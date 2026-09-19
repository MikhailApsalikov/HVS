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
    ['e004', 'epic', 7777, 7777],
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

  it.each([
    ['c040', 300],
    ['c050', 3600],
    ['c052', 5200],
    ['r008', 13400],
    ['r010', 32450],
    ['r026', 150],
    ['r027', 650],
    ['r028', 1500],
    ['r029', 3350],
    ['r041', 50],
    ['r042', 350],
    ['r043', 1050],
    ['r044', 2050],
    ['r054', 350],
    ['r055', 1500],
    ['r056', 350],
    ['r057', 2050],
    ['r058', 350],
    ['r059', 2650],
    ['r060', 350],
    ['r061', 2050],
    ['r062', 650],
    ['e009', 6900],
    ['e015', 6900],
    ['e017', 6900],
    ['e025', 1200],
    ['e027', 1200],
    ['e032', 1200],
    ['e034', 2350],
    ['e035', 1200],
    ['e036', 2350],
    ['l001', 1550],
    ['l003', 1550],
    ['l005', 1550],
    ['l006', 550],
    ['l009', 1550],
    ['l011', 3050],
    ['l012', 1550],
    ['l017', 550],
  ] as const)('%s has one fifth of its former armor', (id, previousArmor) => {
    const session = new GameSession('normal');
    const item = ITEM_MAP.get(id)!;
    session.state.coins = item.price;
    const before = session.state.stats;
    expect(session.buyItem(id)).toBe(true);
    expect(session.state.coins).toBe(0);
    const enduranceArmor = (session.state.stats.endurance - before.endurance) * 2;
    expect(session.state.stats.armor).toBe(before.armor + enduranceArmor + previousArmor / 5);
    const loaded = restore(parseSave(snapshot(session))!);
    expect(loaded.state.stats).toEqual(session.state.stats);
    expect(loaded.sellItem(0)).toBe(true);
    expect(loaded.state.stats).toEqual(before);
  });

  it('has no obsolete damage reduction stat anywhere in the catalog', () => {
    expect(
      ITEM_CATALOG.flatMap((item) => item.stats).some(
        (stat) => String(stat.type) === 'damageReduction',
      ),
    ).toBe(false);
  });
});
