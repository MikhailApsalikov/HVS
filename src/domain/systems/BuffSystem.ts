import type { GameState } from '../model/GameState.js';
import { clearPlayerEffects } from '../model/PlayerEffect.js';
import { HUNTER_REWARD, type StatModifier } from '../rules/stats.js';

export function buffModifiers(state: GameState): StatModifier[] {
  return state.hunterRewardTimer > 0
    ? [
        {
          source: 'effect:hunterReward',
          stat: 'coinsPerSec',
          kind: 'percent',
          value: HUNTER_REWARD.incomePercent,
        },
        {
          source: 'effect:hunterReward',
          stat: 'armor',
          kind: 'percent',
          value: HUNTER_REWARD.armorPercent,
        },
      ]
    : [];
}

export function nextBuffBoundary(state: GameState): number {
  return state.hunterRewardTimer > 0 ? state.hunterRewardTimer : Infinity;
}

/** Returns whether an expiring buff requires resolved stats to be refreshed. */
export function tickBuffs(state: GameState, dt: number): boolean {
  if (state.hunterRewardTimer === 0) return false;
  state.hunterRewardTimer = Math.max(0, state.hunterRewardTimer - dt);
  return state.hunterRewardTimer === 0;
}

/** A cleanser removes temporary player buffs; ongoing attacks and spider debuffs stay active. */
export function clearPlayerBuffs(state: GameState): void {
  clearPlayerEffects(state, (effect) => effect.kind === 'buff' && effect.removableByCleanser);
}
