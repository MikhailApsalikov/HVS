import { describe, expect, it } from 'vitest';
import { parseSave, restore, snapshot } from '../src/domain/save.js';
import { GameSession } from '../src/domain/GameSession.js';
import { ITEM_MAP } from '../src/content/items.js';
import { SAVE_KEY, SaveSystem } from '../src/infrastructure/storage/SaveSystem.js';
import { game, advance, addSpider, MemoryStorage } from './helpers.js';

describe('saves and migration', () => {
  it.each([5, 6])('refunds removed shield block ranks from version %s exactly once', (version) => {
    const session = game(40);
    const previous = {
      ...snapshot(session),
      version,
      abilities: snapshot(session).abilities.slice(0, 9),
      talents: [
        { id: 'shieldBlock', rank: 12 },
        { id: 'lastHope', rank: 1 },
        { id: 'hunterReward', rank: 2 },
      ],
    };
    const loaded = restore(parseSave(previous)!);
    expect(loaded.talents.getRank('shieldBlock')).toBe(8);
    expect(loaded.state.stats).toMatchObject({ blockChance: 0.64, blockPower: 50 });
    expect(loaded.state.pendingTalentPoints).toBe(session.state.pendingTalentPoints + 4);
    expect(loaded.state.isAbilityUnlocked('lastHope')).toBe(true);
    expect(loaded.talents.getRank('hunterReward')).toBe(2);
    expect(loaded.talents.getRank('greed')).toBe(0);
    loaded.state.phase = 'levelUp';
    expect(loaded.upgradeTalent('hunterReward')).toBe(false);
    expect(loaded.upgradeTalent('greed')).toBe(true);
    const saved = snapshot(loaded);
    expect(snapshot(restore(parseSave(saved)!))).toEqual(saved);
  });
  it.each([3, 4, 5, 6])(
    'normalizes version %s duplicate equipment and refunds each extra copy only once',
    (version) => {
      const session = game(30);
      const data = snapshot(session);
      const parsed = parseSave({
        ...data,
        version,
        talents: [
          { id: 'hunterArsenal', rank: 2 },
          { id: 'healBoost', rank: 2 },
        ],
        inventory: ['c001', 'c001', 'missing', 'c003', 'c001', 'c003'],
        abilities: data.abilities.slice(0, version < 5 ? 8 : 9),
      })!;
      expect(parsed.version).toBe(7);
      const loaded = restore(parsed);
      expect(loaded.items.inventory).toEqual(['c001', 'c003']);
      expect(loaded.state.coins).toBe(
        data.state.coins + ITEM_MAP.get('c001')!.price * 2 + ITEM_MAP.get('c003')!.price,
      );
      expect(loaded.talents.getRank('healBoost')).toBe(2);
      expect(loaded.talents.branchPoints('defense')).toBe(2);
      loaded.state.phase = 'levelUp';
      expect(loaded.buyItem('c001')).toBe(false);
      const saved = snapshot(loaded);
      expect(snapshot(restore(parseSave(saved)!))).toEqual(saved);
    },
  );

  it.each([1, 2])('refunds duplicate items in legacy version %s', (version) => {
    const data = parseSave({
      version,
      difficulty: 'normal',
      level: 1,
      hp: 100,
      energy: 100,
      coins: 5,
      pendingTalentPoints: 0,
      record: 1,
      talents: [],
      inventory: ['c001', 'c001'],
    })!;
    const loaded = restore(data);
    expect(loaded.items.inventory).toEqual(['c001']);
    expect(loaded.state.coins).toBe(5 + ITEM_MAP.get('c001')!.price);
    expect(snapshot(restore(parseSave(snapshot(loaded))!))).toEqual(snapshot(loaded));
  });
  it('migrates version 3 bases, equipment, branch ranks and timer without losing the run', () => {
    const session = game(10);
    const previous = {
      ...snapshot(session),
      version: 3,
      abilities: snapshot(session).abilities.slice(0, 8),
      character: { endurance: 0, agility: 0, intellect: 0 },
      talents: [{ id: 'rapidFire', rank: 2 }],
      inventory: ['c009'],
      state: {
        ...snapshot(session).state,
        hp: 400,
        energy: 90,
        coins: 123,
        levelTimerMax: 35,
        levelTimer: 17.5,
      },
    };
    const parsed = parseSave(previous)!;
    expect(parsed.version).toBe(7);
    const loaded = restore(parsed);
    expect(loaded.state.stats).toMatchObject({
      endurance: 104,
      agility: 32,
      intellect: 34,
      maxHp: 740,
      armor: 208,
    });
    expect(loaded.state.hp).toBe(400);
    expect(loaded.state.coins).toBe(123);
    expect(loaded.state.energy).toBe(90);
    expect(loaded.state.levelTimerMax).toBe(31);
    expect(loaded.state.levelTimer).toBe(15.5);
    expect(loaded.talents.getRank('rapidFire')).toBe(2);
    expect(loaded.talents.canUpgrade('rapidFire', 10)).toBe(false);
    expect(loaded.items.toSaveData()).toEqual(['c009']);
    expect(snapshot(restore(parseSave(snapshot(loaded))!))).toEqual(snapshot(loaded));
  });
  it('preserves earned version 3 primary bases and handles an exhausted zero-length timer', () => {
    const previous = {
      ...snapshot(game()),
      version: 3,
      abilities: snapshot(game()).abilities.slice(0, 8),
      character: { endurance: 10, agility: 4, intellect: 9 },
      state: { ...snapshot(game()).state, levelTimer: 0, levelTimerMax: 0 },
    };
    const loaded = restore(parseSave(previous)!);
    expect(loaded.state.stats).toMatchObject({ endurance: 37, agility: 27, intellect: 25 });
    expect(loaded.state.levelTimer).toBe(0);
  });
  it('preserves health supported by equipment when restoring current saves', () => {
    const session = new GameSession('normal');
    session.state.coins = 10000;
    session.buyItem('c009');
    session.state.hp = 400;
    const loaded = restore(parseSave(snapshot(session))!);
    expect(loaded.state.hp).toBe(400);
    expect(loaded.state.maxHp).toBe(470);
  });
  it('round-trips full running state, actors, cooldowns, resources and modifiers', () => {
    const session = game(50);
    session.state.character.setBase('intellect', 53);
    session.state.character.setModifiers('item', [
      { stat: 'intellect', kind: 'percent', value: 5 },
    ]);
    session.refreshStats();
    addSpider(session, 'ninja');
    session.shootLane(0);
    session.activateAbility('blizzard');
    advance(session, 0.1);
    const data = snapshot(session);
    const parsed = parseSave(JSON.parse(JSON.stringify(data)));
    expect(parsed).not.toBeNull();
    const loaded = restore(parsed!, () => 0.999999);
    expect(snapshot(loaded)).toEqual(data);
    advance(loaded, 0.1);
    advance(session, 0.1);
    expect(snapshot(loaded)).toEqual(snapshot(session));
  });
  it('preserves initial talent selection and spent points after reload', () => {
    const session = new GameSession('normal');
    session.upgradeTalent('endurance');
    const loaded = restore(parseSave(snapshot(session))!);
    expect(loaded.state.phase).toBe('levelUp');
    expect(loaded.state.initialTalentPick).toBe(true);
    expect(loaded.state.pendingTalentPoints).toBe(0);
    loaded.confirmLevelUp();
    expect(loaded.state.level).toBe(1);
  });
  it.each([1, 2])('migrates legacy version %s without adding starting money', (version) => {
    const data = parseSave({
      version,
      difficulty: 'normal',
      level: 20,
      hp: 400,
      energy: 80,
      coins: 123,
      pendingTalentPoints: 1,
      record: 21,
      talents: [{ id: 'tireless', rank: 2 }],
      inventory: ['c001'],
    });
    expect(data).not.toBeNull();
    const loaded = restore(data!);
    expect(loaded.state.coins).toBe(123);
    expect(loaded.state.stats.energyRegen).toBe(10.54);
    expect(loaded.state.phase).toBe('levelUp');
    expect(loaded.state.maxHp).toBe(640);
    loaded.upgradeTalent('tireless');
    loaded.confirmLevelUp();
    expect(loaded.state.level).toBe(21);
  });
  it('migrates a legacy running checkpoint and missing inventory', () => {
    const data = parseSave({
      version: 1,
      difficulty: 'easy',
      level: 1,
      hp: 500,
      energy: 100,
      coins: 5,
      pendingTalentPoints: 0,
      record: 1,
      talents: [],
    });
    expect(restore(data!).state.phase).toBe('playing');
    expect(data!.inventory).toEqual([]);
  });
  it.each([
    null,
    [],
    {},
    { version: 99 },
    { version: 3, difficulty: '__proto__' },
    { version: 2, difficulty: 'normal', level: 1 },
    { version: 3, difficulty: 'normal', state: {} },
  ])('rejects malformed saves %j', (invalid) => {
    expect(parseSave(invalid)).toBeNull();
  });
  it.each([
    ['level', -1],
    ['level', 1.5],
    ['hp', NaN],
    ['coins', Infinity],
    ['nextEntityId', 0],
    ['levelTimer', 10000],
    ['phase', 'unknown'],
    ['armageddonPhase', 'unknown'],
    ['freezeActive', true],
    ['initialTalentPick', 'yes'],
    ['coinAccumulator', 2],
    ['spawnAccumulator', 2],
  ])('rejects invalid state field %s = %s', (field, value) => {
    const data = structuredClone(snapshot(game()));
    Object.assign(data.state, { [field]: value });
    expect(parseSave(data)).toBeNull();
  });
  it('rejects invalid nested records and duplicate entity IDs', () => {
    const session = game();
    addSpider(session);
    const original = snapshot(session);
    for (const replacement of [
      { character: { endurance: 0, agility: -1, intellect: 0 } },
      { characterModifiers: [{ source: 'x', stat: 'agility', kind: 'percent', value: -200 }] },
      { archers: [] },
      { abilities: [] },
      { talents: [{ id: 'unknown', rank: 1 }] },
      { inventory: [3] },
      { spiders: [{ ...original.spiders[0], lane: 9 }] },
      { spiders: [original.spiders[0], original.spiders[0]] },
      { arrows: [{ id: 'x', lane: 0 }] },
    ])
      expect(parseSave({ ...original, ...replacement })).toBeNull();
  });

  it('rejects effects that overflow and entity counters that would overwrite the field', () => {
    const session = game();
    addSpider(session);
    const data = snapshot(session);
    expect(parseSave({ ...data, state: { ...data.state, nextEntityId: 1 } })).toBeNull();
    expect(
      parseSave({
        ...data,
        characterModifiers: [
          { source: 'a', stat: 'maxHp', kind: 'percent', value: Number.MAX_VALUE },
          { source: 'b', stat: 'maxHp', kind: 'percent', value: Number.MAX_VALUE },
        ],
      }),
    ).toBeNull();
  });
  it('ignores unexpected JSON fields instead of assigning them onto game objects', () => {
    const data = JSON.parse(JSON.stringify(snapshot(game())));
    data.state.config = 'corrupt';
    data.state.modifyHp = null;
    const loaded = restore(parseSave(data)!);
    expect(loaded.state.config.baseHp).toBe(100);
    expect(typeof loaded.state.modifyHp).toBe('function');
  });
});

describe('storage adapter', () => {
  it('saves, loads, tracks a record separately and clears the run', () => {
    const storage = new MemoryStorage();
    const saves = new SaveSystem(storage);
    expect(saves.hasSave()).toBe(false);
    expect(saves.getRecord()).toBe(0);
    const session = game();
    session.state.record = 20;
    expect(saves.save(session)).toBe(true);
    expect(saves.hasSave()).toBe(true);
    expect(saves.getRecord()).toBe(20);
    saves.clear();
    expect(saves.hasSave()).toBe(false);
    expect(saves.getRecord()).toBe(20);
    session.state.phase = 'gameOver';
    expect(saves.save(session)).toBe(true);
    expect(saves.hasSave()).toBe(false);
  });
  it('keeps corrupt/future saves intact for recovery', () => {
    const storage = new MemoryStorage();
    const saves = new SaveSystem(storage);
    storage.setItem(SAVE_KEY, '{bad json');
    expect(saves.load()).toBeNull();
    expect(storage.getItem(SAVE_KEY)).toBe('{bad json');
  });
  it('does not crash when browser storage is disabled or full', () => {
    const fail = () => {
      throw new Error('storage disabled');
    };
    const saves = new SaveSystem({ getItem: fail, setItem: fail, removeItem: fail });
    expect(saves.load()).toBeNull();
    expect(saves.hasSave()).toBe(false);
    expect(saves.save(game())).toBe(false);
    expect(saves.lastError).not.toBeNull();
    expect(() => saves.clear()).not.toThrow();
    expect(saves.getRecord()).toBe(0);
  });
});
