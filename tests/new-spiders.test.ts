import { describe, expect, it } from 'vitest';
import { GameSession } from '../src/domain/GameSession.js';
import { parseSave, restore, snapshot } from '../src/domain/save.js';
import type { Difficulty } from '../src/domain/types.js';
import { addSpider } from './helpers.js';

function arena(level = 50, roll = 0.5, difficulty: Difficulty = 'normal') {
  const session = new GameSession(difficulty, () => roll, { level });
  session.state.character.setModifiers('test:arena', [
    { stat: 'spawnProbability', kind: 'percent', value: -100 },
    { stat: 'coinsPerSec', kind: 'percent', value: -100 },
    { stat: 'hpRegen', kind: 'percent', value: -100 },
    { stat: 'energyRegen', kind: 'percent', value: -100 },
    { stat: 'shootCost', kind: 'percent', value: -100 },
    { stat: 'shootCooldown', kind: 'percent', value: -100 },
    { stat: 'arrowSpeed', kind: 'percent', value: 2900 },
    { stat: 'hpPerKill', kind: 'flat', value: 7 },
    { stat: 'energyPerKill', kind: 'flat', value: 11 },
  ]);
  session.refreshStats();
  session.state.initialTalentPick = false;
  session.state.pendingTalentPoints = 0;
  session.state.phase = 'playing';
  return session;
}

function shoot(session: GameSession, lane = 0) {
  expect(session.shootLane(lane)).toBe('shot');
  session.tick(0.01);
}

function rewards(session: GameSession) {
  return session.drainEvents().filter((event) => event.type === 'coinDrop');
}

describe('mega-fat spiders through session commands', () => {
  it('takes three normal arrows, changes shape after each wound and rewards only the kill', () => {
    const session = arena();
    const spider = addSpider(session, 'megaFat', 0, 0.9, 123, 0.1);
    const behind = addSpider(session, 'normal', 0, 0.5);
    session.state.hp -= 50;
    session.state.energy -= 50;
    const { hp, energy, coins } = session.state;

    for (const [type, hits] of [
      ['fat', 2],
      ['normal', 1],
    ] as const) {
      shoot(session);
      expect(spider).toMatchObject({ type, hits, dying: false, damage: 123, speed: 0.1 });
      expect(session.state.arrows.size).toBe(0);
      expect(behind.dying).toBe(false);
      session.tick(0.31);
      expect(rewards(session)).toEqual([]);
      expect(session.state).toMatchObject({ hp, energy, coins });
    }

    shoot(session);
    expect(spider).toMatchObject({ hits: 0, dying: true });
    session.tick(0.31);
    expect(rewards(session)).toEqual([
      { type: 'coinDrop', spiderId: spider.id, coins: 3, jackpot: false },
    ]);
    expect(session.state).toMatchObject({ hp: hp + 7, energy: energy + 11, coins: coins + 3 });
    session.tick(0.31);
    expect(rewards(session)).toEqual([]);
    expect(behind.dying).toBe(false);
  });

  it.each([
    [2, 0, 1, 'normal', false, 0],
    [3, 0, 0, 'megaFat', true, 0],
    [2, 1, 0, 'fat', true, 0],
    [3, 1, 0, 'fat', true, 1],
  ] as const)(
    'spends power %i after %i wounds and carries only unused power forward',
    (power, wounds, hits, type, dying, remaining) => {
      const session = arena();
      const spider = addSpider(session, 'megaFat', 0, 0.9);
      for (let i = 0; i < wounds; i++) shoot(session);
      session.state.character.setModifiers('test:critical', [
        { stat: 'criticalShotChance', kind: 'flat', value: 1 },
        { stat: 'improvedCriticalShotChance', kind: 'flat', value: power === 3 ? 1 : 0 },
      ]);
      session.refreshStats();
      const behind = addSpider(session, 'normal', 0, 0.5);
      shoot(session);
      expect(spider).toMatchObject({ type, hits, dying });
      expect([...session.state.arrows.values()].map((arrow) => arrow.power)).toEqual(
        remaining ? [remaining] : [],
      );
      session.tick(0.04);
      expect(behind.dying).toBe(remaining > 0);
    },
  );

  it.each([0, 1, 2])(
    'preserves %i wounds through save/load and finishes the same spider',
    (wounds) => {
      const session = arena();
      const spider = addSpider(session, 'megaFat', 0, 0.9);
      for (let i = 0; i < wounds; i++) shoot(session);
      const saved = snapshot(session);
      const loaded = restore(parseSave(JSON.parse(JSON.stringify(saved)))!, () => 0.5);
      expect(snapshot(loaded)).toEqual(saved);
      expect(loaded.state.spiders.get(spider.id)).toMatchObject({
        type: ['megaFat', 'fat', 'normal'][wounds],
        hits: 3 - wounds,
      });
      for (let i = wounds; i < 3; i++) shoot(loaded);
      loaded.tick(0.31);
      expect(loaded.state.spiders.size).toBe(0);
      expect(rewards(loaded)).toEqual([
        { type: 'coinDrop', spiderId: spider.id, coins: 3, jackpot: false },
      ]);
    },
  );
});

describe('golden spider rewards through session commands', () => {
  it.each([
    ['easy', 40, 53],
    ['normal', 50, 63],
    ['hard', 90, 104],
  ] as const)(
    'adds the level bonus to one normal-arrow kill on %s at level %i',
    (difficulty, level, coins) => {
      const session = arena(level, 0.5, difficulty);
      const spider = addSpider(session, 'golden', 0, 0.9);
      const before = session.state.coins;
      shoot(session);
      expect(spider).toMatchObject({ hits: 0, dying: true });
      session.tick(0.31);
      expect(rewards(session)).toEqual([
        { type: 'coinDrop', spiderId: spider.id, coins, jackpot: false },
      ]);
      expect(session.state.coins).toBe(before + coins);
      session.tick(0.31);
      expect(rewards(session)).toEqual([]);
      expect(session.state.coins).toBe(before + coins);
    },
  );

  it.each([false, true])(
    'applies greed, items and percentages only to ordinary gold; jackpot=%s',
    (jackpot) => {
      const session = arena(90, jackpot ? 0.01 : 0.5);
      session.talents.loadFromSave([
        { id: 'greed', rank: 5 },
        { id: 'hunterReward', rank: 5 },
      ]);
      session.state.phase = 'levelUp';
      session.state.coins = 10000;
      expect(session.buyItem('c096')).toBe(true);
      session.state.character.setModifiers('test:reward', [
        { stat: 'coinsPerKill', kind: 'percent', value: 25 },
      ]);
      session.refreshStats();
      session.state.phase = 'playing';
      const normal = addSpider(session, 'normal', 0, 0.9);
      const golden = addSpider(session, 'golden', 1, 0.9);
      const before = session.state.coins;
      shoot(session, 0);
      shoot(session, 1);
      session.tick(0.31);
      // Base roll + greed (5) + wallet (1) + endurance (1); only that sum receives +25%.
      const normalCoins = jackpot ? 30 : 13;
      const bonus = jackpot ? 300 : 100;
      expect(rewards(session)).toEqual([
        { type: 'coinDrop', spiderId: normal.id, coins: normalCoins, jackpot },
        { type: 'coinDrop', spiderId: golden.id, coins: normalCoins + bonus, jackpot },
      ]);
      expect(session.state.coins).toBe(before + 2 * normalCoins + bonus);
    },
  );

  it.each([0, 1, 2, 3])(
    'gives no bonus on a breach with marauder rank %i, even with a jackpot and shield',
    (rank) => {
      const session = arena(50, 0.01);
      session.talents.loadFromSave([
        { id: 'greed', rank: 5 },
        { id: 'hunterReward', rank: 5 },
        { id: 'marauder', rank },
      ]);
      session.refreshStats();
      session.state.invulnerableTimer = 1;
      session.state.energy = 0;
      const before = session.state.coins;
      const spider = addSpider(session, 'golden', 0, 1, 100000);
      session.tick(0.31);
      const coins = [0, 3, 5, 8][rank]; // round((1 + 5) × 3 × rank × 15%).
      expect(rewards(session)).toEqual(
        rank ? [{ type: 'coinDrop', spiderId: spider.id, coins, jackpot: true }] : [],
      );
      expect(session.state.coins).toBe(before + coins);
      expect(session.state.energy).toBe(session.state.stats.energyPerBreach);
      session.tick(0.31);
      expect(rewards(session)).toEqual([]);
      expect(session.state.coins).toBe(before + coins);
    },
  );

  it('uses the current level after a level-up and preserves a pending golden reward in a save', () => {
    const session = arena(40);
    const spider = addSpider(session, 'golden', 0, 0.9);
    session.state.levelTimer = 0;
    session.tick(0.001);
    expect(session.upgradeTalent('hunterMastery')).toBe(true);
    expect(session.confirmLevelUp()).toBe(true);
    expect(session.state.level).toBe(41);
    shoot(session);
    const saved = snapshot(session);
    const loaded = restore(parseSave(JSON.parse(JSON.stringify(saved)))!, () => 0.5);
    expect(snapshot(loaded)).toEqual(saved);
    expect(loaded.state.spiders.get(spider.id)).toMatchObject({ type: 'golden', dying: true });
    loaded.tick(0.31);
    expect(rewards(loaded)).toEqual([
      { type: 'coinDrop', spiderId: spider.id, coins: 54, jackpot: false },
    ]);
    loaded.tick(0.31);
    expect(rewards(loaded)).toEqual([]);
  });
});

it('armageddon kills both new types immediately and emits one total reward per spider', () => {
  const session = arena();
  const golden = addSpider(session, 'golden');
  const megaFat = addSpider(session, 'megaFat');
  expect(session.activateAbility('armageddon')).toBe('activated');
  session.tick(2.5);
  expect(session.state.spiders.size).toBe(0);
  expect(rewards(session)).toEqual([
    { type: 'coinDrop', spiderId: golden.id, coins: 63, jackpot: false },
    { type: 'coinDrop', spiderId: megaFat.id, coins: 3, jackpot: false },
  ]);
});
