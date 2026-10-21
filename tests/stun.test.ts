import { describe, expect, it } from 'vitest';
import { GameSession } from '../src/domain/GameSession.js';
import { ABILITY_ORDER } from '../src/content/abilities.js';
import { parseSave, restore, snapshot } from '../src/domain/save.js';
import type { SpiderType, TalentId } from '../src/domain/types.js';
import { abilityButtonAvailability } from '../src/ui/abilityButtonModel.js';
import {
  abilityDescription,
  playerEffectDescription,
  shootDescription,
} from '../src/ui/presenters.js';
import { addSpider } from './helpers.js';

function arena(level = 61, talents: { id: TalentId; rank: number }[] = []) {
  let roll = 0;
  const session = new GameSession('normal', () => roll, { level });
  session.talents.loadFromSave(talents);
  session.state.character.setModifiers('arena', [
    { stat: 'spawnProbability', kind: 'percent', value: -100 },
    { stat: 'maxHp', kind: 'flat', value: 100000 },
    { stat: 'maxEnergy', kind: 'flat', value: 10000 },
    { stat: 'armor', kind: 'percent', value: -100 },
    { stat: 'dodgeChance', kind: 'percent', value: -100 },
    { stat: 'hpRegen', kind: 'percent', value: -100 },
    { stat: 'energyRegen', kind: 'percent', value: -100 },
    { stat: 'energyPerKill', kind: 'flat', value: 7 },
    { stat: 'energyPerBreach', kind: 'flat', value: 5 },
    { stat: 'hpPerKill', kind: 'flat', value: 3 },
    { stat: 'coinsPerSec', kind: 'percent', value: -100 },
  ]);
  session.refreshStats();
  session.state.phase = 'playing';
  session.state.initialTalentPick = false;
  session.state.pendingTalentPoints = 0;
  session.state.levelTimer = session.state.levelTimerMax = 10000;
  session.state.energy = session.state.maxEnergy;
  return {
    session,
    setRoll: (value: number) => {
      roll = value;
    },
  };
}

function hit(session: GameSession, damage = 100, type: SpiderType = 'normal') {
  addSpider(session, type, 0, 1, damage);
  session.tick(0.001);
}

describe('piercing stun through session commands', () => {
  it.each([false, true])(
    'allows time freeze during stun, pauses its timer and resumes without a second charge (crown=%s)',
    (crown) => {
      const { session } = arena();
      if (crown) {
        session.state.phase = 'levelUp';
        session.state.coins = 1000000;
        expect(session.buyItem('l015')).toBe(true);
        session.state.phase = 'playing';
      }
      hit(session);
      expect(session.state.isStunned).toBe(true);
      expect(abilityButtonAvailability(session.state, 'freeze')).toEqual({
        hidden: false,
        locked: false,
      });
      expect(abilityDescription(session.state, 'freeze')).not.toContain('Недоступно во время');
      session.state.energy = crown ? 0 : 24;
      if (!crown) {
        const before = snapshot(session);
        expect(session.activateAbility('freeze')).toBe('not_enough_energy');
        expect(snapshot(session)).toEqual(before);
        session.state.energy = 25;
      }
      expect(session.activateAbility('freeze')).toBe('activated');
      expect(session.state.energy).toBe(0);
      session.tick(100);
      expect(session.state.stunTimer).toBe(1);
      const saved = snapshot(session);
      const loaded = restore(parseSave(saved)!, () => 0.999999);
      expect(snapshot(loaded)).toEqual(saved);
      expect(loaded.activateAbility('freeze')).toBe('deactivated');
      expect(loaded.state.energy).toBe(0);
      expect(loaded.shootLane(0)).toBe('blocked');
      loaded.tick(1);
      expect(loaded.state.isStunned).toBe(false);
    },
  );

  it.each([
    [60, 0],
    [61, 1],
    [62, 1.1],
    [71, 2],
    [100, 4.9],
  ])('level %i gives %s seconds, pauses and expires exactly', (level, duration) => {
    const { session } = arena(level);
    hit(session);
    expect(session.state.stunTimer).toBe(duration);
    if (duration === 0) return;
    const effect = session.state.activeEffects.find(({ id }) => id === 'stun')!;
    expect(effect).toMatchObject({
      name: 'Оглушение',
      source: 'spider',
      kind: 'debuff',
      remaining: duration,
    });
    expect(playerEffectDescription(effect)).toContain('«Магическая броня» не защищает');
    session.state.phase = 'paused';
    session.tick(100);
    session.state.phase = 'levelUp';
    session.tick(100);
    expect(session.state.stunTimer).toBe(duration);
    session.state.phase = 'playing';
    session.tick(duration - 0.001);
    expect(session.state.isStunned).toBe(true);
    session.tick(0.001);
    expect(session.state.isStunned).toBe(false);
    expect(session.state.activeEffects.some(({ id }) => id === 'stun')).toBe(false);
    expect(session.shootLane(0)).toBe('shot');
  });

  it('refreshes one stun without adding durations', () => {
    const { session } = arena();
    hit(session);
    session.tick(0.4);
    hit(session);
    expect(session.state.stunTimer).toBe(1);
    expect(session.state.activeEffects.filter(({ id }) => id === 'stun')).toHaveLength(1);
  });

  it.each(['dodge', 'invulnerability', 'full block', 'zero damage'] as const)(
    '%s prevents stun',
    (protection) => {
      const { session } = arena();
      if (protection === 'dodge') {
        session.state.character.removeModifiers('arena');
        session.state.character.setModifiers('dodge', [
          { stat: 'spawnProbability', kind: 'percent', value: -100 },
          { stat: 'dodgeChance', kind: 'flat', value: 0.75 },
        ]);
      }
      if (protection === 'invulnerability') session.state.invulnerableTimer = 10;
      if (protection === 'full block')
        session.state.character.setModifiers('block', [
          { stat: 'blockChance', kind: 'flat', value: 1 },
          { stat: 'blockPower', kind: 'flat', value: 1000 },
        ]);
      session.refreshStats();
      hit(session, protection === 'zero damage' ? 0 : 100);
      expect(session.state.stunTimer).toBe(0);
    },
  );

  it('prevents blocks on later simultaneous hits, then restores the full block bonus', () => {
    const { session } = arena(61, [{ id: 'lastHope', rank: 1 }]);
    session.state.character.setModifiers('block', [
      { stat: 'blockChance', kind: 'flat', value: 1 },
      { stat: 'blockPower', kind: 'flat', value: 10 },
    ]);
    session.refreshStats();
    session.activateAbility('lastHope');
    const { blockChance, blockPower } = session.state.stats;
    addSpider(session, 'normal', 0, 1, 100);
    addSpider(session, 'normal', 1, 1, 100);
    session.tick(0.001);
    const damage = session.drainEvents().filter(({ type }) => type === 'damage');
    expect(damage).toMatchObject([
      { hp: 400 - blockPower, blockedDamage: blockPower },
      { hp: 400 },
    ]);
    expect(damage[1]).not.toHaveProperty('blockedDamage');
    expect(session.state.stats.blockChance).toBe(0);
    session.tick(1);
    expect(session.state.stats.blockChance).toBe(blockChance);
    expect(session.state.lastHopeTimer).toBeGreaterThan(0);
  });

  it('suppresses energy from the triggering breach, later breaches and kills while keeping health and gold rewards', () => {
    const { session, setRoll } = arena();
    const normalEnergy = session.state.stats.energyPerBreach;
    session.state.energy = 10;
    hit(session);
    expect(session.state.energy).toBe(10);
    expect(session.state.stats).toMatchObject({ energyPerKill: 0, energyPerBreach: 0 });
    const hp = session.state.hp;
    const coins = session.state.coins;
    session.drainEvents();
    addSpider(session).startDying();
    setRoll(0.999999);
    hit(session, 0);
    session.tick(0.3);
    expect(session.state.energy).toBe(10);
    expect(session.state.hp).toBe(hp + 3);
    expect(session.state.coins).toBeGreaterThan(coins);
    expect(session.drainEvents().filter(({ type }) => type === 'resourceGain')).toMatchObject([
      { hp: 3, energy: 0 },
    ]);
    session.tick(session.state.stunTimer);
    hit(session, 0);
    expect(session.state.energy).toBe(10 + normalEnergy);
  });

  it('allows passive energy regeneration and preparation recovery to continue', () => {
    const { session } = arena();
    session.activateAbility('prep');
    session.state.character.removeModifiers('arena');
    session.state.character.setModifiers('quiet', [
      { stat: 'spawnProbability', kind: 'percent', value: -100 },
      { stat: 'maxHp', kind: 'flat', value: 100000 },
      { stat: 'dodgeChance', kind: 'percent', value: -100 },
    ]);
    session.refreshStats();
    hit(session);
    session.state.energy = 0;
    const regen = session.state.currentEnergyRegen;
    session.tick(0.5);
    expect(session.state.energy).toBeCloseTo(regen * 0.5);
  });

  it.each(ABILITY_ORDER.filter((id) => id !== 'stand' && id !== 'eagleEye' && id !== 'freeze'))(
    'blocks %s without spending resources or starting cooldowns',
    (id) => {
      const { session } = arena(61, [
        { id: 'recharge', rank: 1 },
        { id: 'lastHope', rank: 1 },
        { id: 'aimedFire', rank: 1 },
        { id: 'adrenaline', rank: 1 },
        { id: 'lightningArrows', rank: 1 },
        { id: 'lightningShield', rank: 1 },
      ]);
      hit(session);
      const before = snapshot(session);
      expect(session.activateAbility(id)).toBe('stunned');
      expect(snapshot(session)).toEqual(before);
      expect(abilityButtonAvailability(session.state, id)).toEqual({ hidden: false, locked: true });
      expect(abilityDescription(session.state, id)).toContain('Недоступно во время «Оглушения»');
    },
  );

  it.each(['stand', 'eagleEye'] as const)(
    'allows %s to cleanse stun and restores shooting',
    (id) => {
      const { session } = arena(61, [
        { id: id === 'stand' ? 'divineShield' : 'eagleEye', rank: 1 },
      ]);
      hit(session);
      expect(abilityButtonAvailability(session.state, id)).toEqual({
        hidden: false,
        locked: false,
      });
      expect(session.activateAbility(id)).toBe('activated');
      expect(session.state.isStunned).toBe(false);
      expect(session.state.stats.energyPerKill).toBe(7);
      expect(session.shootLane(0)).toBe('shot');
    },
  );

  it('blocks even free shots without consuming charges, cooldowns or resources', () => {
    const { session } = arena(61, [
      { id: 'adrenaline', rank: 1 },
      { id: 'eagleEye', rank: 1 },
    ]);
    session.activateAbility('adrenaline');
    session.activateAbility('eagleEye');
    hit(session);
    const before = snapshot(session);
    expect(session.shootLane(0)).toBe('blocked');
    expect(snapshot(session)).toEqual(before);
    expect(shootDescription(session.state, 1)).toContain('Нельзя стрелять во время «Оглушения»');
  });

  it('keeps launched arrows and pending aimed-fire waves active', () => {
    const { session } = arena(71, [{ id: 'aimedFire', rank: 1 }]);
    session.shootLane(1);
    session.activateAbility('aimedFire');
    const arrow = [...session.state.arrows.values()][0];
    hit(session);
    session.tick(1);
    expect(session.state.isStunned).toBe(true);
    expect(arrow.y).toBeLessThan(1);
    expect(session.state.arrows.size).toBe(10);
    expect(session.state.aimedFireWaves).toHaveLength(2);
  });

  it('ignores complete magic armor immunity, including refreshes and save restoration', () => {
    const { session } = arena(61, [{ id: 'magicArmor', rank: 5 }]);
    session.state.character.setBase('intellect', 2000);
    session.refreshStats();
    expect(session.state.stats.spiderDebuffResistance).toBe(1);
    hit(session, 100, 'poisonous');
    expect(session.state.poisonTimer).toBe(0);
    expect(session.state.stunTimer).toBe(1);
    session.refreshStats();
    expect(session.state.isStunned).toBe(true);
    const saved = snapshot(session);
    const loaded = restore(parseSave(saved)!);
    expect(snapshot(loaded)).toEqual(saved);
    expect(loaded.state.isStunned).toBe(true);
  });

  it('allows poison resistance to shorten stun by the normal debuff duration rules', () => {
    const { session } = arena(61, [{ id: 'poisonResistance', rank: 5 }]);
    hit(session);
    expect(session.state.stunTimer).toBe(0.6);
  });

  it.each([false, true])(
    'learning from mistakes cleanses the triggering stun (fatal=%s)',
    (fatal) => {
      const { session } = arena(61, [{ id: 'learningFromMistakes', rank: 5 }]);
      if (fatal) session.state.hp = 10;
      hit(session, 2000);
      expect(session.state.isStunned).toBe(false);
      expect(session.state.isInvulnerable).toBe(true);
      expect(session.state.stats.energyPerKill).toBe(7);
    },
  );
});

describe('stun save compatibility', () => {
  it('migrates version 24 without granting a stun and preserves other active effects', () => {
    const { session } = arena(61, [{ id: 'eagleEye', rank: 1 }]);
    session.activateAbility('eagleEye');
    const saved = snapshot(session);
    const { stunTimer: _stun, ...state } = saved.state;
    const parsed = parseSave({
      ...saved,
      abilities: saved.abilities.slice(0, 12),
      version: 24,
      state,
    })!;
    expect(parsed).not.toBeNull();
    expect(parsed.version).toBe(29);
    const loaded = restore(parsed);
    expect(loaded.state.stunTimer).toBe(0);
    expect(loaded.state.eagleEyeShots).toBe(5);
    expect(snapshot(loaded)).toEqual(saved);
  });

  it('round-trips a partially elapsed stun and resumes its exact expiry', () => {
    const { session } = arena();
    hit(session);
    session.tick(0.4);
    const saved = snapshot(session);
    const loaded = restore(parseSave(JSON.parse(JSON.stringify(saved)))!, () => 0.999999);
    expect(snapshot(loaded)).toEqual(saved);
    loaded.tick(0.6);
    expect(loaded.state.isStunned).toBe(false);
    expect(loaded.state.stats.energyPerKill).toBe(7);
  });

  it.each([-1, 1.01, NaN, Infinity, '1', null, undefined])(
    'rejects malformed stun duration %s',
    (stunTimer) => {
      const { session } = arena();
      const saved = snapshot(session);
      expect(parseSave({ ...saved, state: { ...saved.state, stunTimer } })).toBeNull();
    },
  );

  it('rejects active stun before piercing strikes unlock', () => {
    const { session } = arena(60);
    const saved = snapshot(session);
    expect(parseSave({ ...saved, state: { ...saved.state, stunTimer: 1 } })).toBeNull();
  });
});
