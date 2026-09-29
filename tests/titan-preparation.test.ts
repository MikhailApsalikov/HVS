import { describe, expect, it } from 'vitest';
import { GameSession } from '../src/domain/GameSession.js';
import { parseSave, restore, snapshot } from '../src/domain/save.js';
import type { TalentId } from '../src/domain/types.js';
import { talentDescription, killingStreakDescription } from '../src/ui/presenters.js';
import { addSpider } from './helpers.js';

function arena(rank = 5, learned = false) {
  const session = new GameSession('normal', () => 0.999999);
  const talents: { id: TalentId; rank: number }[] = [{ id: 'titanPreparation', rank }];
  if (learned)
    talents.push({ id: 'killingStreak', rank: 10 }, { id: 'improvedKillingStreak', rank: 5 });
  session.talents.loadFromSave(talents);
  session.state.level = 40;
  session.state.phase = 'playing';
  session.state.initialTalentPick = false;
  session.state.pendingTalentPoints = 0;
  session.state.levelTimer = session.state.levelTimerMax = 1000;
  session.state.character.setModifiers('test', [
    { stat: 'spawnProbability', kind: 'percent', value: -100 },
  ]);
  session.refreshStats();
  return session;
}

describe('titan preparation through session commands', () => {
  it.each([1, 2, 3, 4, 5])('grants four stacks per rank %s without learning the streak', (rank) => {
    const session = arena(rank);
    expect(session.activateAbility('prep')).toBe('activated');
    expect(session.state.killingStreakLearned).toBe(false);
    expect(session.state.killingStreakStacks).toBe(rank * 4);
    expect(session.state.killingStreakExcess).toBe(rank * 4);
    expect(session.state.killingStreakMaximum).toBe(0);
    const energy = session.state.energy;
    expect(session.shootLane(0)).toBe('shot');
    expect(session.state.energy).toBe(energy - (35 - rank * 4));
    expect(talentDescription('titanPreparation', rank, session.state.stats)).toContain(
      `до ${rank * 4}`,
    );
    expect(talentDescription('titanPreparation', rank, session.state.stats)).not.toMatch(
      /1[.,]5|спада|максимум/,
    );
    expect(killingStreakDescription(session.state)).toContain('временных эффектов');
  });

  it.each([
    [10, 10],
    [8, 8],
    [2, 8],
    [0, 8],
  ])('rank two changes %s stacks to %s with a cap of ten', (before, after) => {
    const session = arena(2, true);
    session.state.killingStreakStacks = before;
    session.activateAbility('prep');
    expect(session.state.killingStreakStacks).toBe(after);
    expect(session.state.killingStreakExcess).toBe(0);
    session.tick(1.5);
    expect(session.state.killingStreakStacks).toBe(after);
  });

  it('decays one excess stack every 1.5 seconds and stops at the learned maximum', () => {
    const session = arena(5, true);
    session.activateAbility('prep');
    session.tick(1.49);
    expect(session.state.killingStreakStacks).toBe(20);
    expect(session.state.killingStreakDecayRemaining).toBeCloseTo(0.01);
    session.tick(0.01);
    expect(session.state.killingStreakStacks).toBe(19);
    expect(session.state.killingStreakDecayFraction).toBe(1);
    session.tick(13.5);
    expect(session.state.killingStreakStacks).toBe(10);
    expect(session.state.killingStreakDecayRemaining).toBe(0);
    session.tick(100);
    expect(session.state.killingStreakStacks).toBe(10);
    expect(session.state.killingStreakProgress).toBe(0);
  });

  it('decays all stacks without the streak talent, including with fractional ticks', () => {
    const session = arena(1);
    session.activateAbility('prep');
    for (let frame = 0; frame < 360; frame++) session.tick(1 / 60);
    expect(session.state.killingStreakStacks).toBe(0);
    expect(session.state.killingStreakDecayProgress).toBe(0);
    expect(session.state.killingStreakProgress).toBe(0);
    session.tick(100);
    expect(session.state.killingStreakStacks).toBe(0);
  });

  it('preserves a running decay on a no-op cast and restarts it when stacks are raised', () => {
    const session = arena();
    session.state.character.setModifiers('test:ready', [
      { stat: 'prep.cooldown', kind: 'percent', value: -100 },
    ]);
    session.refreshStats();
    session.activateAbility('prep');
    session.tick(1);
    session.activateAbility('prep');
    expect(session.state.killingStreakStacks).toBe(20);
    expect(session.state.killingStreakDecayRemaining).toBeCloseTo(0.5);
    session.tick(0.5);
    expect(session.state.killingStreakStacks).toBe(19);
    session.tick(1);
    session.activateAbility('prep');
    expect(session.state.killingStreakStacks).toBe(20);
    expect(session.state.killingStreakDecayRemaining).toBe(1.5);
  });

  it('pauses decay for freeze and talent selection, and damage consumes a temporary stack', () => {
    const session = arena(1);
    session.activateAbility('prep');
    session.tick(1);
    expect(session.activateAbility('freeze')).toBe('activated');
    session.tick(100);
    expect(session.state.killingStreakStacks).toBe(4);
    session.activateAbility('freeze');
    session.state.phase = 'levelUp';
    session.tick(100);
    session.state.phase = 'playing';
    addSpider(session, 'normal', 8, 1, 10);
    session.tick(0.01);
    expect(session.state.killingStreakStacks).toBe(3);
    expect(session.state.killingStreakDecayRemaining).toBeCloseTo(0.49);
    session.tick(0.49);
    expect(session.state.killingStreakStacks).toBe(2);
  });

  it('caps every stack source at twenty, including oversized modifiers and assignments', () => {
    const session = arena(5, true);
    session.state.character.setModifiers('test:cap', [
      { stat: 'prep.stacks', kind: 'flat', value: 1000 },
      { stat: 'killingStreak.maxStacks', kind: 'flat', value: 1000 },
      { stat: 'killingStreak.killAdvance', kind: 'flat', value: 1000 },
    ]);
    session.refreshStats();
    session.activateAbility('prep');
    expect(session.state.stats['prep.stacks']).toBe(20);
    expect(session.state.stats['killingStreak.maxStacks']).toBe(20);
    expect(session.state.killingStreakStacks).toBe(20);
    session.state.killingStreakStacks = 999;
    expect(session.state.killingStreakStacks).toBe(20);
    session.state.killingStreakStacks = 0;
    session.tick(250);
    expect(session.state.killingStreakStacks).toBe(20);
    addSpider(session).startDying();
    session.tick(0.4);
    expect(session.state.killingStreakStacks).toBe(20);
  });

  it('keeps energy recovery when no stack change is needed and grants no stacks without the new talent', () => {
    for (const rank of [0, 2]) {
      const session = arena(rank, true);
      session.state.killingStreakStacks = 10;
      session.state.energy = 0;
      session.activateAbility('prep');
      expect(session.state.killingStreakStacks).toBe(10);
      expect(session.state.energy).toBeGreaterThan(0);
      expect(session.state.prepTimer).toBe(5);
    }
  });

  it('round-trips temporary stacks and the partial decay timer', () => {
    const session = arena();
    session.activateAbility('prep');
    session.tick(0.75);
    const saved = snapshot(session);
    const loaded = restore(parseSave(JSON.parse(JSON.stringify(saved)))!, () => 0.999999);
    expect(snapshot(loaded)).toEqual(saved);
    loaded.tick(0.75);
    expect(loaded.state.killingStreakStacks).toBe(19);
  });

  it.each([
    { killingStreakStacks: 21 },
    { killingStreakStacks: 1.5 },
    { killingStreakDecayProgress: 1.5 },
    { killingStreakDecayProgress: -1 },
    { killingStreakDecayProgress: null },
    { killingStreakStacks: 0, killingStreakDecayProgress: 1 },
  ])('rejects invalid saved stacks: %j', (invalid) => {
    const session = arena();
    session.activateAbility('prep');
    const saved = snapshot(session);
    expect(parseSave({ ...saved, state: { ...saved.state, ...invalid } })).toBeNull();
  });
});
