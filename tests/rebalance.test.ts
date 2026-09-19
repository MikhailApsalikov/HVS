import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { GameSession } from '../src/domain/GameSession.js';
import { ITEM_CATALOG, ITEM_MAP } from '../src/content/items.js';
import { parseSave, restore, snapshot } from '../src/domain/save.js';
import { abilityDescription, talentDescription } from '../src/ui/presenters.js';
import type { StatType } from '../src/domain/itemTypes.js';
import { addSpider, game } from './helpers.js';

const beforeItems = JSON.parse(
  readFileSync('tests/fixtures/items-before-rebalance.json', 'utf8'),
) as Record<string, Partial<Record<StatType, number>>>;

describe('item rebalance through purchases', () => {
  it.each(Object.entries(beforeItems))(
    'applies current endurance and regeneration of %s and charges its catalog price',
    (id, previous) => {
      const session = new GameSession('normal');
      session.state.coins = 1000000;
      const before = session.state.stats;
      const coins = session.state.coins;
      const endurance = id === 'l010' ? 80 : id === 'l007' ? 200 : (previous.endurance ?? 0) / 2;
      const regeneration = id === 'l010' ? 5 : id === 'l007' ? 20 : (previous.hpRegen ?? 0) / 2;
      expect(session.buyItem(id)).toBe(true);
      expect(session.state.stats.endurance).toBe(before.endurance + endurance);
      expect(session.state.stats.hpRegen).toBeCloseTo(
        before.hpRegen + regeneration + endurance * 0.04,
      );
      expect(session.state.coins).toBe(coins - ITEM_MAP.get(id)!.price);
      expect(session.sellItem(0)).toBe(true);
      expect(session.state.stats).toEqual(before);
      expect(session.state.coins).toBe(coins - Math.ceil(ITEM_MAP.get(id)!.price / 2));
    },
  );

  const enduranceItems = ITEM_CATALOG.filter(
    (item) => item.stats.length === 1 && item.stats[0].type === 'endurance',
  );
  it.each(
    enduranceItems.flatMap((item) =>
      (['agility', 'intellect'] as const).map((stat) => ({ item, stat })),
    ),
  )(
    'buys a $stat counterpart of $item.id with equal strength, rarity and price',
    ({ item, stat }) => {
      const counterpart = ITEM_MAP.get(`${item.id}-${stat}`)!;
      expect(counterpart).toMatchObject({
        rarity: item.rarity,
        price: item.price,
        stats: [{ type: stat, value: item.stats[0].value }],
      });
      expect(counterpart.abilityMod).toBeUndefined();
      const session = new GameSession('normal');
      session.state.coins = item.price;
      const before = session.state.stats;
      expect(session.buyItem(counterpart.id)).toBe(true);
      expect(session.state.coins).toBe(0);
      expect(session.state.stats[stat]).toBe(before[stat] + item.stats[0].value);
      expect(session.state.stats.endurance).toBe(before.endurance);
      if (stat === 'agility') {
        expect(session.state.stats.shootCooldown).toBeLessThanOrEqual(before.shootCooldown);
        expect(session.state.stats.arrowSpeed).toBeGreaterThanOrEqual(before.arrowSpeed);
      } else {
        expect(session.state.stats.energyRegen).toBeGreaterThan(before.energyRegen);
        expect(session.state.stats['heal.amount']).toBeGreaterThan(before['heal.amount']);
      }
      const loaded = restore(parseSave(snapshot(session))!);
      expect(loaded.state.stats).toEqual(session.state.stats);
      expect(loaded.items.inventory).toEqual([counterpart.id]);
      expect(loaded.sellItem(0)).toBe(true);
      expect(loaded.state.stats).toEqual(before);
    },
  );

  it('fires seven volley arrows with the amulet and applies its explicit defensive bonuses', () => {
    const session = game(20);
    session.state.phase = 'levelUp';
    session.state.coins = ITEM_MAP.get('l007')!.price;
    const before = session.state.stats;
    expect(session.buyItem('l007')).toBe(true);
    expect(session.state.coins).toBe(0);
    expect(session.state.stats.endurance).toBe(before.endurance + 200);
    expect(session.state.stats.hpRegen).toBe(before.hpRegen + 28);
    expect(session.state.stats['volley.lanes']).toBe(7);
    session.state.phase = 'playing';
    expect(session.activateAbility('volley')).toBe('activated');
    expect(session.state.arrows.size).toBe(7);
  });
});

describe('defense requirements and compatibility', () => {
  it.each(['easy', 'normal', 'hard'] as const)(
    'requires all five warrior armor ranks before spider protection on %s',
    (difficulty) => {
      const session = new GameSession(difficulty);
      session.state.pendingTalentPoints = 40;
      session.state.level = 10;
      for (let rank = 0; rank < 7; rank++) expect(session.upgradeTalent('endurance')).toBe(true);
      const baseArmor = session.state.stats.armor;
      for (let rank = 1; rank <= 4; rank++) {
        expect(session.upgradeTalent('warriorArmor')).toBe(true);
        expect(session.state.stats.armor).toBe(baseArmor + rank * 250);
      }
      session.state.level = 20;
      for (let rank = 0; rank < 3; rank++)
        expect(session.upgradeTalent('improvedEndurance')).toBe(true);
      const points = session.state.pendingTalentPoints;
      expect(session.talents.upgradeBlockReason('spiderArmor', 20)).toBe('prerequisite');
      expect(session.upgradeTalent('spiderArmor')).toBe(false);
      expect(session.state.pendingTalentPoints).toBe(points);
      expect(session.upgradeTalent('warriorArmor')).toBe(true);
      expect(session.upgradeTalent('spiderArmor')).toBe(true);
      expect(session.talents.getTalent('warriorArmor').tier).toBe(2);
      expect(session.talents.getTalent('spiderArmor').tier).toBe(3);
      expect(talentDescription('bestDefense', 1, session.state.stats)).toContain('1%');
      expect(talentDescription('bestDefense', 10, session.state.stats)).toContain('10%');
      expect(talentDescription('bestDefense', 10, session.state.stats)).toContain('3 с');
    },
  );

  it('migrates version seven, preserving learned protection and active adrenaline with the new cooldown', () => {
    const session = game(60);
    session.talents.loadFromSave([
      { id: 'spiderArmor', rank: 10 },
      { id: 'bestDefense', rank: 10 },
      { id: 'adrenaline', rank: 1 },
    ]);
    session.refreshStats();
    session.activateAbility('adrenaline');
    session.shootLane(0);
    session.tick(2);
    const current = snapshot(session);
    const { bestDefenseCooldown: _timer, ...state } = current.state;
    const data = parseSave({
      ...current,
      version: 7,
      state,
      archers: current.archers.map(() => ({ duration: 3, remainingCooldown: 1 })),
    })!;
    expect(data.version).toBe(10);
    const loaded = restore(data, () => 0);
    expect(loaded.state.bestDefenseCooldown).toBe(0);
    expect(loaded.state.adrenalineTimer).toBe(18);
    expect(loaded.state.adrenalineShots).toBe(19);
    expect(loaded.state.stats.shootCooldown).toBe(0);
    expect(abilityDescription(loaded.state, 'adrenaline')).toContain('100%');
    expect(loaded.state.archers.every((archer) => archer.isReady)).toBe(true);
    expect(loaded.state.getAbility('adrenaline').remainingCooldown).toBe(118);
    expect(loaded.talents.getRank('spiderArmor')).toBe(10);
    expect(loaded.talents.getRank('warriorArmor')).toBe(0);
    expect(loaded.shootLane(0)).toBe('shot');
    expect(loaded.shootLane(0)).toBe('shot');
    addSpider(loaded, 'burner', 8, 1, 0);
    loaded.tick(0.001);
    expect(loaded.state.bestDefenseCooldown).toBe(3);
    const saved = snapshot(loaded);
    expect(snapshot(restore(parseSave(saved)!))).toEqual(saved);
  });

  it.each([undefined, -1, 3.001, '3', NaN])(
    'rejects an invalid response cooldown: %s',
    (bestDefenseCooldown) => {
      const saved = snapshot(game());
      expect(parseSave({ ...saved, state: { ...saved.state, bestDefenseCooldown } })).toBeNull();
    },
  );
});
