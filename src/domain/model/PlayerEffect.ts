import { PLAYER_EFFECTS } from '../../content/playerEffects.js';
import { DEBUFFS } from '../../content/debuffs.js';
import type { GameState } from './GameState.js';

export type PlayerEffectId =
  | 'prep'
  | 'lastHope'
  | 'stand'
  | 'adrenaline'
  | 'eagleEye'
  | 'goldLock'
  | 'healingReduction'
  | 'poison'
  | 'antiAfk';
export type PlayerEffectKind = 'buff' | 'debuff';
export type PlayerEffectSource = 'ability' | 'spider' | 'inactivity';

export interface PlayerEffectMetadata {
  readonly name: string;
  readonly sprite: string;
  readonly kind: PlayerEffectKind;
  readonly source: PlayerEffectSource;
  readonly removableByCleanser: boolean;
}

export interface PlayerEffectDetails {
  readonly energyRegen: number;
  readonly blockChance: number;
  readonly blockPower: number;
  readonly shootCooldownReduction: number;
  readonly healingReceived: number;
  readonly armorPercent: number;
  readonly tickDamage: number;
  readonly tickInterval: number;
  readonly nextTick: number;
  readonly damagePercent: number;
}

/** A player status; timers and charges remain the authoritative session state. */
export interface PlayerEffect extends PlayerEffectMetadata {
  readonly id: PlayerEffectId;
  readonly remaining: number | null;
  /** Stack count or remaining shot charges; null for effects without a counter. */
  readonly stacks: number | null;
  readonly details?: Readonly<Partial<PlayerEffectDetails>>;
}

interface EffectState {
  readonly remaining: number | null;
  readonly stacks?: number;
  readonly details?: Readonly<Partial<PlayerEffectDetails>>;
}
interface EffectLifecycle {
  readonly read: (state: GameState) => EffectState;
  readonly clear: (state: GameState) => void;
}

const LIFECYCLES: Readonly<Record<PlayerEffectId, EffectLifecycle>> = {
  prep: {
    read: (state) => ({
      remaining: state.prepTimer,
      details: { energyRegen: state.stats['prep.energyRegen'] },
    }),
    clear: (state) => {
      state.prepTimer = 0;
    },
  },
  lastHope: {
    read: (state) => ({
      remaining: state.lastHopeTimer,
      details: {
        blockChance: state.stats['lastHope.blockChance'],
        blockPower: state.stats['lastHope.blockPower'],
      },
    }),
    clear: (state) => {
      state.lastHopeTimer = 0;
    },
  },
  stand: {
    read: (state) => ({ remaining: state.invulnerableTimer }),
    clear: (state) => {
      state.invulnerableTimer = 0;
    },
  },
  adrenaline: {
    read: (state) => ({
      remaining: state.adrenalineTimer,
      stacks: state.adrenalineShots,
      details: { shootCooldownReduction: state.stats['adrenaline.shootCooldownReduction'] },
    }),
    clear: (state) => {
      state.adrenalineTimer = 0;
      state.adrenalineShots = 0;
    },
  },
  eagleEye: {
    read: (state) => ({ remaining: state.eagleEyeTimer, stacks: state.eagleEyeShots }),
    clear: (state) => {
      state.eagleEyeTimer = 0;
      state.eagleEyeShots = 0;
    },
  },
  goldLock: {
    read: (state) => ({ remaining: state.goldLockTimer }),
    clear: (state) => {
      state.goldLockTimer = 0;
    },
  },
  healingReduction: {
    read: (state) => ({
      remaining: state.healingReductionTimer,
      details: { healingReceived: state.stats.healingReceived },
    }),
    clear: (state) => {
      state.healingReductionTimer = 0;
    },
  },
  poison: {
    read: (state) => ({
      remaining: state.poisonTimer,
      stacks: state.poisonDamage.length,
      details: {
        armorPercent: DEBUFFS.poison.armorPercent,
        tickDamage: state.stats['poison.tickDamage'],
        tickInterval: DEBUFFS.poison.interval,
        nextTick: state.poisonTickTimer,
      },
    }),
    clear: (state) => {
      state.poisonTimer = 0;
      state.poisonTickTimer = 0;
      state.poisonDamage = [];
    },
  },
  antiAfk: {
    read: (state) => ({
      remaining: state.antiAfkRecoveryTimer > 0 ? state.antiAfkRecoveryTimer : null,
      stacks: state.antiAfkEnabled ? state.antiAfkStacks : 0,
      details: { damagePercent: state.antiAfkDamagePercent },
    }),
    clear: (state) => {
      state.antiAfkIdleTimer = 0;
      state.antiAfkStacks = 0;
      state.antiAfkRecoveryTimer = 0;
    },
  },
};

/** Stable effect order is shared by the HUD and removal rules. */
export function activePlayerEffects(state: GameState): readonly PlayerEffect[] {
  return (Object.keys(PLAYER_EFFECTS) as PlayerEffectId[]).flatMap((id) => {
    const effect = LIFECYCLES[id].read(state);
    if (effect.remaining === 0 || effect.stacks === 0) return [];
    return [{ id, ...PLAYER_EFFECTS[id], ...effect, stacks: effect.stacks ?? null }];
  });
}

/** Clears classified statuses, including any inactive bookkeeping for those statuses. */
export function clearPlayerEffects(
  state: GameState,
  matches: (effect: PlayerEffectMetadata) => boolean,
): void {
  for (const id of Object.keys(PLAYER_EFFECTS) as PlayerEffectId[])
    if (matches(PLAYER_EFFECTS[id])) LIFECYCLES[id].clear(state);
}
