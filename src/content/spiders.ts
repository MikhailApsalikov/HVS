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
  readonly chanceGrowth?: { readonly levels: number; readonly percent: number };
  readonly burnsEnergy?: boolean;
  readonly jumpLevelStep?: number;
}

export const SPIDERS: Readonly<Record<SpiderType, SpiderDefinition>> = {
  normal: { unlockLevel: 1, speedPercent: 0, damagePercent: 0, hits: 1 },
  fat: {
    unlockLevel: 10,
    chanceKey: 'spiderChanceFat',
    chanceGrowth: { levels: 25, percent: 1 },
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
    chanceGrowth: { levels: 35, percent: 1 },
    speedPercent: 0,
    damagePercent: 0,
    hits: 1,
    jumpLevelStep: 35,
  },
  burner: {
    unlockLevel: 5,
    chanceKey: 'spiderChanceBurner',
    chanceGrowth: { levels: 20, percent: 1 },
    speedPercent: 0,
    damagePercent: -50,
    hits: 1,
    burnsEnergy: true,
  },
  tank: {
    unlockLevel: 15,
    chanceKey: 'spiderChanceTank',
    chanceGrowth: { levels: 15, percent: 1 },
    speedPercent: -40,
    damagePercent: 900,
    hits: 1,
  },
};
export const SPECIAL_SPIDER_ORDER: readonly SpiderType[] = [
  'tank',
  'burner',
  'fat',
  'fast',
  'ninja',
];
