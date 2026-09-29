import { describe, expect, it } from 'vitest';
import { GameSession } from '../src/domain/GameSession.js';
import { parseSave, restore, snapshot } from '../src/domain/save.js';
import { activeDebuffs, abilityDescription, coinsDescription } from '../src/ui/presenters.js';
import { addSpider } from './helpers.js';

function arena(level = 50) {
  const session = new GameSession('normal', () => 0.999999, { level });
  session.state.character.setModifiers('test:arena', [
    { stat: 'spawnProbability', kind: 'percent', value: -100 },
    { stat: 'maxHp', kind: 'flat', value: 100000 },
    { stat: 'energyRegen', kind: 'percent', value: -100 },
    { stat: 'dodgeChance', kind: 'percent', value: -100 },
    { stat: 'arrowSpeed', kind: 'percent', value: 2900 },
    { stat: 'shootCost', kind: 'percent', value: -100 },
  ]);
  session.state.character.setModifiers('test:regen', [
    { stat: 'hpRegen', kind: 'percent', value: -100 },
  ]);
  session.refreshStats();
  session.state.phase = 'playing';
  session.state.initialTalentPick = false;
  session.state.pendingTalentPoints = 0;
  session.state.levelTimer = session.state.levelTimerMax = 1000;
  return session;
}

function breach(session: GameSession, type: 'golden' | 'fast' | 'poisonous', damage = 100) {
  addSpider(session, type, 0, 1, damage);
  session.tick(0.001);
}

describe('spider debuffs through session commands', () => {
  it('stops only passive income for 40 seconds, refreshes duration and retains fractional gold', () => {
    const session = arena();
    const rate = session.state.stats.coinsPerSec;
    session.state.coinAccumulator = 0.4;
    breach(session, 'golden');
    const { coins, coinAccumulator } = session.state;
    expect(session.state.stats.coinsPerSec).toBe(0);
    expect(coinsDescription(session.state)).toContain('40 с');
    session.tick(10);
    expect(session.state).toMatchObject({ coins, coinAccumulator, goldLockTimer: 30 });
    const target = addSpider(session, 'normal', 1, 0.9);
    expect(session.shootLane(1)).toBe('shot');
    session.tick(0.31);
    expect(target.dying).toBe(true);
    const rewards = session.drainEvents().filter((event) => event.type === 'coinDrop');
    expect(rewards).toHaveLength(1);
    expect(session.state.coins).toBe(coins + rewards[0].coins);
    breach(session, 'golden');
    expect(session.state.goldLockTimer).toBe(40);
    const before = session.state.coins;
    session.tick(40);
    expect(session.state.coins).toBe(before);
    expect(session.state.coinAccumulator).toBe(coinAccumulator);
    expect(session.state.stats.coinsPerSec).toBe(rate);
    session.tick(1);
    expect(session.state.coins + session.state.coinAccumulator).toBeCloseTo(
      before + coinAccumulator + rate,
    );
  });

  it.each([
    [20, 8],
    [50, 17],
    [100, 32],
  ])(
    'uses the current level %i for %i seconds of reduced healing without stacking',
    (level, duration) => {
      const session = arena(level);
      session.state.character.setModifiers('test:regen', []);
      session.state.character.setModifiers('test:vampirism', [
        { stat: 'hpPerKill', kind: 'flat', value: 100 },
      ]);
      session.refreshStats();
      const before = session.state.stats;
      breach(session, 'fast');
      expect(session.state.healingReductionTimer).toBe(duration);
      expect(session.state.stats.healingReceived).toBe(0.25);
      expect(session.state.stats.hpRegen).toBeCloseTo(before.hpRegen * 0.25);
      expect(session.state.stats.hpPerKill).toBe(25);
      expect(session.state.stats['heal.amount']).toBe(Math.round(before['heal.amount'] * 0.25));
      session.state.hp = 1000;
      session.state.energy = session.state.maxEnergy;
      expect(session.activateAbility('heal')).toBe('activated');
      expect(session.state.hp).toBe(1000 + session.state.stats['heal.amount']);
      expect(session.state.getAbility('heal').remainingCooldown).toBe(17);
      const hp = session.state.hp;
      session.tick(1);
      expect(session.state.hp).toBeCloseTo(hp + session.state.stats.hpRegen);
      const target = addSpider(session, 'normal', 1, 0.9);
      session.shootLane(1);
      const beforeKill = session.state.hp;
      session.tick(0.31);
      expect(target.dying).toBe(true);
      expect(session.state.hp).toBeCloseTo(beforeKill + 25 + session.state.stats.hpRegen * 0.31);
      breach(session, 'fast');
      expect(session.state.healingReductionTimer).toBe(duration);
      expect(session.state.stats.healingReceived).toBe(0.25);
      const beforeExpiry = session.state.hp;
      session.tick(duration + 1);
      expect(session.state.stats.healingReceived).toBe(1);
      expect(session.state.stats.hpRegen).toBe(before.hpRegen);
      expect(session.state.hp).toBeCloseTo(beforeExpiry + before.hpRegen * (duration * 0.25 + 1));
    },
  );

  it.each(['golden', 'fast', 'poisonous'] as const)(
    '%s applies only on health loss, including after partial block',
    (type) => {
      const session = arena();
      breach(session, type, 0);
      expect(activeDebuffs(session.state)).toEqual([]);
      session.state.invulnerableTimer = 1;
      breach(session, type);
      expect(activeDebuffs(session.state)).toEqual([]);
      session.state.invulnerableTimer = 0;
      session.state.character.setModifiers('test:block', [
        { stat: 'blockChance', kind: 'flat', value: 1 },
        { stat: 'blockPower', kind: 'flat', value: 10000 },
      ]);
      session.refreshStats();
      breach(session, type);
      expect(activeDebuffs(session.state)).toEqual([]);
      session.state.character.setModifiers('test:block', [
        { stat: 'blockChance', kind: 'flat', value: 1 },
        { stat: 'blockPower', kind: 'flat', value: 1 },
      ]);
      session.refreshStats();
      breach(session, type);
      expect(activeDebuffs(session.state)).toHaveLength(1);
    },
  );

  it.each(['golden', 'fast', 'poisonous'] as const)('%s cannot debuff a dodging player', (type) => {
    const session = arena();
    const saved = snapshot(session);
    const loaded = restore(saved, () => 0);
    loaded.state.character.setModifiers('test:arena', [
      { stat: 'spawnProbability', kind: 'percent', value: -100 },
      { stat: 'dodgeChance', kind: 'flat', value: 0.75 },
    ]);
    loaded.refreshStats();
    breach(loaded, type);
    expect(loaded.drainEvents().some((event) => event.type === 'damage' && event.dodged)).toBe(
      true,
    );
    expect(activeDebuffs(loaded.state)).toEqual([]);
  });

  it('deals exactly 20 poison ticks totaling 300% raw damage, ignores defenses and restores armor', () => {
    const session = arena();
    session.talents.loadFromSave([{ id: 'spiderArmor', rank: 10 }]);
    session.refreshStats();
    const armor = session.state.stats.armor;
    breach(session, 'poisonous', 101);
    expect(session.state.stats.armor).toBe(Math.round(armor * 0.25));
    expect(session.state.stats['poison.tickDamage']).toBe(15.15);
    const hp = session.state.hp;
    session.state.character.setModifiers('test:defense', [
      { stat: 'incomingDamage', kind: 'percent', value: -100 },
      { stat: 'blockChance', kind: 'flat', value: 1 },
      { stat: 'blockPower', kind: 'flat', value: 1000 },
    ]);
    session.refreshStats();
    session.tick(1.999);
    expect(session.state.hp).toBe(hp);
    session.tick(0.001);
    expect(session.state.hp).toBeCloseTo(hp - 15.15);
    session.tick(37.999);
    expect(session.state.hp).toBeCloseTo(hp - 19 * 15.15);
    expect(session.state.poisonTimer).toBeCloseTo(0.001);
    session.tick(0.001);
    expect(session.state.hp).toBeCloseTo(hp - 303);
    expect(session.state).toMatchObject({ poisonTimer: 0, poisonTickTimer: 0, poisonDamage: [] });
    expect(session.state.stats.armor).toBe(armor);
    session.tick(4);
    expect(session.state.hp).toBeCloseTo(hp - 303);
  });

  it('refreshes poison without delaying ticks and replaces the oldest of five damage contributions', () => {
    const session = arena();
    const armor = session.state.stats.armor;
    breach(session, 'poisonous', 100);
    session.tick(0.999);
    breach(session, 'poisonous', 200);
    expect(session.state).toMatchObject({ poisonTimer: 40, poisonDamage: [100, 200] });
    expect(session.state.poisonTickTimer).toBeCloseTo(1);
    const hp = session.state.hp;
    session.tick(1);
    expect(session.state.hp).toBe(hp - 45);
    for (const damage of [300, 400, 500, 600]) breach(session, 'poisonous', damage);
    expect(session.state.poisonDamage).toEqual([200, 300, 400, 500, 600]);
    expect(session.state.stats['poison.tickDamage']).toBe(300);
    expect(session.state.stats.armor).toBe(Math.round(armor * 0.25));
    expect(activeDebuffs(session.state)[0]).toMatchObject({ name: 'Яд ×5', timer: 40 });
    const before = session.state.hp;
    session.tick(40);
    expect(session.state.hp).toBe(before - 20 * 300);
    expect(activeDebuffs(session.state)).toEqual([]);
  });

  it('keeps debuffs paused during time freeze and level-up, including a save and load', () => {
    const session = arena();
    breach(session, 'golden');
    breach(session, 'fast');
    breach(session, 'poisonous');
    session.tick(0.7);
    expect(session.activateAbility('freeze')).toBe('activated');
    const saved = snapshot(session);
    session.tick(20);
    expect(snapshot(session)).toEqual(saved);
    const loaded = restore(parseSave(JSON.parse(JSON.stringify(saved)))!, () => 0.999999);
    expect(snapshot(loaded)).toEqual(saved);
    expect(loaded.state.stats).toEqual(session.state.stats);
    loaded.tick(20);
    expect(snapshot(loaded)).toEqual(saved);
    expect(loaded.activateAbility('freeze')).toBe('deactivated');
    const hp = loaded.state.hp;
    loaded.tick(1.3);
    expect(loaded.state.hp).toBe(hp - 15);
    loaded.state.levelTimer = 0.1;
    loaded.tick(0.1);
    expect(loaded.state.phase).toBe('levelUp');
    const levelUpSave = snapshot(loaded);
    loaded.tick(20);
    expect(snapshot(loaded)).toEqual(levelUpSave);
    loaded.upgradeTalent('hunterMastery');
    expect(loaded.confirmLevelUp()).toBe(true);
    expect(loaded.state.poisonTimer).toBe(levelUpSave.state.poisonTimer);
    breach(loaded, 'fast');
    expect(loaded.state.healingReductionTimer).toBeCloseTo(17.3);
  });

  it('cleanses all debuffs and idle penalty only when divine shield successfully activates', () => {
    const session = arena();
    session.talents.loadFromSave([{ id: 'divineShield', rank: 1 }]);
    session.refreshStats();
    breach(session, 'golden');
    breach(session, 'fast');
    breach(session, 'poisonous');
    session.state.antiAfkStacks = 3;
    session.state.antiAfkRecoveryTimer = 9;
    session.refreshStats(false);
    session.state.energy = 0;
    expect(session.activateAbility('stand')).toBe('not_enough_energy');
    expect(activeDebuffs(session.state)).toHaveLength(3);
    session.state.energy = 100;
    expect(session.activateAbility('stand')).toBe('activated');
    expect(activeDebuffs(session.state)).toEqual([]);
    expect(session.state).toMatchObject({
      antiAfkStacks: 0,
      antiAfkRecoveryTimer: 0,
      antiAfkIdleTimer: 0,
    });
    expect(session.state.stats.healingReceived).toBe(1);
    expect(session.state.stats.coinsPerSec).toBeGreaterThan(0);
    for (const type of ['golden', 'fast', 'poisonous'] as const) breach(session, type);
    expect(activeDebuffs(session.state)).toEqual([]);
    const hp = session.state.hp;
    session.tick(5);
    expect(session.state.hp).toBe(hp);
    expect(abilityDescription(session.state, 'stand')).toContain('Снимает все дебаффы');
  });

  it('ends the run when poison kills, before regeneration or completing the level', () => {
    const session = arena();
    breach(session, 'poisonous', 100);
    session.state.character.setModifiers('test:regen', [
      { stat: 'hpRegen', kind: 'flat', value: 100 },
    ]);
    session.refreshStats();
    session.state.hp = 15;
    session.state.levelTimer = 2;
    session.tick(10);
    expect(session.state.hp).toBe(0);
    expect(session.state.phase).toBe('gameOver');
  });
});

describe('debuff save compatibility', () => {
  it('migrates version 17 without changing existing timers, projectiles, health or ranks', () => {
    const session = arena();
    session.talents.loadFromSave([{ id: 'healBoost', rank: 3 }]);
    session.refreshStats();
    session.state.hp = 123;
    session.activateAbility('heal');
    session.state.getAbility('heal').start(10);
    session.tick(4);
    session.shootLane(0);
    session.state.killingStreakDecayProgress = 0;
    const current = snapshot(session);
    const {
      goldLockTimer,
      healingReductionTimer,
      poisonTimer,
      poisonTickTimer,
      poisonDamage,
      ...state
    } = current.state;
    void [goldLockTimer, healingReductionTimer, poisonTimer, poisonTickTimer, poisonDamage];
    const previous = { ...current, version: 17, state };
    const migrated = parseSave(previous)!;
    expect(migrated).toEqual(current);
    const loaded = restore(migrated);
    expect(snapshot(loaded)).toEqual(current);
    expect(activeDebuffs(loaded.state)).toEqual([]);
    expect(loaded.state.getAbility('heal').remainingCooldown).toBe(6);
    expect(loaded.state.stats['heal.cooldown']).toBe(11);
  });

  it.each([
    { goldLockTimer: undefined },
    { goldLockTimer: -1 },
    { goldLockTimer: 40.01 },
    { healingReductionTimer: 17.01 },
    { healingReductionTimer: NaN },
    { poisonTimer: 40.01 },
    { poisonTickTimer: 2.01 },
    { poisonTickTimer: 0 },
    { poisonTimer: 0 },
    { poisonDamage: [] },
    { poisonDamage: [1, 2, 3, 4, 5, 6] },
    { poisonDamage: [-1] },
    { poisonDamage: [Infinity] },
    { poisonDamage: '100' },
  ])('rejects invalid debuff state %j', (invalid) => {
    const session = arena();
    breach(session, 'poisonous');
    const saved = snapshot(session);
    expect(parseSave({ ...saved, state: { ...saved.state, ...invalid } })).toBeNull();
  });
});
