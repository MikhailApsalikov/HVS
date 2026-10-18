import { describe, expect, it } from 'vitest';
import { GameSession } from '../src/domain/GameSession.js';
import { parseSave, restore, snapshot } from '../src/domain/save.js';
import type { AbilityId, TalentId } from '../src/domain/types.js';
import { ABILITY_ORDER } from '../src/content/abilities.js';
import { addSpider } from './helpers.js';

type Attack = 'shoot' | 'volley' | 'aimedFire';
const attacks = [
  { action: 'shoot', cost: 35 },
  { action: 'volley', cost: 100 },
  { action: 'aimedFire', cost: 100 },
] as const;
const ranks = [
  { rank: 1, healthPerEnergy: 10, minHpFraction: 0.9 },
  { rank: 2, healthPerEnergy: 9, minHpFraction: 0.8 },
  { rank: 3, healthPerEnergy: 8, minHpFraction: 0.7 },
  { rank: 4, healthPerEnergy: 7, minHpFraction: 0.6 },
  { rank: 5, healthPerEnergy: 6, minHpFraction: 0.5 },
] as const;
const rankedAttacks = attacks.flatMap((attack) => ranks.map((rank) => ({ ...attack, ...rank })));

function arena(rank = 5, talents: { id: TalentId; rank: number }[] = []) {
  const session = new GameSession('normal', () => 0.999999, { level: 60 });
  session.talents.loadFromSave([
    { id: 'masochism', rank },
    { id: 'aimedFire', rank: 1 },
    ...talents,
  ]);
  session.state.character.setModifiers('test:arena', [
    { stat: 'endurance', kind: 'percent', value: -100 },
    { stat: 'agility', kind: 'percent', value: -100 },
    { stat: 'intellect', kind: 'percent', value: -100 },
    { stat: 'maxHp', kind: 'flat', value: 4900 },
    { stat: 'spawnProbability', kind: 'percent', value: -100 },
    { stat: 'hpRegen', kind: 'percent', value: -100 },
    { stat: 'energyRegen', kind: 'percent', value: -100 },
    { stat: 'coinsPerSec', kind: 'percent', value: -100 },
  ]);
  session.refreshStats();
  session.state.phase = 'playing';
  session.state.initialTalentPick = false;
  session.state.pendingTalentPoints = 0;
  session.state.levelTimer = session.state.levelTimerMax = 1000;
  session.state.hp = 5000;
  session.state.energy = 0;
  return session;
}

function attack(session: GameSession, action: Attack) {
  return action === 'shoot' ? session.shootLane(0) : session.activateAbility(action);
}

function expectAttack(session: GameSession, action: Attack) {
  expect(attack(session, action)).toBe(action === 'shoot' ? 'shot' : 'activated');
}

describe('masochism through session commands', () => {
  it.each(attacks)('$action pays the missing energy at every rank', ({ action, cost }) => {
    for (const { rank, healthPerEnergy } of ranks) {
      const session = arena(rank);
      session.state.character.setModifiers('test:health', [
        { stat: 'maxHp', kind: 'flat', value: 20000 },
      ]);
      session.refreshStats();
      expect(session.state.maxHp).toBe(25000);
      expect(session.state.hp).toBe(25000);
      expectAttack(session, action);
      expect(session.state.energy).toBe(0);
      expect(session.state.hp).toBe(25000 - cost * healthPerEnergy);
      if (action === 'shoot') {
        expect(session.state.arrows.size).toBe(1);
        expect(session.state.archers[0].isOnCooldown).toBe(true);
      } else {
        expect(session.state.getAbility(action).isOnCooldown).toBe(true);
        if (action === 'volley') expect(session.state.arrows.size).toBe(4);
        else {
          expect(session.state.arrows.size).toBe(0);
          session.tick(5);
          expect(session.state.arrows.size).toBe(18);
          expect(session.state.hp).toBe(25000 - cost * healthPerEnergy);
          expect(session.state.energy).toBe(0);
        }
      }
    }
  });

  it.each(attacks)(
    '$action spends fractional remaining energy before health',
    ({ action, cost }) => {
      const session = arena(3);
      session.state.energy = 12.5;
      expectAttack(session, action);
      expect(session.state.energy).toBe(0);
      expect(session.state.hp).toBe(5000 - (cost - 12.5) * 8);
    },
  );

  it.each(rankedAttacks)(
    '$action at rank $rank may spend health down to its exact threshold',
    ({ action, cost, rank, healthPerEnergy, minHpFraction }) => {
      const session = arena(rank);
      const minHp = 5000 * minHpFraction;
      session.state.energy = cost - 2.5;
      session.state.hp = minHp + 2.5 * healthPerEnergy;
      expectAttack(session, action);
      expect(session.state.hp).toBe(minHp);
      expect(session.state.energy).toBe(0);
    },
  );

  it.each(rankedAttacks)(
    '$action at rank $rank rejects a payment below its threshold without changing anything',
    ({ action, cost, rank, healthPerEnergy, minHpFraction }) => {
      const session = arena(rank);
      session.state.energy = cost - 2.5;
      session.state.hp = 5000 * minHpFraction + 2.5 * healthPerEnergy - 0.001;
      const before = snapshot(session);
      expect(attack(session, action)).toBe('not_enough_energy');
      expect(snapshot(session)).toEqual(before);
      session.tick(5);
      expect(session.state.arrows.size).toBe(0);
      expect(session.state.aimedFireWaves).toEqual([]);
      expect(session.state.archers[0].isReady).toBe(true);
      expect(session.state.getAbility('volley').isReady).toBe(true);
      expect(session.state.getAbility('aimedFire').isReady).toBe(true);
    },
  );

  it('accepts the exact rank-one boundary with fractional energy', () => {
    const session = arena(1);
    session.state.character.setModifiers('test:health', [
      { stat: 'maxHp', kind: 'flat', value: -4900 },
    ]);
    session.refreshStats(false);
    session.state.energy = 34.9;
    session.state.hp = 91;
    expect(session.state.maxHp).toBe(100);
    expect(session.shootLane(0)).toBe('shot');
    expect(session.state.energy).toBe(0);
    expect(session.state.hp).toBe(90);
    expect(session.state.arrows.size).toBe(1);
  });

  it('still rejects an actual shortfall near the fractional boundary', () => {
    const session = arena(1);
    session.state.character.setModifiers('test:health', [
      { stat: 'maxHp', kind: 'flat', value: -4900 },
    ]);
    session.refreshStats(false);
    session.state.energy = 34.9;
    session.state.hp = 90.999;
    const before = snapshot(session);
    expect(session.shootLane(0)).toBe('not_enough_energy');
    expect(snapshot(session)).toEqual(before);
  });

  it.each(rankedAttacks)(
    '$action at rank $rank uses energy normally even below its health threshold',
    ({ action, cost, rank, minHpFraction }) => {
      const session = arena(rank);
      const hp = 5000 * minHpFraction - 1;
      session.state.energy = cost;
      session.state.hp = hp;
      expectAttack(session, action);
      expect(session.state.hp).toBe(hp);
      expect(session.state.energy).toBe(0);
    },
  );

  it.each(attacks)('$action cannot replace energy without the talent', ({ action }) => {
    const session = arena(0);
    session.state.energy = 20;
    const before = snapshot(session);
    expect(attack(session, action)).toBe('not_enough_energy');
    expect(snapshot(session)).toEqual(before);
  });

  it.each(ranks)(
    'rank $rank uses the current maximum health after a health bonus changes',
    ({ rank, healthPerEnergy, minHpFraction }) => {
      const session = arena(rank);
      session.state.character.setModifiers('test:health', [
        { stat: 'maxHp', kind: 'flat', value: 5000 },
      ]);
      session.refreshStats(false);
      const minHp = 10000 * minHpFraction;
      const healthCost = 35 * healthPerEnergy;
      session.state.hp = minHp + healthCost - 1;
      expect(session.state.maxHp).toBe(10000);
      const before = snapshot(session);
      expect(session.shootLane(0)).toBe('not_enough_energy');
      expect(snapshot(session)).toEqual(before);
      session.state.hp = minHp + healthCost;
      expect(session.shootLane(0)).toBe('shot');
      expect(session.state.hp).toBe(minHp);
    },
  );

  it('pays only the final reduced costs, including killing-streak discounts', () => {
    const session = arena(5, [
      { id: 'hunterMastery', rank: 5 },
      { id: 'killingStreak', rank: 1 },
    ]);
    session.state.character.setModifiers('test:cost', [
      { stat: 'shootCost', kind: 'percent', value: -20 },
      { stat: 'shootCost', kind: 'flat', value: -3 },
      { stat: 'volley.cost', kind: 'percent', value: -50 },
      { stat: 'aimedFire.cost', kind: 'percent', value: -40 },
    ]);
    session.refreshStats();
    session.state.killingStreakStacks = 5;
    session.state.energy = 2;
    expect(session.state.currentShootCost).toBe(10); // 35 * .8 - 10 - 3 - 5.
    expect(session.shootLane(0)).toBe('shot');
    expect(session.state.hp).toBe(4952); // Eight missing energy at six health each.
    expect(session.state.killingStreakStacks).toBe(5);
    expect(session.activateAbility('volley')).toBe('activated');
    expect(session.state.hp).toBe(4652); // 50 energy.
    expect(session.activateAbility('aimedFire')).toBe('activated');
    expect(session.state.hp).toBe(4292); // 60 energy.
    expect(session.state.energy).toBe(0);
  });

  it('leaves adrenaline shots free while volley and aimed fire still have a cost', () => {
    const session = arena(5, [{ id: 'adrenaline', rank: 1 }]);
    expect(session.activateAbility('adrenaline')).toBe('activated');
    session.state.hp = 2499;
    expect(session.shootLane(0)).toBe('shot');
    expect(session.state.hp).toBe(2499);
    expect(session.state.energy).toBe(0);
    expect(session.state.adrenalineShots).toBe(19);
    expect(session.activateAbility('volley')).toBe('not_enough_energy');
    expect(session.activateAbility('aimedFire')).toBe('not_enough_energy');
    session.state.hp = 5000;
    expect(session.activateAbility('volley')).toBe('activated');
    expect(session.activateAbility('aimedFire')).toBe('activated');
    expect(session.state.hp).toBe(3800);
    expect(session.state.adrenalineShots).toBe(19);
  });

  it.each(['paused', 'levelUp', 'gameOver'] as const)(
    'does not pay for attacks blocked in %s',
    (phase) => {
      const session = arena();
      session.state.phase = phase;
      const before = snapshot(session);
      for (const { action } of attacks) {
        expect(attack(session, action)).toBe(action === 'shoot' ? 'blocked' : 'level_locked');
        expect(snapshot(session)).toEqual(before);
      }
    },
  );

  it.each(attacks)('$action cannot pay through an existing cooldown', ({ action }) => {
    const session = arena();
    if (action === 'shoot') session.state.archers[0].start(3);
    else session.state.getAbility(action).start(3);
    const before = snapshot(session);
    expect(attack(session, action)).toBe(action === 'shoot' ? 'blocked' : 'on_cooldown');
    expect(snapshot(session)).toEqual(before);
  });

  it('does not pay for invalid lanes or locked abilities', () => {
    const session = arena(5, [{ id: 'aimedFire', rank: 0 }]);
    const before = snapshot(session);
    for (const lane of [-1, 9, 0.5]) expect(session.shootLane(lane)).toBe('blocked');
    expect(session.activateAbility('aimedFire')).toBe('level_locked');
    expect(snapshot(session)).toEqual(before);
    session.state.level = 7;
    const atLowLevel = snapshot(session);
    expect(session.activateAbility('volley')).toBe('level_locked');
    expect(snapshot(session)).toEqual(atLowLevel);
  });

  it('never replaces the energy cost of other abilities with health', () => {
    const session = arena(5, [
      { id: 'divineShield', rank: 1 },
      { id: 'lastHope', rank: 1 },
      { id: 'adrenaline', rank: 1 },
      { id: 'eagleEye', rank: 1 },
      { id: 'recharge', rank: 1 },
    ]);
    const otherAbilities = ABILITY_ORDER.filter(
      (id): id is Exclude<AbilityId, 'volley' | 'aimedFire'> =>
        id !== 'volley' && id !== 'aimedFire',
    );
    session.state.character.setModifiers(
      'test:paid',
      otherAbilities.map((id) => ({ stat: `${id}.cost`, kind: 'flat', value: 30 })),
    );
    session.refreshStats();
    const before = snapshot(session);
    for (const id of otherAbilities) {
      expect(session.activateAbility(id)).toBe('not_enough_energy');
      expect(snapshot(session)).toEqual(before);
    }
  });

  it.each(attacks)('$action spends health without treating it as spider damage', ({ action }) => {
    const session = arena(5, [{ id: 'killingStreak', rank: 1 }]);
    session.state.killingStreakStacks = 3;
    session.state.killingStreakProgress = 4;
    expectAttack(session, action);
    expect(session.state.killingStreakStacks).toBe(3);
    expect(session.state.killingStreakProgress).toBe(4);
    expect(session.drainEvents()).toEqual([]);
    addSpider(session, 'normal', 4, 1, 10);
    session.tick(0.001);
    expect(session.state.killingStreakStacks).toBe(2);
    expect(session.state.killingStreakProgress).toBe(0);
    expect(session.drainEvents()).toContainEqual(
      expect.objectContaining({ type: 'damage', hp: 10 }),
    );
  });

  it('counts a successful health-paid shot as activity and ignores a failed payment', () => {
    const session = arena();
    addSpider(session, 'normal', 8, 0.1);
    session.state.energy = session.state.maxEnergy;
    session.tick(3);
    expect(session.state.antiAfkStacks).toBe(1);
    session.state.energy = 0;
    session.state.hp = 2500;
    const before = snapshot(session);
    expect(session.shootLane(0)).toBe('not_enough_energy');
    expect(snapshot(session)).toEqual(before);
    session.state.hp = 5000;
    expect(session.shootLane(0)).toBe('shot');
    expect(session.state.antiAfkIdleTimer).toBe(0);
    expect(session.state.antiAfkRecoveryTimer).toBe(10);
    session.tick(10);
    expect(session.state.antiAfkStacks).toBe(0);
  });
});

describe('masochism saves', () => {
  it('preserves rank, paid resources, cooldowns and pending waves through save/load', () => {
    const session = arena(2);
    session.state.energy = 25;
    expect(session.activateAbility('aimedFire')).toBe('activated');
    expect(session.state.hp).toBe(4325);
    const saved = snapshot(session);
    expect(saved.version).toBe(25);
    const parsed = parseSave(JSON.parse(JSON.stringify(saved)));
    expect(parsed).not.toBeNull();
    const loaded = restore(parsed!, () => 0.999999);
    expect(loaded.talents.getRank('masochism')).toBe(2);
    expect(snapshot(loaded)).toEqual(saved);
    loaded.tick(5);
    session.tick(5);
    expect(snapshot(loaded)).toEqual(snapshot(session));
    expect(loaded.shootLane(0)).toBe('shot');
    expect(loaded.state.hp).toBe(4010);
    expect(loaded.shootLane(1)).toBe('not_enough_energy');
    expect(loaded.state.hp).toBe(4010);
    expect(loaded.state.energy).toBe(0);
  });

  it('loads an existing version-20 save without a masochism entry at rank zero', () => {
    const saved = snapshot(arena(0));
    const existing = { ...saved, talents: saved.talents.filter(({ id }) => id !== 'masochism') };
    const parsed = parseSave(JSON.parse(JSON.stringify(existing)));
    expect(parsed).not.toBeNull();
    const loaded = restore(parsed!, () => 0.999999);
    expect(loaded.talents.getRank('masochism')).toBe(0);
    const normalized = snapshot(loaded);
    expect(normalized.version).toBe(25);
    expect(normalized.state).toEqual(existing.state);
    expect(normalized.talents.filter(({ id }) => id !== 'masochism')).toEqual(existing.talents);
    expect(loaded.shootLane(0)).toBe('not_enough_energy');
    expect(snapshot(loaded)).toEqual(normalized);
  });
});
