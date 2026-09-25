import { describe, expect, it } from 'vitest';
import { GameSession } from '../src/domain/GameSession.js';
import { ITEM_CATALOG, ITEM_MAP } from '../src/content/items.js';
import { parseSave, restore, snapshot } from '../src/domain/save.js';

describe('armor equipment through session commands', () => {
  it.each([
    ['c-shield', 'common', 50, 50],
    ['c046', 'common', 300, 300],
    ['c055', 'common', 900, 900],
    ['r009', 'rare', 2500, 2500],
    ['e-shield', 'epic', 10000, 10000],
  ] as const)('buys and sells %s at one gold per armor', (id, rarity, armor, price) => {
    const session = new GameSession('normal');
    const before = session.state.stats;
    session.state.coins = price;
    expect(ITEM_MAP.get(id)).toMatchObject({
      rarity,
      price,
      stats: [{ type: 'armor', value: armor }],
    });
    expect(session.buyItem(id)).toBe(true);
    expect(session.state.coins).toBe(0);
    expect(session.state.stats.armor).toBe(before.armor + armor);
    expect(session.state.stats.armorReduction).toBeGreaterThan(before.armorReduction);
    const loaded = restore(parseSave(snapshot(session))!);
    expect(loaded.state.stats).toEqual(session.state.stats);
    expect(loaded.sellItem(0)).toBe(true);
    expect(loaded.state.stats).toEqual(before);
    expect(loaded.state.coins).toBe(Math.floor(price / 2));
  });

  it('applies all bonuses of No Step Back and removes them on sale', () => {
    const session = new GameSession('normal');
    session.state.coins = 1000000;
    const before = session.state.stats;
    expect(session.buyItem('l010')).toBe(true);
    const stats = session.state.stats;
    expect(stats.armor).toBe(before.armor + 11111 + 80 * 2);
    expect(stats.endurance).toBe(before.endurance + 80);
    expect(stats.agility).toBe(before.agility + 25);
    expect(stats.intellect).toBe(before.intellect + 25);
    expect(stats.hpRegen).toBeCloseTo(before.hpRegen + 5 + 80 * 0.04);
    expect(stats['stand.cooldown']).toBe(before['stand.cooldown'] - 15);
    expect(stats.damageFactor).toBe(0.25);
    expect(session.sellItem(0)).toBe(true);
    expect(session.state.stats).toEqual(before);
  });

  it.each(ITEM_CATALOG.filter((item) => item.stats.some((stat) => stat.type === 'armor')))(
    '$id grants armor without a separate incoming damage reduction',
    (item) => {
      const session = new GameSession('normal');
      session.state.coins = 1000000;
      const before = session.state.stats.armor;
      expect(session.buyItem(item.id)).toBe(true);
      expect(session.state.stats.armor).toBeGreaterThan(before);
      expect(
        session.items.getModifiers().some((modifier) => modifier.stat === 'incomingDamage'),
      ).toBe(false);
    },
  );

  it('has no obsolete damage reduction stat anywhere in the catalog', () => {
    expect(
      ITEM_CATALOG.flatMap((item) => item.stats).some(
        (stat) => String(stat.type) === 'damageReduction',
      ),
    ).toBe(false);
  });
});
