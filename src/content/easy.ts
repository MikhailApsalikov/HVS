import type { DifficultyConfig } from '../domain/types.js';
import { normalConfig } from './normal.js';

export const easyConfig: DifficultyConfig = {
  ...normalConfig,
  armorEffectiveness: 2,
  coinsPerSec: 1,
  startingCoins: 50,
  spiderSpeedBase: 0.07,
  spiderSpeedStep: 0.003,
  spiderDamageBase: 20,
  spiderDamageGrowth: 0.06,
  spawnP0: 0.00054,
  spawnDP: 0.0000315,
};
