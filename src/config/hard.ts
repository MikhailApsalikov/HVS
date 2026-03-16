import type { DifficultyConfig } from './types.js';
import { normalConfig } from './normal.js';

export const hardConfig: DifficultyConfig = {
  ...normalConfig,
  baseHp: 400,
  coinsPerSec: 3,
  spiderSpeedBase: 0.09,
  spiderSpeedStep: 0.005,
  spiderDamageBase: 18,
  spiderDamageStep: 2.5,
  spawnP0: 0.005,
  spawnDP: 0.00025,
};
