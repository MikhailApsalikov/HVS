import type { DifficultyConfig } from '../domain/types.js';
import { SPIDER_DAMAGE, SPIDER_SPEED } from '../domain/rules/stats.js';
import { normalConfig } from './normal.js';

export const hardConfig: DifficultyConfig = {
  ...normalConfig,
  armorEffectiveness: 1,
  coinsPerSec: 7,
  startingCoins: 2000,
  spiderSpeedBase: SPIDER_SPEED.hard.base,
  spiderSpeedStep: SPIDER_SPEED.hard.perLevel,
  spiderDamageBase: SPIDER_DAMAGE.base,
  spiderDamageGrowth: SPIDER_DAMAGE.growth.hard,
  spawnP0: 0.00065,
  spawnDP: 0.00005265,
};
