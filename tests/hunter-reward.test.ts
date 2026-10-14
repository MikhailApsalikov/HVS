import { describe, expect, it } from 'vitest';
import { GameSession } from '../src/domain/GameSession.js';
import type { SpiderType } from '../src/domain/types.js';
import { addSpider } from './helpers.js';

function arena(rank = 5, roll = 0.999999, level = 50) {
  const session = new GameSession('normal', () => roll, { level });
  session.talents.loadFromSave([{ id: 'hunterReward', rank }]);
  session.state.character.setModifiers('test:arena', [
    { stat: 'spawnProbability', kind: 'percent', value: -100 },
    { stat: 'endurance', kind: 'percent', value: -100 },
    { stat: 'agility', kind: 'percent', value: -100 },
    { stat: 'maxHp', kind: 'flat', value: 100000 },
    { stat: 'hpRegen', kind: 'percent', value: -100 },
    { stat: 'energyRegen', kind: 'percent', value: -100 },
    { stat: 'shootCost', kind: 'percent', value: -100 },
    { stat: 'shootCooldown', kind: 'percent', value: -100 },
    { stat: 'arrowSpeed', kind: 'percent', value: 2900 },
    { stat: 'armor', kind: 'flat', value: 100 },
  ]);
  session.refreshStats();
  session.state.phase = 'playing';
  session.state.levelTimer = session.state.levelTimerMax = 1000;
  return session;
}

function kill(session: GameSession, type: SpiderType = 'golden', lane = 0) {
  const spider = addSpider(session, type, lane, 0.9);
  expect(session.shootLane(lane)).toBe('shot');
  session.tick(0.31);
  const reward = session
    .drainEvents()
    .find((event) => event.type === 'coinDrop' && event.spiderId === spider.id);
  expect(reward?.type).toBe('coinDrop');
  return reward!;
}

describe('hunter reward through session commands', () => {
  it.each([1, 2, 3, 4, 5])('gives a golden jackpot at 20%% per rank, rank %i', (rank) => {
    const session = arena(rank, rank * 0.2 - 0.000001);
    expect(session.state.stats.goldenJackpotChance).toBeCloseTo(rank * 0.2);
    expect(kill(session)).toMatchObject({ jackpot: true });
    expect(session.state.hunterRewardTimer).toBe(15);
    expect(session.state.stats).toMatchObject({ armor: 150, coinsPerSec: 6 });
  });

  it.each([0, 1, 2, 3, 4])(
    'requires a roll strictly below the golden chance at rank %i',
    (rank) => {
      const session = arena(rank, rank * 0.2);
      expect(kill(session)).toMatchObject({ jackpot: false });
      expect(session.state.hunterRewardTimer).toBe(0);
      expect(session.state.stats).toMatchObject({ armor: 100, coinsPerSec: 4 });
    },
  );

  it('guarantees the final golden jackpot rank even on the largest valid roll', () => {
    const session = arena(5);
    expect(session.state.stats.goldenJackpotChance).toBe(1);
    expect(kill(session)).toMatchObject({ coins: 195, jackpot: true });
    expect(session.state.activeEffects).toContainEqual(
      expect.objectContaining({ id: 'hunterReward', remaining: 15, stacks: null }),
    );
  });

  it.each([1, 2, 3, 4, 5])('preserves 7%% per rank for ordinary spiders, rank %i', (rank) => {
    const success = arena(rank, rank * 0.07 - 0.000001);
    expect(success.state.stats.jackpotChance).toBeCloseTo(rank * 0.07);
    expect(kill(success, 'normal')).toMatchObject({ jackpot: true });
    expect(success.state.hunterRewardTimer).toBe(0);
    const failure = arena(rank, rank * 0.07);
    expect(kill(failure, 'normal')).toMatchObject({ jackpot: false });
    expect(failure.state.hunterRewardTimer).toBe(0);
  });

  it.each([0.01, 0.5])(
    'keeps the ordinary jackpot chance on golden breaches with roll %f',
    (roll) => {
      const session = arena(5, roll);
      session.talents.loadFromSave([
        { id: 'hunterReward', rank: 5 },
        { id: 'marauder', rank: 3 },
      ]);
      session.refreshStats();
      addSpider(session, 'golden', 0, 1, 0);
      session.tick(0.31);
      expect(session.drainEvents()).toContainEqual(
        expect.objectContaining({ type: 'coinDrop', jackpot: roll < 0.35 }),
      );
      expect(session.state.hunterRewardTimer).toBe(0);
      expect(session.state.stats).toMatchObject({ armor: 100, coinsPerSec: 4 });
    },
  );

  it('refreshes the buff for 15 seconds without stacking it after another golden jackpot', () => {
    const session = arena();
    kill(session);
    session.tick(7);
    expect(session.state.hunterRewardTimer).toBe(8);
    kill(session);
    expect(session.state.hunterRewardTimer).toBe(15);
    expect(session.state.stats).toMatchObject({ armor: 150, coinsPerSec: 6 });
    session.tick(14.99);
    expect(session.state.hunterRewardTimer).toBeCloseTo(0.01);
    expect(session.state.stats.armor).toBe(150);
    session.tick(0.01);
    expect(session.state.hunterRewardTimer).toBe(0);
    expect(session.state.stats).toMatchObject({ armor: 100, coinsPerSec: 4 });
    expect(session.state.activeEffects.some((effect) => effect.id === 'hunterReward')).toBe(false);
  });

  it('accounts for passive income exactly when a long tick crosses buff expiration', () => {
    const session = arena();
    kill(session);
    const coins = session.state.coins;
    const fraction = session.state.coinAccumulator;
    session.tick(20);
    expect(session.state.coins).toBe(coins + 110); // 15 × 6 + 5 × 4.
    expect(session.state.coinAccumulator).toBeCloseTo(fraction);
    expect(session.state.hunterRewardTimer).toBe(0);
    expect(session.state.stats).toMatchObject({ armor: 100, coinsPerSec: 4 });
  });

  it('combines its armor and income bonuses with independent positive sources', () => {
    const session = arena();
    session.state.character.setModifiers('test:equipment', [
      { stat: 'armor', kind: 'percent', value: 25 },
      { stat: 'coinsPerSec', kind: 'percent', value: 25 },
    ]);
    session.refreshStats();
    kill(session);
    expect(session.state.stats).toMatchObject({ armor: 188, coinsPerSec: 7.5 });
    session.tick(15);
    expect(session.state.stats).toMatchObject({ armor: 125, coinsPerSec: 5 });
  });

  it('keeps golden and poison penalties after a cleanser removes the reward buff', () => {
    const session = arena();
    kill(session);
    addSpider(session, 'golden', 1, 1, 100);
    addSpider(session, 'poisonous', 2, 1, 100);
    session.tick(0.001);
    // At level 50, golden reduces income by 33%; one poison stack reduces armor by 43%.
    expect(session.state.stats).toMatchObject({ armor: 86, coinsPerSec: 4.02 });
    expect(session.state.hunterRewardTimer).toBeGreaterThan(0);
    addSpider(session, 'cleanser', 3, 1, 0);
    session.tick(0.001);
    expect(session.state.hunterRewardTimer).toBe(0);
    expect(session.state.stats).toMatchObject({ armor: 57, coinsPerSec: 2.68 });
    expect(session.state.poisonDamage).toHaveLength(1);
    expect(session.state.goldLockTimer).toBeGreaterThan(0);
    expect(session.state.poisonTimer).toBeGreaterThan(0);
    expect(session.state.activeEffects.some((effect) => effect.id === 'hunterReward')).toBe(false);
  });
});
