import { describe, expect, it } from 'vitest';
import { GameSession } from '../src/domain/GameSession.js';
import { parseSave, restore, snapshot } from '../src/domain/save.js';
import { activeDebuffs, abilityDescription, coinsDescription } from '../src/ui/presenters.js';
import { addNearbySpider as addSpider } from './helpers.js';

function arena(level = 50) {
  const session = new GameSession('normal', () => 0.999999, { level });
  session.state.character.setModifiers('test:arena', [
    { stat: 'spawnProbability', kind: 'percent', value: -100 },
    { stat: 'maxHp', kind: 'flat', value: 100000 },
    { stat: 'energyRegen', kind: 'percent', value: -100 },
    { stat: 'dodgeChance', kind: 'percent', value: -100 },
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
  it('unlocks resistance at defense tier six, with five ranks and no prerequisite', () => {
    const session = new GameSession('normal', () => 0.999999, { level: 49 });
    session.state.pendingTalentPoints = 100;
    session.talents.loadFromSave([
      { id: 'endurance', rank: 7 },
      { id: 'improvedEndurance', rank: 5 },
      { id: 'greed', rank: 2 },
      { id: 'warriorArmor', rank: 5 },
      { id: 'spiderArmor', rank: 10 },
      { id: 'shieldBlock', rank: 5 },
    ]);
    expect(session.upgradeTalent('poisonResistance')).toBe(false);
    session.state.level = 50;
    expect(session.upgradeTalent('poisonResistance')).toBe(false);
    expect(session.upgradeTalent('shieldBlock')).toBe(true);
    expect(session.talents.getTalent('poisonResistance')).toMatchObject({
      branch: 'defense',
      tier: 6,
      requiredBranchPoints: 35,
      maxRanks: 5,
    });
    for (let rank = 1; rank <= 5; rank++) {
      expect(session.upgradeTalent('poisonResistance')).toBe(true);
      expect(session.state.rules.value('spiderDebuffDuration', 40)).toBeCloseTo(
        40 * (1 - 0.08 * rank),
      );
    }
    expect(session.upgradeTalent('poisonResistance')).toBe(false);
  });

  it.each([1, 2, 3, 4, 5])(
    'rank %i shortens all breach debuffs, without weakening them or changing poison ticks',
    (rank) => {
      for (const type of ['golden', 'fast', 'poisonous'] as const) {
        const session = arena();
        session.talents.loadFromSave([{ id: 'poisonResistance', rank }]);
        session.refreshStats();
        const income = session.state.stats.coinsPerSec;
        breach(session, type, 101);
        const baseDuration = type === 'fast' ? 34 : type === 'poisonous' ? 31.5 : 40;
        const duration = Number((baseDuration * (1 - 0.08 * rank)).toFixed(2));
        expect(activeDebuffs(session.state)[0].timer).toBe(duration);
        if (type === 'golden') expect(session.state.stats.coinsPerSec).toBeCloseTo(income * 0.67);
        if (type === 'fast') expect(session.state.stats.healingReceived).toBe(0.69);
        if (type === 'poisonous') {
          expect(session.state.stats['poison.tickDamage']).toBe(12.12);
          expect(activeDebuffs(session.state)[0].detail).toContain('12 урона раз в 2 секунды');
        }
        const hp = session.state.hp;
        const loaded = restore(parseSave(snapshot(session))!, () => 0.999999);
        loaded.tick(duration);
        expect(activeDebuffs(loaded.state)).toEqual([]);
        expect(loaded.state.hp).toBeCloseTo(
          hp - (type === 'poisonous' ? Math.floor(duration / 2) * 12.12 : 0),
        );
        expect(loaded.state.stats.healingReceived).toBe(1);
        expect(loaded.state.stats.coinsPerSec).toBeGreaterThan(0);
      }
    },
  );

  it('refreshes reduced poison duration without restarting its tick and shows total stacked damage', () => {
    const session = arena();
    session.talents.loadFromSave([{ id: 'poisonResistance', rank: 5 }]);
    session.refreshStats();
    breach(session, 'poisonous', 101);
    session.tick(0.999);
    breach(session, 'poisonous', 202);
    expect(session.state.poisonTimer).toBe(18.9);
    expect(session.state.poisonTickTimer).toBeCloseTo(1);
    expect(activeDebuffs(session.state)[0]).toMatchObject({ name: 'Яд ×2' });
    expect(activeDebuffs(session.state)[0].detail).toContain('36 урона раз в 2 секунды');
    const hp = session.state.hp;
    session.tick(1);
    expect(session.state.hp).toBeCloseTo(hp - 36.36);
    session.state.energy = 100;
    expect(session.activateAbility('freeze')).toBe('activated');
    session.tick(20);
    expect(session.state.poisonTimer).toBeCloseTo(17.9);
    expect(session.state.hp).toBeCloseTo(hp - 36.36);
  });

  it.each([
    [8, 10.5],
    [9, 11],
    [30, 21.5],
    [60, 36.5],
  ])('poison at level %i lasts %s seconds', (level, duration) => {
    const session = arena(level);
    breach(session, 'poisonous', 100);
    expect(session.state.poisonTimer).toBe(duration);
    expect(session.state.stats['poison.tickDamage']).toBe(12);
    const hp = session.state.hp;
    session.tick(duration);
    expect(session.state.hp).toBeCloseTo(hp - Math.floor(duration / 2) * 12);
    expect(activeDebuffs(session.state)).toEqual([]);
  });

  it('reduces passive income for 40 seconds, refreshes duration and retains kill rewards and fractional gold', () => {
    const session = arena();
    const rate = session.state.stats.coinsPerSec;
    session.state.coinAccumulator = 0.4;
    breach(session, 'golden');
    const { coins, coinAccumulator } = session.state;
    const reducedRate = session.state.stats.coinsPerSec;
    expect(reducedRate).toBeCloseTo(rate * 0.67);
    expect(coinsDescription(session.state)).toContain('40 с');
    session.tick(10);
    expect(session.state.goldLockTimer).toBe(30);
    expect(session.state.coins + session.state.coinAccumulator).toBeCloseTo(
      coins + coinAccumulator + reducedRate * 10,
    );
    const target = addSpider(session, 'normal', 1, 0.9);
    expect(session.shootLane(1)).toBe('shot');
    session.tick(0.31);
    expect(target.dying).toBe(true);
    const rewards = session.drainEvents().filter((event) => event.type === 'coinDrop');
    expect(rewards).toHaveLength(1);
    expect(session.state.coins + session.state.coinAccumulator).toBeCloseTo(
      coins + coinAccumulator + reducedRate * 10.31 + rewards[0].coins,
    );
    breach(session, 'golden');
    expect(session.state.goldLockTimer).toBe(40);
    const before = session.state.coins + session.state.coinAccumulator;
    session.tick(40);
    expect(session.state.coins + session.state.coinAccumulator).toBeCloseTo(
      before + reducedRate * 40,
    );
    expect(session.state.stats.coinsPerSec).toBe(rate);
    session.tick(1);
    expect(session.state.coins + session.state.coinAccumulator).toBeCloseTo(
      before + reducedRate * 40 + rate,
    );
  });

  it.each([
    [40, 0.97],
    [41, 0.94],
    [50, 0.67],
    [72, 0.01],
    [73, 0],
    [100, 0],
  ])('golden debuff at level %i retains %s of passive income', (level, fraction) => {
    const session = arena(level);
    const income = session.state.stats.coinsPerSec;
    breach(session, 'golden');
    expect(session.state.stats.coinsPerSec).toBeCloseTo(income * fraction);
    expect(session.state.goldLockTimer).toBe(40);
    const total = session.state.coins + session.state.coinAccumulator;
    const reducedRate = session.state.stats.coinsPerSec;
    session.tick(40);
    expect(session.state.coins + session.state.coinAccumulator).toBeCloseTo(
      total + reducedRate * 40,
    );
    expect(session.state.stats.coinsPerSec).toBe(income);
  });

  it.each([
    [8, 1, 0.5],
    [8, 2, 1],
    [9, 3, 3],
    [17, 10, 50],
    [26, 10, 95],
    [27, 10, 100],
    [50, 2, 43],
    [50, 3, 64.5],
    [206, 1, 99.5],
    [207, 1, 100],
    [220, 1, 100],
  ])('poison at level %i with %i stacks reduces armor by %s%%', (level, stacks, percent) => {
    const session = arena(level);
    const armor = session.state.stats.armor;
    for (let stack = 0; stack < stacks; stack++) breach(session, 'poisonous');
    expect(session.state.poisonDamage).toHaveLength(stacks);
    expect(session.state.stats.armor).toBe(Math.round(armor * (1 - percent / 100)));
    expect(activeDebuffs(session.state)[0].detail).toContain(`Броня уменьшена на ${percent}%`);
    session.tick(session.state.poisonTimer);
    expect(session.state.stats.armor).toBe(armor);
  });

  it.each([
    [20, 16, 0.99],
    [21, 16.6, 0.98],
    [50, 34, 0.69],
    [100, 64, 0.19],
    [119, 75.4, 0],
    [120, 76, 0],
  ])(
    'uses the current level %i for %i seconds of reduced healing without stacking',
    (level, duration, healingFraction) => {
      const session = arena(level);
      session.state.character.setModifiers('test:regen', []);
      session.state.character.setModifiers('test:vampirism', [
        { stat: 'hpPerKill', kind: 'flat', value: 100 },
      ]);
      session.refreshStats();
      const before = session.state.stats;
      breach(session, 'fast');
      expect(session.state.healingReductionTimer).toBe(duration);
      expect(session.state.stats.healingReceived).toBe(healingFraction);
      expect(session.state.stats.hpRegen).toBeCloseTo(before.hpRegen * healingFraction);
      expect(session.state.stats.hpPerKill).toBe(Math.round(100 * healingFraction));
      expect(session.state.stats['heal.amount']).toBe(
        Math.round(before['heal.amount'] * healingFraction),
      );
      const reducedRegen = session.state.stats.hpRegen;
      expect(activeDebuffs(session.state)[0].detail).toContain(
        `уменьшены на ${Number(((1 - healingFraction) * 100).toFixed(1))}%`,
      );
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
      expect(session.state.hp).toBeCloseTo(
        beforeKill + session.state.stats.hpPerKill + session.state.stats.hpRegen * 0.31,
      );
      breach(session, 'fast');
      expect(session.state.healingReductionTimer).toBe(duration);
      expect(session.state.stats.healingReceived).toBe(healingFraction);
      const beforeExpiry = session.state.hp;
      session.tick(duration + 1);
      expect(session.state.stats.healingReceived).toBe(1);
      expect(session.state.stats.hpRegen).toBe(before.hpRegen);
      expect(session.state.hp).toBeCloseTo(beforeExpiry + reducedRegen * duration + before.hpRegen);
    },
  );

  it.each([
    [74, 3, 21, 16],
    [75, 1, 7, 6],
  ])(
    'rounds vampirism at agility %i and rank %i only after reduced healing',
    (agility, rank, normalHealing, reducedHealing) => {
      const session = arena(39);
      session.talents.loadFromSave([{ id: 'vampirism', rank }]);
      session.state.character.setBase('agility', agility - 38);
      session.refreshStats();
      expect(session.state.stats.agility).toBe(agility);
      expect(session.state.stats.hpPerKill).toBe(normalHealing);
      breach(session, 'fast');
      expect(session.state.stats.healingReceived).toBe(0.8);
      expect(session.state.stats.hpPerKill).toBe(reducedHealing);
      session.state.hp = 1000;
      const target = addSpider(session, 'normal', 1, 0.9);
      expect(session.shootLane(1)).toBe('shot');
      session.tick(0.31);
      expect(target.dying).toBe(true);
      expect(session.state.hp).toBe(1000 + reducedHealing);
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

  it('deals exactly 13 poison ticks totaling 156% raw damage at level 39, ignores defenses and restores armor', () => {
    const session = arena(39);
    session.talents.loadFromSave([{ id: 'spiderArmor', rank: 10 }]);
    session.refreshStats();
    const armor = session.state.stats.armor;
    breach(session, 'poisonous', 101);
    expect(session.state.stats.armor).toBe(Math.round(armor * 0.84));
    expect(session.state.stats['poison.tickDamage']).toBe(12.12);
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
    expect(session.state.hp).toBeCloseTo(hp - 12.12);
    session.tick(23.999);
    expect(session.state.hp).toBeCloseTo(hp - 12 * 12.12);
    expect(session.state.poisonTimer).toBeCloseTo(0.001);
    session.tick(0.001);
    expect(session.state.hp).toBeCloseTo(hp - 157.56);
    expect(session.state).toMatchObject({ poisonTimer: 0, poisonTickTimer: 0, poisonDamage: [] });
    expect(session.state.stats.armor).toBe(armor);
    session.tick(4);
    expect(session.state.hp).toBeCloseTo(hp - 157.56);
  });

  it('refreshes poison without delaying ticks and replaces the oldest of ten damage contributions', () => {
    const session = arena();
    breach(session, 'poisonous', 100);
    session.tick(0.999);
    breach(session, 'poisonous', 200);
    expect(session.state).toMatchObject({ poisonTimer: 31.5, poisonDamage: [100, 200] });
    expect(session.state.poisonTickTimer).toBeCloseTo(1);
    const hp = session.state.hp;
    session.tick(1);
    expect(session.state.hp).toBe(hp - 36);
    for (const damage of [300, 400, 500, 600, 700, 800, 900, 1000, 1100])
      breach(session, 'poisonous', damage);
    expect(session.state.poisonDamage).toEqual([
      200, 300, 400, 500, 600, 700, 800, 900, 1000, 1100,
    ]);
    expect(session.state.stats['poison.tickDamage']).toBe(780);
    expect(session.state.stats.armor).toBe(0);
    expect(activeDebuffs(session.state)[0]).toMatchObject({ name: 'Яд ×10', timer: 31.5 });
    const before = session.state.hp;
    const loaded = restore(parseSave(snapshot(session))!, () => 0.999999);
    expect(loaded.state.poisonDamage).toEqual(session.state.poisonDamage);
    loaded.tick(31.5);
    expect(loaded.state.hp).toBe(before - 15 * 780);
    expect(activeDebuffs(loaded.state)).toEqual([]);
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
    expect(loaded.state.hp).toBe(hp - 12);
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
    expect(loaded.state.healingReductionTimer).toBeCloseTo(34.6);
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

  it('leaves one health after a poison tick and allows the level to complete', () => {
    const session = arena();
    breach(session, 'poisonous', 100);
    session.state.hp = 12;
    session.state.levelTimer = 2;
    session.tick(10);
    expect(session.state.hp).toBe(1);
    expect(session.state.phase).toBe('levelUp');
  });

  it.each([1, 5, 12, 12.5])('poison cannot kill a player starting at %s health', (hp) => {
    const session = arena();
    breach(session, 'poisonous', 100);
    session.state.hp = hp;
    session.tick(8);
    expect(session.state.hp).toBe(1);
    expect(session.state.phase).toBe('playing');
    expect(session.state.poisonTimer).toBe(23.5);
  });

  it('poison does not revive a player who has already died', () => {
    const session = arena();
    breach(session, 'poisonous', 100);
    session.state.hp = 0;
    session.tick(2);
    expect(session.state.hp).toBe(0);
    expect(session.state.phase).toBe('gameOver');
  });

  it('poison leaves one health before ordinary damage can kill the player', () => {
    const session = arena();
    breach(session, 'poisonous', 100);
    session.state.hp = 12;
    session.tick(1.999);
    addSpider(session, 'normal', 0, 1, 100);
    session.tick(0.001);
    expect(session.state.hp).toBe(0);
    expect(session.state.phase).toBe('gameOver');
  });

  it('eagle eye clears every spider debuff immediately while retaining the idle penalty', () => {
    const session = arena();
    session.talents.loadFromSave([{ id: 'eagleEye', rank: 1 }]);
    session.state.character.setModifiers('test:regen', []);
    session.refreshStats();
    const before = session.state.stats;
    for (const type of ['golden', 'fast', 'poisonous'] as const) breach(session, type);
    session.state.antiAfkIdleTimer = 2;
    session.state.antiAfkStacks = 3;
    session.state.antiAfkRecoveryTimer = 9;
    session.refreshStats(false);
    expect(activeDebuffs(session.state)).toHaveLength(3);
    expect(session.activateAbility('eagleEye')).toBe('activated');
    expect(activeDebuffs(session.state)).toEqual([]);
    expect(session.state).toMatchObject({
      goldLockTimer: 0,
      healingReductionTimer: 0,
      poisonTimer: 0,
      poisonTickTimer: 0,
      poisonDamage: [],
      antiAfkIdleTimer: 0,
      antiAfkStacks: 3,
      antiAfkRecoveryTimer: 9,
      eagleEyeTimer: 20,
      eagleEyeShots: 5,
    });
    expect(session.state.stats.hpRegen).toBe(before.hpRegen);
    expect(session.state.stats.armor).toBe(before.armor);
    expect(session.state.stats.healingReceived).toBe(1);
    expect(session.state.stats.coinsPerSec).toBe(before.coinsPerSec);
    expect(abilityDescription(session.state, 'eagleEye')).toContain(
      'Снимает все дебаффы от пауков',
    );
    const loaded = restore(parseSave(snapshot(session))!, () => 0.999999);
    expect(loaded.state.poisonDamage).toEqual([]);
    const hp = loaded.state.hp;
    loaded.tick(2);
    expect(loaded.state.hp).toBeCloseTo(hp + before.hpRegen * 2);
  });

  it.each(['locked', 'energy', 'cooldown'] as const)(
    'a failed eagle eye activation due to %s retains spider debuffs',
    (failure) => {
      const session = arena();
      if (failure !== 'locked') session.talents.loadFromSave([{ id: 'eagleEye', rank: 1 }]);
      session.refreshStats();
      for (const type of ['golden', 'fast', 'poisonous'] as const) breach(session, type);
      if (failure === 'energy') session.state.energy = 0;
      if (failure === 'cooldown') session.state.getAbility('eagleEye').start(10);
      const before = activeDebuffs(session.state);
      expect(session.activateAbility('eagleEye')).toBe(
        failure === 'locked'
          ? 'level_locked'
          : failure === 'energy'
            ? 'not_enough_energy'
            : 'on_cooldown',
      );
      expect(activeDebuffs(session.state)).toEqual(before);
      expect(session.state.eagleEyeActive).toBe(false);
    },
  );
});

describe('debuff save compatibility', () => {
  it.each([
    [8, 40, 10.5],
    [8, 10, 10],
    [50, 40, 31.5],
  ])(
    'migrates version 18 poison at level %i from %i to %i remaining seconds only once',
    (level, previousTimer, expectedTimer) => {
      const session = arena(level);
      breach(session, 'golden');
      breach(session, 'fast');
      breach(session, 'poisonous', 100);
      session.tick(0.5);
      const current = snapshot(session);
      const previous = {
        ...current,
        abilities: current.abilities.slice(0, 12),
        version: 18,
        state: {
          ...current.state,
          healingReductionTimer: 2 + 0.3 * level,
          poisonTimer: previousTimer,
          poisonDamage: [100, 200, 300, 400, 500],
        },
      };
      const parsed = parseSave(previous)!;
      expect(parsed).not.toBeNull();
      expect(parsed.version).toBe(27);
      expect(parsed.state).toEqual({ ...previous.state, poisonTimer: expectedTimer });
      const loaded = restore(parsed, () => 0.999999);
      expect(loaded.state.stats['poison.tickDamage']).toBe(180);
      expect(loaded.state.stats.healingReceived).toBe(level < 20 ? 1 : 0.69);
      const hp = loaded.state.hp;
      loaded.tick(current.state.poisonTickTimer);
      expect(loaded.state.hp).toBeCloseTo(hp - 180);
      expect(snapshot(restore(parseSave(snapshot(loaded))!))).toEqual(snapshot(loaded));
    },
  );

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
    const previous = { ...current, abilities: current.abilities.slice(0, 12), version: 17, state };
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
    { healingReductionTimer: 34.01 },
    { healingReductionTimer: NaN },
    { poisonTimer: 31.51 },
    { poisonTickTimer: 2.01 },
    { poisonTickTimer: 0 },
    { poisonTimer: 0 },
    { poisonDamage: [] },
    { poisonDamage: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11] },
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
