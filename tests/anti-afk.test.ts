import { describe, expect, it } from 'vitest';
import { GameSession } from '../src/domain/GameSession.js';
import { Arrow } from '../src/domain/model/Arrow.js';
import { parseSave, restore, snapshot } from '../src/domain/save.js';
import { resourceDescription } from '../src/ui/presenters.js';
import { game, advance, addSpider } from './helpers.js';

function breach(session: GameSession, damage = 20, type: 'normal' | 'burner' = 'normal') {
  addSpider(session, type, 8, 1, damage);
  session.tick(1 / 60);
  return session.drainEvents().find((event) => event.type === 'damage');
}

describe('anti-AFK through player commands and gameplay time', () => {
  it('starts at exactly three seconds with full energy and does not stack with time alone', () => {
    const session = game();
    advance(session, 3 - 1 / 60);
    expect(session.state.antiAfkStacks).toBe(0);
    session.tick(1 / 60);
    expect(session.state.antiAfkDamagePercent).toBe(10);
    advance(session, 4);
    expect(session.state.antiAfkStacks).toBe(1);
  });

  it('counts only the full-energy portion of regeneration, including within a tick', () => {
    const session = game();
    session.state.energy -= session.state.stats.energyRegen * 2;
    session.tick(4);
    expect(session.state.antiAfkIdleTimer).toBeCloseTo(2);
    expect(session.state.antiAfkStacks).toBe(0);
    session.tick(1);
    expect(session.state.antiAfkStacks).toBe(1);
  });

  it('does not accumulate idle time below full energy without regeneration', () => {
    const session = game();
    session.state.character.setModifiers('test', [
      { stat: 'energyRegen', kind: 'percent', value: -100 },
    ]);
    session.refreshStats();
    session.state.energy -= 1;
    session.tick(6);
    expect(session.state.antiAfkIdleTimer).toBe(0);
    expect(session.state.antiAfkStacks).toBe(0);
  });

  it('resets the three-second warning after a successful paid shot', () => {
    const session = game();
    session.tick(2.9);
    expect(session.shootLane(0)).toBe('shot');
    expect(session.state.antiAfkIdleTimer).toBe(0);
    session.state.energy = session.state.maxEnergy;
    session.tick(2.9);
    expect(session.state.antiAfkStacks).toBe(0);
    session.tick(0.1);
    expect(session.state.antiAfkStacks).toBe(1);
  });

  it('adds ten percentage points per breach before its damage and counts each spider once', () => {
    const session = game();
    session.tick(3);
    const first = breach(session, 100);
    expect(session.state.antiAfkDamagePercent).toBe(20);
    expect(first).toMatchObject({ hp: session.state.rules.value('incomingDamage', 100) });
    expect(first?.hp).toBe(87); // 100 * 1.2 * (1 - 3/11 armor reduction)
    const second = breach(session, 100);
    expect(session.state.antiAfkDamagePercent).toBe(30);
    expect(second?.hp).toBe(95);
    session.tick(0.1);
    expect(session.state.antiAfkStacks).toBe(3);
  });

  it('keeps a single additive stack source beyond 100%, including simultaneous breaches', () => {
    const session = game();
    session.tick(3);
    for (let i = 0; i < 50; i++) addSpider(session, 'normal', i % 9, 1, 0);
    session.tick(0.01);
    expect(session.state.antiAfkDamagePercent).toBe(510);
    expect(session.state.stats.damageFactor).toBeCloseTo(4.436364);
    expect(resourceDescription(session.state, 'hp')).toContain('Общее увеличение урона - 343.6%');
  });

  it('stops stacking immediately on spending, retains damage for five seconds and does not restart the timer', () => {
    const session = game();
    session.tick(3);
    breach(session, 0);
    expect(session.shootLane(0)).toBe('shot');
    expect(session.state.antiAfkRecoveryTimer).toBe(5);
    expect(session.state.antiAfkRecoveryFraction).toBe(1);
    session.tick(1);
    session.shootLane(1);
    expect(session.state.antiAfkRecoveryTimer).toBe(4);
    expect(breach(session, 100)?.hp).toBe(87);
    expect(session.state.antiAfkStacks).toBe(2);
    advance(session, 4 - 2 / 60);
    expect(session.state.antiAfkStacks).toBe(2);
    session.tick(1 / 60);
    expect(session.state.antiAfkStacks).toBe(0);
    expect(session.state.antiAfkRecoveryTimer).toBe(0);
    expect(session.state.stats.damageFactor).toBeCloseTo(8 / 11);
  });

  it('resumes the preserved stacks on re-entering AFK during recovery, including after load', () => {
    const session = game();
    session.tick(3);
    breach(session, 0);
    session.shootLane(0);
    session.state.energy = session.state.maxEnergy;
    session.tick(2);
    expect(session.state.antiAfkRecoveryTimer).toBe(3);
    const loaded = restore(parseSave(snapshot(session))!, () => 0.999999);
    loaded.tick(1 - 1 / 60);
    expect(loaded.state.antiAfkRecoveryTimer).toBeGreaterThan(0);
    loaded.tick(1 / 60);
    expect(loaded.state.antiAfkRecoveryTimer).toBe(0);
    expect(loaded.state.antiAfkStacks).toBe(2);
    breach(loaded, 0);
    expect(loaded.state.antiAfkStacks).toBe(3);
    expect(loaded.shootLane(1)).toBe('shot');
    expect(loaded.state.antiAfkRecoveryTimer).toBe(5);
  });

  it('repeated energy spending prevents AFK relapse without extending removal', () => {
    const session = game();
    session.tick(3);
    session.shootLane(0);
    session.state.energy = session.state.maxEnergy;
    session.tick(2);
    session.shootLane(1);
    session.state.energy = session.state.maxEnergy;
    session.tick(2);
    session.shootLane(2);
    session.tick(1);
    expect(session.state.antiAfkStacks).toBe(0);
    expect(session.state.antiAfkRecoveryTimer).toBe(0);
  });

  it('starts at one stack if the old penalty expires before becoming AFK again', () => {
    const session = game();
    session.tick(3);
    breach(session, 0);
    session.shootLane(0);
    session.state.energy = session.state.maxEnergy - session.state.stats.energyRegen * 3;
    session.tick(6);
    expect(session.state.antiAfkStacks).toBe(1);
    expect(session.state.antiAfkRecoveryTimer).toBe(0);
  });

  it('recognizes paid abilities even when their effect restores energy', () => {
    const session = game(50);
    session.state.energy = session.state.maxEnergy;
    session.state.character.setModifiers('test', [{ stat: 'prep.cost', kind: 'flat', value: 1 }]);
    session.refreshStats();
    session.tick(3);
    expect(session.activateAbility('prep')).toBe('activated');
    expect(session.state.energy).toBe(session.state.maxEnergy);
    expect(session.state.antiAfkRecoveryTimer).toBe(5);
  });

  it('ignores rejected commands, free abilities and free adrenaline shots', () => {
    const session = game(60);
    session.state.energy = session.state.maxEnergy;
    session.talents.loadFromSave([{ id: 'adrenaline', rank: 1 }]);
    session.refreshStats();
    session.tick(3);
    expect(session.shootLane(-1)).toBe('blocked');
    expect(session.activateAbility('prep')).toBe('activated');
    expect(session.activateAbility('prep')).toBe('on_cooldown');
    expect(session.activateAbility('adrenaline')).toBe('activated');
    expect(session.shootLane(0)).toBe('shot');
    expect(session.state.antiAfkRecoveryTimer).toBe(0);
    expect(session.state.antiAfkStacks).toBe(1);
    session.state.adrenalineTimer = 0;
    session.state.energy = 0;
    expect(session.shootLane(1)).toBe('not_enough_energy');
    expect(session.activateAbility('heal')).toBe('not_enough_energy');
    expect(session.state.antiAfkRecoveryTimer).toBe(0);
  });

  it('does not treat energy burning as activity or remove the existing penalty below full energy', () => {
    const session = game();
    session.tick(3);
    breach(session, 0, 'burner');
    expect(session.state.energy).toBeLessThan(session.state.maxEnergy);
    expect(session.state.antiAfkRecoveryTimer).toBe(0);
    breach(session, 0);
    expect(session.state.antiAfkStacks).toBe(3);
  });

  it('counts breaches through invulnerability and preserves flat block after percentage effects', () => {
    const session = game();
    session.tick(3);
    session.state.invulnerableTimer = 1;
    expect(breach(session, 100)).toBeUndefined();
    expect(session.state.antiAfkStacks).toBe(2);
    session.state.invulnerableTimer = 0;
    session.state.character.setModifiers('test', [
      { stat: 'blockChance', kind: 'flat', value: 1 },
      { stat: 'blockPower', kind: 'flat', value: 10 },
    ]);
    session.refreshStats();
    expect(breach(session, 100)).toMatchObject({ hp: 85, blockedDamage: 10 });
  });

  it('freezes detection in menus and recovery on pause, then allows a fresh idle cycle', () => {
    const initial = new GameSession('normal');
    initial.tick(10);
    expect(initial.state.antiAfkIdleTimer).toBe(0);
    const session = game(50);
    session.state.energy = session.state.maxEnergy;
    session.tick(3);
    expect(session.activateAbility('freeze')).toBe('activated');
    session.tick(10);
    expect(session.state.antiAfkRecoveryTimer).toBe(5);
    expect(session.activateAbility('freeze')).toBe('deactivated');
    session.state.phase = 'levelUp';
    session.tick(10);
    expect(session.state.antiAfkRecoveryTimer).toBe(5);
    session.state.phase = 'playing';
    session.state.energy = 0;
    session.tick(5);
    expect(session.state.antiAfkStacks).toBe(0);
    session.state.energy = session.state.maxEnergy;
    session.tick(3);
    expect(session.state.antiAfkStacks).toBe(1);
  });

  it.each(['idle', 'stacking', 'recovering'] as const)(
    'preserves %s state and damage through save/load',
    (stage) => {
      const session = game();
      session.tick(stage === 'idle' ? 2 : 3);
      if (stage === 'recovering') {
        session.shootLane(0);
        session.tick(1);
      }
      const saved = snapshot(session);
      const loaded = restore(parseSave(saved)!, () => 0.999999);
      expect(snapshot(loaded)).toEqual(saved);
      expect(loaded.state.stats.damageFactor).toBe(session.state.stats.damageFactor);
      session.tick(1);
      loaded.tick(1);
      expect(snapshot(loaded)).toEqual(snapshot(session));
    },
  );

  it('migrates version 9 without a penalty, retaining critical arrows and existing effects', () => {
    const session = game();
    session.shootLane(0);
    const shot = [...session.state.arrows.values()][0];
    const arrow = new Arrow(shot.id, shot.lane, shot.speed, false, true);
    session.state.arrows.set(arrow.id, arrow);
    arrow.kills = 1;
    const spider = addSpider(session);
    spider.grantsKillEnergy = false;
    session.state.bestDefenseCooldown = 2;
    const current = snapshot(session);
    const { antiAfkIdleTimer, antiAfkStacks, antiAfkRecoveryTimer, ...previousState } =
      current.state;
    const migrated = parseSave({ ...current, version: 9, state: previousState })!;
    expect(migrated.version).toBe(10);
    expect(migrated.state).toMatchObject({
      antiAfkIdleTimer: 0,
      antiAfkStacks: 0,
      antiAfkRecoveryTimer: 0,
      bestDefenseCooldown: 2,
    });
    expect(migrated.arrows).toEqual(current.arrows);
    expect(migrated.spiders).toEqual(current.spiders);
    expect(snapshot(restore(parseSave(migrated)!))).toEqual(migrated);
  });

  it.each([
    { antiAfkIdleTimer: -1 },
    { antiAfkIdleTimer: 4 },
    { antiAfkStacks: -1 },
    { antiAfkStacks: 1.5 },
    { antiAfkRecoveryTimer: -1 },
    { antiAfkRecoveryTimer: 6 },
    { antiAfkRecoveryTimer: 1, antiAfkStacks: 0 },
  ])('rejects invalid saved anti-AFK state %j', (patch) => {
    const saved = snapshot(game());
    expect(parseSave({ ...saved, state: { ...saved.state, ...patch } })).toBeNull();
  });
});
