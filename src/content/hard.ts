import type { DifficultyConfig } from '../domain/types.js';
import { normalConfig } from './normal.js';

export const hardConfig: DifficultyConfig = {
  ...normalConfig,
  armorEffectiveness: 1,
  coinsPerSec: 7,
  startingCoins: 150,
  spiderSpeedBase: 0.09,
  spiderSpeedStep: 0.005,
  spiderDamageBase: 20,
  spiderDamageGrowth: 0.1,
  spawnP0: 0.000585,
  spawnDP: 0.0000585,
};
