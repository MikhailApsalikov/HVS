import { describe, expect, it } from 'vitest';
import {
  ABILITY_SOUNDS,
  buttonSound,
  gameOverSound,
  soundsForEvent,
} from '../src/application/sounds.js';
import { GameSession } from '../src/domain/GameSession.js';
import { parseSave, restore, snapshot } from '../src/domain/save.js';
import { SOUND_FILES, SoundEffect } from '../src/infrastructure/audio/catalog.js';
import { addSpider } from './helpers.js';

function arena(level = 60, roll = 0.999999): GameSession {
  const session = new GameSession('normal', () => roll, { level });
  session.talents.loadFromSave([
    { id: 'aimedFire', rank: 1 },
    { id: 'adrenaline', rank: 1 },
    { id: 'eagleEye', rank: 1 },
    { id: 'lightningArrows', rank: 1 },
    { id: 'lightningShield', rank: 1 },
    { id: 'divineShield', rank: 1 },
    { id: 'lastHope', rank: 1 },
  ]);
  session.state.character.setModifiers('test:quiet', [
    { stat: 'spawnProbability', kind: 'percent', value: -100 },
    { stat: 'hpRegen', kind: 'percent', value: -100 },
    { stat: 'energyRegen', kind: 'percent', value: -100 },
    { stat: 'agility', kind: 'percent', value: -100 },
    { stat: 'endurance', kind: 'percent', value: -100 },
    { stat: 'maxHp', kind: 'flat', value: 100000 },
    { stat: 'maxEnergy', kind: 'flat', value: 10000 },
  ]);
  session.refreshStats();
  session.state.energy = session.state.maxEnergy;
  session.state.phase = 'playing';
  session.state.initialTalentPick = false;
  session.state.pendingTalentPoints = 0;
  session.state.levelTimer = session.state.levelTimerMax = 1000;
  return session;
}

function sounds(session: GameSession): SoundEffect[] {
  return session.drainEvents().flatMap(soundsForEvent);
}

describe('selected ability sounds through successful session commands', () => {
  it.each([
    ['prep', 'Enrest.mp3'],
    ['adrenaline', 'bloodlust_player_cast_head.ogg'],
    ['eagleEye', 'InnerFireC.ogg'],
    ['lightningArrows', 'SPELL_LightningBolt_Impact_04.ogg'],
    ['volley', 'Shoot.mp3'],
    ['aimedFire', 'BowPullback.ogg'],
    ['stand', 'Bubble.mp3'],
    ['lightningShield', 'LightningShieldImpact.ogg'],
  ] as const)('%s uses %s', (ability, filename) => {
    const session = arena();
    expect(session.activateAbility(ability)).toBe('activated');
    expect(SOUND_FILES[ABILITY_SOUNDS[ability]]).toBe(filename);
  });

  it('plays the selected last hope activation', () => {
    const session = arena();
    expect(session.activateAbility('lastHope')).toBe('activated');
    expect(ABILITY_SOUNDS.lastHope).toBe(SoundEffect.LAST_HOPE_ACTIVATE);
    expect(SOUND_FILES[SoundEffect.LAST_HOPE_ACTIVATE]).toBe('ShieldWallTarget.ogg');
  });
});

describe('aimed fire release feedback', () => {
  it('plays Shoot only when a wave releases, at 1, 3 and 5 seconds', () => {
    const session = arena();
    session.activateAbility('aimedFire');
    expect(sounds(session)).toEqual([]);
    session.tick(0.999);
    expect(sounds(session)).toEqual([]);
    session.tick(0.001);
    expect(session.drainEvents()).toEqual([{ type: 'aimedFireVolley', arrows: 9 }]);
    session.tick(2);
    expect(sounds(session)).toEqual([SoundEffect.SHOOT]);
    session.tick(2);
    expect(sounds(session)).toEqual([SoundEffect.SHOOT]);
    session.tick(2);
    expect(sounds(session)).toEqual([]);
  });

  it('keeps the delay during freeze and resumes after reload without replaying activation', () => {
    const session = arena();
    session.activateAbility('aimedFire');
    session.tick(0.5);
    session.activateAbility('freeze');
    session.tick(10);
    expect(sounds(session)).toEqual([]);
    const loaded = restore(parseSave(snapshot(session))!, () => 0.999999);
    expect(sounds(loaded)).toEqual([]);
    loaded.activateAbility('freeze');
    loaded.tick(0.5);
    expect(sounds(loaded)).toEqual([SoundEffect.SHOOT]);
  });

  it('does not play a release when every arrow fails due to curse', () => {
    const session = arena(60, 0);
    session.state.curseTimer = 10;
    session.refreshStats();
    session.activateAbility('aimedFire');
    session.tick(5);
    expect(session.state.arrows.size).toBe(0);
    expect(sounds(session)).toEqual([]);
  });
});

describe('kill and reward feedback', () => {
  it.each([
    ['normal', SoundEffect.KILL_SPIDER],
    ['golden', SoundEffect.KILL_GOLDEN_SPIDER],
  ] as const)(
    'keeps a distinct sound slot for a %s kill without an extra jackpot cue',
    (type, cue) => {
      const session = arena();
      session.state.character.setModifiers('test:jackpot', [
        { stat: 'jackpotChance', kind: 'flat', value: 1 },
        { stat: 'goldenJackpotChance', kind: 'flat', value: 1 },
      ]);
      session.refreshStats();
      const killed = addSpider(session, type);
      killed.startDying();
      session.tick(0.4);
      const events = session.drainEvents();
      expect(events).toContainEqual({
        type: 'spiderKilled',
        spiderId: killed.id,
        spiderType: type,
      });
      expect(events).toContainEqual(expect.objectContaining({ type: 'coinDrop', jackpot: true }));
      expect(events.flatMap(soundsForEvent)).toEqual([cue]);
    },
  );

  it('does not play a kill sound for marauder coins from a breached spider', () => {
    const session = arena();
    session.state.character.setModifiers('test:marauder', [
      { stat: 'breachRewardFraction', kind: 'flat', value: 0.15 },
    ]);
    session.refreshStats();
    addSpider(session, 'normal', 0, 1, 0);
    session.tick(0.4);
    const events = session.drainEvents();
    expect(events.some((event) => event.type === 'coinDrop')).toBe(true);
    expect(events.some((event) => event.type === 'spiderKilled')).toBe(false);
    expect(events.flatMap(soundsForEvent)).toEqual([]);
  });
});

describe('distinct defense and damage slots', () => {
  it.each([
    [10, [SoundEffect.FULL_BLOCK]],
    [100, [SoundEffect.PARTIAL_DEFENSE_DAMAGE, SoundEffect.PARTIAL_BLOCK]],
  ] as const)('separates block from invulnerability at raw damage %s', (damage, expected) => {
    const session = arena(40);
    session.talents.loadFromSave([{ id: 'shieldBlock', rank: 1 }]);
    session.state.character.setModifiers('test:block', [
      { stat: 'blockChance', kind: 'flat', value: 1 },
      { stat: 'blockPower', kind: 'flat', value: 20 },
    ]);
    session.refreshStats();
    addSpider(session, 'normal', 0, 1, damage);
    session.tick(0.001);
    const events = session.drainEvents();
    expect(events.some((event) => event.type === 'absorb')).toBe(false);
    expect(events.flatMap(soundsForEvent)).toEqual(expected);
  });

  it('retains AbsorbGetHitA specifically for invulnerability', () => {
    const session = arena(40);
    session.activateAbility('stand');
    addSpider(session, 'normal', 0, 1, 100);
    session.tick(0.001);
    expect(sounds(session)).toEqual([SoundEffect.ABSORB_DAMAGE]);
  });

  it.each([
    ['normal', 40, 0.999999, SoundEffect.PLAYER_TAKE_DAMAGE],
    ['tank', 40, 0.999999, SoundEffect.TANK_DAMAGE],
    ['normal', 61, 0, SoundEffect.PIERCING_DAMAGE],
  ] as const)('separates %s damage at level %s', (type, level, roll, expected) => {
    const session = arena(level, roll);
    addSpider(session, type, 0, 1, 100);
    session.tick(0.001);
    expect(sounds(session)).toEqual([expected]);
  });

  it('keeps an independent slot for damage left after shield absorption', () => {
    const session = arena(40);
    session.activateAbility('lightningShield');
    session.state.lightningShieldAbsorption = 5;
    addSpider(session, 'normal', 0, 1, 100);
    session.tick(0.001);
    expect(sounds(session)).toEqual([SoundEffect.PARTIAL_DEFENSE_DAMAGE]);
  });

  it('preserves energy burn feedback and does not report a block after a dodge', () => {
    const session = arena(40);
    addSpider(session, 'burner', 0, 1, 0);
    session.tick(0.001);
    expect(sounds(session)).toEqual([SoundEffect.BURNER_DRAIN]);
    expect(
      soundsForEvent({
        type: 'damage',
        spiderId: 'spider-1',
        hp: 0,
        energy: 0,
        blockedDamage: 5,
        dodged: true,
      }),
    ).toEqual([]);
  });
});

describe('screen and button sounds', () => {
  it('only sounds actual level completion, never initial selection or a loaded talent screen', () => {
    const session = new GameSession('normal', () => 0.999999);
    expect(sounds(session)).toEqual([]);
    session.upgradeTalent('hunterMastery');
    session.confirmLevelUp();
    session.tick(session.state.levelTimer);
    expect(session.state.phase).toBe('levelUp');
    expect(sounds(session)).toEqual([SoundEffect.LEVEL_COMPLETE]);
    const loaded = restore(parseSave(snapshot(session))!);
    expect(loaded.state.phase).toBe('levelUp');
    expect(sounds(loaded)).toEqual([]);
  });

  it('distinguishes victory and defeat through session outcomes', () => {
    const victory = new GameSession('normal', undefined, { level: 120 });
    expect(SOUND_FILES[gameOverSound(victory.state)]).toBe('greed_main.mp3');
    const defeated = arena(40);
    defeated.state.hp = 1;
    addSpider(defeated, 'normal', 0, 1, 100);
    defeated.tick(0.001);
    expect(defeated.state.phase).toBe('gameOver');
    expect(SOUND_FILES[gameOverSound(defeated.state)]).toBe('4.mp3');
  });

  it.each([undefined, 'start', 'load', 'help'])(
    'uses Select1 for main menu button %s',
    (action) => {
      const sound = buttonSound({ screen: 'main-menu', action });
      expect(sound).toBe(SoundEffect.MENU_SELECT);
      expect(SOUND_FILES[sound!]).toBe('Select1.mp3');
    },
  );

  it.each([
    [undefined, undefined],
    ['level-up', undefined],
    ['level-up', 'confirm'],
    ['game', undefined],
    ['game', 'start'],
    ['game-over', 'menu'],
    ['help', undefined],
    ['help', 'help'],
    ['main-menu-other', 'start'],
  ])('does not add a click to button action %s / %s outside the main menu', (screen, action) => {
    expect(buttonSound({ screen, action })).toBeNull();
  });

  it('retains Select2 exclusively for the help back button', () => {
    expect(buttonSound({ screen: 'help', action: 'back' })).toBe(SoundEffect.MENU_BACK);
    expect(SOUND_FILES[SoundEffect.MENU_BACK]).toBe('Select2.mp3');
    expect(buttonSound({ screen: 'level-up', action: 'back' })).toBeNull();
  });

  it('keeps talent selection, buying and selling items silent', () => {
    const session = new GameSession('normal', () => 0.999999, { coins: 1000 });
    expect(session.upgradeTalent('hunterMastery')).toBe(true);
    expect(session.buyItem('c046')).toBe(true);
    expect(session.sellItem(0)).toBe(true);
    expect(sounds(session)).toEqual([]);
    expect(buttonSound({ screen: 'level-up' })).toBeNull();
  });
});
