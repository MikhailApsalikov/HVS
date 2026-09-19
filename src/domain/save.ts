import type { Difficulty, TalentId } from './types.js';
import type { PrimaryStatId, StatModifier } from './rules/stats.js';
import { GameSession } from './GameSession.js';
import type { GameState } from './model/GameState.js';
import { Spider } from './model/Spider.js';
import { Arrow } from './model/Arrow.js';
import { ABILITY_ORDER } from '../content/abilities.js';
import {
  ANTI_AFK,
  BEST_DEFENSE_COOLDOWN,
  CRITICAL_SHOT_POWER,
  IMPROVED_CRITICAL_SHOT_POWER,
  PRIMARY_STATS,
  STATS,
} from './rules/stats.js';
import { TALENTS } from '../content/talents.js';
import { SPIDERS } from '../content/spiders.js';
import { DIFFICULTIES } from '../content/difficulties.js';
import { WORLD } from './rules/world.js';
import type { RandomSource } from './rules/random.js';

const STATE_FIELDS = [
  'level',
  'hp',
  'energy',
  'coins',
  'pendingTalentPoints',
  'record',
  'phase',
  'initialTalentPick',
  'levelTimer',
  'levelTimerMax',
  'freezeActive',
  'invulnerableTimer',
  'lastHopeTimer',
  'bestDefenseCooldown',
  'adrenalineTimer',
  'adrenalineShots',
  'eagleEyeTimer',
  'eagleEyeShots',
  'antiAfkIdleTimer',
  'antiAfkStacks',
  'antiAfkRecoveryTimer',
  'blizzardTimer',
  'armageddonPhase',
  'armageddonTimer',
  'coinAccumulator',
  'spawnAccumulator',
  'nextEntityId',
] as const;
type SavedState = Pick<GameState, (typeof STATE_FIELDS)[number]>;
type SavedSpider = Pick<
  Spider,
  | 'id'
  | 'type'
  | 'lane'
  | 'speed'
  | 'damage'
  | 'hits'
  | 'jumpThreshold'
  | 'y'
  | 'previousY'
  | 'slowFactor'
  | 'slowTimer'
  | 'dying'
  | 'dyingTimer'
  | 'reachedCastle'
  | 'jumpsMade'
  | 'jumpLimit'
  | 'grantsKillEnergy'
>;
type SavedArrow = Pick<
  Arrow,
  'id' | 'lane' | 'speed' | 'fromVolley' | 'critical' | 'kills' | 'power' | 'y' | 'previousY'
>;
interface SavedCooldown {
  readonly duration: number;
  readonly remainingCooldown: number;
}
export interface SaveData {
  readonly version: 12;
  readonly difficulty: Difficulty;
  readonly state: SavedState;
  readonly talents: readonly { id: TalentId; rank: number }[];
  readonly inventory: readonly string[];
  readonly character: Readonly<Record<PrimaryStatId, number>>;
  readonly characterModifiers: readonly StatModifier[];
  readonly spiders: readonly SavedSpider[];
  readonly arrows: readonly SavedArrow[];
  readonly archers: readonly SavedCooldown[];
  readonly abilities: readonly SavedCooldown[];
}

export function snapshot(session: GameSession): SaveData {
  const state = session.state;
  const fields = Object.fromEntries(STATE_FIELDS.map((key) => [key, state[key]])) as SavedState;
  return {
    version: 12,
    difficulty: state.difficulty,
    state: fields,
    talents: session.talents.toSaveData(),
    inventory: session.items.toSaveData(),
    character: { ...state.character.base },
    characterModifiers: state.character.getModifiers(),
    spiders: [...state.spiders.values()].map((spider) => ({ ...spider })),
    arrows: [...state.arrows.values()].map((arrow) => ({ ...arrow })),
    archers: state.archers.map((cooldown) => ({ ...cooldown })),
    abilities: ABILITY_ORDER.map((id) => ({ ...state.getAbility(id) })),
  };
}

export function restore(data: SaveData, random?: RandomSource, testMode = false): GameSession {
  const session = new GameSession(data.difficulty, random, testMode);
  const state = session.state;
  state.level = data.state.level;
  state.lastHopeTimer = data.state.lastHopeTimer;
  state.adrenalineTimer = data.state.adrenalineTimer;
  state.adrenalineShots = data.state.adrenalineShots;
  state.eagleEyeTimer = data.state.eagleEyeTimer;
  state.eagleEyeShots = data.state.eagleEyeShots;
  state.antiAfkStacks = data.state.antiAfkStacks;
  const talentRefund = session.talents.loadFromSave(data.talents);
  state.character.restoreBase(data.character);
  for (const source of new Set(data.characterModifiers.map((modifier) => modifier.source))) {
    state.character.setModifiers(
      source,
      data.characterModifiers.filter((modifier) => modifier.source === source),
    );
  }
  session.refreshStats(false);
  const duplicateRefund = session.items.loadFromSave(data.inventory, state.stats.inventorySlots);
  session.refreshStats(false);
  Object.assign(state, Object.fromEntries(STATE_FIELDS.map((key) => [key, data.state[key]])));
  if (!state.antiAfkEnabled) {
    state.antiAfkIdleTimer = 0;
    state.antiAfkStacks = 0;
    state.antiAfkRecoveryTimer = 0;
  }
  const minimumDuration = STATS.levelDuration.policy.min!;
  if (state.levelTimerMax < minimumDuration) {
    if (state.levelTimer > 0) state.levelTimer += minimumDuration - state.levelTimerMax;
    state.levelTimerMax = minimumDuration;
  }
  if (testMode) {
    const duration = state.rules.levelDuration(state.level);
    state.levelTimer =
      state.levelTimerMax > 0 ? (duration * state.levelTimer) / state.levelTimerMax : 0;
    state.levelTimerMax = duration;
  }
  state.coins += duplicateRefund;
  state.pendingTalentPoints += talentRefund;
  state.modifyHp(0);
  state.modifyEnergy(0);
  for (const entry of data.spiders) {
    const spider = new Spider(
      entry.id,
      entry.type,
      entry.lane,
      entry.speed,
      entry.damage,
      entry.hits,
      entry.jumpThreshold,
      entry.jumpLimit,
    );
    for (const key of [
      'y',
      'previousY',
      'slowFactor',
      'slowTimer',
      'dying',
      'dyingTimer',
      'reachedCastle',
      'jumpsMade',
      'grantsKillEnergy',
    ] as const) {
      Object.assign(spider, { [key]: entry[key] });
    }
    state.spiders.set(spider.id, spider);
  }
  for (const entry of data.arrows) {
    const arrow = new Arrow(
      entry.id,
      entry.lane,
      entry.speed,
      entry.fromVolley,
      entry.critical,
      entry.power,
    );
    arrow.kills = entry.kills;
    arrow.y = entry.y;
    arrow.previousY = entry.previousY;
    state.arrows.set(arrow.id, arrow);
  }
  data.archers.forEach((entry, index) =>
    Object.assign(state.archers[index], {
      duration: entry.duration,
      remainingCooldown: entry.remainingCooldown,
    }),
  );
  data.abilities.forEach((entry, index) =>
    Object.assign(state.getAbility(ABILITY_ORDER[index]), {
      duration: entry.duration,
      remainingCooldown: entry.remainingCooldown,
    }),
  );
  if (state.adrenalineActive) for (const archer of state.archers) archer.start(0);
  return session;
}

type JsonObject = Record<string, unknown>;
const object = (value: unknown): value is JsonObject =>
  typeof value === 'object' && value !== null && !Array.isArray(value);
const number = (value: unknown): value is number =>
  typeof value === 'number' && Number.isFinite(value) && value >= 0;
const integer = (value: unknown): value is number => number(value) && Number.isSafeInteger(value);
const member = (value: unknown, options: object): value is string =>
  typeof value === 'string' && Object.hasOwn(options, value);
const arrayOf = (value: unknown, valid: (entry: unknown) => boolean): value is unknown[] =>
  Array.isArray(value) && value.length <= 100_000 && value.every(valid);
const cooldown = (entry: unknown) =>
  object(entry) &&
  number(entry.duration) &&
  number(entry.remainingCooldown) &&
  entry.remainingCooldown <= entry.duration;
const talent = (entry: unknown) =>
  object(entry) && member(entry.id, TALENTS) && integer(entry.rank);
const lane = (value: unknown) => integer(value) && value < WORLD.lanes;

/** Validate at the trust boundary. Bad/future saves are left intact in storage. */
export function parseSave(value: unknown): SaveData | null {
  try {
    const data = parseSaveUnchecked(value);
    // Structural validity also has to produce a usable set of game values.
    if (data) restore(data);
    return data;
  } catch {
    return null;
  }
}

function parseSaveUnchecked(value: unknown): SaveData | null {
  if (!object(value) || !member(value.difficulty, DIFFICULTIES)) return null;
  if (value.version === 1 || value.version === 2) return migrateLegacy(value);
  if (![3, 4, 5, 6, 7, 8, 9, 10, 11, 12].includes(value.version as number) || !object(value.state))
    return null;
  const state = value.state;
  if (
    (value.version as number) >= 10 &&
    (!number(state.antiAfkIdleTimer) ||
      state.antiAfkIdleTimer > ANTI_AFK.idleDuration ||
      !integer(state.antiAfkStacks) ||
      !number(state.antiAfkRecoveryTimer) ||
      state.antiAfkRecoveryTimer > ANTI_AFK.recoveryDuration ||
      (state.antiAfkRecoveryTimer > 0 && state.antiAfkStacks === 0))
  )
    return null;
  if (
    (value.version as number) >= 11 &&
    (!number(state.eagleEyeTimer) ||
      state.eagleEyeTimer > STATS['eagleEye.duration'].policy.max! ||
      !integer(state.eagleEyeShots) ||
      state.eagleEyeShots > STATS['eagleEye.shots'].policy.max! ||
      state.eagleEyeTimer > 0 !== state.eagleEyeShots > 0)
  )
    return null;
  const numeric = [
    'level',
    'hp',
    'energy',
    'coins',
    'pendingTalentPoints',
    'record',
    'levelTimer',
    'levelTimerMax',
    'invulnerableTimer',
    'blizzardTimer',
    'armageddonTimer',
    'coinAccumulator',
    'spawnAccumulator',
    'nextEntityId',
  ];
  if (!numeric.every((key) => number(state[key]))) return null;
  if ((value.version as number) >= 5 && !number(state.lastHopeTimer)) return null;
  if (
    (value.version as number) >= 8 &&
    (!number(state.bestDefenseCooldown) || state.bestDefenseCooldown > BEST_DEFENSE_COOLDOWN)
  )
    return null;
  if ((value.version as number) >= 7) {
    if (
      !number(state.adrenalineTimer) ||
      state.adrenalineTimer > STATS['adrenaline.duration'].policy.max! ||
      !integer(state.adrenalineShots) ||
      state.adrenalineShots > STATS['adrenaline.shots'].policy.max! ||
      state.adrenalineTimer > 0 !== state.adrenalineShots > 0
    )
      return null;
  }
  if (
    !['level', 'coins', 'pendingTalentPoints', 'record', 'nextEntityId'].every((key) =>
      integer(state[key]),
    )
  )
    return null;
  if (
    (state.level as number) < 1 ||
    (state.nextEntityId as number) < 1 ||
    (state.levelTimer as number) > (state.levelTimerMax as number)
  )
    return null;
  if (
    !['playing', 'paused', 'levelUp'].includes(String(state.phase)) ||
    !['none', 'charging', 'firing'].includes(String(state.armageddonPhase))
  )
    return null;
  if (typeof state.initialTalentPick !== 'boolean' || typeof state.freezeActive !== 'boolean')
    return null;
  if (
    (state.phase === 'paused') !== state.freezeActive ||
    (state.initialTalentPick && (state.phase !== 'levelUp' || state.level !== 1))
  )
    return null;
  if (
    (state.coinAccumulator as number) >= 1 ||
    (state.spawnAccumulator as number) >
      DIFFICULTIES[value.difficulty as Difficulty].spawnTickInterval
  )
    return null;
  if (
    !arrayOf(value.talents, talent) ||
    !arrayOf(value.inventory, (entry) => typeof entry === 'string')
  )
    return null;
  if (
    !object(value.character) ||
    !['endurance', 'agility', 'intellect'].every((key) =>
      number((value.character as JsonObject)[key]),
    )
  )
    return null;
  if (
    !arrayOf(
      value.characterModifiers,
      (entry) =>
        object(entry) &&
        typeof entry.source === 'string' &&
        member(entry.stat, STATS) &&
        ['flat', 'percent'].includes(String(entry.kind)) &&
        typeof entry.value === 'number' &&
        Number.isFinite(entry.value) &&
        (entry.kind !== 'percent' || entry.value >= -100),
    )
  )
    return null;
  if (
    !arrayOf(value.archers, cooldown) ||
    value.archers.length !== WORLD.lanes ||
    !arrayOf(value.abilities, cooldown) ||
    value.abilities.length !==
      ((value.version as number) >= 11
        ? ABILITY_ORDER.length
        : (value.version as number) >= 7
          ? 10
          : (value.version as number) >= 5
            ? 9
            : 8)
  )
    return null;
  if (
    !arrayOf(
      value.spiders,
      (entry) =>
        object(entry) &&
        typeof entry.id === 'string' &&
        member(entry.type, SPIDERS) &&
        lane(entry.lane) &&
        [
          'speed',
          'damage',
          'hits',
          'jumpThreshold',
          'y',
          'previousY',
          'slowFactor',
          'slowTimer',
        ].every((key) => number(entry[key])) &&
        integer(entry.hits) &&
        typeof entry.dyingTimer === 'number' &&
        Number.isFinite(entry.dyingTimer) &&
        ['dying', 'reachedCastle'].every((key) => typeof entry[key] === 'boolean') &&
        ((value.version as number) < 12
          ? typeof entry.hasJumped === 'boolean'
          : integer(entry.jumpsMade) &&
            integer(entry.jumpLimit) &&
            entry.jumpsMade <= entry.jumpLimit &&
            (entry.type === 'ninja' ? entry.jumpLimit >= 1 : entry.jumpLimit === 0) &&
            number(entry.jumpThreshold) &&
            entry.jumpThreshold <= WORLD.ninjaJumpMax &&
            entry.jumpThreshold >= WORLD.ninjaJumpMin) &&
        ((value.version as number) < 9 || typeof entry.grantsKillEnergy === 'boolean'),
    )
  )
    return null;
  if (
    !arrayOf(
      value.arrows,
      (entry) =>
        object(entry) &&
        typeof entry.id === 'string' &&
        lane(entry.lane) &&
        number(entry.speed) &&
        number(entry.y) &&
        number(entry.previousY) &&
        typeof entry.fromVolley === 'boolean' &&
        ((value.version as number) < 9 ||
          (typeof entry.critical === 'boolean' &&
            integer(entry.kills) &&
            (entry.critical
              ? !entry.fromVolley &&
                entry.kills <
                  ((value.version as number) >= 11
                    ? IMPROVED_CRITICAL_SHOT_POWER
                    : CRITICAL_SHOT_POWER)
              : entry.kills === 0))) &&
        ((value.version as number) < 11 ||
          (integer(entry.power) &&
            entry.power > 0 &&
            (entry.critical
              ? entry.power + (entry.kills as number) <= IMPROVED_CRITICAL_SHOT_POWER
              : entry.power === 1))),
    )
  )
    return null;
  const ids = [...value.spiders, ...value.arrows].map((entry) => (entry as JsonObject).id);
  if (new Set(ids).size !== ids.length) return null;
  if (
    ids.some(
      (id) =>
        typeof id !== 'string' ||
        !/^(spider|arrow)-\d+$/.test(id) ||
        Number(id.split('-')[1]) >= (state.nextEntityId as number),
    )
  )
    return null;
  if (value.version !== 12) {
    const previous = {
      ...value,
      version: 12,
      spiders: value.spiders.map((entry) => {
        const { hasJumped, ...spider } = entry as JsonObject;
        return {
          ...spider,
          jumpLimit: spider.type === 'ninja' ? 1 : 0,
          jumpsMade: spider.type === 'ninja' && hasJumped ? 1 : 0,
          grantsKillEnergy: (value.version as number) >= 9 ? spider.grantsKillEnergy : true,
        };
      }),
      arrows: value.arrows.map((entry) => ({
        ...(entry as JsonObject),
        critical: (value.version as number) >= 9 ? (entry as JsonObject).critical : false,
        kills: (value.version as number) >= 9 ? (entry as JsonObject).kills : 0,
        power:
          (value.version as number) >= 11
            ? (entry as JsonObject).power
            : (value.version as number) >= 9 && (entry as JsonObject).critical
              ? CRITICAL_SHOT_POWER - ((entry as JsonObject).kills as number)
              : 1,
      })),
      state: {
        ...state,
        lastHopeTimer: (value.version as number) >= 5 ? state.lastHopeTimer : 0,
        bestDefenseCooldown: (value.version as number) >= 8 ? state.bestDefenseCooldown : 0,
        adrenalineTimer: (value.version as number) >= 7 ? state.adrenalineTimer : 0,
        adrenalineShots: (value.version as number) >= 7 ? state.adrenalineShots : 0,
        eagleEyeTimer: (value.version as number) >= 11 ? state.eagleEyeTimer : 0,
        eagleEyeShots: (value.version as number) >= 11 ? state.eagleEyeShots : 0,
        antiAfkIdleTimer: (value.version as number) >= 10 ? state.antiAfkIdleTimer : 0,
        antiAfkStacks: (value.version as number) >= 10 ? state.antiAfkStacks : 0,
        antiAfkRecoveryTimer: (value.version as number) >= 10 ? state.antiAfkRecoveryTimer : 0,
      },
      abilities: [
        ...value.abilities,
        ...ABILITY_ORDER.slice(value.abilities.length).map(() => ({
          duration: 0,
          remainingCooldown: 0,
        })),
      ],
    } as unknown as SaveData;
    if (value.version !== 3) return snapshot(restore(previous));
    const character = Object.fromEntries(
      PRIMARY_STATS.map((id) => [id, previous.character[id] + STATS[id].base]),
    ) as Record<PrimaryStatId, number>;
    const session = restore({ ...previous, character });
    const duration = session.state.rules.levelDuration(session.state.level);
    session.state.levelTimer =
      previous.state.levelTimerMax > 0
        ? (duration * previous.state.levelTimer) / previous.state.levelTimerMax
        : 0;
    session.state.levelTimerMax = duration;
    return snapshot(session);
  }
  return value as unknown as SaveData;
}

function migrateLegacy(value: JsonObject): SaveData | null {
  if (
    !['level', 'coins', 'pendingTalentPoints', 'record'].every((key) => integer(value[key])) ||
    !number(value.hp) ||
    !number(value.energy) ||
    (value.level as number) < 1
  )
    return null;
  if (
    !arrayOf(value.talents, talent) ||
    (value.inventory !== undefined &&
      !arrayOf(value.inventory, (entry) => typeof entry === 'string'))
  )
    return null;
  const session = new GameSession(value.difficulty as Difficulty);
  session.state.level = value.level as number;
  const talentRefund = session.talents.loadFromSave(
    value.talents as { id: string; rank: number }[],
  );
  session.refreshStats(false);
  const duplicateRefund = session.items.loadFromSave(
    (value.inventory ?? []) as string[],
    session.state.stats.inventorySlots,
  );
  session.refreshStats(false);
  const state = session.state;
  state.level = value.level as number;
  state.coins = (value.coins as number) + duplicateRefund;
  state.hp = Math.min(value.hp, state.maxHp);
  state.energy = Math.min(value.energy, state.maxEnergy);
  state.pendingTalentPoints = (value.pendingTalentPoints as number) + talentRefund;
  state.record = Math.max(value.record as number, state.level);
  state.initialTalentPick = false;
  state.phase = state.pendingTalentPoints > 0 ? 'levelUp' : 'playing';
  state.levelTimer = state.levelTimerMax = state.rules.levelDuration(state.level);
  return snapshot(session);
}
