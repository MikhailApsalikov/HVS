import type { DifficultyConfig } from './types.js';
import { normalConfig } from './normal.js';

export const easyConfig: DifficultyConfig = {
  ...normalConfig,
  coinsPerSec: 0.1,
  spiderSpeedBase: 0.07,
  spiderSpeedStep: 0.003,
  spiderDamageBase: 12,
  spiderDamageStep: 1.5,
  spawnP0: 0.00055,
  spawnDP: 0.000035,
};
