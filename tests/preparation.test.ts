import { describe, expect, it } from 'vitest';
import { parseSave, restore, snapshot } from '../src/domain/save.js';
import { abilityDescription, resourceDescription } from '../src/ui/presenters.js';
import { addSpider, game } from './helpers.js';

function preparation(regenPercent = 0) {
  const session = game(12);
  session.state.character.setModifiers('test', [
    { stat: 'intellect', kind: 'percent', value: -100 },
    { stat: 'maxEnergy', kind: 'flat', value: 1000 },
    { stat: 'energyRegen', kind: 'percent', value: regenPercent },
  ]);
  session.refreshStats();
  session.state.energy = 0;
  return session;
}

describe('preparation through session commands', () => {
  it('restores 100 immediately and advertises 150 over five seconds', () => {
    const session = preparation();
    expect(abilityDescription(session.state, 'prep')).toContain(
      'Восстанавливает 100 энергии и 150 в течение 5 секунд.',
    );
    expect(session.activateAbility('prep')).toBe('activated');
    expect(session.state.energy).toBe(100);
    expect(session.state.currentEnergyRegen).toBe(38);
    expect(session.state.abilityActiveTimer('prep')).toBe(5);
    expect(session.state.getAbility('prep').remainingCooldown).toBe(60);
    expect(abilityDescription(session.state, 'prep')).toContain('Действует ещё 5 с');
    expect(resourceDescription(session.state, 'energy')).toContain(
      'Восстанавливается 38 в секунду.',
    );
    session.tick(1);
    expect(session.state.energy).toBe(138);
    expect(session.state.abilityActiveTimer('prep')).toBe(4);
    expect(session.activateAbility('prep')).toBe('on_cooldown');
    expect(session.state.energy).toBe(138);
    expect(session.state.abilityActiveTimer('prep')).toBe(4);
  });

  it.each([[5], [2, 4], Array.from({ length: 300 }, () => 1 / 60)])(
    'credits precisely five seconds of recovery with timesteps %j',
    (...steps: number[]) => {
      const session = preparation();
      session.activateAbility('prep');
      for (const dt of steps) session.tick(dt);
      const elapsed = steps.reduce((sum, dt) => sum + dt, 0);
      expect(session.state.energy).toBeCloseTo(250 + 8 * elapsed);
      expect(session.state.abilityActiveTimer('prep')).toBe(0);
      expect(session.state.currentEnergyRegen).toBe(8);
      const energy = session.state.energy;
      session.tick(1);
      expect(session.state.energy).toBeCloseTo(energy + 8);
      expect(abilityDescription(session.state, 'prep')).not.toContain('Действует ещё');
    },
  );

  it.each([-100, 100])('adds exactly 30/s with a %s%% normal regeneration modifier', (percent) => {
    const session = preparation(percent);
    const baseRegen = session.state.currentEnergyRegen;
    session.activateAbility('prep');
    expect(session.state.currentEnergyRegen).toBe(baseRegen + 30);
    session.tick(5);
    expect(session.state.energy).toBe(250 + 5 * baseRegen);
    expect(session.state.currentEnergyRegen).toBe(baseRegen);
  });

  it('keeps intellect and equipment bonuses in the instant portion of the previous total', () => {
    const session = game(20);
    session.state.phase = 'levelUp';
    session.state.coins = 100000;
    session.state.character.setModifiers('test', [
      { stat: 'maxEnergy', kind: 'flat', value: 1000 },
    ]);
    expect(session.buyItem('l013')).toBe(true);
    session.state.phase = 'playing';
    session.state.energy = 0;
    expect(session.state.stats.intellect).toBe(154);
    // The pendant still multiplies the previous (250 + intellect) total by 1.5.
    expect(session.state.stats['prep.restore']).toBe(606);
    expect(session.activateAbility('prep')).toBe('activated');
    expect(session.state.energy).toBe(456);
    expect(abilityDescription(session.state, 'prep')).toContain(
      'Восстанавливает 456 энергии и 150 в течение 5 секунд.',
    );
    session.tick(5);
    expect(session.state.energy).toBeCloseTo(606 + session.state.stats.energyRegen * 5);
  });

  it('respects the energy cap and resumes recovery when energy is spent', () => {
    const session = preparation();
    session.state.energy = session.state.maxEnergy - 10;
    session.activateAbility('prep');
    expect(session.state.energy).toBe(session.state.maxEnergy);
    session.tick(1);
    expect(session.state.energy).toBe(session.state.maxEnergy);
    expect(session.shootLane(0)).toBe('shot');
    const energy = session.state.energy;
    session.tick(0.1);
    expect(session.state.energy).toBeCloseTo(energy + 3.8);
    session.tick(5);
    expect(session.state.energy).toBe(session.state.maxEnergy);
  });

  it('pauses recovery during freeze and talent selection', () => {
    const session = preparation();
    session.activateAbility('prep');
    session.tick(1);
    expect(session.activateAbility('freeze')).toBe('activated');
    const energy = session.state.energy;
    session.tick(20);
    expect(session.state.energy).toBe(energy);
    expect(session.state.abilityActiveTimer('prep')).toBe(4);
    expect(session.activateAbility('freeze')).toBe('deactivated');
    session.state.levelTimer = 1;
    session.tick(1);
    expect(session.state.phase).toBe('levelUp');
    expect(session.state.abilityActiveTimer('prep')).toBe(3);
    session.tick(20);
    expect(session.state.energy).toBe(energy + 38);
    expect(session.state.abilityActiveTimer('prep')).toBe(3);
    expect(session.upgradeTalent('agility')).toBe(true);
    expect(session.confirmLevelUp()).toBe(true);
    session.tick(3);
    expect(session.state.abilityActiveTimer('prep')).toBe(0);
  });

  it('refreshes the duration after recharge without stacking regeneration', () => {
    const session = preparation();
    session.talents.loadFromSave([{ id: 'recharge', rank: 1 }]);
    session.refreshStats();
    session.activateAbility('prep');
    session.tick(2);
    expect(session.activateAbility('recharge')).toBe('activated');
    const energy = session.state.energy;
    expect(session.activateAbility('prep')).toBe('activated');
    expect(session.state.energy).toBe(energy + 100);
    expect(session.state.currentEnergyRegen).toBe(38);
    expect(session.state.abilityActiveTimer('prep')).toBe(5);
    session.tick(5);
    expect(session.state.energy).toBe(energy + 100 + 190);
  });

  it.each([
    [76, 4, 2],
    [200, 8, 1.75],
  ])(
    'uses the temporary rate when filling %s missing energy before AFK detection',
    (missing, dt, idle) => {
      const session = preparation();
      addSpider(session, 'normal', 8, 0.1);
      session.activateAbility('prep');
      session.state.energy = session.state.maxEnergy - missing;
      session.tick(dt);
      expect(session.state.energy).toBe(session.state.maxEnergy);
      expect(session.state.antiAfkIdleTimer).toBeCloseTo(idle);
      expect(session.state.antiAfkStacks).toBe(0);
    },
  );

  it('never restores energy after lethal damage', () => {
    const session = preparation();
    session.activateAbility('prep');
    addSpider(session, 'normal', 0, 1, 100000);
    session.tick(1);
    expect(session.state.phase).toBe('gameOver');
    expect(session.state.energy).toBe(100);
    session.tick(5);
    expect(session.state.energy).toBe(100);
  });
});

describe('preparation saves', () => {
  it('continues the remaining recovery after loading without repeating the instant gain', () => {
    const session = preparation();
    session.activateAbility('prep');
    session.tick(2);
    session.activateAbility('freeze');
    const saved = snapshot(session);
    const loaded = restore(parseSave(JSON.parse(JSON.stringify(saved)))!, () => 0.999999);
    expect(snapshot(loaded)).toEqual(saved);
    expect(loaded.state.abilityActiveTimer('prep')).toBe(3);
    expect(loaded.state.currentEnergyRegen).toBe(38);
    loaded.tick(10);
    expect(snapshot(loaded)).toEqual(saved);
    for (const active of [session, loaded]) {
      active.activateAbility('freeze');
      active.tick(4);
    }
    expect(snapshot(loaded)).toEqual(snapshot(session));
    expect(loaded.state.energy).toBe(250 + 8 * 6 - 50);
    expect(loaded.state.currentEnergyRegen).toBe(8);
  });

  it('migrates version 14 with an inactive effect and preserves resources, cooldowns and streak', () => {
    const session = preparation();
    session.talents.loadFromSave([{ id: 'killingStreak', rank: 1 }]);
    session.refreshStats();
    session.state.killingStreakStacks = 2;
    session.state.killingStreakProgress = 3;
    session.activateAbility('prep');
    session.tick(1);
    const saved = snapshot(session);
    const { prepTimer: _timer, ...state } = saved.state;
    const previous = { ...saved, version: 14, state };
    const parsed = parseSave(previous)!;
    expect(parsed.version).toBe(16);
    const loaded = restore(parsed, () => 0.999999);
    expect(loaded.state.prepTimer).toBe(0);
    expect(loaded.state.energy).toBe(saved.state.energy);
    expect(loaded.state.coins).toBe(saved.state.coins);
    expect(loaded.state.killingStreakStacks).toBe(saved.state.killingStreakStacks);
    expect(loaded.state.killingStreakProgress).toBe(saved.state.killingStreakProgress);
    expect(snapshot(loaded).abilities).toEqual(saved.abilities);
    const migrated = snapshot(loaded);
    expect(snapshot(restore(parseSave(migrated)!))).toEqual(migrated);
    loaded.tick(1);
    expect(loaded.state.energy).toBe(saved.state.energy + 8);
  });

  it.each([undefined, -1, 5.1, Infinity, NaN, '3'])(
    'rejects invalid saved duration %s',
    (prepTimer) => {
      const saved = snapshot(preparation());
      expect(parseSave({ ...saved, state: { ...saved.state, prepTimer } })).toBeNull();
    },
  );
});
