import { describe, expect, it } from 'vitest';
import { GameSession } from '../src/domain/GameSession.js';
import { parseSave, restore, snapshot } from '../src/domain/save.js';
import type { Difficulty, TalentId } from '../src/domain/types.js';
import { addSpider } from './helpers.js';

function arena(random = () => 0.999999, difficulty: Difficulty = 'normal'): GameSession {
  const session = new GameSession(difficulty, random, { level: 60, coins: 1000000 });
  session.state.character.setModifiers('test:quiet', [
    { stat: 'spawnProbability', kind: 'percent', value: -100 },
    { stat: 'hpRegen', kind: 'percent', value: -100 },
    { stat: 'energyRegen', kind: 'percent', value: -100 },
    { stat: 'dodgeChance', kind: 'percent', value: -100 },
    { stat: 'arrowSpeed', kind: 'percent', value: -100 },
  ]);
  session.refreshStats();
  return session;
}

function learn(session: GameSession, id: TalentId, ranks = 1): void {
  for (let rank = 0; rank < ranks; rank++) expect(session.upgradeTalent(id)).toBe(true);
}

function play(session: GameSession): void {
  session.state.phase = 'playing';
  session.state.initialTalentPick = false;
  session.state.levelTimer = session.state.levelTimerMax = 1000;
  session.state.energy = session.state.maxEnergy;
}

function criticalTalents(session: GameSession, improvedRanks = 0): void {
  learn(session, 'hunterMastery', 5);
  learn(session, 'vampirism', 2);
  learn(session, 'criticalShot', 7);
  learn(session, 'eagleEye');
  if (improvedRanks > 0) learn(session, 'piercingReward', 6);
  learn(session, 'improvedCriticalShot', improvedRanks);
}

describe('item combat balance through session commands', () => {
  it.each(['easy', 'normal', 'hard'] as const)(
    'uses seven shield ranks, six percentage points per rank and forty from last hope in %s',
    (difficulty) => {
      const session = arena(() => 0.999999, difficulty);
      learn(session, 'endurance', 7);
      expect(session.state.rules.shieldBlockLearned).toBe(false);
      for (let rank = 1; rank <= 6; rank++) {
        learn(session, 'shieldBlock');
        expect(session.state.stats.blockChance).toBeCloseTo(rank * 0.06);
        expect(session.upgradeTalent('lastHope')).toBe(false);
      }
      learn(session, 'shieldBlock');
      expect(session.upgradeTalent('shieldBlock')).toBe(false);
      expect(session.state.stats.blockChance).toBe(0.42);
      expect(session.state.rules.shieldBlockLearned).toBe(true);
      learn(session, 'lastHope');
      play(session);
      expect(session.activateAbility('lastHope')).toBe('activated');
      expect(session.state.stats.blockChance).toBe(0.82);
      session.tick(6);
      expect(session.state.stats.blockChance).toBe(0.42);
    },
  );

  it('opens item block with the first shield rank and removes it when the item is sold', () => {
    const session = arena(() => 0.1);
    expect(session.buyItem('l021')).toBe(true);
    expect(session.state.stats).toMatchObject({ blockChance: 0, blockPower: 0 });
    learn(session, 'endurance', 7);
    learn(session, 'shieldBlock');
    expect(session.state.stats.blockChance).toBe(0.12);
    expect(session.state.stats.blockPower).toBeGreaterThan(40);
    play(session);
    addSpider(session, 'normal', 0, 1, 100);
    session.tick(0.01);
    expect(session.drainEvents()).toContainEqual({ type: 'absorb' });
    session.state.phase = 'levelUp';
    expect(session.sellItem(0)).toBe(true);
    expect(session.state.stats.blockChance).toBe(0.06);
    play(session);
    addSpider(session, 'normal', 0, 1, 100);
    session.tick(0.01);
    expect(session.drainEvents().some((event) => event.type === 'absorb')).toBe(false);
  });

  it('adds both named shields independently and caps block including last hope at one', () => {
    const session = arena();
    learn(session, 'endurance', 7);
    learn(session, 'hunterArsenal');
    learn(session, 'shieldBlock', 7);
    learn(session, 'lastHope');
    expect(session.buyItem('l021')).toBe(true);
    expect(session.buyItem('l010')).toBe(true);
    expect(session.state.stats.blockChance).toBe(0.52);
    session.state.character.setModifiers('item:test-extra-block', [
      { stat: 'blockChance', kind: 'flat', value: 0.2 },
    ]);
    session.refreshStats();
    play(session);
    expect(session.activateAbility('lastHope')).toBe('activated');
    expect(session.state.stats.blockChance).toBe(1);
  });

  it('keeps the new item critical bonuses inactive until critical shot is learned', () => {
    const session = arena(() => 0);
    expect(session.buyItem('l027')).toBe(true);
    expect(session.state.rules.criticalShotLearned).toBe(false);
    expect(session.state.currentCriticalShotChance).toBe(0);
    expect(session.state.currentImprovedCriticalShotChance).toBe(0);
    play(session);
    expect(session.shootLane(0)).toBe('shot');
    expect([...session.state.arrows.values()][0]).toMatchObject({ critical: false, power: 1 });
    session.state.phase = 'levelUp';
    learn(session, 'hunterMastery', 5);
    learn(session, 'vampirism', 2);
    learn(session, 'criticalShot');
    expect(session.state.rules.criticalShotLearned).toBe(true);
    expect(session.state.currentCriticalShotChance).toBeGreaterThan(0.1);
    expect(session.state.currentImprovedCriticalShotChance).toBe(0.36);
    session.state.character.setModifiers('item:test-extra-critical', [
      { stat: 'criticalShotChance', kind: 'flat', value: 2 },
    ]);
    session.refreshStats();
    expect(session.state.currentCriticalShotChance).toBe(1);
  });

  it('rolls the item triple chance only for arrows that are critical', () => {
    const rolls = [0, 0.359999, 0, 0.36, 0.999999];
    const session = arena(() => rolls.shift() ?? 0.999999);
    criticalTalents(session);
    expect(session.buyItem('l027')).toBe(true);
    play(session);
    for (let lane = 0; lane < 3; lane++) expect(session.shootLane(lane)).toBe('shot');
    expect(
      [...session.state.arrows.values()].map(({ critical, power }) => ({ critical, power })),
    ).toEqual([
      { critical: true, power: 3 },
      { critical: true, power: 2 },
      { critical: false, power: 1 },
    ]);
    expect(rolls).toEqual([]);
  });

  it('adds the item bonus to talent strength and the active eagle eye chance', () => {
    const session = arena();
    criticalTalents(session, 1);
    expect(session.state.currentImprovedCriticalShotChance).toBe(0.08);
    expect(session.buyItem('l027')).toBe(true);
    expect(session.state.currentImprovedCriticalShotChance).toBe(0.44);
    play(session);
    expect(session.activateAbility('eagleEye')).toBe('activated');
    expect(session.state.currentCriticalShotChance).toBe(1);
    expect(session.state.currentImprovedCriticalShotChance).toBe(0.48);
    session.tick(20);
    expect(session.state.currentImprovedCriticalShotChance).toBe(0.44);
    expect(session.state.currentCriticalShotChance).toBe(session.state.stats.criticalShotChance);
  });

  it('upgrades all critical arrows to triples with the maximum talent, including aimed fire', () => {
    const session = arena(() => 0.999999);
    criticalTalents(session, 8);
    learn(session, 'agileCriticalShot', 5);
    learn(session, 'piercingReward', 2);
    learn(session, 'rapidFire', 6);
    learn(session, 'titanPreparation', 5);
    learn(session, 'aimedFire');
    expect(session.state.currentImprovedCriticalShotChance).toBe(0.64);
    expect(session.buyItem('l027')).toBe(true);
    expect(session.state.currentImprovedCriticalShotChance).toBe(1);
    session.state.character.setModifiers('test:guaranteed-critical', [
      { stat: 'criticalShotChance', kind: 'flat', value: 1 },
    ]);
    session.refreshStats();
    play(session);
    expect(session.shootLane(0)).toBe('shot');
    expect([...session.state.arrows.values()][0]).toMatchObject({ critical: true, power: 3 });
    expect(session.activateAbility('aimedFire')).toBe('activated');
    session.tick(5);
    const arrows = [...session.state.arrows.values()];
    expect(arrows).toHaveLength(28);
    expect(arrows.every(({ critical, power }) => critical && power === 3)).toBe(true);
    expect(session.activateAbility('eagleEye')).toBe('activated');
    expect(session.state.currentImprovedCriticalShotChance).toBe(1);
  });

  it('does not enable the item triple bonus on guaranteed ability criticals without the talent', () => {
    const session = arena(() => 0);
    learn(session, 'hunterMastery', 5);
    learn(session, 'vampirism', 5);
    learn(session, 'piercingReward', 8);
    learn(session, 'volleyMastery', 5);
    learn(session, 'killingStreak', 5);
    learn(session, 'rapidFire', 7);
    learn(session, 'killingStreak', 3);
    learn(session, 'titanPreparation', 5);
    learn(session, 'aimedFire');
    expect(session.buyItem('l027')).toBe(true);
    play(session);
    expect(session.activateAbility('aimedFire')).toBe('activated');
    session.tick(1);
    expect(session.state.arrows.size).toBe(9);
    expect([...session.state.arrows.values()].every(({ power }) => power === 2)).toBe(true);
  });
});

describe('version 20 shield rank migration through session restoration', () => {
  it('refunds the eighth shield rank once and preserves equipment, buffs and cooldowns', () => {
    const session = arena();
    learn(session, 'endurance', 7);
    learn(session, 'shieldBlock', 7);
    learn(session, 'lastHope');
    learn(session, 'improvedEndurance', 5);
    learn(session, 'greed');
    learn(session, 'improvedLastHope', 3);
    expect(session.buyItem('l021')).toBe(true);
    play(session);
    session.activateAbility('lastHope');
    session.state.archers[0].start(5);
    session.tick(1.25);
    const previous = snapshot(session);
    const parsed = parseSave({
      ...previous,
      version: 20,
      talents: previous.talents.map((talent) =>
        talent.id === 'shieldBlock' ? { ...talent, rank: 8 } : talent,
      ),
    });
    expect(parsed).not.toBeNull();
    expect(parsed!.version).toBe(23);
    const loaded = restore(parsed!, () => 0.999999);
    expect(loaded.talents.getRank('shieldBlock')).toBe(7);
    expect(loaded.talents.getRank('improvedLastHope')).toBe(3);
    expect(loaded.state.pendingTalentPoints).toBe(previous.state.pendingTalentPoints + 1);
    expect(snapshot(loaded)).toEqual({
      ...previous,
      state: { ...previous.state, pendingTalentPoints: previous.state.pendingTalentPoints + 1 },
    });
    expect(snapshot(restore(parseSave(snapshot(loaded))!))).toEqual(snapshot(loaded));
  });

  it.each([0, 1, 6, 7])('keeps version 20 shield rank %s without a refund', (rank) => {
    const session = arena();
    learn(session, 'endurance', 7);
    learn(session, 'shieldBlock', rank);
    const previous = snapshot(session);
    const loaded = restore(parseSave({ ...previous, version: 20 })!);
    expect(loaded.talents.getRank('shieldBlock')).toBe(rank);
    expect(loaded.state.pendingTalentPoints).toBe(previous.state.pendingTalentPoints);
    expect(snapshot(loaded)).toEqual(previous);
  });
});
