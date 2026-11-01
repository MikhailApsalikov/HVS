import { describe, expect, it, vi } from 'vitest';
import { GameSession } from '../src/domain/GameSession.js';
import type { RandomSource } from '../src/domain/rules/random.js';
import { addSpider } from './helpers.js';

function arena(level: number, random: RandomSource) {
  const session = new GameSession('normal', random);
  session.state.level = level; // Also exercise legacy formulas above the victory level.
  session.state.character.setModifiers('test:arena', [
    { stat: 'spawnProbability', kind: 'percent', value: -100 },
    { stat: 'endurance', kind: 'percent', value: -100 },
    { stat: 'agility', kind: 'percent', value: -100 },
    { stat: 'maxHp', kind: 'flat', value: 100000 },
    { stat: 'hpRegen', kind: 'percent', value: -100 },
    { stat: 'energyRegen', kind: 'percent', value: -100 },
  ]);
  session.refreshStats();
  session.state.phase = 'playing';
  session.state.levelTimer = session.state.levelTimerMax = 1000;
  return session;
}

describe('spider piercing strike through session ticks', () => {
  it.each([
    [60, 0, false],
    [61, 0.009999, true],
    [61, 0.01, false],
    [62, 0.019999, true],
    [62, 0.02, false],
    [100, 0.399999, true],
    [100, 0.4, false],
    [160, 0.999999, true],
    [300, 0.999999, true],
  ] as const)(
    'level %i with roll %s produces piercing=%s, with no roll before unlock',
    (level, roll, piercing) => {
      const random = vi.fn(() => roll);
      const session = arena(level, random);
      const spider = addSpider(session, 'normal', 0, 1, 100);
      const before = session.state.hp;
      session.tick(0.001);
      expect(session.state.hp).toBe(before - (piercing ? 250 : 100));
      expect(random).toHaveBeenCalledTimes(level < 61 ? 0 : 1);
      expect(session.drainEvents()).toEqual([
        {
          type: 'damage',
          spiderId: spider.id,
          hp: piercing ? 250 : 100,
          energy: 0,
          ...(piercing ? { piercing: true, rawDamageMultiplier: 2.5 } : {}),
        },
      ]);
    },
  );

  it('multiplies the tank attack by 2.5, for twenty-five times ordinary raw damage', () => {
    const session = arena(61, () => 0);
    const tank = addSpider(session, 'tank', 0, 1, 1000);
    const before = session.state.hp;
    session.tick(0.001);
    expect(session.state.hp).toBe(before - 2500);
    expect(session.drainEvents()).toEqual([
      {
        type: 'damage',
        spiderId: tank.id,
        hp: 2500,
        energy: 0,
        piercing: true,
        rawDamageMultiplier: 25,
      },
    ]);
  });

  it('identifies an ordinary tank strike without marking it piercing', () => {
    const session = arena(61, () => 0.9);
    const tank = addSpider(session, 'tank', 0, 1, 1000);
    session.tick(0.001);
    expect(session.drainEvents()).toEqual([
      { type: 'damage', spiderId: tank.id, hp: 1000, energy: 0, rawDamageMultiplier: 10 },
    ]);
  });

  it.each([50, 1000])(
    'applies armor and %i block power after multiplying raw damage',
    (blockPower) => {
      const random = vi.fn(() => 0);
      const session = arena(61, random);
      session.state.character.setModifiers('test:defense', [
        { stat: 'armor', kind: 'flat', value: 1000000 },
        { stat: 'blockChance', kind: 'flat', value: 1 },
        { stat: 'blockPower', kind: 'flat', value: blockPower },
      ]);
      session.refreshStats();
      const spider = addSpider(session, 'normal', 0, 1, 100);
      const incoming = session.state.rules.value('incomingDamage', 250);
      const hp = session.state.rules.value('incomingDamage', 250, [
        { source: 'block', kind: 'flat', value: -blockPower },
      ]);
      const before = session.state.hp;
      session.tick(0.001);
      expect(session.state.hp).toBe(before - hp);
      expect(random).toHaveBeenCalledTimes(2);
      expect(session.drainEvents()).toEqual([
        {
          type: 'damage',
          spiderId: spider.id,
          hp,
          energy: 0,
          blockedDamage: incoming - hp,
          piercing: true,
          rawDamageMultiplier: 2.5,
        },
      ]);
    },
  );

  it('can dodge a piercing burner strike without losing health or energy', () => {
    const random = vi.fn(() => 0);
    const session = arena(61, random);
    session.state.character.setModifiers('test:dodge', [
      { stat: 'dodgeChance', kind: 'flat', value: 0.75 },
    ]);
    session.refreshStats();
    const burner = addSpider(session, 'burner', 0, 1, 50);
    const { hp, energy } = session.state;
    session.tick(0.001);
    expect(session.state).toMatchObject({ hp, energy });
    expect(random).toHaveBeenCalledTimes(2);
    expect(session.drainEvents()).toEqual([
      {
        type: 'damage',
        spiderId: burner.id,
        hp: 0,
        energy: 0,
        dodged: true,
        piercing: true,
        rawDamageMultiplier: 1.25,
      },
    ]);
  });

  it.each(['zero damage', 'invulnerability'] as const)(
    'does not roll piercing for %s',
    (protection) => {
      const random = vi.fn(() => 0);
      const session = arena(61, random);
      if (protection === 'invulnerability') session.state.invulnerableTimer = 1;
      addSpider(session, 'normal', 0, 1, protection === 'zero damage' ? 0 : 100);
      const before = session.state.hp;
      session.tick(0.001);
      expect(session.state.hp).toBe(before);
      expect(random).not.toHaveBeenCalled();
    },
  );
});
