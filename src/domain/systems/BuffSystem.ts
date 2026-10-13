import type { GameState } from '../model/GameState.js';

/** A cleanser removes temporary player buffs; ongoing attacks and spider debuffs stay active. */
export function clearPlayerBuffs(state: GameState): void {
  state.prepTimer = 0;
  state.lastHopeTimer = 0;
  state.adrenalineTimer = 0;
  state.adrenalineShots = 0;
  state.eagleEyeTimer = 0;
  state.eagleEyeShots = 0;
  state.killingStreakStacks = 0;
  state.killingStreakProgress = 0;
  state.killingStreakDecayProgress = 0;
}
