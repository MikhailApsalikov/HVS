import { describe, expect, it } from 'vitest';
import { GameSession } from '../src/domain/GameSession.js';
import { parseSave, restore, snapshot } from '../src/domain/save.js';
import { activeDebuffs, playerEffectDescription } from '../src/ui/presenters.js';
import { addSpider } from './helpers.js';

function arena(level = 55) {
  const session = new GameSession('normal', () => 0.999999);
  session.state.level = level; // Also exercise legacy formulas above the victory level.
  session.state.character.setBase('agility', 200 - (level - 1));
  session.state.character.setModifiers('test:arena', [
    { stat: 'spawnProbability', kind: 'percent', value: -100 },
    { stat: 'maxHp', kind: 'flat', value: 100000 },
    { stat: 'hpRegen', kind: 'percent', value: -100 },
    { stat: 'blockChance', kind: 'flat', value: 0.6 },
    { stat: 'blockPower', kind: 'flat', value: 1 },
    { stat: 'dodgeChance', kind: 'flat', value: 0.1 },
    { stat: 'dodgeChance', kind: 'percent', value: 50 },
  ]);
  session.refreshStats();
  session.state.phase = 'playing';
  session.state.initialTalentPick = false;
  session.state.pendingTalentPoints = 0;
  session.state.levelTimer = session.state.levelTimerMax = 1000;
  return session;
}

function breach(session: GameSession, damage = 100) {
  addSpider(session, 'ninja', 4, 1, damage);
  session.tick(0.001);
}

describe('jumping spider disorientation through the session API', () => {
  it('starts at level 55 and leaves earlier jumping spiders unchanged', () => {
    const session = arena(54);
    const stats = session.state.stats;
    breach(session);
    expect(session.state.disorientationTimer).toBe(0);
    expect(activeDebuffs(session.state)).toEqual([]);
    expect(session.state.stats.blockChance).toBe(stats.blockChance);
    expect(session.state.stats.dodgeChance).toBe(stats.dodgeChance);
  });

  it.each([
    [55, 10, 3, 1],
    [56, 13, 6, 2],
    [88, 109, 100, 34],
    [154, 307, 100, 100],
  ])(
    'at level %i lasts %i seconds and reduces block by %i%% and agility dodge by %i%%',
    (level, duration, blockPercent, dodgePercent) => {
      const session = arena(level);
      const { agility, shootCooldown, arrowSpeed } = session.state.stats;
      breach(session);
      expect(session.state.disorientationTimer).toBe(duration);
      expect(session.state.stats).toMatchObject({ agility, shootCooldown, arrowSpeed });
      expect(session.state.stats.blockChance).toBeCloseTo(0.6 * (1 - blockPercent / 100));
      expect(session.state.stats.dodgeChance).toBeCloseTo(
        (0.1 + 0.03 * (1 - dodgePercent / 100)) * 1.5,
        6,
      );
      expect(session.state.activeEffects).toContainEqual({
        id: 'disorientation',
        name: 'Дезориентация',
        sprite: 'DebuffDisorientation',
        kind: 'debuff',
        source: 'spider',
        removableByCleanser: false,
        remaining: duration,
        stacks: null,
        details: {
          blockReductionPercent: blockPercent,
          agilityDodgeReductionPercent: dodgePercent,
        },
      });
      expect(playerEffectDescription(session.state.activeEffects[0])).toContain(
        `Шанс блока уменьшен на ${blockPercent}%`,
      );
      expect(activeDebuffs(session.state)[0].detail).toContain(
        `Шанс уклонения от ловкости уменьшен на ${dodgePercent}%`,
      );
    },
  );

  it('reduces the block granted by last hope as well as the ordinary block chance', () => {
    const session = arena();
    session.talents.loadFromSave([{ id: 'lastHope', rank: 1 }]);
    session.refreshStats();
    expect(session.activateAbility('lastHope')).toBe('activated');
    const chance = session.state.stats.blockChance;
    breach(session, 10000);
    expect(session.state.stats.blockChance).toBeCloseTo(chance * 0.97);
  });

  it('refreshes its duration without stacking the penalties and restores chances exactly on expiry', () => {
    const session = arena();
    const { blockChance, dodgeChance } = session.state.stats;
    breach(session);
    const reduced = session.state.stats;
    session.tick(2);
    breach(session);
    expect(session.state.disorientationTimer).toBe(10);
    expect(session.state.stats.blockChance).toBe(reduced.blockChance);
    expect(session.state.stats.dodgeChance).toBe(reduced.dodgeChance);
    session.tick(9.999);
    expect(session.state.disorientationTimer).toBeCloseTo(0.001);
    expect(session.state.stats.blockChance).toBe(reduced.blockChance);
    session.tick(0.001);
    expect(session.state.disorientationTimer).toBe(0);
    expect(session.state.stats).toMatchObject({ blockChance, dodgeChance });
    expect(activeDebuffs(session.state)).toEqual([]);
  });

  it('resistance shortens its duration without weakening its penalties', () => {
    const session = arena(56);
    session.talents.loadFromSave([{ id: 'poisonResistance', rank: 5 }]);
    session.refreshStats();
    breach(session);
    expect(session.state.disorientationTimer).toBe(7.8);
    expect(session.state.stats.blockChance).toBe(0.564);
    expect(session.state.stats.dodgeChance).toBe(0.1941);
    session.tick(7.8);
    expect(session.state.disorientationTimer).toBe(0);
  });

  it.each(['stand', 'eagleEye'] as const)('%s removes disorientation immediately', (ability) => {
    const session = arena();
    session.talents.loadFromSave([
      { id: ability === 'stand' ? 'divineShield' : 'eagleEye', rank: 1 },
    ]);
    session.refreshStats();
    const { blockChance, dodgeChance } = session.state.stats;
    breach(session);
    expect(session.state.disorientationTimer).toBe(10);
    expect(session.activateAbility(ability)).toBe('activated');
    expect(session.state.disorientationTimer).toBe(0);
    expect(session.state.stats).toMatchObject({ blockChance, dodgeChance });
  });

  it.each(['immune', 'blocked', 'dodged', 'zero damage'] as const)(
    'does not apply when the breach is %s',
    (defense) => {
      const original = arena();
      const session = restore(snapshot(original), () => 0);
      if (defense === 'immune') {
        session.talents.loadFromSave([{ id: 'divineShield', rank: 1 }]);
        session.refreshStats();
        expect(session.activateAbility('stand')).toBe('activated');
      } else {
        session.state.character.setModifiers(
          'test:defense',
          defense === 'blocked'
            ? [
                { stat: 'blockChance', kind: 'flat', value: 1 },
                { stat: 'blockPower', kind: 'flat', value: 10000 },
              ]
            : defense === 'dodged'
              ? [{ stat: 'dodgeChance', kind: 'flat', value: 0.75 }]
              : [{ stat: 'incomingDamage', kind: 'percent', value: -100 }],
        );
        session.refreshStats();
      }
      breach(session);
      expect(session.state.disorientationTimer).toBe(0);
      expect(activeDebuffs(session.state)).toEqual([]);
    },
  );

  it('pauses the timer during time freeze and level-up, including a save and load', () => {
    const session = arena();
    breach(session);
    session.tick(2);
    expect(session.activateAbility('freeze')).toBe('activated');
    const saved = snapshot(session);
    const loaded = restore(parseSave(JSON.parse(JSON.stringify(saved)))!, () => 0.999999);
    expect(snapshot(loaded)).toEqual(saved);
    expect(loaded.state.stats).toEqual(session.state.stats);
    loaded.tick(20);
    expect(snapshot(loaded)).toEqual(saved);
    expect(loaded.activateAbility('freeze')).toBe('deactivated');
    loaded.state.levelTimer = 1;
    loaded.tick(1);
    expect(loaded.state.phase).toBe('levelUp');
    const timer = loaded.state.disorientationTimer;
    loaded.tick(20);
    expect(loaded.state.disorientationTimer).toBe(timer);
  });
});

describe('disorientation save compatibility', () => {
  it('migrates version 22 without inventing disorientation or changing previous timers and progress', () => {
    const session = arena();
    session.state.hunterRewardTimer = 7;
    session.state.hp = 1234;
    session.refreshStats();
    addSpider(session, 'normal', 2, 0.5);
    const current = snapshot(session);
    const { disorientationTimer: _timer, ...state } = current.state;
    const previous = { ...current, abilities: current.abilities.slice(0, 12), version: 22, state };
    const parsed = parseSave(previous)!;
    expect(parsed).not.toBeNull();
    expect(parsed.version).toBe(29);
    expect(parsed.state.disorientationTimer).toBe(0);
    expect(snapshot(restore(parsed))).toEqual(current);
    expect(parseSave({ ...previous, state: { ...state, disorientationTimer: 10 } })).toEqual(
      parsed,
    );
  });

  it.each([undefined, -1, NaN, Infinity, 10.01, '10'])(
    'rejects invalid disorientation timer %s',
    (disorientationTimer) => {
      const current = snapshot(arena());
      expect(
        parseSave({ ...current, state: { ...current.state, disorientationTimer } }),
      ).toBeNull();
    },
  );

  it('rejects disorientation before its unlock level', () => {
    const current = snapshot(arena(54));
    expect(
      parseSave({ ...current, state: { ...current.state, disorientationTimer: 1 } }),
    ).toBeNull();
  });
});
