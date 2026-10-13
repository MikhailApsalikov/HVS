import { describe, expect, it } from 'vitest';
import { GameSession } from '../src/domain/GameSession.js';
import { parseSave, restore, snapshot } from '../src/domain/save.js';
import { addSpider } from './helpers.js';

function arena(roll = 0.999999) {
  const session = new GameSession('normal', () => roll, { level: 60 });
  session.state.character.setModifiers('test:arena', [
    { stat: 'spawnProbability', kind: 'percent', value: -100 },
    { stat: 'maxHp', kind: 'flat', value: 100000 },
    { stat: 'maxEnergy', kind: 'flat', value: 1000 },
    { stat: 'hpRegen', kind: 'percent', value: -100 },
    { stat: 'energyRegen', kind: 'percent', value: -100 },
    { stat: 'armor', kind: 'percent', value: -100 },
    { stat: 'dodgeChance', kind: 'percent', value: -100 },
  ]);
  session.talents.loadFromSave([
    { id: 'lastHope', rank: 1 },
    { id: 'adrenaline', rank: 1 },
    { id: 'eagleEye', rank: 1 },
    { id: 'killingStreak', rank: 1 },
    { id: 'titanPreparation', rank: 2 },
    { id: 'divineShield', rank: 1 },
    { id: 'aimedFire', rank: 1 },
  ]);
  session.refreshStats();
  session.state.energy = session.state.maxEnergy;
  session.state.phase = 'playing';
  session.state.initialTalentPick = false;
  session.state.pendingTalentPoints = 0;
  session.state.levelTimer = session.state.levelTimerMax = 1000;
  return session;
}

function applyBuffs(session: GameSession) {
  for (const ability of ['prep', 'lastHope', 'adrenaline', 'eagleEye'] as const)
    expect(session.activateAbility(ability)).toBe('activated');
  session.state.killingStreakStacks = 8;
  session.state.killingStreakProgress = 0;
  session.state.killingStreakDecayProgress = 0.5;
}

function expectBuffsCleared(session: GameSession) {
  expect(session.state).toMatchObject({
    prepTimer: 0,
    lastHopeTimer: 0,
    adrenalineTimer: 0,
    adrenalineShots: 0,
    eagleEyeTimer: 0,
    eagleEyeShots: 0,
  });
  expect(session.state.activeEffects.filter((effect) => effect.kind === 'buff')).toEqual([]);
}

describe('cleanser spiders through session ticks', () => {
  it('removes every temporary player buff and immediately restores their ordinary parameters', () => {
    const session = arena();
    const { shootCooldown, blockChance, blockPower } = session.state.stats;
    applyBuffs(session);
    session.state.killingStreakStacks = 3;
    session.state.killingStreakProgress = 3;
    expect(session.state.stats.shootCooldown).toBe(0);
    expect(session.state.stats.blockChance).toBeGreaterThan(blockChance);
    const cooldowns = [...session.state.abilities].map(
      ([id, cooldown]) => [id, cooldown.remainingCooldown] as const,
    );
    const talents = session.talents.toSaveData();
    const hp = session.state.hp;
    const spider = addSpider(session, 'cleanser', 0, 1, 100);
    session.tick(0.001);
    expectBuffsCleared(session);
    expect(session.state.hp).toBe(hp - 100);
    expect(session.state.killingStreakStacks).toBe(2);
    expect(session.state.killingStreakProgress).toBe(0);
    expect(session.state.stats).toMatchObject({ shootCooldown, blockChance, blockPower });
    expect(session.state.currentEnergyRegen).toBe(session.state.stats.energyRegen);
    expect(session.state.currentShootCost).toBe(session.state.stats.shootCost - 2);
    expect(session.talents.toSaveData()).toEqual(talents);
    for (const [id, remaining] of cooldowns)
      expect(session.state.getAbility(id).remainingCooldown).toBeCloseTo(
        remaining > 0 ? remaining - 0.001 : 0,
      );
    expect(session.drainEvents()).toContainEqual({
      type: 'damage',
      spiderId: spider.id,
      hp: 100,
      energy: 0,
    });
    session.state.energy = 500;
    session.tick(1);
    expect(session.state.energy).toBe(500);
    expect(session.shootLane(0)).toBe('shot');
    expect(session.state.energy).toBe(500 - session.state.currentShootCost);
  });

  it.each(['zero damage', 'full block', 'damage reduction', 'partial block'] as const)(
    'removes buffs despite %s',
    (defense) => {
      const session = arena();
      applyBuffs(session);
      if (defense === 'full block' || defense === 'partial block')
        session.state.character.setModifiers('test:defense', [
          { stat: 'blockChance', kind: 'flat', value: 1 },
          { stat: 'blockPower', kind: 'flat', value: defense === 'full block' ? 10000 : 1 },
        ]);
      if (defense === 'damage reduction')
        session.state.character.setModifiers('test:defense', [
          { stat: 'incomingDamage', kind: 'percent', value: -100 },
        ]);
      session.refreshStats(false);
      const spider = addSpider(session, 'cleanser', 0, 1, defense === 'zero damage' ? 0 : 1000);
      const before = session.state.hp;
      session.tick(0.001);
      expectBuffsCleared(session);
      if (defense === 'partial block') expect(session.state.hp).toBeLessThan(before);
      else expect(session.state.hp).toBe(before);
      expect(session.state.killingStreakStacks).toBe(defense === 'partial block' ? 7 : 8);
      expect(session.state.killingStreakDecayProgress).toBeCloseTo(0.501);
      expect(spider.reachedCastle).toBe(true);
    },
  );

  it('keeps kill streak progress when cleansing causes no health damage', () => {
    const session = arena();
    applyBuffs(session);
    session.state.killingStreakStacks = 3;
    session.state.killingStreakProgress = 4;
    addSpider(session, 'cleanser', 0, 1, 0);
    session.tick(0.001);
    expectBuffsCleared(session);
    expect(session.state.killingStreakStacks).toBe(3);
    expect(session.state.killingStreakProgress).toBeCloseTo(4.001);
    expect(session.state.killingStreakDecayProgress).toBe(0);
  });

  it.each([0, 100])('divine shield protects buffs from a cleanser with %i damage', (damage) => {
    const session = arena();
    applyBuffs(session);
    expect(session.activateAbility('stand')).toBe('activated');
    const hp = session.state.hp;
    addSpider(session, 'cleanser', 0, 1, damage);
    session.tick(0.001);
    expect(session.state.hp).toBe(hp);
    expect(session.state.prepTimer).toBeGreaterThan(0);
    expect(session.state.lastHopeTimer).toBeGreaterThan(0);
    expect(session.state.adrenalineActive).toBe(true);
    expect(session.state.eagleEyeActive).toBe(true);
    expect(session.state.killingStreakStacks).toBe(8);
    expect(session.drainEvents()).toEqual([{ type: 'absorb' }]);
  });

  it('keeps ongoing attacks, spider debuffs, passive talents and equipment effects', () => {
    const session = arena();
    expect(session.activateAbility('blizzard')).toBe('activated');
    expect(session.activateAbility('aimedFire')).toBe('activated');
    expect(session.activateAbility('armageddon')).toBe('activated');
    applyBuffs(session);
    session.state.goldLockTimer = 10;
    session.state.healingReductionTimer = 10;
    session.state.poisonTimer = 10;
    session.state.poisonTickTimer = 2;
    session.state.poisonDamage = [100];
    session.state.character.setModifiers('test:equipment', [
      { stat: 'maxEnergy', kind: 'flat', value: 7 },
    ]);
    session.refreshStats(false);
    const maxEnergy = session.state.maxEnergy;
    const waves = session.state.aimedFireWaves;
    addSpider(session, 'cleanser', 0, 1, 0);
    session.tick(0.001);
    expectBuffsCleared(session);
    expect(session.state.blizzardActive).toBe(true);
    expect(session.state.armageddonPhase).toBe('charging');
    expect(session.state.aimedFireWaves).toEqual(
      waves.map((wave) => ({ ...wave, remaining: wave.remaining - 0.001 })),
    );
    expect(session.state.goldLockTimer).toBeCloseTo(9.999);
    expect(session.state.healingReductionTimer).toBeCloseTo(9.999);
    expect(session.state.poisonTimer).toBeCloseTo(9.999);
    expect(session.state.poisonDamage).toEqual([100]);
    expect(session.state.maxEnergy).toBe(maxEnergy);
    expect(session.state.killingStreakLearned).toBe(true);
    expect(session.state.killingStreakStacks).toBe(8);
    expect(session.state.killingStreakDecayProgress).toBeCloseTo(0.501);
  });

  it('round-trips a cleanser before the breach and removes buffs after loading', () => {
    const session = arena();
    applyBuffs(session);
    addSpider(session, 'cleanser', 0, 0.9);
    const saved = snapshot(session);
    const loaded = restore(parseSave(JSON.parse(JSON.stringify(saved)))!, () => 0.999999);
    expect(snapshot(loaded)).toEqual(saved);
    const cleanser = [...loaded.state.spiders.values()][0];
    expect(cleanser.type).toBe('cleanser');
    cleanser.y = 1;
    loaded.tick(0.001);
    expectBuffsCleared(loaded);
    expect(loaded.state.killingStreakStacks).toBe(7);
    expect(loaded.state.killingStreakDecayProgress).toBeCloseTo(0.501);
  });
});

describe('dodge prevents burner and cleanser contact effects', () => {
  it.each(['burner', 'cleanser'] as const)(
    '%s cannot apply its effect on dodge, including full block and zero damage',
    (type) => {
      for (const defense of ['none', 'full block', 'zero damage', 'damage reduction'] as const) {
        const session = arena(0);
        applyBuffs(session);
        session.state.character.setModifiers('test:arena', [
          { stat: 'spawnProbability', kind: 'percent', value: -100 },
          { stat: 'hpRegen', kind: 'percent', value: -100 },
          { stat: 'energyRegen', kind: 'percent', value: -100 },
          { stat: 'dodgeChance', kind: 'flat', value: 0.75 },
        ]);
        if (defense === 'full block')
          session.state.character.setModifiers('test:defense', [
            { stat: 'blockChance', kind: 'flat', value: 1 },
            { stat: 'blockPower', kind: 'flat', value: 10000 },
          ]);
        if (defense === 'damage reduction')
          session.state.character.setModifiers('test:defense', [
            { stat: 'incomingDamage', kind: 'percent', value: -100 },
          ]);
        session.refreshStats(false);
        session.state.energy = 50;
        const hp = session.state.hp;
        const spider = addSpider(session, type, 0, 1, defense === 'zero damage' ? 0 : 100);
        session.tick(0.001);
        expect(session.state.hp).toBe(hp);
        expect(session.state.energy).toBeCloseTo(
          50 +
            session.state.stats.energyPerBreach +
            session.state.stats['prep.energyRegen'] * 0.001,
        );
        expect(session.drainEvents()).toContainEqual(
          expect.objectContaining({
            type: 'damage',
            spiderId: spider.id,
            hp: 0,
            energy: 0,
            dodged: true,
          }),
        );
        expect(session.state.prepTimer).toBeGreaterThan(0);
        expect(session.state.lastHopeTimer).toBeGreaterThan(0);
        expect(session.state.adrenalineActive).toBe(true);
        expect(session.state.eagleEyeActive).toBe(true);
        expect(session.state.killingStreakStacks).toBe(8);
      }
    },
  );
});
