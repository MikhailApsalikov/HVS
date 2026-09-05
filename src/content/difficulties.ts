import type { Difficulty, DifficultyConfig } from '../domain/types.js';
import { easyConfig } from './easy.js';
import { normalConfig } from './normal.js';
import { hardConfig } from './hard.js';

export const DIFFICULTIES: Readonly<Record<Difficulty, DifficultyConfig>> = {
  easy: easyConfig,
  normal: normalConfig,
  hard: hardConfig,
};
