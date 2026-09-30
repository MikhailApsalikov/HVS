import { DEBUFFS } from '../../content/debuffs.js';
import type { GameState } from '../model/GameState.js';
import type { Spider } from '../model/Spider.js';
import type { StatModifier } from '../rules/stats.js';

export function debuffModifiers(state: GameState): StatModifier[] {
  const effects: StatModifier[] = [];
  if (state.goldLockTimer > 0)
    effects.push({
      source: 'debuff:goldLock',
      stat: 'coinsPerSec',
      kind: 'percent',
      value: DEBUFFS.goldLock.incomePercent,
    });
  if (state.healingReductionTimer > 0)
    effects.push({
      source: 'debuff:healingReduction',
      stat: 'healingReceived',
      kind: 'percent',
      value: DEBUFFS.healingReduction.healingPercent,
    });
  if (state.poisonTimer > 0)
    effects.push(
      {
        source: 'debuff:poison',
        stat: 'armor',
        kind: 'percent',
        value: DEBUFFS.poison.armorPercent,
      },
      {
        source: 'debuff:poison',
        stat: 'poison.tickDamage',
        kind: 'flat',
        value: state.poisonDamage.reduce((total, damage) => total + damage, 0),
      },
      {
        source: 'debuff:poison',
        stat: 'poison.tickDamage',
        kind: 'percent',
        value: DEBUFFS.poison.damagePercent - 100,
      },
    );
  return effects;
}

/** Called only after a breach actually removes health. */
export function applySpiderDebuff(state: GameState, spider: Spider): boolean {
  const duration = (base: number) => state.rules.value('spiderDebuffDuration', base);
  if (spider.type === 'golden') state.goldLockTimer = duration(DEBUFFS.goldLock.duration);
  else if (spider.type === 'fast')
    state.healingReductionTimer = duration(
      DEBUFFS.healingReduction.duration + DEBUFFS.healingReduction.durationPerLevel * state.level,
    );
  else if (spider.type === 'poisonous') {
    if (state.poisonTimer === 0) state.poisonTickTimer = DEBUFFS.poison.interval;
    state.poisonTimer = duration(DEBUFFS.poison.duration);
    state.poisonDamage = [...state.poisonDamage, spider.damage].slice(-DEBUFFS.poison.maxStacks);
  } else return false;
  return true;
}

export function clearDebuffs(state: GameState): void {
  state.goldLockTimer = 0;
  state.healingReductionTimer = 0;
  state.poisonTimer = 0;
  state.poisonTickTimer = 0;
  state.poisonDamage = [];
  state.antiAfkIdleTimer = 0;
  state.antiAfkStacks = 0;
  state.antiAfkRecoveryTimer = 0;
}

export function nextDebuffBoundary(state: GameState): number {
  return Math.min(
    ...[
      state.goldLockTimer,
      state.healingReductionTimer,
      state.poisonTimer,
      state.poisonTickTimer,
    ].filter((timer) => timer > 0),
  );
}

/** Session steps stop at every expiry and poison tick, including a tick exactly at expiry. */
export function tickDebuffs(state: GameState, dt: number): boolean {
  const wasGoldLocked = state.goldLockTimer > 0;
  const wasHealingReduced = state.healingReductionTimer > 0;
  const wasPoisoned = state.poisonTimer > 0;
  const remaining = (timer: number) => (timer - dt > 1e-9 ? timer - dt : 0);
  state.goldLockTimer = remaining(state.goldLockTimer);
  state.healingReductionTimer = remaining(state.healingReductionTimer);
  if (wasPoisoned) {
    state.poisonTimer = remaining(state.poisonTimer);
    state.poisonTickTimer = remaining(state.poisonTickTimer);
    if (state.poisonTickTimer === 0) {
      state.modifyHp(-state.stats['poison.tickDamage']);
      state.poisonTickTimer = DEBUFFS.poison.interval;
    }
    if (state.poisonTimer === 0) {
      state.poisonTickTimer = 0;
      state.poisonDamage = [];
    }
  }
  return (
    (wasGoldLocked && state.goldLockTimer === 0) ||
    (wasHealingReduced && state.healingReductionTimer === 0) ||
    (wasPoisoned && state.poisonTimer === 0)
  );
}
