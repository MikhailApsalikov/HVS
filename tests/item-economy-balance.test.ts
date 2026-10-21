import { describe, expect, it } from 'vitest';
import { ITEM_CATALOG, ITEM_MAP } from '../src/content/items.js';
import { GameSession } from '../src/domain/GameSession.js';
import { parseSave, restore, snapshot } from '../src/domain/save.js';

describe('rebalanced equipment prices through session commands', () => {
  it.each([
    ['c068', 103],
    ['c-regen-flow', 655],
    ['r-regen-potion', 2140],
    ['c076', 4416],
    ['c078', 606],
    ['c086', 4416],
    ['c088', 600],
    ['c-crit-focus', 1350],
    ['e008', 12768],
    ['c-block-charm', 600],
    ['c-block-bracelet', 1350],
    ['r-block-sigil', 2760],
    ['r-block-rune', 4313],
    ['e-block-heart', 12768],
    ['e018', 13967],
    ['e006', 36487],
    ['l021', 28882],
    ['l010', 23117],
    ['l024', 21835],
    ['l027', 44107],
  ] as const)('buys and sells %s at its recalibrated price of %s', (id, price) => {
    const session = new GameSession('normal');
    expect(ITEM_MAP.get(id)?.price).toBe(price);
    session.state.coins = price - 1;
    expect(session.buyItem(id)).toBe(false);
    expect(session.state.coins).toBe(price - 1);
    expect(session.items.inventory).toEqual([]);
    session.state.coins = price;
    expect(session.buyItem(id)).toBe(true);
    expect(session.state.coins).toBe(0);
    const loaded = restore(parseSave(snapshot(session))!);
    expect(loaded.items.inventory).toEqual([id]);
    expect(loaded.sellItem(0)).toBe(true);
    expect(loaded.state.coins).toBe(Math.floor(price / 2));
  });

  it.each([
    ['c068', 10.11],
    ['c-regen-flow', 10.61],
    ['r-regen-potion', 11.11],
    ['c076', 11.61],
    ['e018', 13.21],
  ] as const)('restores fractional energy from %s over game time', (id, regeneration) => {
    const session = new GameSession('normal', () => 0.999999);
    session.state.coins = 100000;
    expect(session.buyItem(id)).toBe(true);
    expect(session.state.stats.energyRegen).toBe(regeneration);
    session.state.character.setModifiers('test:quiet', [
      { stat: 'spawnProbability', kind: 'percent', value: -100 },
    ]);
    session.refreshStats();
    session.state.phase = 'playing';
    session.state.energy = 0;
    session.tick(2);
    expect(session.state.energy).toBeCloseTo(regeneration * 2);
  });

  it('keeps only the half-energy starter below 250 because its next variant costs 655', () => {
    expect(ITEM_CATALOG.filter((item) => item.price < 250).map((item) => item.id)).toEqual([
      'c068',
    ]);
    expect(ITEM_MAP.get('c-regen-flow')?.price).toBe(655);
    const chances = ITEM_CATALOG.flatMap((item) =>
      item.stats.filter((stat) => stat.type === 'criticalShotChance').map((stat) => stat.value),
    );
    expect(chances).toContain(0.03);
    expect(chances).toContain(0.05);
    expect(
      ITEM_CATALOG.filter((item) => item.name === 'Око сокола').map((item) => item.id),
    ).toEqual(['e008']);
  });
});

describe('retired cheap equipment in previous-version saves', () => {
  it.each([
    ['c001', 38],
    ['c001-agility', 38],
    ['c001-intellect', 38],
    ['c056', 43],
    ['c-shield', 50],
    ['c022', 91],
  ] as const)('refunds every removed %s once at its former full price', (id, refund) => {
    const session = new GameSession('normal');
    const previous = {
      ...snapshot(session),
      abilities: snapshot(session).abilities.slice(0, 12),
      version: 20,
      inventory: [id, id],
    };
    const loaded = restore(parseSave(previous)!);
    expect(loaded.items.inventory).toEqual([]);
    expect(loaded.state.coins).toBe(session.state.coins + refund * 2);
    expect(loaded.buyItem(id)).toBe(false);
    const saved = snapshot(loaded);
    expect(saved.version).toBe(29);
    expect(snapshot(restore(parseSave(saved)!))).toEqual(saved);
  });
});
