import { describe, expect, it } from 'vitest';
import { GameSession } from '../src/domain/GameSession.js';
import { parseSave, restore, snapshot } from '../src/domain/save.js';
import type { Difficulty, SpiderType } from '../src/domain/types.js';
import { addSpider, game, previousSpiders } from './helpers.js';

const priority = [
  ['golden', 40],
  ['tank', 15],
  ['burner', 5],
  ['megaFat', 50],
  ['fat', 10],
  ['fast', 20],
  ['ninja', 35],
] as const;

function encounter(level: number, rolls: number[], difficulty: Difficulty = 'normal') {
  const session = new GameSession(difficulty, () => rolls.shift() ?? 0.999999);
  session.upgradeTalent('hunterMastery');
  session.confirmLevelUp();
  session.state.level = level;
  session.refreshStats();
  session.state.levelTimer = session.state.levelTimerMax = session.state.rules.levelDuration(level);
  return session;
}

function speciesRolls(type: SpiderType, level: number, roll: number) {
  const rolls = [0];
  for (const [candidate, unlock] of priority) {
    if (level < unlock) continue;
    rolls.push(candidate === type ? roll : 0.999999);
    if (candidate === type) break;
  }
  return [...rolls, 0.5, 0.5, 0.5];
}

describe('spider generation through session ticks', () => {
  it.each([
    ['easy', 1, 22],
    ['easy', 25, 125],
    ['easy', 50, 320],
    ['normal', 1, 23],
    ['normal', 25, 180],
    ['normal', 50, 500],
    ['hard', 1, 24],
    ['hard', 25, 245],
    ['hard', 50, 720],
  ] as const)('spawns quadratic damage on %s at level %i: %i', (difficulty, level, damage) => {
    const session = encounter(level, speciesRolls('normal', level, 0), difficulty);
    session.tick(0.02);
    expect([...session.state.spiders.values()][0]).toMatchObject({ type: 'normal', damage });
  });

  it.each([
    ['normal', 0, 350],
    ['normal', 1, 650],
    ['fat', 0.5, 500],
    ['megaFat', 0.5, 500],
    ['golden', 0.5, 500],
    ['ninja', 0.5, 500],
    ['fast', 0, 175],
    ['burner', 1, 325],
    ['tank', 1, 6500],
  ] as const)('keeps species and variance modifiers for %s with roll %s', (type, roll, damage) => {
    const rolls = speciesRolls(type, 50, 0);
    rolls[rolls.length - 2] = roll;
    const session = encounter(50, rolls);
    session.tick(0.02);
    expect([...session.state.spiders.values()][0]).toMatchObject({ type, damage });
  });

  it.each([
    ['golden', [0, 0, 0, 0, 0, 0, 0]],
    ['tank', [0.99, 0, 0, 0, 0, 0, 0]],
    ['burner', [0.99, 0.99, 0, 0, 0, 0, 0]],
    ['megaFat', [0.99, 0.99, 0.99, 0, 0, 0, 0]],
    ['fat', [0.99, 0.99, 0.99, 0.99, 0, 0, 0]],
    ['fast', [0.99, 0.99, 0.99, 0.99, 0.99, 0, 0]],
    ['ninja', [0.99, 0.99, 0.99, 0.99, 0.99, 0.99, 0]],
    ['normal', [0.99, 0.99, 0.99, 0.99, 0.99, 0.99, 0.99]],
  ] as const)('chooses %s before every later eligible type', (type, rolls) => {
    const session = encounter(50, [0, ...rolls]);
    session.tick(0.02);
    expect([...session.state.spiders.values()][0].type).toBe(type);
  });

  it.each([
    ['golden', 40, 0.005],
    ['golden', 50, 0.005],
    ['golden', 500, 0.005],
    ['megaFat', 50, 0.01],
    ['megaFat', 89, 0.01],
    ['megaFat', 90, 0.02],
    ['megaFat', 129, 0.02],
    ['megaFat', 130, 0.03],
    ['tank', 15, 0.02],
    ['tank', 29, 0.02],
    ['tank', 30, 0.03],
    ['tank', 45, 0.04],
    ['burner', 5, 0.01],
    ['burner', 24, 0.01],
    ['burner', 25, 0.02],
    ['burner', 45, 0.03],
    ['fat', 10, 0.05],
    ['fat', 34, 0.05],
    ['fat', 35, 0.06],
    ['fat', 60, 0.07],
    ['fast', 20, 0.07],
    ['fast', 70, 0.07],
    ['fast', 140, 0.07],
    ['ninja', 35, 0.02],
    ['ninja', 69, 0.02],
    ['ninja', 70, 0.03],
    ['ninja', 105, 0.04],
  ] as const)('%s at level %i uses chance %s', (type, level, probability) => {
    const success = encounter(level, speciesRolls(type, level, probability - 0.000001));
    success.tick(0.02);
    expect([...success.state.spiders.values()][0].type).toBe(type);
    const failure = encounter(level, speciesRolls(type, level, probability));
    failure.tick(0.02);
    expect([...failure.state.spiders.values()][0].type).toBe('normal');
  });

  it.each(priority)('does not select %s before level %i', (type, unlock) => {
    const session = encounter(unlock - 1, [0, 0, 0, 0, 0, 0]);
    session.tick(0.02);
    expect([...session.state.spiders.values()].some((spider) => spider.type === type)).toBe(false);
    expect(session.state.rules.spiderTypeProbability(type, unlock - 1)).toBe(0);
    expect(session.state.rules.spiderTypeProbability('normal', unlock)).toBe(0);
  });

  it.each(['easy', 'normal', 'hard'] as const)(
    'uses the same new-species chances and ordinary speed and damage on %s',
    (difficulty) => {
      for (const [type, level, probability, hits] of [
        ['golden', 40, 0.005, 1],
        ['megaFat', 50, 0.01, 3],
        ['megaFat', 90, 0.02, 3],
      ] as const) {
        const normal = encounter(level, speciesRolls('normal', level, 0), difficulty);
        normal.tick(0.02);
        const ordinary = [...normal.state.spiders.values()][0];
        const success = encounter(
          level,
          speciesRolls(type, level, probability - 0.000001),
          difficulty,
        );
        success.tick(0.02);
        expect([...success.state.spiders.values()][0]).toMatchObject({
          type,
          hits,
          speed: ordinary.speed,
          damage: ordinary.damage,
        });
        const failure = encounter(level, speciesRolls(type, level, probability), difficulty);
        failure.tick(0.02);
        expect([...failure.state.spiders.values()][0].type).toBe('normal');
      }
    },
  );

  it('caps a growing species chance at 100 percent', () => {
    const session = encounter(1500, [0, 0.999999, 0.999999, 0.5, 0.5, 0.5]);
    session.tick(0.02);
    expect([...session.state.spiders.values()][0].type).toBe('tank');
    expect(session.state.rules.spiderTypeProbability('tank', 1500)).toBe(1);
  });

  it.each([
    ['easy', 1, 0.0006],
    ['easy', 2, 0.000628],
    ['easy', 50, 0.001989],
    ['normal', 1, 0.0006],
    ['normal', 2, 0.000641],
    ['normal', 50, 0.002585],
    ['hard', 1, 0.00065],
    ['hard', 2, 0.000703],
    ['hard', 50, 0.00323],
  ] as const)(
    'uses restored spawn base and reduced level growth on %s at level %i: %s',
    (difficulty, level, probability) => {
      const spawned = encounter(level, [probability - 0.000001], difficulty);
      spawned.tick(0.01);
      expect(spawned.state.spiders.size).toBe(0);
      spawned.tick(0.01);
      expect(spawned.state.spiders.size).toBe(1);
      const empty = encounter(level, [probability], difficulty);
      empty.tick(0.02);
      expect(empty.state.spiders.size).toBe(0);
    },
  );

  it('still checks all nine lanes independently, including occupied lanes', () => {
    const session = encounter(1, Array(72).fill(0));
    session.tick(0.04);
    expect(session.state.spiders.size).toBe(18);
    for (let lane = 0; lane < 9; lane++)
      expect(
        [...session.state.spiders.values()].filter((spider) => spider.lane === lane),
      ).toHaveLength(2);
  });
});

describe('burner damage and energy', () => {
  it.each([
    ['easy', 5, 17, 100],
    ['normal', 25, 90, 140],
    ['hard', 50, 360, 190],
  ] as const)(
    'spawns and breaches with scaled damage on %s level %i',
    (difficulty, level, damage, energy) => {
      const session = encounter(level, speciesRolls('burner', level, 0), difficulty);
      session.state.character.setModifiers('test', [
        { stat: 'maxHp', kind: 'flat', value: 10000 },
        { stat: 'maxEnergy', kind: 'flat', value: 1000 },
        { stat: 'hpRegen', kind: 'percent', value: -100 },
        { stat: 'energyRegen', kind: 'percent', value: -100 },
        { stat: 'energyPerBreach', kind: 'flat', value: 3 },
      ]);
      session.refreshStats();
      session.state.energy = 500;
      session.tick(0.02);
      const spider = [...session.state.spiders.values()][0];
      expect(spider).toMatchObject({ type: 'burner', damage });
      spider.y = 1;
      const hp = session.state.rules.value('incomingDamage', damage);
      session.tick(0.001);
      expect(session.drainEvents()).toContainEqual({
        type: 'damage',
        spiderId: spider.id,
        hp,
        energy,
      });
      expect(session.state.energy).toBe(500 - energy + session.state.stats.energyPerBreach);
    },
  );

  it('uses the current level for burning, limits loss to available energy, and respects invulnerability', () => {
    const session = game(35);
    session.state.character.setModifiers('test', [
      { stat: 'maxEnergy', kind: 'flat', value: 500 },
      { stat: 'energyRegen', kind: 'percent', value: -100 },
    ]);
    session.refreshStats();
    const spider = addSpider(session, 'burner', 0, 0.5, 0);
    session.state.levelTimer = 0;
    session.tick(0.001);
    session.upgradeTalent('hunterMastery');
    expect(session.confirmLevelUp()).toBe(true);
    expect(session.state.level).toBe(36);
    session.state.energy = 300;
    spider.y = 1;
    session.tick(0.001);
    expect(session.drainEvents()).toContainEqual({
      type: 'damage',
      spiderId: spider.id,
      hp: 0,
      energy: 162,
    });
    const second = addSpider(session, 'burner', 1, 1, 0);
    session.state.energy = 17;
    session.tick(0.001);
    expect(session.drainEvents()).toContainEqual({
      type: 'damage',
      spiderId: second.id,
      hp: 0,
      energy: 17,
    });
    addSpider(session, 'burner', 2, 1, 0);
    session.state.energy = 100;
    session.state.invulnerableTimer = 1;
    session.tick(0.001);
    expect(session.drainEvents()).toEqual([{ type: 'absorb' }]);
    expect(session.state.energy).toBe(100 + session.state.stats.energyPerBreach);
  });
});

describe('ninja jumps and saved progress', () => {
  it.each([
    [35, 1],
    [69, 1],
    [70, 2],
    [104, 2],
    [105, 3],
    [140, 4],
  ] as const)(
    'assigns %i-level ninjas %i jumps spread along the remaining path',
    (level, limit) => {
      const session = encounter(level, speciesRolls('ninja', level, 0));
      session.tick(0.02);
      const spider = [...session.state.spiders.values()][0];
      expect(spider.jumpLimit).toBe(limit);
      expect(spider.jumpThreshold).toBeCloseTo(0.3);
      for (let jump = 0; jump < limit; jump++) {
        const threshold = 0.3 + (0.7 * jump) / limit;
        spider.y = threshold - 0.001;
        session.tick(0.000001);
        expect(spider.jumpsMade).toBe(jump);
        spider.y = threshold + 0.000001;
        const lane = spider.lane;
        session.tick(0.000001);
        expect(spider.jumpsMade).toBe(jump + 1);
        expect(Math.abs(spider.lane - lane)).toBe(1);
      }
      spider.y = 0.99;
      const lane = spider.lane;
      session.tick(0.000001);
      expect(spider.jumpsMade).toBe(limit);
      expect(spider.lane).toBe(lane);
    },
  );

  it.each([0, 8])('never leaves the field during repeated jumps from edge %i', (lane) => {
    const session = game(140);
    const spider = addSpider(session, 'ninja', lane, 0.99);
    session.tick(0.001);
    expect(spider.jumpsMade).toBe(4);
    expect(spider.lane).toBeGreaterThanOrEqual(0);
    expect(spider.lane).toBeLessThan(9);
  });

  it('keeps a spawned ninja jump allowance through level-up and saves completed jumps', () => {
    const session = game(104);
    const spider = addSpider(session, 'ninja', 4, 0.3);
    session.tick(0.001);
    expect(spider.jumpsMade).toBe(1);
    session.state.levelTimer = 0;
    session.tick(0.001);
    session.upgradeTalent('hunterMastery');
    expect(session.confirmLevelUp()).toBe(true);
    expect(session.state.level).toBe(105);
    const saved = snapshot(session);
    const loaded = restore(parseSave(JSON.parse(JSON.stringify(saved)))!, () => 0.999999);
    expect(snapshot(loaded)).toEqual(saved);
    const ninja = [...loaded.state.spiders.values()][0];
    expect(ninja).toMatchObject({ jumpLimit: 2, jumpsMade: 1 });
    ninja.y = 0.8;
    loaded.tick(0.001);
    expect(ninja).toMatchObject({ jumpLimit: 2, jumpsMade: 2, lane: 6 });
    loaded.tick(0.001);
    expect(ninja.lane).toBe(6);
    expect(addSpider(loaded, 'ninja').jumpLimit).toBe(3);
  });

  it.each([false, true])(
    'migrates version 11 ninja with hasJumped=%s without granting extra jumps',
    (hasJumped) => {
      const session = game(105);
      addSpider(session, 'ninja', 4, 0.8);
      session.state.eagleEyeTimer = 9;
      session.state.eagleEyeShots = 3;
      session.shootLane(0);
      const current = snapshot(session);
      const previous = {
        ...current,
        version: 11,
        spiders: previousSpiders(current).map((spider) => ({ ...spider, hasJumped })),
      };
      const migrated = parseSave(previous)!;
      expect(migrated.version).toBe(16);
      expect(migrated.state).toEqual(current.state);
      expect(migrated.arrows).toEqual(current.arrows);
      const loaded = restore(migrated, () => 0.999999);
      const spider = [...loaded.state.spiders.values()][0];
      expect(spider).toMatchObject({ jumpLimit: 1, jumpsMade: hasJumped ? 1 : 0 });
      loaded.tick(0.001);
      expect(spider).toMatchObject({ jumpLimit: 1, jumpsMade: 1, lane: hasJumped ? 4 : 5 });
      const saved = snapshot(loaded);
      expect(snapshot(restore(parseSave(saved)!))).toEqual(saved);
    },
  );

  it.each([
    { jumpsMade: -1 },
    { jumpsMade: 0.5 },
    { jumpsMade: 4 },
    { jumpLimit: 0 },
    { jumpLimit: 1.5 },
    { jumpLimit: null },
    { jumpThreshold: 0.09 },
    { jumpThreshold: 0.51 },
  ])('rejects invalid saved jump state %j', (invalid) => {
    const session = game(105);
    addSpider(session, 'ninja');
    const saved = snapshot(session);
    expect(parseSave({ ...saved, spiders: [{ ...saved.spiders[0], ...invalid }] })).toBeNull();
  });
});
