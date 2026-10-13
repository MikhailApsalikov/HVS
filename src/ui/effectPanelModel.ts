import type { PlayerEffect } from '../domain/model/PlayerEffect.js';

export const PLAYER_EFFECT_ROW_CAPACITY = 5;

export interface EffectPanelGroup {
  readonly visible: readonly PlayerEffect[];
  readonly overflow: readonly PlayerEffect[];
}

export function effectPanelGroups(
  effects: readonly PlayerEffect[],
): Record<PlayerEffect['kind'], EffectPanelGroup> {
  const group = (kind: PlayerEffect['kind']): EffectPanelGroup => {
    const matching = effects.filter((effect) => effect.kind === kind);
    return {
      visible: matching.slice(0, PLAYER_EFFECT_ROW_CAPACITY),
      overflow: matching.slice(PLAYER_EFFECT_ROW_CAPACITY),
    };
  };
  return { buff: group('buff'), debuff: group('debuff') };
}
