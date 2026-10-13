import type { GameState } from '../model/GameState.js';
import { clearPlayerEffects } from '../model/PlayerEffect.js';

/** A cleanser removes temporary player buffs; ongoing attacks and spider debuffs stay active. */
export function clearPlayerBuffs(state: GameState): void {
  clearPlayerEffects(state, (effect) => effect.kind === 'buff' && effect.removableByCleanser);
}
