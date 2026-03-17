import type { DifficultyConfig } from './types.js';
import { normalConfig } from './normal.js';

export const hardConfig: DifficultyConfig = {
  ...normalConfig,
  coinsPerSec: 0.7,
  startingCoins: 250,
  spiderSpeedBase: 0.09,
  spiderSpeedStep: 0.005,
  spiderDamageBase: 20,
  spiderDamageStep: 9,
  spawnP0: 0.00065,
  spawnDP: 0.000065,
};
