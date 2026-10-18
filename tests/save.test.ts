import { describe, expect, it } from 'vitest';
import { parseSave, restore, snapshot } from '../src/domain/save.js';
import { GameSession } from '../src/domain/GameSession.js';
import { ITEM_MAP } from '../src/content/items.js';
import { TALENT_ORDER } from '../src/content/talents.js';
import { SAVE_KEY, SaveSystem } from '../src/infrastructure/storage/SaveSystem.js';
import { game, advance, addNearbySpider as addSpider, MemoryStorage } from './helpers.js';

describe('saves and migration', () => {
  it.each([2, 5])('migrates version 23 ranks, fixed flight and titan rank %i once', (rank) => {
    const session = game(55);
    session.shootLane(0);
    const saved = snapshot(session);
    const previous = {
      ...saved,
      abilities: saved.abilities.slice(0, 12),
      version: 23,
      talents: [
        { id: 'criticalShot', rank: 7 },
        { id: 'piercingReward', rank: 8 },
        { id: 'titanPreparation', rank },
        { id: 'learningFromMistakes', rank: 1 },
      ],
      state: {
        ...saved.state,
        killingStreakStacks: rank * 4,
        killingStreakDecayProgress: 0.5,
        fatalShieldTimer: 4,
        exhaustionTimer: 299,
      },
      arrows: saved.arrows.map((arrow) => ({ ...arrow, speed: 10 })),
    };
    const parsed = parseSave(previous)!;
    expect(parsed).not.toBeNull();
    const loaded = restore(parsed);
    expect(loaded.talents.getRank('criticalShot')).toBe(5);
    expect(loaded.talents.getRank('piercingReward')).toBe(7);
    expect(loaded.state.pendingTalentPoints).toBe(saved.state.pendingTalentPoints + 3);
    expect(loaded.state.killingStreakStacks).toBe(rank * 2);
    expect(loaded.state.killingStreakDecayProgress).toBe(0.5);
    expect(loaded.state.fatalShieldTimer).toBe(1);
    expect([...loaded.state.arrows.values()][0]).toMatchObject({ speed: 0.333333, y: 1 });
    const current = snapshot(loaded);
    expect(snapshot(restore(parseSave(current)!))).toEqual(current);
  });

  it('refunds retired armor and primary attribute ranks from version 23 exactly once', () => {
    const previous = {
      ...snapshot(game(20)),
      abilities: snapshot(game(20)).abilities.slice(0, 12),
      version: 23,
      talents: [
        { id: 'magicArmor', rank: 7 },
        { id: 'improvedEndurance', rank: 7 },
        { id: 'improvedAgility', rank: 7 },
        { id: 'improvedIntellect', rank: 7 },
      ],
    };
    expect(previous.version).toBe(23);
    const parsed = parseSave(previous)!;
    expect(parsed).not.toBeNull();
    const loaded = restore(parsed, () => 0.999999);
    for (const id of [
      'magicArmor',
      'improvedEndurance',
      'improvedAgility',
      'improvedIntellect',
    ] as const)
      expect(loaded.talents.getRank(id)).toBe(5);
    expect(loaded.state.pendingTalentPoints).toBe(previous.state.pendingTalentPoints + 8);
    expect(loaded.state.level).toBe(20);
    loaded.state.phase = 'levelUp';
    expect(loaded.upgradeTalent('magicArmor')).toBe(false);
    const saved = snapshot(loaded);
    expect(saved.version).toBe(26);
    expect(saved.talents.find(({ id }) => id === 'magicArmor')?.rank).toBe(5);
    expect(snapshot(restore(parseSave(saved)!, () => 0.999999))).toEqual(saved);
  });

  it.each([19, 20, 21])(
    'migrates version %s poison duration while preserving its stacks and next tick',
    (version) => {
      const session = game(50);
      session.state.character.setModifiers('test:regen', [
        { stat: 'hpRegen', kind: 'percent', value: -100 },
      ]);
      session.refreshStats();
      const data = snapshot(session);
      const { hunterRewardTimer: _timer, ...previousState } = data.state;
      const parsed = parseSave({
        ...data,
        abilities: data.abilities.slice(0, version >= 17 ? 12 : data.abilities.length),
        version,
        state: {
          ...previousState,
          poisonTimer: 45,
          poisonTickTimer: 0.7,
          poisonDamage: [20, 40],
        },
      });
      expect(parsed).not.toBeNull();
      expect(parsed!.version).toBe(26);
      const loaded = restore(parsed!, () => 0.999999);
      expect(loaded.state).toMatchObject({
        hunterRewardTimer: 0,
        poisonTimer: 31.5,
        poisonTickTimer: 0.7,
        poisonDamage: [20, 40],
      });
      const hp = loaded.state.hp;
      const damage = loaded.state.stats['poison.tickDamage'];
      loaded.tick(0.7);
      expect(loaded.state.hp).toBeCloseTo(hp - damage);
      expect(loaded.state.poisonTickTimer).toBe(2);
      expect(loaded.state.poisonDamage).toEqual([20, 40]);
      const saved = snapshot(loaded);
      expect(snapshot(restore(parseSave(saved)!))).toEqual(saved);
    },
  );

  it.each([3, 17, 18, 19, 20, 21])(
    'ignores a supplied hunter reward timer in version %s',
    (version) => {
      const data = snapshot(game(50));
      const loaded = restore(
        parseSave({
          ...data,
          version,
          abilities: version === 3 ? data.abilities.slice(0, 8) : data.abilities.slice(0, 12),
          state: { ...data.state, hunterRewardTimer: 15 },
        })!,
      );
      expect(loaded.state.hunterRewardTimer).toBe(0);
    },
  );

  it('restores hunter reward bonuses until their timer expires or a cleanser removes them', () => {
    const session = game(50);
    session.talents.loadFromSave([{ id: 'hunterReward', rank: 5 }]);
    session.state.character.setModifiers('test:arena', [
      { stat: 'spawnProbability', kind: 'percent', value: -100 },
      { stat: 'shootCost', kind: 'percent', value: -100 },
    ]);
    session.refreshStats();
    const { armor, coinsPerSec } = session.state.stats;
    addSpider(session, 'golden', 0, 0.9);
    expect(session.shootLane(0)).toBe('shot');
    session.tick(0.01);
    session.tick(0.31);
    expect(session.state.hunterRewardTimer).toBe(15);
    session.tick(3.5);
    const saved = snapshot(session);
    const parsed = parseSave(JSON.parse(JSON.stringify(saved)))!;
    const loaded = restore(parsed, () => 0.999999);
    expect(snapshot(loaded)).toEqual(saved);
    expect(loaded.state.stats).toEqual(session.state.stats);
    expect(loaded.state.stats.coinsPerSec).toBeCloseTo(coinsPerSec * 1.5);
    expect(loaded.state.stats.armor).toBeCloseTo(armor * 1.5);
    loaded.tick(loaded.state.hunterRewardTimer);
    expect(loaded.state.hunterRewardTimer).toBe(0);
    expect(loaded.state.stats).toMatchObject({ armor, coinsPerSec });

    const cleansed = restore(parsed, () => 0.999999);
    addSpider(cleansed, 'cleanser', 0, 1, 0);
    cleansed.tick(0.001);
    expect(cleansed.state.hunterRewardTimer).toBe(0);
    expect(cleansed.state.stats).toMatchObject({ armor, coinsPerSec });
  });

  it.each([1, 7, 8, 10])(
    'migrates version 19 rank %s with one refund and the same earned streak fraction',
    (rank) => {
      const data = snapshot(game(50));
      const previous = {
        ...data,
        abilities: data.abilities.slice(0, 12),
        version: 19,
        talents: [
          { id: 'criticalShot', rank: 10 },
          { id: 'killingStreak', rank },
          { id: 'eagleEye', rank: 1 },
          { id: 'enthusiasm', rank: 5 },
        ],
        state: {
          ...data.state,
          killingStreakStacks: 2,
          killingStreakProgress: (20 - rank) * 0.75,
        },
      };
      const parsed = parseSave(previous)!;
      expect(parsed).not.toBeNull();
      expect(parsed.version).toBe(26);
      const loaded = restore(parsed, () => 0.999999);
      expect(loaded.talents.getRank('criticalShot')).toBe(5);
      expect(loaded.talents.getRank('killingStreak')).toBe(Math.min(rank, 8));
      expect(loaded.state.pendingTalentPoints).toBe(
        data.state.pendingTalentPoints + 5 + Math.max(0, rank - 8),
      );
      expect(loaded.state.killingStreakStacks).toBe(2);
      expect(loaded.state.killingStreakFraction).toBe(0.75);
      expect(loaded.state.isAbilityUnlocked('eagleEye')).toBe(true);
      expect(loaded.talents.getRank('enthusiasm')).toBe(5);
      const saved = snapshot(loaded);
      expect(snapshot(restore(parseSave(saved)!))).toEqual(saved);
      loaded.tick(loaded.state.killingStreakRemaining);
      expect(loaded.state.killingStreakStacks).toBe(3);
    },
  );

  it('rejects version 19 streak progress at the previous interval', () => {
    const data = snapshot(game(50));
    expect(
      parseSave({
        ...data,
        abilities: data.abilities.slice(0, 12),
        version: 19,
        talents: [{ id: 'killingStreak', rank: 10 }],
        state: { ...data.state, killingStreakProgress: 10 },
      }),
    ).toBeNull();
  });

  it('uses the last duplicate talent rank when migrating version 19 progress', () => {
    const data = snapshot(game(50));
    const loaded = restore(
      parseSave({
        ...data,
        abilities: data.abilities.slice(0, 12),
        version: 19,
        talents: [
          { id: 'killingStreak', rank: 1 },
          { id: 'killingStreak', rank: 10 },
        ],
        state: { ...data.state, killingStreakProgress: 5 },
      })!,
    );
    expect(loaded.talents.getRank('killingStreak')).toBe(8);
    expect(loaded.state.killingStreakFraction).toBe(0.5);
    expect(loaded.state.pendingTalentPoints).toBe(data.state.pendingTalentPoints + 2);
  });

  it('restores a higher-level start during talent selection and after entering combat', () => {
    const session = new GameSession('normal', () => 0.999999, { level: 50, coins: 1000 });
    expect(session.upgradeTalent('endurance')).toBe(true);
    expect(session.buyItem('c009')).toBe(true);
    const data = snapshot(session);
    const parsed = parseSave(JSON.parse(JSON.stringify(data)));
    expect(parsed).not.toBeNull();
    const loaded = restore(parsed!, () => 0.999999);
    expect(snapshot(loaded)).toEqual(data);
    expect(loaded.state.pendingTalentPoints).toBe(49);
    expect(loaded.confirmLevelUp()).toBe(false);
    for (let point = 0; point < 49; point++) {
      const id = TALENT_ORDER.find((talent) =>
        loaded.talents.canUpgrade(talent, loaded.state.level),
      );
      expect(id).toBeDefined();
      expect(loaded.upgradeTalent(id!)).toBe(true);
    }
    expect(loaded.confirmLevelUp()).toBe(true);
    expect(loaded.state.level).toBe(50);
    expect(loaded.state.phase).toBe('playing');
    loaded.tick(0.5);
    const playing = snapshot(loaded);
    expect(snapshot(restore(parseSave(playing)!, () => 0.999999))).toEqual(playing);
  });
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
    expect(loaded.talents.getRank('shieldBlock')).toBe(7);
    expect(loaded.state.stats).toMatchObject({ blockChance: 0.42, blockPower: 54 });
    expect(loaded.state.pendingTalentPoints).toBe(session.state.pendingTalentPoints + 5);
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
        inventory: ['c015', 'c015', 'missing', 'c009', 'c015', 'c009'],
        abilities: data.abilities.slice(0, version < 5 ? 8 : 9),
      })!;
      expect(parsed.version).toBe(26);
      const loaded = restore(parsed);
      expect(loaded.items.inventory).toEqual(['c015', 'c009']);
      expect(loaded.state.coins).toBe(
        data.state.coins + ITEM_MAP.get('c015')!.price * 2 + ITEM_MAP.get('c009')!.price,
      );
      expect(loaded.talents.getRank('healBoost')).toBe(2);
      expect(loaded.talents.branchPoints('defense')).toBe(2);
      loaded.state.phase = 'levelUp';
      expect(loaded.buyItem('c015')).toBe(false);
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
      inventory: ['c015', 'c015'],
    })!;
    const loaded = restore(data);
    expect(loaded.items.inventory).toEqual(['c015']);
    expect(loaded.state.coins).toBe(5 + ITEM_MAP.get('c015')!.price);
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
    expect(parsed.version).toBe(26);
    const loaded = restore(parsed);
    expect(loaded.state.stats).toMatchObject({
      endurance: 79,
      agility: 32,
      intellect: 34,
      maxHp: 490,
      armor: 158,
    });
    expect(loaded.state.hp).toBe(400);
    expect(loaded.state.coins).toBe(123);
    expect(loaded.state.energy).toBe(90);
    expect(loaded.state.levelTimerMax).toBe(32);
    expect(loaded.state.levelTimer).toBe(16);
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
    session.state.hp = 200;
    const loaded = restore(parseSave(snapshot(session))!);
    expect(loaded.state.hp).toBe(200);
    expect(loaded.state.maxHp).toBe(220);
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
      inventory: ['c009'],
    });
    expect(data).not.toBeNull();
    const loaded = restore(data!);
    expect(loaded.state.coins).toBe(123);
    expect(loaded.state.stats.energyRegen).toBe(10.54);
    expect(loaded.state.phase).toBe('levelUp');
    expect(loaded.state.maxHp).toBe(790);
    loaded.upgradeTalent('agility');
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
    ['hunterRewardTimer', undefined],
    ['hunterRewardTimer', null],
    ['hunterRewardTimer', -1],
    ['hunterRewardTimer', NaN],
    ['hunterRewardTimer', Infinity],
    ['hunterRewardTimer', 15.001],
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
