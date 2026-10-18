import { describe, expect, it } from 'vitest';
import { GameSession } from '../src/domain/GameSession.js';
import { parseSave, restore, snapshot } from '../src/domain/save.js';
import { ANTI_AFK } from '../src/domain/rules/stats.js';
import { DEBUFFS } from '../src/content/debuffs.js';
import { addSpider } from './helpers.js';

function arena(level = 60) {
  const session = new GameSession('normal', () => 0.999999, { level });
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
    { id: 'divineShield', rank: 1 },
    { id: 'aimedFire', rank: 1 },
    { id: 'hunterMastery', rank: 1 },
    { id: 'killingStreak', rank: 1 },
  ]);
  session.refreshStats();
  session.state.energy = session.state.maxEnergy;
  session.state.phase = 'playing';
  session.state.initialTalentPick = false;
  session.state.pendingTalentPoints = 0;
  session.state.levelTimer = session.state.levelTimerMax = 1000;
  return session;
}

describe('player effect entities through session commands', () => {
  it('lists five active buffs with their timers, charges and resolved effects', () => {
    const session = arena();
    expect(session.state.activeEffects).toEqual([]);
    for (const ability of ['prep', 'lastHope', 'stand', 'adrenaline', 'eagleEye'] as const)
      expect(session.activateAbility(ability)).toBe('activated');
    const { state } = session;
    const beforeRead = snapshot(session);
    expect(state.activeEffects).toEqual([
      {
        id: 'prep',
        name: 'Подготовка',
        sprite: 'AbilityPrep',
        kind: 'buff',
        source: 'ability',
        removableByCleanser: true,
        remaining: state.prepTimer,
        stacks: null,
        details: { energyRegen: state.stats['prep.energyRegen'] },
      },
      {
        id: 'lastHope',
        name: 'Блок последней надежды',
        sprite: 'AbilityLastHope',
        kind: 'buff',
        source: 'ability',
        removableByCleanser: true,
        remaining: state.lastHopeTimer,
        stacks: null,
        details: {
          blockChance: state.stats['lastHope.blockChance'],
          blockPower: state.stats['lastHope.blockPower'],
        },
      },
      {
        id: 'stand',
        name: 'Божественный щит',
        sprite: 'AbilityStand',
        kind: 'buff',
        source: 'ability',
        removableByCleanser: true,
        remaining: state.invulnerableTimer,
        stacks: null,
      },
      {
        id: 'adrenaline',
        name: 'Адреналин',
        sprite: 'AbilityAdrenaline',
        kind: 'buff',
        source: 'ability',
        removableByCleanser: true,
        remaining: state.adrenalineTimer,
        stacks: state.adrenalineShots,
        details: { shootCooldownReduction: state.stats['adrenaline.shootCooldownReduction'] },
      },
      {
        id: 'eagleEye',
        name: 'Зоркость',
        sprite: 'AbilityEagleEye',
        kind: 'buff',
        source: 'ability',
        removableByCleanser: true,
        remaining: state.eagleEyeTimer,
        stacks: state.eagleEyeShots,
      },
    ]);
    expect(snapshot(session)).toEqual(beforeRead);
    const active = state.activeEffects;
    session.tick(1);
    state.activeEffects.forEach((effect, index) => {
      expect(effect.remaining).toBe(active[index].remaining! - 1);
    });
    session.tick(19);
    expect(state.activeEffects).toEqual([]);
  });

  it('excludes kill streak, passive bonuses, cooldowns, instant actions and ongoing attacks', () => {
    const session = arena();
    session.state.killingStreakStacks = 3;
    session.state.hp -= 100;
    for (const ability of ['heal', 'volley', 'blizzard', 'aimedFire', 'armageddon'] as const)
      expect(session.activateAbility(ability)).toBe('activated');
    expect(session.state.killingStreakLearned).toBe(true);
    expect(session.state.getAbility('heal').isOnCooldown).toBe(true);
    expect(session.state.blizzardActive).toBe(true);
    expect(session.state.aimedFireWaves.length).toBeGreaterThan(0);
    expect(session.state.armageddonPhase).toBe('charging');
    expect(session.state.activeEffects).toEqual([]);
  });

  it('removes shot buffs when their charges are spent before their timers expire', () => {
    const session = arena();
    expect(session.activateAbility('adrenaline')).toBe('activated');
    expect(session.activateAbility('eagleEye')).toBe('activated');
    const shots = session.state.adrenalineShots;
    const criticalShots = session.state.eagleEyeShots;
    for (let shot = 0; shot < criticalShots; shot++) expect(session.shootLane(0)).toBe('shot');
    expect(session.state.activeEffects.map((effect) => effect.id)).toEqual(['adrenaline']);
    expect(session.state.activeEffects[0].stacks).toBe(shots - criticalShots);
    for (let shot = criticalShots; shot < shots; shot++) expect(session.shootLane(0)).toBe('shot');
    expect(session.state.activeEffects).toEqual([]);
  });

  it('pauses effect timers with gameplay and updates them when gameplay resumes', () => {
    const session = arena();
    expect(session.activateAbility('prep')).toBe('activated');
    const active = session.state.activeEffects;
    expect(session.activateAbility('freeze')).toBe('activated');
    session.tick(100);
    expect(session.state.activeEffects).toEqual(active);
    expect(session.activateAbility('freeze')).toBe('deactivated');
    session.tick(1);
    expect(session.state.activeEffects[0].remaining).toBe(active[0].remaining! - 1);
    session.state.levelTimer = 1;
    session.tick(1);
    const levelUpEffects = session.state.activeEffects;
    expect(session.state.phase).toBe('levelUp');
    session.tick(100);
    expect(session.state.activeEffects).toEqual(levelUpEffects);
  });

  it('describes spider debuffs from actual hits, including poison stack and tick changes', () => {
    const session = arena();
    for (const type of ['golden', 'fast', 'poisonous', 'poisonous'] as const) {
      addSpider(session, type, 8, 1, 100);
      session.tick(0.001);
    }
    const { state } = session;
    expect(state.activeEffects.map((effect) => effect.id)).toEqual([
      'goldLock',
      'healingReduction',
      'poison',
    ]);
    expect(
      state.activeEffects.every(
        (effect) =>
          effect.kind === 'debuff' && effect.source === 'spider' && !effect.removableByCleanser,
      ),
    ).toBe(true);
    expect(state.activeEffects[1].details).toEqual({
      healingReceived: state.stats.healingReceived,
    });
    expect(state.activeEffects[0].details).toEqual({ incomePercent: -63 });
    const poison = state.activeEffects[2];
    expect(poison).toMatchObject({
      name: 'Яд',
      sprite: 'DebuffPoison',
      remaining: state.poisonTimer,
      stacks: 2,
      details: {
        armorPercent: -53,
        tickDamage: state.stats['poison.tickDamage'],
        tickInterval: DEBUFFS.poison.interval,
        nextTick: state.poisonTickTimer,
      },
    });
    session.tick(state.poisonTickTimer);
    expect(state.activeEffects[2].details?.nextTick).toBe(DEBUFFS.poison.interval);
    expect(session.activateAbility('eagleEye')).toBe('activated');
    expect(state.activeEffects.map((effect) => effect.id)).toEqual(['eagleEye']);
  });

  it('represents inactivity without a deadline until recovery begins', () => {
    const session = arena();
    addSpider(session, 'normal', 8, 0.1);
    session.tick(ANTI_AFK.idleDuration);
    expect(session.state.activeEffects).toEqual([
      {
        id: 'antiAfk',
        name: 'Бездействие',
        sprite: 'DebuffInactivity',
        kind: 'debuff',
        source: 'inactivity',
        removableByCleanser: false,
        remaining: null,
        stacks: 1,
        details: { damagePercent: ANTI_AFK.damagePerStack },
      },
    ]);
    addSpider(session, 'normal', 8, 1, 0);
    session.tick(0.001);
    expect(session.state.activeEffects[0].stacks).toBe(2);
    expect(session.state.activeEffects[0].details?.damagePercent).toBe(2 * ANTI_AFK.damagePerStack);
    expect(session.shootLane(0)).toBe('shot');
    expect(session.state.activeEffects[0].remaining).toBe(ANTI_AFK.recoveryDuration);
    session.tick(1);
    expect(session.state.activeEffects[0].remaining).toBe(ANTI_AFK.recoveryDuration - 1);
    session.tick(ANTI_AFK.recoveryDuration - 1);
    expect(session.state.activeEffects).toEqual([]);
  });

  it('uses the same source classification for eagle eye and divine shield cleansing', () => {
    const session = arena();
    addSpider(session, 'normal', 8, 0.1);
    session.tick(ANTI_AFK.idleDuration);
    for (const type of ['golden', 'fast', 'poisonous'] as const) {
      addSpider(session, type, 8, 1, 100);
      session.tick(0.001);
    }
    expect(session.state.activeEffects.filter((effect) => effect.kind === 'debuff')).toHaveLength(
      4,
    );
    expect(session.activateAbility('eagleEye')).toBe('activated');
    expect(
      session.state.activeEffects
        .filter((effect) => effect.kind === 'debuff')
        .map((effect) => effect.id),
    ).toEqual(['antiAfk']);
    expect(session.activateAbility('stand')).toBe('activated');
    expect(session.state.activeEffects.filter((effect) => effect.kind === 'debuff')).toEqual([]);
    expect(session.state.activeEffects.map((effect) => effect.id)).toEqual(['stand', 'eagleEye']);
  });

  it('reconstructs active entities from saved timers and charges without changing save format', () => {
    const session = arena();
    addSpider(session, 'normal', 8, 0.1);
    session.tick(ANTI_AFK.idleDuration);
    for (const ability of ['prep', 'lastHope', 'adrenaline', 'eagleEye'] as const)
      expect(session.activateAbility(ability)).toBe('activated');
    for (const type of ['golden', 'fast', 'poisonous'] as const) {
      addSpider(session, type, 8, 1, 100);
      session.tick(0.001);
    }
    const saved = snapshot(session);
    expect(saved.version).toBe(27);
    expect(saved.state).not.toHaveProperty('activeEffects');
    const loaded = restore(parseSave(JSON.parse(JSON.stringify(saved)))!, () => 0.999999);
    expect(loaded.state.activeEffects).toEqual(session.state.activeEffects);
    loaded.tick(0.5);
    session.tick(0.5);
    expect(loaded.state.activeEffects).toEqual(session.state.activeEffects);
  });
});
