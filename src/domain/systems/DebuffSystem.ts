import { DEBUFFS } from '../../content/debuffs.js';
import { SPIDERS } from '../../content/spiders.js';
import type { GameState } from '../model/GameState.js';
import { clearPlayerEffects } from '../model/PlayerEffect.js';
import type { Spider } from '../model/Spider.js';
import {
  disorientationDuration,
  disorientationPercent,
  goldIncomePercent,
  poisonArmorPercent,
  poisonDuration,
} from '../rules/debuffs.js';
import type { Modifier } from '../rules/numbers.js';
import type { StatModifier } from '../rules/stats.js';

export function debuffModifiers(state: GameState): StatModifier[] {
  const effects: StatModifier[] = [];
  if (state.disorientationTimer > 0)
    effects.push({
      source: 'debuff:disorientation',
      stat: 'blockChance',
      kind: 'percent',
      value: -disorientationPercent(state.level, 'block'),
    });
  if (state.goldLockTimer > 0)
    effects.push({
      source: 'debuff:goldLock',
      stat: 'coinsPerSec',
      kind: 'percent',
      value: -goldIncomePercent(state.level),
    });
  if (state.healingReductionTimer > 0)
    effects.push({
      source: 'debuff:healingReduction',
      stat: 'healingReceived',
      kind: 'percent',
      value: -Math.min(
        DEBUFFS.healingReduction.maxHealingReductionPercent,
        Math.max(0, state.level - SPIDERS.fast.unlockLevel + 1) *
          DEBUFFS.healingReduction.healingPercentPerLevel,
      ),
    });
  if (state.poisonTimer > 0)
    effects.push(
      {
        source: 'debuff:poison',
        stat: 'armor',
        kind: 'percent',
        value: -poisonArmorPercent(state),
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

/** This penalty affects only the dodge chance contributed by agility. */
export function debuffAgilityDodgeModifiers(state: GameState): readonly Modifier[] {
  return state.disorientationTimer > 0
    ? [
        {
          source: 'debuff:disorientation',
          kind: 'percent',
          value: -disorientationPercent(state.level, 'agilityDodge'),
        },
      ]
    : [];
}

/** Called only after a breach actually removes health. */
export function applySpiderDebuff(state: GameState, spider: Spider): boolean {
  const duration = (base: number) => state.rules.value('spiderDebuffDuration', base);
  if (spider.type === 'golden') state.goldLockTimer = duration(DEBUFFS.goldLock.duration);
  else if (spider.type === 'ninja' && state.level >= DEBUFFS.disorientation.unlockLevel)
    state.disorientationTimer = duration(disorientationDuration(state.level));
  else if (spider.type === 'fast')
    state.healingReductionTimer = duration(
      DEBUFFS.healingReduction.duration + DEBUFFS.healingReduction.durationPerLevel * state.level,
    );
  else if (spider.type === 'poisonous') {
    if (state.poisonTimer === 0) state.poisonTickTimer = DEBUFFS.poison.interval;
    state.poisonTimer = duration(poisonDuration(state.level));
    state.poisonDamage = [...state.poisonDamage, spider.damage].slice(-DEBUFFS.poison.maxStacks);
  } else return false;
  return true;
}

export function clearSpiderDebuffs(state: GameState): void {
  clearPlayerEffects(state, (effect) => effect.kind === 'debuff' && effect.source === 'spider');
}

export function clearDebuffs(state: GameState): void {
  clearPlayerEffects(state, (effect) => effect.kind === 'debuff');
}

export function nextDebuffBoundary(state: GameState): number {
  return Math.min(
    ...[
      state.goldLockTimer,
      state.healingReductionTimer,
      state.disorientationTimer,
      state.poisonTimer,
      state.poisonTickTimer,
    ].filter((timer) => timer > 0),
  );
}

/** Session steps stop at every expiry and poison tick, including a tick exactly at expiry. */
export function tickDebuffs(state: GameState, dt: number): boolean {
  const wasGoldLocked = state.goldLockTimer > 0;
  const wasHealingReduced = state.healingReductionTimer > 0;
  const wasDisoriented = state.disorientationTimer > 0;
  const wasPoisoned = state.poisonTimer > 0;
  const remaining = (timer: number) => (timer - dt > 1e-9 ? timer - dt : 0);
  state.goldLockTimer = remaining(state.goldLockTimer);
  state.healingReductionTimer = remaining(state.healingReductionTimer);
  state.disorientationTimer = remaining(state.disorientationTimer);
  if (wasPoisoned) {
    state.poisonTimer = remaining(state.poisonTimer);
    state.poisonTickTimer = remaining(state.poisonTickTimer);
    if (state.poisonTickTimer === 0) {
      state.modifyHp(-Math.min(state.stats['poison.tickDamage'], Math.max(0, state.hp - 1)));
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
    (wasDisoriented && state.disorientationTimer === 0) ||
    (wasPoisoned && state.poisonTimer === 0)
  );
}
