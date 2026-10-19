import { PLAYER_EFFECTS } from '../../content/playerEffects.js';
import { DEBUFFS } from '../../content/debuffs.js';
import { HUNTER_REWARD, MASOCHISM } from '../rules/stats.js';
import { disorientationPercent, goldIncomePercent, poisonArmorPercent } from '../rules/debuffs.js';
import type { GameState } from './GameState.js';

export type PlayerEffectId =
  | 'prep'
  | 'lastHope'
  | 'stand'
  | 'lightningShield'
  | 'masochism'
  | 'learningShield'
  | 'fatalShield'
  | 'exhaustion'
  | 'adrenaline'
  | 'eagleEye'
  | 'hunterReward'
  | 'goldLock'
  | 'healingReduction'
  | 'poison'
  | 'disorientation'
  | 'stun'
  | 'antiAfk';
export type PlayerEffectKind = 'buff' | 'debuff';
export type PlayerEffectSource = 'ability' | 'talent' | 'spider' | 'inactivity';

export interface PlayerEffectMetadata {
  readonly name: string;
  readonly sprite: string;
  readonly kind: PlayerEffectKind;
  readonly source: PlayerEffectSource;
  readonly removableByCleanser: boolean;
  readonly undispellable?: boolean;
  readonly ignoresMagicArmor?: boolean;
}

export interface PlayerEffectDetails {
  readonly energyRegen: number;
  readonly absorption: number;
  readonly agility: number;
  readonly blockChance: number;
  readonly blockPower: number;
  readonly shootCooldownReduction: number;
  readonly healingReceived: number;
  readonly armorPercent: number;
  readonly incomePercent: number;
  readonly tickDamage: number;
  readonly tickInterval: number;
  readonly nextTick: number;
  readonly damagePercent: number;
  readonly blockReductionPercent: number;
  readonly agilityDodgeReductionPercent: number;
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
  lightningShield: {
    read: (state) => ({
      remaining: state.lightningShieldTimer,
      details: { absorption: state.lightningShieldAbsorption },
    }),
    clear: (state) => {
      state.lightningShieldTimer = 0;
      state.lightningShieldAbsorption = 0;
    },
  },
  masochism: {
    read: (state) => ({
      remaining: state.masochismTimer,
      details: { agility: state.masochismRank * MASOCHISM.agilityPerRank },
    }),
    clear: (state) => {
      state.masochismTimer = 0;
    },
  },
  learningShield: {
    read: (state) => ({ remaining: state.learningShieldTimer }),
    clear: (state) => {
      state.learningShieldTimer = 0;
    },
  },
  fatalShield: {
    read: (state) => ({ remaining: state.fatalShieldTimer }),
    clear: (state) => {
      state.fatalShieldTimer = 0;
    },
  },
  exhaustion: {
    read: (state) => ({ remaining: state.exhaustionTimer }),
    clear: (state) => {
      state.exhaustionTimer = 0;
    },
  },
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
  hunterReward: {
    read: (state) => ({
      remaining: state.hunterRewardTimer,
      details: {
        incomePercent: HUNTER_REWARD.incomePercent,
        armorPercent: HUNTER_REWARD.armorPercent,
      },
    }),
    clear: (state) => {
      state.hunterRewardTimer = 0;
    },
  },
  goldLock: {
    read: (state) => ({
      remaining: state.goldLockTimer,
      details: {
        incomePercent: -goldIncomePercent(state.level, state.stats.spiderDebuffResistance),
      },
    }),
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
        armorPercent: -poisonArmorPercent(state, state.stats.spiderDebuffResistance),
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
  disorientation: {
    read: (state) => ({
      remaining: state.disorientationTimer,
      details: {
        blockReductionPercent: disorientationPercent(
          state.level,
          'block',
          state.stats.spiderDebuffResistance,
        ),
        agilityDodgeReductionPercent: disorientationPercent(
          state.level,
          'agilityDodge',
          state.stats.spiderDebuffResistance,
        ),
      },
    }),
    clear: (state) => {
      state.disorientationTimer = 0;
    },
  },
  stun: {
    read: (state) => ({ remaining: state.stunTimer }),
    clear: (state) => {
      state.stunTimer = 0;
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
    if (!(PLAYER_EFFECTS[id] as PlayerEffectMetadata).undispellable && matches(PLAYER_EFFECTS[id]))
      LIFECYCLES[id].clear(state);
}
