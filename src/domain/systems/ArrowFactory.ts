import type { GameState } from '../model/GameState.js';
import { Arrow } from '../model/Arrow.js';
import type { RandomSource } from '../rules/random.js';
import { CRITICAL_SHOT_POWER, IMPROVED_CRITICAL_SHOT_POWER } from '../rules/stats.js';

interface ArrowOptions {
  readonly fromVolley: boolean;
  readonly guaranteedCritical?: boolean;
  readonly eagleEyeActive?: boolean;
  readonly canCrit?: boolean;
}

/** Curse is rolled once per attempted arrow, before critical rolls and electric charges. */
export function createArrow(
  state: GameState,
  random: RandomSource,
  lane: number,
  {
    fromVolley,
    guaranteedCritical = false,
    eagleEyeActive = state.eagleEyeActive,
    canCrit = true,
  }: ArrowOptions,
): Arrow | null {
  if (state.stats.curseFailureChance > 0 && random() < state.stats.curseFailureChance) return null;
  const criticalChance = canCrit ? state.rules.criticalShotChance() : 0;
  const critical = guaranteedCritical || (criticalChance > 0 && random() < criticalChance);
  const improvedChance = state.rules.improvedCriticalShotChance(eagleEyeActive);
  const improved = critical && improvedChance > 0 && random() < improvedChance;
  return chargeArrow(
    state,
    new Arrow(
      state.newId('arrow'),
      lane,
      state.stats.arrowSpeed,
      fromVolley,
      critical,
      improved ? IMPROVED_CRITICAL_SHOT_POWER : critical ? CRITICAL_SHOT_POWER : 1,
    ),
  );
}

export function chargeArrow(state: GameState, arrow: Arrow): Arrow {
  if (state.lightningCharges[arrow.lane]) {
    state.lightningCharges[arrow.lane] -= 1;
    arrow.lightningJumps = state.stats['lightningArrows.jumps'];
    arrow.lightningDelay = state.stats['lightningArrows.delay'];
  }
  return arrow;
}
