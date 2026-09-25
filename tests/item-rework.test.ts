import { readFileSync } from 'node:fs';
import { describe, expect, it, vi } from 'vitest';
import { ITEM_CATALOG, ITEM_MAP } from '../src/content/items.js';
import { RETIRED_ITEM_REFUNDS } from '../src/content/retiredItems.js';
import { GameSession } from '../src/domain/GameSession.js';
import type { AbilityMod, ItemConfig, StatType } from '../src/domain/itemTypes.js';
import { PRIMARY_STATS } from '../src/domain/rules/stats.js';
import { computeItemPrice } from '../src/domain/rules/economy.js';
import { parseSave, restore, snapshot } from '../src/domain/save.js';
import { describeModifier } from '../src/ui/presenters.js';

const exceptions = JSON.parse(
  readFileSync('tests/fixtures/item-rework-exceptions.json', 'utf8'),
) as ItemConfig[];
const abilityMods = JSON.parse(
  readFileSync('tests/fixtures/item-rework-ability-mods.json', 'utf8'),
) as Record<string, AbilityMod>;
const exceptionIds = new Set([...exceptions.map((item) => item.id), 'e006']);
const dependent: Partial<Record<StatType, StatType>> = {
  hpRegen: 'endurance',
  armor: 'endurance',
  energyPerKill: 'agility',
  criticalShotChance: 'agility',
  energyRegen: 'intellect',
  maxEnergy: 'intellect',
};
const isPrimary = (type: StatType) => PRIMARY_STATS.some((stat) => stat === type);

describe('equipment catalog rules', () => {
  it.each(ITEM_CATALOG)('$id obeys rarity, stat order and dependency rules', (item) => {
    expect(item.stats.every((stat) => stat.value > 0 && stat.kind === undefined)).toBe(true);
    expect(item.stats.some((stat) => String(stat.type) === 'energyPerBreach')).toBe(false);
    expect(new Set(item.stats.map((stat) => stat.type)).size).toBe(item.stats.length);
    expect(item.price).toBe(computeItemPrice(item));
    if (exceptionIds.has(item.id)) return;
    const [min, max, count] = {
      common: [1, 1500, 1],
      rare: [1500, 6000, 2],
      epic: [8000, 14000, 3],
      legendary: [17000, 30000, 3],
    }[item.rarity];
    expect(item.price).toBeGreaterThanOrEqual(min);
    expect(item.price).toBeLessThanOrEqual(max);
    expect(item.stats.length).toBeGreaterThanOrEqual(1);
    expect(item.stats.length).toBeLessThanOrEqual(count);
    if (item.stats.length === 1) return;
    const [first, second, third] = item.stats;
    expect(isPrimary(first.type)).toBe(true);
    for (const stat of item.stats.slice(1)) {
      if (dependent[stat.type]) expect(dependent[stat.type]).toBe(first.type);
    }
    if (isPrimary(second.type)) {
      expect(second.value / first.value).toBeGreaterThanOrEqual(0.3);
      expect(second.value / first.value).toBeLessThanOrEqual(0.8);
    } else
      expect(dependent[second.type] === first.type || second.type === 'coinsPerKill').toBe(true);
    if (!third) return;
    if (isPrimary(second.type)) {
      expect(third.type === 'coinsPerKill' || isPrimary(third.type)).toBe(true);
      if (isPrimary(third.type)) {
        expect(third.value / first.value).toBeGreaterThanOrEqual(0.2);
        expect(third.value / first.value).toBeLessThanOrEqual(0.5);
      }
    } else {
      expect(dependent[second.type]).toBe(first.type);
      expect(dependent[third.type] === first.type || third.type === 'coinsPerKill').toBe(true);
    }
  });

  it('reduces single-stat tiers, avoids duplicate bonuses and mirrors all primary stats', () => {
    const singles = ITEM_CATALOG.filter((item) => item.stats.length === 1);
    const signatures = ITEM_CATALOG.map((item) =>
      JSON.stringify([item.rarity, item.stats, item.abilityMod]),
    );
    expect(new Set(signatures).size).toBe(signatures.length);
    expect(ITEM_CATALOG.filter((item) => item.rarity === 'common').length).toBeLessThan(48);
    for (const type of new Set(singles.map((item) => item.stats[0].type))) {
      for (const [rarity, max] of [
        ['common', 3],
        ['rare', 2],
        ['epic', 1],
      ] as const) {
        expect(
          singles.filter((item) => item.rarity === rarity && item.stats[0].type === type).length,
        ).toBeLessThanOrEqual(max);
      }
    }
    for (const item of singles.filter((item) => isPrimary(item.stats[0].type))) {
      for (const primary of PRIMARY_STATS) {
        const mirror = singles.find(
          (other) =>
            other.rarity === item.rarity &&
            other.stats[0].type === primary &&
            other.stats[0].value === item.stats[0].value,
        );
        expect(mirror?.price).toBe(item.price);
      }
    }
  });

  it.each(exceptions)('preserves all protected bonuses, rarity and identity: $id', (item) => {
    expect(ITEM_MAP.get(item.id)).toEqual({ ...item, price: computeItemPrice(item) });
  });

  it.each(Object.entries(abilityMods))(
    'preserves the legendary spell improvement of %s',
    (id, mod) => {
      expect(ITEM_MAP.get(id)?.abilityMod).toEqual(mod);
    },
  );

  it('keeps Rune of Flow legendary at +4 energy per second with its algorithmic price', () => {
    const session = new GameSession('normal');
    session.state.coins = 53453;
    const before = session.state.stats.energyRegen;
    expect(ITEM_MAP.get('e006')).toMatchObject({
      rarity: 'legendary',
      price: 53453,
      stats: [{ type: 'energyRegen', value: 4 }],
    });
    expect(session.buyItem('e006')).toBe(true);
    expect(session.state.coins).toBe(0);
    expect(session.state.stats.energyRegen).toBe(before + 4);
  });
});

describe('item price bases and curves', () => {
  it.each([
    ['endurance', 5, 38, 10, 122],
    ['agility', 5, 38, 10, 122],
    ['intellect', 5, 38, 10, 122],
    ['hpRegen', 0.5, 29, 1, 91],
    ['maxEnergy', 10, 43, 20, 173],
    ['coinsPerKill', 1, 480, 2, 1920],
    ['energyRegen', 1, 480, 2, 3840],
    ['energyPerKill', 1, 480, 2, 3840],
    ['criticalShotChance', 0.01, 600, 0.02, 2400],
    ['armor', 1, 1, 200, 200],
  ] as const)(
    '%s has the increased base and preserves its curve',
    (type, unit, price, twice, nextPrice) => {
      const item: ItemConfig = {
        id: 'price',
        name: 'price',
        rarity: 'common',
        stats: [{ type, value: unit }],
      };
      expect(computeItemPrice(item)).toBe(price);
      expect(computeItemPrice({ ...item, stats: [{ type, value: twice }] })).toBe(nextPrice);
    },
  );
  it.each([
    ['common', 1],
    ['rare', 1.15],
    ['epic', 1.33],
    ['legendary', 1.74],
  ] as const)('keeps the %s multiplier off armor and rounds only the total', (rarity, factor) => {
    expect(
      computeItemPrice({
        id: 'price',
        name: 'price',
        rarity,
        stats: [
          { type: 'armor', value: 100 },
          { type: 'criticalShotChance', value: 0.02 },
        ],
      }),
    ).toBe(Math.round(100 + 2400 * factor));
  });
});

describe('reworked equipment through session commands', () => {
  it.each(ITEM_CATALOG)('buys, applies, saves and sells every bonus on $id', (item) => {
    const session = new GameSession('normal');
    session.talents.loadFromSave([{ id: 'criticalShot', rank: 1 }]);
    session.refreshStats();
    const before = session.state.stats;
    session.state.coins = item.price;
    expect(session.buyItem(item.id)).toBe(true);
    expect(session.state.coins).toBe(0);
    const bonus = (type: StatType) => item.stats.find((stat) => stat.type === type)?.value ?? 0;
    const stats = session.state.stats;
    for (const type of PRIMARY_STATS) expect(stats[type]).toBe(before[type] + bonus(type));
    expect(stats.armor).toBe(before.armor + bonus('armor') + bonus('endurance') * 2);
    expect(stats.hpRegen).toBeCloseTo(
      before.hpRegen + bonus('hpRegen') + bonus('endurance') * 0.04,
    );
    expect(stats.energyRegen).toBeCloseTo(
      before.energyRegen + bonus('energyRegen') + bonus('intellect') * 0.01,
    );
    expect(stats.maxEnergy).toBe(100 + bonus('maxEnergy') + Math.max(0, stats.intellect - 100) * 2);
    expect(stats.energyPerKill).toBe(bonus('energyPerKill') + Math.floor(stats.agility / 240));
    expect(stats.coinsPerKill).toBe(bonus('coinsPerKill') + Math.floor(stats.endurance / 240));
    expect(stats.energyPerBreach).toBe(Math.floor(stats.endurance / 100));
    expect(stats.criticalShotChance).toBeCloseTo(
      0.02 + bonus('criticalShotChance') + Math.floor(stats.agility / 130) / 100,
    );
    const loaded = restore(parseSave(snapshot(session))!);
    expect(loaded.state.stats).toEqual(stats);
    expect(loaded.items.inventory).toEqual([item.id]);
    expect(loaded.sellItem(0)).toBe(true);
    expect(loaded.state.stats).toEqual(before);
    expect(loaded.state.coins).toBe(Math.floor(item.price / 2));
  });

  it('activates equipped critical chance upon learning the talent, stacks items and removes sold bonuses', () => {
    const session = new GameSession('normal');
    session.state.level = 10;
    session.state.initialTalentPick = false;
    session.state.pendingTalentPoints = 20;
    session.state.coins = 100000;
    expect(session.upgradeTalent('hunterArsenal')).toBe(true);
    expect(session.buyItem('c088')).toBe(true);
    expect(session.buyItem('r018')).toBe(true);
    expect(session.state.stats.criticalShotChance).toBe(0);
    for (let rank = 0; rank < 5; rank++) expect(session.upgradeTalent('hunterMastery')).toBe(true);
    for (let rank = 0; rank < 2; rank++)
      expect(session.upgradeTalent('improvedAgility')).toBe(true);
    expect(session.upgradeTalent('criticalShot')).toBe(true);
    expect(session.state.stats.criticalShotChance).toBe(0.05);
    const loaded = restore(parseSave(snapshot(session))!);
    expect(loaded.state.stats.criticalShotChance).toBe(0.05);
    expect(loaded.sellItem(0)).toBe(true);
    expect(loaded.state.stats.criticalShotChance).toBe(0.04);
    expect(loaded.sellItem(0)).toBe(true);
    expect(loaded.state.stats.criticalShotChance).toBe(0.02);
  });

  it.each([
    [0, 0, false],
    [1, 0.029999, true],
    [1, 0.03, false],
  ] as const)(
    'uses +1 percentage point for actual arrows only with the talent (rank %s, roll %s)',
    (rank, roll, critical) => {
      const random = vi.fn(() => roll);
      const session = new GameSession('normal', random);
      session.talents.loadFromSave([{ id: 'criticalShot', rank }]);
      session.state.coins = 600;
      expect(session.buyItem('c088')).toBe(true);
      const loaded = restore(parseSave(snapshot(session))!, random);
      loaded.state.phase = 'playing';
      expect(loaded.shootLane(0)).toBe('shot');
      expect([...loaded.state.arrows.values()][0].critical).toBe(critical);
      expect(random).toHaveBeenCalledTimes(rank ? 1 : 0);
    },
  );

  it('caps equipped critical chance at 100% and keeps volleys ordinary', () => {
    const session = new GameSession('normal', () => 0.999999);
    session.state.level = 20;
    session.state.character.setBase('agility', 13000);
    session.talents.loadFromSave([{ id: 'criticalShot', rank: 1 }]);
    session.state.coins = 600;
    expect(session.buyItem('c088')).toBe(true);
    expect(session.state.stats.criticalShotChance).toBe(1);
    session.state.phase = 'playing';
    expect(session.shootLane(0)).toBe('shot');
    expect([...session.state.arrows.values()][0].critical).toBe(true);
    session.state.energy = session.state.maxEnergy;
    expect(session.activateAbility('volley')).toBe('activated');
    expect(
      [...session.state.arrows.values()]
        .filter((arrow) => arrow.fromVolley)
        .every((arrow) => !arrow.critical),
    ).toBe(true);
  });

  it('keeps the critical chance label free of explanations', () => {
    expect(describeModifier({ stat: 'criticalShotChance', kind: 'flat', value: 0.01 })).toBe(
      'Шанс критического выстрела: +1%',
    );
  });
});

describe('removed equipment compatibility', () => {
  it.each(Object.entries(RETIRED_ITEM_REFUNDS))(
    'refunds removed %s from version 12 exactly once',
    (id, price) => {
      const session = new GameSession('normal');
      const previous = { ...snapshot(session), version: 12, inventory: [id] };
      const loaded = restore(parseSave(previous)!);
      expect(loaded.items.inventory).toEqual([]);
      expect(loaded.state.coins).toBe(previous.state.coins + price);
      expect(loaded.buyItem(id)).toBe(false);
      const saved = snapshot(loaded);
      expect(snapshot(restore(parseSave(saved)!))).toEqual(saved);
    },
  );
  it('refunds multiple removed copies, retains existing items and ignores unknown IDs', () => {
    const previous = {
      ...snapshot(new GameSession('normal')),
      inventory: ['c094', 'c094', 'missing', '__proto__', 'constructor', 'toString', 'c088'],
    };
    const loaded = restore(parseSave(previous)!);
    expect(loaded.items.inventory).toEqual(['c088']);
    expect(loaded.state.coins).toBe(previous.state.coins + 320);
    expect(loaded.state.stats.criticalShotChance).toBe(0);
    expect(snapshot(restore(parseSave(snapshot(loaded))!))).toEqual(snapshot(loaded));
  });
});
