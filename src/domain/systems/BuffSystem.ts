import type { GameState } from '../model/GameState.js';
import { clearPlayerEffects } from '../model/PlayerEffect.js';
import { HUNTER_REWARD, MASOCHISM, type StatModifier } from '../rules/stats.js';

export function buffModifiers(state: GameState): StatModifier[] {
  return [
    ...(state.masochismTimer > 0
      ? [
          {
            source: 'effect:masochism',
            stat: 'agility' as const,
            kind: 'flat' as const,
            value: state.masochismRank * MASOCHISM.agilityPerRank,
          },
        ]
      : []),
    ...(state.hunterRewardTimer > 0
      ? [
          {
            source: 'effect:hunterReward',
            stat: 'coinsPerSec' as const,
            kind: 'percent' as const,
            value: HUNTER_REWARD.incomePercent,
          },
          {
            source: 'effect:hunterReward',
            stat: 'armor' as const,
            kind: 'percent' as const,
            value: HUNTER_REWARD.armorPercent,
          },
        ]
      : []),
  ];
}

export function nextBuffBoundary(state: GameState): number {
  return Math.min(
    ...[
      state.hunterRewardTimer,
      state.masochismTimer,
      state.lightningShieldTimer,
      state.lightningShieldProcCooldown,
    ].filter((timer) => timer > 0),
  );
}

/** Returns whether an expiring buff requires resolved stats to be refreshed. */
export function tickBuffs(state: GameState, dt: number): boolean {
  let changed = false;
  for (const field of [
    'hunterRewardTimer',
    'masochismTimer',
    'lightningShieldTimer',
    'lightningShieldProcCooldown',
  ] as const) {
    if (state[field] === 0) continue;
    state[field] = state[field] - dt > 1e-9 ? state[field] - dt : 0;
    if (state[field] === 0) changed = true;
  }
  if (state.lightningShieldTimer === 0) state.lightningShieldAbsorption = 0;
  return changed;
}

/** A cleanser removes temporary player buffs; ongoing attacks and spider debuffs stay active. */
export function clearPlayerBuffs(state: GameState): void {
  clearPlayerEffects(state, (effect) => effect.kind === 'buff' && effect.removableByCleanser);
}
