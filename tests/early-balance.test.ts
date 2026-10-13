import { describe, expect, it } from 'vitest';
import { GameSession } from '../src/domain/GameSession.js';
import type { Difficulty } from '../src/domain/types.js';
import { SPECIAL_SPIDER_ORDER } from '../src/content/spiders.js';
import { parseSave, restore, snapshot } from '../src/domain/save.js';

function playing(difficulty: Difficulty, level: number, rolls: number[] = []) {
  const session = new GameSession(difficulty, () => rolls.shift() ?? 0.999999);
  expect(session.upgradeTalent('hunterMastery')).toBe(true);
  expect(session.confirmLevelUp()).toBe(true);
  session.state.level = level;
  session.refreshStats();
  session.state.levelTimer = session.state.levelTimerMax = session.state.rules.levelDuration(level);
  return session;
}

describe('early damage rebalance through session generation', () => {
  it.each([
    ['easy', 0.09, 409.6],
    ['normal', 0.12, 672.4],
    ['hard', 0.15, 1000],
  ] as const)('uses a base of 10 and rounded growth on %s', (difficulty, growth, reference) => {
    for (const roll of [0, 0.5, 1]) {
      const rolls = [0, ...SPECIAL_SPIDER_ORDER.map(() => 0.999999), 0.5, roll, 0.5];
      const session = playing(difficulty, 60, rolls);
      const { spiderDamageBase, spiderDamageGrowth } = session.state.config;
      expect(spiderDamageBase).toBe(10);
      expect(spiderDamageGrowth).toBe(growth);
      expect(spiderDamageBase * (1 + spiderDamageGrowth * 60) ** 2).toBeCloseTo(reference, 12);
      session.tick(0.02);
      expect([...session.state.spiders.values()][0]).toMatchObject({
        type: 'normal',
        damage: Math.round(reference * (1 + (2 * roll - 1) * 0.3)),
      });
    }
  });

  it.each([
    ['easy', 12],
    ['normal', 13],
    ['hard', 13],
  ] as const)('uses the reduced starting damage on %s', (difficulty, damage) => {
    const session = playing(difficulty, 1, [0, 0.5, 0.5, 0.5]);
    session.tick(0.02);
    expect([...session.state.spiders.values()][0]).toMatchObject({ type: 'normal', damage });
  });
});

describe('easy early regeneration through session state and ticks', () => {
  it.each([
    [1, 11.6, 2.9],
    [2, 11.2, 2.8],
    [15, 6, 1.5],
    [29, 0.4, 0.1],
    [30, 0, 0],
    [31, 0, 0],
    [60, 0, 0],
  ])('adds %s-level bonuses of %s HP/s and %s energy/s', (level, hpBonus, energyBonus) => {
    const easy = playing('easy', level);
    const normal = playing('normal', level);
    const hard = playing('hard', level);
    expect(easy.state.stats.hpRegen - normal.state.stats.hpRegen).toBeCloseTo(hpBonus);
    expect(easy.state.stats.energyRegen - normal.state.stats.energyRegen).toBeCloseTo(energyBonus);
    expect(hard.state.stats.hpRegen).toBe(normal.state.stats.hpRegen);
    expect(hard.state.stats.energyRegen).toBe(normal.state.stats.energyRegen);
    easy.state.hp = easy.state.energy = 1;
    normal.state.hp = normal.state.energy = 1;
    easy.tick(1);
    normal.tick(1);
    expect(easy.state.hp - normal.state.hp).toBeCloseTo(hpBonus);
    expect(easy.state.energy - normal.state.energy).toBeCloseTo(energyBonus);
  });

  it('includes the bonus in the base before regeneration and healing modifiers', () => {
    const session = playing('easy', 1);
    session.state.character.setModifiers('test:regeneration', [
      { stat: 'hpRegen', kind: 'flat', value: 2 },
      { stat: 'hpRegen', kind: 'percent', value: 50 },
      { stat: 'energyRegen', kind: 'flat', value: 1 },
      { stat: 'energyRegen', kind: 'percent', value: 50 },
      { stat: 'healingReceived', kind: 'percent', value: -50 },
    ]);
    session.refreshStats();
    expect(session.state.stats.hpRegen).toBe(11.01);
    expect(session.state.stats.energyRegen).toBe(18.09);
    session.state.hp = session.state.energy = 1;
    session.tick(1);
    expect(session.state.hp).toBe(12.01);
    expect(session.state.energy).toBe(19.09);
  });

  it('removes the remaining bonus at level 30 and restores it from the saved difficulty', () => {
    const session = playing('easy', 29);
    session.state.levelTimer = 0;
    session.tick(0.001);
    expect(session.upgradeTalent('hunterMastery')).toBe(true);
    expect(session.confirmLevelUp()).toBe(true);
    expect(session.state.level).toBe(30);
    const normal = playing('normal', 30);
    expect(session.state.stats.hpRegen).toBe(normal.state.stats.hpRegen);
    expect(session.state.stats.energyRegen).toBe(normal.state.stats.energyRegen);
    const saved = snapshot(playing('easy', 15));
    const loaded = restore(parseSave(saved)!, () => 0.999999);
    expect(loaded.state.stats.hpRegen).toBe(8.76);
    expect(loaded.state.stats.energyRegen).toBe(9.94);
    expect(snapshot(loaded)).toEqual(saved);
  });
});
