import type { Difficulty, DifficultyConfig } from '../config/types.js';
import { easyConfig } from '../config/easy.js';
import { normalConfig } from '../config/normal.js';
import { hardConfig } from '../config/hard.js';

export class ConfigManager {
  public getConfig(difficulty: Difficulty): DifficultyConfig {
    switch (difficulty) {
      case 'easy':
        return easyConfig;
      case 'normal':
        return normalConfig;
      case 'hard':
        return hardConfig;
    }
  }
}
