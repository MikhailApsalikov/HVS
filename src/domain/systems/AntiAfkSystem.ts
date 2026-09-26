import type { GameState } from '../model/GameState.js';
import { ANTI_AFK } from '../rules/stats.js';

/** Called only during gameplay; returns whether the damage modifier changed. */
export function tickAntiAfk(state: GameState, dt: number, occupiedAt: number): boolean {
  if (!state.antiAfkEnabled) return false;
  const previousStacks = state.antiAfkStacks;
  if (previousStacks > 0 && state.antiAfkRecoveryTimer === 0) return false;
  // Regeneration fills energy continuously: exclude the portion before it becomes full.
  const missing = state.maxEnergy - state.energy;
  const boostedEnergy = state.currentEnergyRegen * state.prepTimer;
  const refillTime =
    missing <= 0
      ? 0
      : missing <= boostedEnergy
        ? missing / state.currentEnergyRegen
        : state.stats.energyRegen > 0
          ? state.prepTimer + (missing - boostedEnergy) / state.stats.energyRegen
          : Infinity;
  if (missing > 0) state.antiAfkIdleTimer = 0;
  // Overlapping exemptions pause detection; recovery still uses the entire gameplay tick.
  const idleStartsAt = Math.max(
    refillTime,
    occupiedAt,
    state.invulnerableTimer,
    state.lastHopeTimer,
    state.adrenalineActive ? state.adrenalineTimer : 0,
  );
  const activationTime = idleStartsAt + ANTI_AFK.idleDuration - state.antiAfkIdleTimer;
  const activates = activationTime <= dt + 1e-9;
  if (state.antiAfkRecoveryTimer > 0) {
    // Re-entering AFK before removal preserves the stack count and cancels removal.
    if (activates && activationTime <= state.antiAfkRecoveryTimer + 1e-9) {
      state.antiAfkRecoveryTimer = 0;
      state.antiAfkIdleTimer = ANTI_AFK.idleDuration;
      return false;
    }
    const remaining = state.antiAfkRecoveryTimer - dt;
    state.antiAfkRecoveryTimer = remaining > 1e-9 ? remaining : 0;
    if (state.antiAfkRecoveryTimer === 0) state.antiAfkStacks = 0;
  }
  state.antiAfkIdleTimer = Math.min(
    ANTI_AFK.idleDuration,
    state.antiAfkIdleTimer + Math.max(0, dt - idleStartsAt),
  );
  if (activates) {
    state.antiAfkIdleTimer = ANTI_AFK.idleDuration;
    state.antiAfkStacks = 1;
  }
  return previousStacks !== state.antiAfkStacks;
}
