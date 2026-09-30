import { describe, expect, it } from 'vitest';
import { GameSession } from '../src/domain/GameSession.js';
import { ITEM_CATALOG, ITEM_MAP } from '../src/content/items.js';
import { parseSave, restore, snapshot } from '../src/domain/save.js';
import { abilityDescription, talentDescription } from '../src/ui/presenters.js';
import { itemAbilityDescription, itemStatLines } from '../src/ui/itemPresentation.js';
import { generateItemSvg } from '../src/ui/ItemSpriteGenerator.js';

function shop() {
  const session = new GameSession('normal', () => 0.999999, { level: 60, coins: 1000000 });
  session.state.character.setModifiers('test:arena', [
    { stat: 'inventorySlots', kind: 'flat', value: 20 },
    { stat: 'spawnProbability', kind: 'percent', value: -100 },
    { stat: 'arrowSpeed', kind: 'percent', value: -100 },
    { stat: 'maxEnergy', kind: 'flat', value: 1000 },
  ]);
  session.refreshStats();
  return session;
}

function play(session: GameSession) {
  session.state.phase = 'playing';
  session.state.initialTalentPick = false;
  session.state.pendingTalentPoints = 0;
  session.state.levelTimer = session.state.levelTimerMax = 1000;
  session.state.energy = session.state.maxEnergy;
}

describe('will to win in shooting', () => {
  it('requires shooting investment, adds 70 agility and 4% discount per rank', () => {
    const session = shop();
    session.state.pendingTalentPoints = 100;
    session.talents.loadFromSave([
      { id: 'endurance', rank: 7 },
      { id: 'improvedEndurance', rank: 7 },
      { id: 'warriorArmor', rank: 5 },
      { id: 'spiderArmor', rank: 10 },
      { id: 'shieldBlock', rank: 8 },
    ]);
    expect(session.upgradeTalent('willToWin')).toBe(false);
    session.talents.loadFromSave([
      { id: 'hunterMastery', rank: 5 },
      { id: 'vampirism', rank: 5 },
      { id: 'piercingReward', rank: 8 },
      { id: 'criticalShot', rank: 10 },
      { id: 'killingStreak', rank: 7 },
    ]);
    session.refreshStats();
    const base = session.state.stats;
    for (let rank = 1; rank <= 5; rank++) {
      expect(session.upgradeTalent('willToWin')).toBe(true);
      expect(session.state.stats.agility).toBe(base.agility + 70 * rank);
      expect(session.state.stats.shopDiscount).toBe(4 * rank);
      const item = ITEM_MAP.get('c001')!;
      const price = Math.round(item.price * (1 - 0.04 * rank));
      session.state.coins = price - 1;
      expect(session.buyItem(item.id)).toBe(false);
      expect(session.state.coins).toBe(price - 1);
      session.state.coins = price;
      expect(session.buyItem(item.id)).toBe(true);
      expect(session.state.coins).toBe(0);
      expect(session.sellItem(0)).toBe(true);
      expect(session.state.coins).toBe(Math.floor(item.price / 2));
      expect(talentDescription('willToWin', rank, session.state.stats)).toContain(`${4 * rank}%`);
    }
    expect(session.upgradeTalent('willToWin')).toBe(false);
  });

  it.each(ITEM_CATALOG)('discounts the purchase of $id without changing its sale price', (item) => {
    const session = shop();
    session.talents.loadFromSave([{ id: 'willToWin', rank: 5 }]);
    session.refreshStats();
    const price = Math.round(item.price * 0.8);
    session.state.coins = price;
    expect(session.items.canBuy(item.id, price, 21, session.state.stats.shopDiscount)).toBe(true);
    expect(session.buyItem(item.id)).toBe(true);
    expect(session.state.coins).toBe(0);
    expect(session.buyItem(item.id)).toBe(false);
    expect(session.sellItem(0)).toBe(true);
    expect(session.state.coins).toBe(Math.floor(item.price / 2));
  });
});

describe('updated legendary equipment through session purchases', () => {
  it.each([
    ['l001', 200, 110, 0, 0, 0, 2],
    ['l003', 220, 0, 0, 0, 2, 0],
    ['l004', 180, 0, 80, 80, 0, 0],
  ] as const)(
    '%s replaces its old bonuses',
    (id, intellect, endurance, agility, energy, regen, coins) => {
      const session = shop();
      const before = session.state.stats;
      expect(session.buyItem(id)).toBe(true);
      const after = session.state.stats;
      expect(after.intellect).toBe(before.intellect + intellect);
      expect(after.endurance).toBe(before.endurance + endurance);
      expect(after.agility).toBe(before.agility + agility);
      expect(after.maxEnergy).toBe(before.maxEnergy + 2 * intellect + energy);
      expect(after.energyRegen).toBeCloseTo(before.energyRegen + intellect * 0.01 + regen);
      expect(after.hpRegen).toBeCloseTo(before.hpRegen + endurance * 0.04);
      expect(after.armor).toBe(before.armor + 2 * endurance);
      expect(after.coinsPerKill).toBe(
        before.coinsPerKill +
          coins +
          Math.floor(after.endurance / 240) -
          Math.floor(before.endurance / 240),
      );
    },
  );

  it.each([
    ['l003', 'armageddon', 15],
    ['l020', 'recharge', 5],
  ] as const)('%s reduces the actual energy spent on %s to %i', (id, ability, cost) => {
    const session = shop();
    session.talents.loadFromSave([{ id: 'recharge', rank: 1 }]);
    expect(session.buyItem(id)).toBe(true);
    play(session);
    session.state.energy = cost;
    expect(session.activateAbility(ability)).toBe('activated');
    expect(session.state.energy).toBe(0);
  });

  it('combines Volley Bowstring multiplicatively with agility and talent percentages', () => {
    const session = shop();
    session.talents.loadFromSave([
      { id: 'volleyMastery', rank: 5 },
      { id: 'quickInstinct', rank: 10 },
    ]);
    expect(session.buyItem('l009')).toBe(true);
    const agilityReduction = Math.min(70, Math.floor(session.state.stats.agility / 18));
    const cooldown = Math.round(36 * (1 - agilityReduction / 100) * 0.8 * 0.85 * 0.8 * 100) / 100;
    play(session);
    expect(session.activateAbility('volley')).toBe('activated');
    expect(session.state.getAbility('volley').remainingCooldown).toBe(cooldown);
    expect(itemAbilityDescription(ITEM_MAP.get('l009')!)).toContain('на 20%');
  });
});

describe('six new legendary items', () => {
  it.each(['l021', 'l022', 'l023', 'l024', 'l025', 'l026'])(
    '%s has its own illustration and tooltip',
    (id) => {
      const item = ITEM_MAP.get(id)!;
      expect(item.rarity).toBe('legendary');
      expect(item.price).toBeGreaterThanOrEqual(17000);
      expect(item.price).toBeLessThanOrEqual(30000);
      expect(generateItemSvg(item)).not.toContain('?</text>');
      expect(itemAbilityDescription(item)).toBeTruthy();
      expect(itemStatLines(item)).toHaveLength(item.stats.length);
    },
  );

  it('extends Last Hope by two seconds and expires precisely', () => {
    const session = shop();
    session.talents.loadFromSave([{ id: 'lastHope', rank: 1 }]);
    expect(session.buyItem('l021')).toBe(true);
    play(session);
    expect(session.activateAbility('lastHope')).toBe('activated');
    expect(session.state.lastHopeTimer).toBe(8);
    session.tick(7.999);
    expect(session.state.lastHopeTimer).toBeCloseTo(0.001);
    session.tick(0.0011);
    expect(session.state.lastHopeTimer).toBe(0);
  });

  it('uses both Adrenaline items together, with 35 free arrows and a 75-second cooldown', () => {
    const session = shop();
    session.talents.loadFromSave([{ id: 'adrenaline', rank: 1 }]);
    expect(session.buyItem('l022')).toBe(true);
    expect(session.buyItem('l023')).toBe(true);
    play(session);
    session.state.energy = 0;
    expect(session.activateAbility('adrenaline')).toBe('activated');
    expect(session.state.getAbility('adrenaline').remainingCooldown).toBe(75);
    expect(session.state.adrenalineShots).toBe(35);
    const loaded = restore(parseSave(snapshot(session))!);
    for (let i = 0; i < 35; i++) expect(loaded.shootLane(i % 9)).toBe('shot');
    expect(loaded.state.energy).toBe(0);
    expect(loaded.state.adrenalineActive).toBe(false);
    expect(loaded.shootLane(0)).toBe('not_enough_energy');
  });

  it('adds five Eagle Eye arrows on top of the five agility talent ranks', () => {
    const session = shop();
    session.talents.loadFromSave([
      { id: 'eagleEye', rank: 1 },
      { id: 'agileCriticalShot', rank: 5 },
    ]);
    expect(session.buyItem('l024')).toBe(true);
    play(session);
    expect(session.activateAbility('eagleEye')).toBe('activated');
    expect(session.state.eagleEyeShots).toBe(20);
    expect(session.shootLane(0)).toBe('shot');
    expect([...session.state.arrows.values()][0].critical).toBe(true);
    expect(session.state.eagleEyeShots).toBe(19);
    expect(parseSave(snapshot(session))).not.toBeNull();
  });

  it('adds two to the learned Killing Streak maximum and to its improved maximum', () => {
    const session = shop();
    expect(session.buyItem('l025')).toBe(true);
    expect(session.state.killingStreakMaximum).toBe(0);
    session.talents.loadFromSave([{ id: 'killingStreak', rank: 10 }]);
    session.refreshStats();
    expect(session.state.killingStreakMaximum).toBe(7);
    play(session);
    session.tick(70);
    expect(session.state.killingStreakStacks).toBe(7);
    session.talents.loadFromSave([
      { id: 'killingStreak', rank: 10 },
      { id: 'improvedKillingStreak', rank: 5 },
    ]);
    session.refreshStats();
    session.tick(50);
    expect(session.state.killingStreakStacks).toBe(12);
    expect(session.state.killingStreakMaximum).toBe(12);
    session.state.phase = 'levelUp';
    expect(session.sellItem(0)).toBe(true);
    expect(session.state.killingStreakStacks).toBe(10);
    expect(parseSave(snapshot(session))).not.toBeNull();
  });

  it('adds waves precisely at seven and nine seconds, preserves critical rules and saves', () => {
    const session = shop();
    session.talents.loadFromSave([{ id: 'aimedFire', rank: 1 }]);
    expect(session.buyItem('l026')).toBe(true);
    play(session);
    expect(abilityDescription(session.state, 'aimedFire')).toContain(
      'каждые 2 секунды в течение 9 секунд',
    );
    expect(session.activateAbility('aimedFire')).toBe('activated');
    const loaded = restore(parseSave(snapshot(session))!, () => 0.999999);
    loaded.tick(5);
    expect(loaded.state.arrows.size).toBe(27);
    loaded.tick(1.999);
    expect(loaded.state.arrows.size).toBe(27);
    loaded.tick(0.001);
    expect(loaded.state.arrows.size).toBe(36);
    loaded.tick(1.999);
    expect(loaded.state.arrows.size).toBe(36);
    loaded.tick(0.001);
    expect(loaded.state.arrows.size).toBe(45);
    expect([...loaded.state.arrows.values()].slice(27).every((arrow) => !arrow.critical)).toBe(
      true,
    );
    expect(loaded.state.aimedFireWaves).toEqual([]);
  });

  it.each(['l023', 'l024', 'l026'] as const)(
    'preserves the active effect after selling %s and saving',
    (id) => {
      const session = shop();
      session.talents.loadFromSave([
        { id: 'adrenaline', rank: 1 },
        { id: 'eagleEye', rank: 1 },
        { id: 'aimedFire', rank: 1 },
      ]);
      expect(session.buyItem(id)).toBe(true);
      play(session);
      expect(
        session.activateAbility(
          id === 'l023' ? 'adrenaline' : id === 'l024' ? 'eagleEye' : 'aimedFire',
        ),
      ).toBe('activated');
      session.state.phase = 'levelUp';
      expect(session.sellItem(0)).toBe(true);
      expect(parseSave(snapshot(session))).not.toBeNull();
    },
  );

  it('loads existing version 18 ranks and inventory with new balance without a schema migration', () => {
    const session = shop();
    session.talents.loadFromSave([
      { id: 'willToWin', rank: 5 },
      { id: 'titanArmor', rank: 5 },
    ]);
    session.buyItem('l003');
    session.state.getAbility('armageddon').start(37);
    const previous = snapshot(session);
    const loaded = restore(
      parseSave({
        ...previous,
        talents: previous.talents.filter(({ id }) => id !== 'poisonResistance'),
      })!,
    );
    expect(loaded.talents.getTalent('willToWin').branch).toBe('shooting');
    expect(loaded.talents.getRank('willToWin')).toBe(5);
    expect(loaded.talents.getRank('titanArmor')).toBe(5);
    expect(loaded.talents.getRank('poisonResistance')).toBe(0);
    expect(loaded.state.stats.shopDiscount).toBe(20);
    expect(loaded.state.stats['armageddon.cost']).toBe(15);
    expect(loaded.state.getAbility('armageddon').remainingCooldown).toBe(37);
    expect(snapshot(restore(parseSave(snapshot(loaded))!))).toEqual(snapshot(loaded));
  });
});
