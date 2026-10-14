import { DEBUFFS } from '../../content/debuffs.js';
import { SPIDERS } from '../../content/spiders.js';
import type { GameState } from '../model/GameState.js';

export function poisonDuration(level: number): number {
  return (
    DEBUFFS.poison.duration +
    DEBUFFS.poison.durationPerLevel * Math.max(0, level - SPIDERS.poisonous.unlockLevel + 1)
  );
}

export function poisonArmorPercent(state: Pick<GameState, 'level' | 'poisonDamage'>): number {
  return Math.min(
    DEBUFFS.poison.maxArmorReductionPercent,
    Math.max(0, state.level - SPIDERS.poisonous.unlockLevel + 1) *
      DEBUFFS.poison.armorPercentPerLevel *
      state.poisonDamage.length,
  );
}

export function goldIncomePercent(level: number): number {
  return Math.min(
    DEBUFFS.goldLock.maxIncomeReductionPercent,
    Math.max(0, level - SPIDERS.golden.unlockLevel + 1) * DEBUFFS.goldLock.incomePercentPerLevel,
  );
}
