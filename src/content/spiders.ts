import type { SpiderType, DifficultyConfig } from '../domain/types.js';

interface SpiderDefinition {
  readonly unlockLevel: number;
  readonly chanceKey?: keyof Pick<
    DifficultyConfig,
    | 'spiderChanceFat'
    | 'spiderChanceFast'
    | 'spiderChanceNinja'
    | 'spiderChanceBurner'
    | 'spiderChanceTank'
  >;
  readonly speedPercent: number;
  readonly damagePercent: number;
  readonly hits: number;
  readonly burnsEnergy?: boolean;
  readonly jumps?: boolean;
}

export const SPIDERS: Readonly<Record<SpiderType, SpiderDefinition>> = {
  normal: { unlockLevel: 1, speedPercent: 0, damagePercent: 0, hits: 1 },
  fat: {
    unlockLevel: 10,
    chanceKey: 'spiderChanceFat',
    speedPercent: 0,
    damagePercent: 0,
    hits: 2,
  },
  fast: {
    unlockLevel: 20,
    chanceKey: 'spiderChanceFast',
    speedPercent: 200,
    damagePercent: -50,
    hits: 1,
  },
  ninja: {
    unlockLevel: 35,
    chanceKey: 'spiderChanceNinja',
    speedPercent: 0,
    damagePercent: 0,
    hits: 1,
    jumps: true,
  },
  // Preserve the old game's effective 1% HP damage; previously applied twice as 0.1 × 0.1.
  burner: {
    unlockLevel: 5,
    chanceKey: 'spiderChanceBurner',
    speedPercent: 0,
    damagePercent: -99,
    hits: 1,
    burnsEnergy: true,
  },
  tank: {
    unlockLevel: 15,
    chanceKey: 'spiderChanceTank',
    speedPercent: -40,
    damagePercent: 900,
    hits: 1,
  },
};
export const SPECIAL_SPIDER_ORDER: readonly SpiderType[] = [
  'ninja',
  'fast',
  'tank',
  'fat',
  'burner',
];
