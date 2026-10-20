import { describe, expect, it } from 'vitest';
import { GameSession } from '../src/domain/GameSession.js';
import type { Difficulty } from '../src/domain/types.js';
import { SPECIAL_SPIDER_ORDER } from '../src/content/spiders.js';
import { parseSave, restore, snapshot } from '../src/domain/save.js';
import { playerEffectDescription } from '../src/ui/presenters.js';
import { effectPanelGroups } from '../src/ui/effectPanelModel.js';
import { addSpider } from './helpers.js';

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

describe.each([
  ['easy', 1],
  ['normal', 0.5],
  ['hard', 0.25],
] as const)(
  'initial assistance on %s through session state and ticks',
  (difficulty, multiplier) => {
    it.each([
      [1, 11.6, 2.9],
      [2, 11.2, 2.8],
      [15, 6, 1.5],
      [29, 0.4, 0.1],
      [30, 0, 0],
      [31, 0, 0],
      [60, 0, 0],
    ])('adds %s-level bonuses of %s HP/s and %s energy/s', (level, hpBonus, energyBonus) => {
      const session = playing(difficulty, level);
      expect(session.state.rules.explain('hpRegen').base).toBeCloseTo(hpBonus * multiplier);
      expect(session.state.rules.explain('energyRegen').base).toBeCloseTo(
        8 + energyBonus * multiplier,
      );
      session.state.hp = session.state.energy = 1;
      session.tick(1);
      expect(session.state.hp).toBeCloseTo(1 + session.state.stats.hpRegen);
      expect(session.state.energy).toBeCloseTo(1 + session.state.stats.energyRegen);
      const buff = session.state.activeEffects.find((effect) => effect.id === 'initialAssistance');
      if (level < 30) {
        expect(buff).toMatchObject({
          name: 'Начальная помощь',
          kind: 'buff',
          remaining: null,
          stacks: null,
          removableByCleanser: false,
          undispellable: true,
        });
        expect(buff!.details!.hpRegen).toBeCloseTo(hpBonus * multiplier);
        expect(buff!.details!.energyRegen).toBeCloseTo(energyBonus * multiplier);
        expect(effectPanelGroups(session.state.activeEffects).buff.visible).toContainEqual(buff);
      } else expect(buff).toBeUndefined();
    });

    it('includes the bonus in the base before regeneration and healing modifiers', () => {
      const session = playing(difficulty, 1);
      session.state.character.setModifiers('test:regeneration', [
        { stat: 'hpRegen', kind: 'flat', value: 2 },
        { stat: 'hpRegen', kind: 'percent', value: 50 },
        { stat: 'energyRegen', kind: 'flat', value: 1 },
        { stat: 'energyRegen', kind: 'percent', value: 50 },
        { stat: 'healingReceived', kind: 'percent', value: -50 },
      ]);
      session.refreshStats();
      const [hpRegen, energyRegen] = {
        easy: [11.01, 18.09],
        normal: [6.66, 15.92],
        hard: [4.49, 14.83],
      }[difficulty];
      expect(session.state.stats.hpRegen).toBe(hpRegen);
      expect(session.state.stats.energyRegen).toBe(energyRegen);
      session.state.hp = session.state.energy = 1;
      session.tick(1);
      expect(session.state.hp).toBeCloseTo(1 + hpRegen);
      expect(session.state.energy).toBeCloseTo(1 + energyRegen);
    });

    it('removes the remaining bonus at level 30 and restores it from the saved difficulty', () => {
      const session = playing(difficulty, 29);
      expect(session.state.activeEffects.some((effect) => effect.id === 'initialAssistance')).toBe(
        true,
      );
      session.state.levelTimer = 0;
      session.tick(0.001);
      expect(session.upgradeTalent('hunterMastery')).toBe(true);
      expect(session.confirmLevelUp()).toBe(true);
      expect(session.state.level).toBe(30);
      const normal = playing('normal', 30);
      expect(session.state.stats.hpRegen).toBe(normal.state.stats.hpRegen);
      expect(session.state.stats.energyRegen).toBe(normal.state.stats.energyRegen);
      expect(session.state.activeEffects.some((effect) => effect.id === 'initialAssistance')).toBe(
        false,
      );
      const original = playing(difficulty, 15);
      const saved = snapshot(original);
      const loaded = restore(parseSave(saved)!, () => 0.999999);
      expect(loaded.state.stats).toEqual(original.state.stats);
      expect(loaded.state.activeEffects).toEqual(original.state.activeEffects);
      expect(snapshot(loaded)).toEqual(saved);
    });

    it('keeps the help after a cleanser and describes its current bonuses', () => {
      const session = playing(difficulty, 15);
      const buff = session.state.activeEffects.find((effect) => effect.id === 'initialAssistance')!;
      addSpider(session, 'cleanser', 4, 1, 0);
      session.tick(0.001);
      expect(session.state.activeEffects).toContainEqual(buff);
      const description = playerEffectDescription(buff);
      expect(description).toContain('Начальная помощь');
      expect(description).toContain(`на ${6 * multiplier} в секунду`);
      expect(description).toContain(
        `на ${{ easy: 1.5, normal: 0.75, hard: 0.38 }[difficulty]} в секунду`,
      );
      expect(description).toContain('30-м уровне');
      expect(description).toContain('Нельзя рассеять');
    });
  },
);
