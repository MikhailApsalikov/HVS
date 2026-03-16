import type { Difficulty } from '../config/types.js';

export interface IGameEngine {
  startNewGame(difficulty: Difficulty): void;
  loadGame(): void;
}
