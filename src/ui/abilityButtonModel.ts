import type { GameState } from '../domain/model/GameState.js';
import type { AbilityId } from '../domain/types.js';
import { ABILITIES } from '../content/abilities.js';

export function abilityButtonAvailability(
  state: Pick<GameState, 'isAbilityUnlocked' | 'exhaustionTimer'>,
  id: AbilityId,
): { hidden: boolean; locked: boolean } {
  const unlearned = !state.isAbilityUnlocked(id);
  return {
    hidden: Boolean(ABILITIES[id].talent) && unlearned,
    locked: unlearned || (id === 'stand' && state.exhaustionTimer > 0),
  };
}
