import type { GameState } from '../domain/model/GameState.js';
import { MusicTrack } from '../infrastructure/audio/catalog.js';

export function musicForState(
  state: Pick<GameState, 'phase' | 'criticalHealthReached'>,
): MusicTrack | null {
  switch (state.phase) {
    case 'menu':
      return MusicTrack.MAIN_MENU;
    case 'levelUp':
      return MusicTrack.TALENT_SCREEN;
    case 'paused':
      return MusicTrack.FREEZE;
    case 'playing':
      return state.criticalHealthReached ? MusicTrack.CRITICAL_HEALTH : MusicTrack.GAMEPLAY;
    case 'gameOver':
      return null;
  }
}
