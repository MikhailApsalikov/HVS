import { describe, expect, it } from 'vitest';
import { GameSession } from '../src/domain/GameSession.js';
import { parseSave, restore, snapshot } from '../src/domain/save.js';
import type { TalentId } from '../src/domain/types.js';
import { ABILITIES, ABILITY_ORDER, ABILITY_DISPLAY_ORDER } from '../src/content/abilities.js';
import { TALENTS } from '../src/content/talents.js';
import { abilityDescription, talentDescription } from '../src/ui/presenters.js';
import { addSpider } from './helpers.js';

function arena(
  talents: { id: TalentId; rank: number }[] = [],
  roll: number | (() => number) = 0.999999,
) {
  const session = new GameSession('normal', typeof roll === 'number' ? () => roll : roll, {
    level: 60,
  });
  session.talents.loadFromSave([{ id: 'aimedFire', rank: 1 }, ...talents]);
  session.state.character.setModifiers('test', [
    { stat: 'spawnProbability', kind: 'percent', value: -100 },
    { stat: 'energyRegen', kind: 'percent', value: -100 },
    { stat: 'arrowSpeed', kind: 'percent', value: -100 },
  ]);
  session.refreshStats();
  session.state.phase = 'playing';
  session.state.initialTalentPick = false;
  session.state.pendingTalentPoints = 0;
  session.state.levelTimer = session.state.levelTimerMax = 1000;
  session.state.energy = session.state.maxEnergy;
  return session;
}

describe('aimed fire through session commands', () => {
  it('costs 100 energy once and launches nine arrows at 1, 3 and 5 seconds', () => {
    const session = arena();
    const energy = session.state.energy;
    expect(session.activateAbility('aimedFire')).toBe('activated');
    expect(session.state.energy).toBe(energy - 100);
    expect(session.state.arrows.size).toBe(0);
    expect(session.activateAbility('aimedFire')).toBe('on_cooldown');
    session.tick(0.999);
    expect(session.state.arrows.size).toBe(0);
    session.tick(0.001);
    expect(session.state.arrows.size).toBe(9);
    expect([...session.state.arrows.values()].map((arrow) => arrow.lane)).toEqual([
      0, 1, 2, 3, 4, 5, 6, 7, 8,
    ]);
    expect(
      [...session.state.arrows.values()].every((arrow) => arrow.critical && arrow.power === 2),
    ).toBe(true);
    session.tick(1.999);
    expect(session.state.arrows.size).toBe(9);
    session.tick(0.001);
    expect(session.state.arrows.size).toBe(18);
    session.tick(2);
    expect(session.state.arrows.size).toBe(27);
    expect(
      [...session.state.arrows.values()]
        .slice(9)
        .every((arrow) => !arrow.critical && arrow.power === 1),
    ).toBe(true);
    expect(session.state.aimedFireWaves).toEqual([]);
    expect(session.state.energy).toBe(energy - 100);
  });

  it.each([
    [0.1, true],
    [0.3, false],
  ])('rolls talent critical chance on later waves at roll %s', (roll, critical) => {
    const session = arena([{ id: 'criticalShot', rank: 10 }], roll);
    session.activateAbility('aimedFire');
    session.tick(5);
    expect(
      [...session.state.arrows.values()].slice(9).every((arrow) => arrow.critical === critical),
    ).toBe(true);
  });

  it('upgrades critical arrows from all waves and leaves archer buffs and cooldowns intact', () => {
    const session = arena(
      [
        { id: 'criticalShot', rank: 10 },
        { id: 'improvedCriticalShot', rank: 8 },
        { id: 'eagleEye', rank: 1 },
        { id: 'adrenaline', rank: 1 },
      ],
      0,
    );
    session.state.character.setModifiers('test:energy', [
      { stat: 'maxEnergy', kind: 'flat', value: 1000 },
    ]);
    session.refreshStats();
    session.state.energy = session.state.maxEnergy;
    session.activateAbility('eagleEye');
    session.activateAbility('adrenaline');
    session.state.archers[0].start(10);
    session.activateAbility('aimedFire');
    session.tick(5);
    expect(
      [...session.state.arrows.values()].every((arrow) => arrow.critical && arrow.power === 3),
    ).toBe(true);
    expect(session.state.eagleEyeShots).toBe(5);
    expect(session.state.adrenalineShots).toBe(20);
    expect(session.state.archers[0].remainingCooldown).toBe(5);
    expect(session.state.getAbility('volley').isReady).toBe(true);
  });

  it('rolls critical chance independently for each arrow of the later waves', () => {
    let roll = 0;
    const session = arena([{ id: 'criticalShot', rank: 10 }], () =>
      roll++ % 2 === 0 ? 0 : 0.999999,
    );
    session.activateAbility('aimedFire');
    session.tick(5);
    const arrows = [...session.state.arrows.values()];
    for (const start of [9, 18]) {
      const criticals = arrows.slice(start, start + 9).filter((arrow) => arrow.critical).length;
      expect(criticals).toBeGreaterThanOrEqual(4);
      expect(criticals).toBeLessThanOrEqual(5);
    }
  });

  it('critical ability arrows pierce and reward every kill through the usual combat rules', () => {
    const session = arena([{ id: 'piercingReward', rank: 8 }]);
    session.state.character.setModifiers('test', [
      { stat: 'spawnProbability', kind: 'percent', value: -100 },
      { stat: 'energyRegen', kind: 'percent', value: -100 },
      { stat: 'arrowSpeed', kind: 'percent', value: 2900 },
    ]);
    session.refreshStats();
    addSpider(session, 'normal', 0, 0.8);
    addSpider(session, 'normal', 0, 0.5);
    session.activateAbility('aimedFire');
    const energy = session.state.energy;
    session.tick(1);
    session.tick(0.4);
    expect(session.state.spiders.size).toBe(0);
    expect(session.state.energy).toBe(energy + 16);
  });

  it('rolls improvement on a guaranteed critical even without the critical-shot talent', () => {
    const session = arena([{ id: 'improvedCriticalShot', rank: 8 }], 0);
    session.activateAbility('aimedFire');
    session.tick(5);
    expect([...session.state.arrows.values()].slice(0, 9).every((arrow) => arrow.power === 3)).toBe(
      true,
    );
    expect([...session.state.arrows.values()].slice(9).every((arrow) => arrow.power === 1)).toBe(
      true,
    );
  });

  it('applies agility, mastery, rapid fire and common cooldown reductions independently', () => {
    const session = arena([
      { id: 'volleyMastery', rank: 5 },
      { id: 'rapidFire', rank: 7 },
      { id: 'quickInstinct', rank: 2 },
    ]);
    session.state.character.setBase('agility', 121); // 180 after level growth: -10%.
    session.refreshStats();
    expect(session.state.stats['aimedFire.cooldown']).toBe(35.62); // 100 × .9 × .8 × .51 × .97
    expect(session.state.stats['aimedFire.cost']).toBe(100);
    session.activateAbility('aimedFire');
    expect(session.state.getAbility('aimedFire').remainingCooldown).toBe(35.62);
    session.tick(5);
    expect(session.state.arrows.size).toBe(27);
  });

  it('rejects unlearned or unaffordable casts without scheduling arrows', () => {
    const session = arena([{ id: 'aimedFire', rank: 0 }]);
    expect(session.activateAbility('aimedFire')).toBe('level_locked');
    session.talents.loadFromSave([{ id: 'aimedFire', rank: 1 }]);
    session.refreshStats();
    session.state.energy = 99;
    expect(session.activateAbility('aimedFire')).toBe('not_enough_energy');
    session.tick(5);
    expect(session.state.arrows.size).toBe(0);
    expect(session.state.aimedFireWaves).toEqual([]);
    expect(session.state.getAbility('aimedFire').isReady).toBe(true);
  });

  it('pauses pending waves during freeze and talent selection', () => {
    const session = arena();
    session.activateAbility('aimedFire');
    session.state.energy = 100;
    session.tick(0.5);
    session.activateAbility('freeze');
    session.tick(10);
    expect(session.state.arrows.size).toBe(0);
    session.activateAbility('freeze');
    session.state.phase = 'levelUp';
    session.tick(10);
    session.state.phase = 'playing';
    session.tick(0.5);
    expect(session.state.arrows.size).toBe(9);
  });

  it('allows recharge and overlapping casts without cancelling an earlier wave', () => {
    const session = arena([{ id: 'recharge', rank: 1 }]);
    session.state.character.setModifiers('test:energy', [
      { stat: 'maxEnergy', kind: 'flat', value: 1000 },
    ]);
    session.refreshStats();
    session.state.energy = session.state.maxEnergy;
    session.activateAbility('aimedFire');
    session.tick(0.5);
    expect(session.activateAbility('recharge')).toBe('activated');
    expect(session.activateAbility('aimedFire')).toBe('activated');
    session.tick(5);
    expect(session.state.arrows.size).toBe(54);
    expect(session.state.aimedFireWaves).toEqual([]);
  });

  it('moves arrows only for time after their release even across several wave boundaries', () => {
    const session = arena();
    session.state.character.setModifiers('test', [
      { stat: 'spawnProbability', kind: 'percent', value: -100 },
      { stat: 'arrowSpeed', kind: 'percent', value: -90 },
    ]);
    session.refreshStats();
    session.activateAbility('aimedFire');
    session.tick(5);
    const arrows = [...session.state.arrows.values()];
    expect(arrows).toHaveLength(27);
    expect(session.state.stats.arrowSpeed).toBeGreaterThan(0);
    expect(arrows[0].y).toBeCloseTo(1 - session.state.stats.arrowSpeed * 4);
    expect(arrows[9].y).toBeCloseTo(1 - session.state.stats.arrowSpeed * 2);
    expect(arrows[18].y).toBe(1);
  });

  it('does not release pending waves after death', () => {
    const session = arena();
    session.state.hp = 1;
    addSpider(session, 'normal', 0, 1, 999999);
    session.activateAbility('aimedFire');
    session.tick(5);
    expect(session.state.phase).toBe('gameOver');
    expect(session.state.arrows.size).toBe(0);
  });

  it('saves critical ability arrows and resumes the remaining waves at their original times', () => {
    const session = arena();
    session.activateAbility('aimedFire');
    session.tick(1.5);
    const saved = snapshot(session);
    const loaded = restore(parseSave(JSON.parse(JSON.stringify(saved)))!, () => 0.999999);
    expect(snapshot(loaded)).toEqual(saved);
    loaded.tick(3.5);
    session.tick(3.5);
    expect(snapshot(loaded)).toEqual(snapshot(session));
  });

  it.each([
    null,
    [{ remaining: 0, guaranteedCritical: true }],
    [{ remaining: 10, guaranteedCritical: false }],
    [{ remaining: 1, guaranteedCritical: 'yes' }],
  ])('rejects malformed wave queues: %j', (aimedFireWaves) => {
    const saved = snapshot(arena());
    expect(parseSave({ ...saved, state: { ...saved.state, aimedFireWaves } })).toBeNull();
  });
});

describe('progression and compatibility', () => {
  it.each(['easy', 'normal', 'hard'] as const)(
    'requires all five titan ranks and tier seven investment on %s',
    (difficulty) => {
      const session = new GameSession(difficulty, () => 0.999999, { level: 60 });
      session.talents.loadFromSave([
        { id: 'hunterMastery', rank: 5 },
        { id: 'improvedAgility', rank: 7 },
        { id: 'criticalShot', rank: 10 },
        { id: 'piercingReward', rank: 8 },
        { id: 'killingStreak', rank: 10 },
        { id: 'vampirism', rank: 5 },
      ]);
      session.refreshStats();
      expect(session.talents.getTalent('titanPreparation')).toMatchObject({ tier: 5, maxRanks: 5 });
      expect(session.talents.getTalent('aimedFire')).toMatchObject({ tier: 7, maxRanks: 1 });
      for (let i = 0; i < 5; i++) {
        expect(session.upgradeTalent('aimedFire')).toBe(false);
        expect(session.upgradeTalent('titanPreparation')).toBe(true);
      }
      expect(session.upgradeTalent('titanPreparation')).toBe(false);
      session.state.level = 59;
      expect(session.upgradeTalent('aimedFire')).toBe(false);
      session.state.level = 60;
      expect(session.upgradeTalent('aimedFire')).toBe(true);
      expect(session.upgradeTalent('aimedFire')).toBe(false);
      expect(session.state.isAbilityUnlocked('aimedFire')).toBe(true);
      expect(talentDescription('aimedFire', 1, session.state.stats)).toContain(
        'каждые 2 секунды в течение 5 секунд',
      );
    },
  );

  it('orders basic abilities by unlock level and assigns unique keys in the top keyboard row', () => {
    const session = arena();
    const basic = ABILITY_DISPLAY_ORDER.filter((id) => !ABILITIES[id].talent);
    expect(basic.map((id) => [ABILITIES[id].unlockLevel, ABILITIES[id].key])).toEqual([
      [4, 'Q'],
      [8, 'W'],
      [12, 'E'],
      [16, 'R'],
      [20, 'T'],
      [30, 'Y'],
    ]);
    for (const id of basic) {
      session.state.level = ABILITIES[id].unlockLevel - 1;
      expect(session.activateAbility(id)).toBe('level_locked');
      session.state.level += 1;
      session.state.energy = session.state.maxEnergy;
      expect(session.activateAbility(id)).toBe('activated');
      if (id === 'freeze') session.activateAbility(id);
    }
    expect(new Set(ABILITY_ORDER.map((id) => ABILITIES[id].key)).size).toBe(ABILITY_ORDER.length);
    expect(ABILITY_DISPLAY_ORDER.map((id) => ABILITIES[id].key).join('')).toBe('QWERTYUIOP[]');
    expect('volley' in TALENTS).toBe(false);
    expect(TALENTS.volleyMastery.prerequisite).toBeUndefined();
    expect(abilityDescription(session.state, 'aimedFire')).not.toContain('{');
  });

  it('migrates v16 with a single volley refund and unchanged cooldown identities', () => {
    const session = arena([
      { id: 'aimedFire', rank: 0 },
      { id: 'volleyMastery', rank: 3 },
    ]);
    ABILITY_ORDER.forEach((id, index) => session.state.getAbility(id).start(index + 1));
    const saved = snapshot(session);
    const { aimedFireWaves: _waves, killingStreakDecayProgress: _decay, ...state } = saved.state;
    const previous = {
      ...saved,
      version: 16,
      state,
      talents: [
        ...saved.talents.filter((t) => !['titanPreparation', 'aimedFire'].includes(t.id)),
        { id: 'volley', rank: 1 },
      ],
      abilities: saved.abilities.slice(0, 11),
    };
    const loaded = restore(parseSave(previous)!);
    expect(loaded.state.pendingTalentPoints).toBe(1);
    expect(loaded.state.coins).toBe(session.state.coins);
    expect(loaded.talents.getRank('volleyMastery')).toBe(3);
    expect(loaded.state.isAbilityUnlocked('volley')).toBe(true);
    ABILITY_ORDER.slice(0, 11).forEach((id, index) =>
      expect(loaded.state.getAbility(id).remainingCooldown).toBe(index + 1),
    );
    expect(loaded.state.getAbility('aimedFire').isReady).toBe(true);
    expect(loaded.state.aimedFireWaves).toEqual([]);
    const current = snapshot(loaded);
    expect(current.version).toBe(18);
    expect(snapshot(restore(parseSave(current)!))).toEqual(current);
  });
});
