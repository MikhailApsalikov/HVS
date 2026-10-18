import type { GameState } from '../model/GameState.js';
import {
  LEARNING_FROM_MISTAKES,
  learningDamageThreshold,
  learningFatalShieldDuration,
} from '../rules/stats.js';
import { clearSpiderDebuffs } from './DebuffSystem.js';
import type { StatModifier } from '../rules/stats.js';

export function learningModifiers(state: GameState): StatModifier[] {
  return state.exhaustionTimer > 0
    ? [
        {
          source: 'debuff:exhaustion',
          stat: 'agility',
          kind: 'percent',
          value: -LEARNING_FROM_MISTAKES.exhaustionAgilityPercent,
        },
      ]
    : [];
}

/** Resolves fatal prevention before health is spent; the short shield follows a damaging hit. */
export function protectFromBreach(state: GameState, damage: number): number {
  if (
    damage <= 0 ||
    state.learningFromMistakesRank === 0 ||
    state.exhaustionTimer > 0 ||
    damage < state.hp
  )
    return damage;
  clearSpiderDebuffs(state);
  state.invulnerableTimer = 0;
  state.learningShieldTimer = 0;
  state.fatalShieldTimer = learningFatalShieldDuration(state.learningFromMistakesRank);
  state.exhaustionTimer = LEARNING_FROM_MISTAKES.exhaustionDuration;
  if (state.hp < 1) state.modifyHp(1 - state.hp);
  return Math.max(0, state.hp - 1);
}

export function shieldAfterBreach(state: GameState, damage: number): void {
  if (state.fatalShieldTimer > 0) {
    clearSpiderDebuffs(state);
    return;
  }
  if (
    state.learningFromMistakesRank === 0 ||
    state.exhaustionTimer > 0 ||
    state.learningShieldCooldown > 0 ||
    damage / state.maxHp < learningDamageThreshold(state.learningFromMistakesRank)
  )
    return;
  clearSpiderDebuffs(state);
  state.learningShieldTimer =
    LEARNING_FROM_MISTAKES.shieldDurationPerRank * state.learningFromMistakesRank;
  state.learningShieldCooldown = LEARNING_FROM_MISTAKES.shieldCooldown;
}

export function nextLearningBoundary(state: GameState): number {
  return Math.min(
    ...[
      state.invulnerableTimer,
      state.learningShieldTimer,
      state.fatalShieldTimer,
      state.learningShieldCooldown,
      state.exhaustionTimer,
    ].filter((timer) => timer > 0),
  );
}

export function tickLearningFromMistakes(state: GameState, dt: number): boolean {
  const exhausted = state.exhaustionTimer > 0;
  for (const key of [
    'learningShieldTimer',
    'fatalShieldTimer',
    'learningShieldCooldown',
    'exhaustionTimer',
  ] as const) {
    const remaining = state[key] - dt;
    state[key] = remaining > 1e-9 ? remaining : 0;
  }
  return exhausted && state.exhaustionTimer === 0;
}
