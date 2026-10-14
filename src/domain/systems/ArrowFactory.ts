import type { GameState } from '../model/GameState.js';
import { Arrow } from '../model/Arrow.js';
import type { RandomSource } from '../rules/random.js';
import { CRITICAL_SHOT_POWER, IMPROVED_CRITICAL_SHOT_POWER } from '../rules/stats.js';

/** Ability waves use the same critical rolls, without spending archer buff charges. */
export function createArrow(
  state: GameState,
  random: RandomSource,
  lane: number,
  fromVolley: boolean,
  guaranteedCritical = false,
  eagleEyeActive = state.eagleEyeActive,
): Arrow {
  const criticalChance = state.rules.criticalShotChance();
  const critical = guaranteedCritical || (criticalChance > 0 && random() < criticalChance);
  const improvedChance = state.rules.improvedCriticalShotChance(eagleEyeActive);
  const improved = critical && improvedChance > 0 && random() < improvedChance;
  return new Arrow(
    state.newId('arrow'),
    lane,
    state.stats.arrowSpeed,
    fromVolley,
    critical,
    improved ? IMPROVED_CRITICAL_SHOT_POWER : critical ? CRITICAL_SHOT_POWER : 1,
  );
}
