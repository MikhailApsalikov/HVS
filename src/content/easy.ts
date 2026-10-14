import type { DifficultyConfig } from '../domain/types.js';
import { SPIDER_DAMAGE, SPIDER_SPEED } from '../domain/rules/stats.js';
import { normalConfig } from './normal.js';

export const easyConfig: DifficultyConfig = {
  ...normalConfig,
  easyRegeneration: true,
  armorEffectiveness: 2,
  coinsPerSec: 1,
  startingCoins: 0,
  spiderSpeedBase: SPIDER_SPEED.easy.base,
  spiderSpeedStep: SPIDER_SPEED.easy.perLevel,
  spiderDamageBase: SPIDER_DAMAGE.base,
  spiderDamageGrowth: SPIDER_DAMAGE.growth.easy,
  spawnP0: 0.0006,
  spawnDP: 0.00002835,
};
