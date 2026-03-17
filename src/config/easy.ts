import type { DifficultyConfig } from './types.js';
import { normalConfig } from './normal.js';

export const easyConfig: DifficultyConfig = {
  ...normalConfig,
  coinsPerSec: 0.1,
  startingCoins: 50,
  spiderSpeedBase: 0.07,
  spiderSpeedStep: 0.003,
  spiderDamageBase: 20,
  spiderDamageStep: 5,
  spawnP0: 0.0006,
  spawnDP: 0.000035,
};
