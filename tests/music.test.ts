import { describe, expect, it } from 'vitest';
import { musicForState } from '../src/application/music.js';
import { GameSession } from '../src/domain/GameSession.js';
import { parseSave, restore, snapshot } from '../src/domain/save.js';
import { MusicTrack } from '../src/infrastructure/audio/catalog.js';
import { addSpider, game } from './helpers.js';

function quietGame(level = 4): GameSession {
  const session = game(level);
  session.state.character.setModifiers('test:no-regen', [
    { stat: 'hpRegen', kind: 'percent', value: -100 },
  ]);
  session.refreshStats();
  return session;
}

function hit(session: GameSession): void {
  addSpider(session, 'normal', 0, 1, 10);
  session.tick(0.001);
}

function reachCriticalHealth(session: GameSession): void {
  session.state.hp = session.state.maxHp * 0.2 + session.state.rules.value('incomingDamage', 10);
  hit(session);
  expect(session.state.criticalHealthReached).toBe(true);
}

describe('music through public session commands', () => {
  it('keeps the existing preparation, combat and intermission themes', () => {
    const session = new GameSession('normal', () => 0.999999);
    expect(musicForState(session.state)).toBe(MusicTrack.TALENT_SCREEN);
    expect(session.upgradeTalent('hunterMastery')).toBe(true);
    expect(session.confirmLevelUp()).toBe(true);
    expect(musicForState(session.state)).toBe(MusicTrack.GAMEPLAY);
    session.tick(session.state.levelTimer);
    expect(musicForState(session.state)).toBe(MusicTrack.TALENT_SCREEN);
  });

  it.each([
    [0.200001, MusicTrack.GAMEPLAY],
    [0.2, MusicTrack.CRITICAL_HEALTH],
    [0.199, MusicTrack.CRITICAL_HEALTH],
  ] as const)('switches when a hit leaves health at %s of maximum', (fraction, track) => {
    const session = quietGame();
    session.state.hp =
      session.state.maxHp * fraction + session.state.rules.value('incomingDamage', 10);
    hit(session);
    expect(musicForState(session.state)).toBe(track);
  });

  it('keeps the critical theme after healing and restores it after freezing time', () => {
    const session = quietGame(16);
    reachCriticalHealth(session);
    expect(session.activateAbility('heal')).toBe('activated');
    expect(session.state.hp).toBeGreaterThan(session.state.maxHp * 0.2);
    expect(musicForState(session.state)).toBe(MusicTrack.CRITICAL_HEALTH);
    session.state.energy = session.state.maxEnergy;
    expect(session.activateAbility('freeze')).toBe('activated');
    expect(musicForState(session.state)).toBe(MusicTrack.FREEZE);
    session.tick(5);
    expect(musicForState(session.state)).toBe(MusicTrack.FREEZE);
    expect(session.activateAbility('freeze')).toBe('deactivated');
    expect(musicForState(session.state)).toBe(MusicTrack.CRITICAL_HEALTH);
  });

  it('restores the base combat theme after freezing a healthy level', () => {
    const session = quietGame();
    expect(session.activateAbility('freeze')).toBe('activated');
    expect(musicForState(session.state)).toBe(MusicTrack.FREEZE);
    expect(session.activateAbility('freeze')).toBe('deactivated');
    expect(musicForState(session.state)).toBe(MusicTrack.GAMEPLAY);
  });

  it('notices a critical poison tick without a new spider breach', () => {
    const session = quietGame(8);
    session.state.poisonTimer = 10;
    session.state.poisonTickTimer = 0.01;
    session.state.poisonDamage = [100];
    session.refreshStats();
    session.state.hp = session.state.maxHp * 0.2 + session.state.stats['poison.tickDamage'] / 2;
    expect(musicForState(session.state)).toBe(MusicTrack.GAMEPLAY);
    session.tick(0.01);
    expect(musicForState(session.state)).toBe(MusicTrack.CRITICAL_HEALTH);
  });

  it.each(['stand', 'lightningShield'] as const)(
    'keeps the base theme when %s prevents all health loss below 20%',
    (ability) => {
      const session = quietGame(30);
      session.talents.loadFromSave([
        { id: ability === 'stand' ? 'divineShield' : 'lightningShield', rank: 1 },
      ]);
      session.refreshStats();
      session.state.hp = session.state.maxHp * 0.15;
      expect(session.activateAbility(ability)).toBe('activated');
      const hp = session.state.hp;
      hit(session);
      expect(session.state.hp).toBe(hp);
      expect(musicForState(session.state)).toBe(MusicTrack.GAMEPLAY);
    },
  );

  it('keeps the base theme when a full block prevents health loss below 20%', () => {
    const session = quietGame();
    session.talents.loadFromSave([{ id: 'shieldBlock', rank: 1 }]);
    session.state.character.setModifiers('test:full-block', [
      { stat: 'blockChance', kind: 'flat', value: 1 },
      { stat: 'blockPower', kind: 'flat', value: 1000 },
    ]);
    session.refreshStats();
    session.state.hp = session.state.maxHp * 0.15;
    const hp = session.state.hp;
    hit(session);
    expect(session.state.hp).toBe(hp);
    expect(musicForState(session.state)).toBe(MusicTrack.GAMEPLAY);
  });

  it('keeps the current battle music throughout Armageddon', () => {
    const session = quietGame(30);
    expect(session.activateAbility('armageddon')).toBe('activated');
    expect(musicForState(session.state)).toBe(MusicTrack.GAMEPLAY);
    session.tick(session.state.stats['armageddon.charge']);
    expect(session.state.armageddonPhase).toBe('firing');
    expect(musicForState(session.state)).toBe(MusicTrack.GAMEPLAY);
  });

  it('remembers a critical hit even when a kill heals it in the same simulation step', () => {
    const session = quietGame();
    session.state.character.setModifiers('test:kill-healing', [
      { stat: 'hpPerKill', kind: 'flat', value: 100 },
    ]);
    session.refreshStats();
    const killed = addSpider(session, 'normal', 1);
    killed.startDying();
    killed.dyingTimer = 0;
    reachCriticalHealth(session);
    expect(session.state.hp).toBeGreaterThan(session.state.maxHp * 0.2);
    expect(musicForState(session.state)).toBe(MusicTrack.CRITICAL_HEALTH);
  });

  it.each([
    [0.099, MusicTrack.CRITICAL_HEALTH],
    [0.1, MusicTrack.GAMEPLAY],
    [0.15, MusicTrack.GAMEPLAY],
    [0.2, MusicTrack.GAMEPLAY],
    [0.5, MusicTrack.GAMEPLAY],
  ] as const)('resets at the next level and uses its starting health %s', (fraction, track) => {
    const session = quietGame();
    reachCriticalHealth(session);
    session.tick(session.state.levelTimer);
    expect(musicForState(session.state)).toBe(MusicTrack.TALENT_SCREEN);
    expect(session.upgradeTalent('hunterMastery')).toBe(true);
    const nextMaxHp = new GameSession('normal', undefined, { level: 5 }).state.maxHp;
    session.state.hp = nextMaxHp * fraction - (nextMaxHp - session.state.maxHp);
    expect(session.confirmLevelUp()).toBe(true);
    expect(session.state.hp / session.state.maxHp).toBeCloseTo(fraction);
    expect(musicForState(session.state)).toBe(track);
    session.tick(0.001);
    expect(musicForState(session.state)).toBe(track);
  });

  it('starts the critical theme if health falls again while already below 20% on a new level', () => {
    const session = quietGame();
    session.tick(session.state.levelTimer);
    session.upgradeTalent('hunterMastery');
    session.state.hp = 20;
    session.confirmLevelUp();
    expect(musicForState(session.state)).toBe(MusicTrack.GAMEPLAY);
    hit(session);
    expect(musicForState(session.state)).toBe(MusicTrack.CRITICAL_HEALTH);
  });

  it('does not add music to victory or defeat and retains the menu theme', () => {
    const session = quietGame();
    session.state.hp = 1;
    hit(session);
    expect(session.state.phase).toBe('gameOver');
    expect(musicForState(session.state)).toBeNull();
    const victory = new GameSession('normal', undefined, { level: 120 });
    expect(musicForState(victory.state)).toBeNull();
    expect(musicForState({ phase: 'menu', criticalHealthReached: false })).toBe(
      MusicTrack.MAIN_MENU,
    );
  });
});

describe('critical health history in saved sessions', () => {
  it('preserves the theme through reload after healing and while time is frozen', () => {
    const session = quietGame(16);
    reachCriticalHealth(session);
    session.activateAbility('heal');
    session.state.energy = session.state.maxEnergy;
    session.activateAbility('freeze');
    const saved = snapshot(session);
    const loaded = restore(parseSave(JSON.parse(JSON.stringify(saved)))!);
    expect(snapshot(loaded)).toEqual(saved);
    expect(musicForState(loaded.state)).toBe(MusicTrack.FREEZE);
    loaded.activateAbility('freeze');
    expect(musicForState(loaded.state)).toBe(MusicTrack.CRITICAL_HEALTH);
  });

  it.each([
    ['playing', 0.2, true],
    ['playing', 0.200001, false],
    ['paused', 0.15, true],
    ['levelUp', 0.05, false],
  ] as const)('migrates version 30 at phase %s and health %s', (phase, fraction, expected) => {
    const session = quietGame();
    const saved = snapshot(session);
    const { criticalHealthReached: _history, ...state } = saved.state;
    const previous = {
      ...saved,
      version: 30,
      state: {
        ...state,
        phase,
        freezeActive: phase === 'paused',
        hp: session.state.maxHp * fraction,
      },
    };
    const parsed = parseSave(previous)!;
    expect(parsed.version).toBe(31);
    const loaded = restore(parsed);
    expect(loaded.state.criticalHealthReached).toBe(expected);
    expect(loaded.state.hp).toBe(previous.state.hp);
    expect(loaded.state.levelTimer).toBe(previous.state.levelTimer);
    expect(snapshot(restore(parseSave(snapshot(loaded))!))).toEqual(snapshot(loaded));
  });

  it.each([undefined, null, 0, 1, 'true'])('rejects invalid saved health history %s', (value) => {
    const saved = snapshot(quietGame());
    expect(
      parseSave({ ...saved, state: { ...saved.state, criticalHealthReached: value } }),
    ).toBeNull();
  });
});
