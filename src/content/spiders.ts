import type { SpiderType, DifficultyConfig } from '../domain/types.js';

interface SpiderDefinition {
  readonly name: string;
  readonly unlockLevel: number;
  readonly chance?: number;
  readonly chanceKey?: keyof Pick<
    DifficultyConfig,
    | 'spiderChanceGolden'
    | 'spiderChanceMegaFat'
    | 'spiderChanceFat'
    | 'spiderChanceFast'
    | 'spiderChancePoisonous'
    | 'spiderChanceNinja'
    | 'spiderChanceBurner'
    | 'spiderChanceTank'
  >;
  readonly speedPercent: number;
  readonly damagePercent: number;
  readonly hits: number;
  readonly chanceGrowth?: { readonly levels: number; readonly percent: number };
  readonly burnsEnergy?: boolean;
  readonly clearsBuffs?: boolean;
  readonly jumpLevelStep?: number;
}

export const SPIDERS: Readonly<Record<SpiderType, SpiderDefinition>> = {
  normal: { name: 'Обычный', unlockLevel: 1, speedPercent: 0, damagePercent: 0, hits: 1 },
  golden: {
    name: 'Золотой',
    unlockLevel: 40,
    chanceKey: 'spiderChanceGolden',
    speedPercent: 0,
    damagePercent: 0,
    hits: 1,
  },
  megaFat: {
    name: 'Мегатолстый',
    unlockLevel: 50,
    chanceKey: 'spiderChanceMegaFat',
    chanceGrowth: { levels: 40, percent: 1 },
    speedPercent: 0,
    damagePercent: 0,
    hits: 3,
  },
  fat: {
    name: 'Толстый',
    unlockLevel: 10,
    chanceKey: 'spiderChanceFat',
    chanceGrowth: { levels: 25, percent: 1 },
    speedPercent: 0,
    damagePercent: 0,
    hits: 2,
  },
  fast: {
    name: 'Быстрый',
    unlockLevel: 20,
    chanceKey: 'spiderChanceFast',
    speedPercent: 200,
    damagePercent: -50,
    hits: 1,
  },
  poisonous: {
    name: 'Ядовитый',
    unlockLevel: 8,
    chanceKey: 'spiderChancePoisonous',
    chanceGrowth: { levels: 8, percent: 1 },
    speedPercent: 0,
    damagePercent: 0,
    hits: 1,
  },
  cleanser: {
    name: 'Очиститель',
    unlockLevel: 45,
    chance: 0.01,
    speedPercent: 0,
    damagePercent: 0,
    hits: 1,
    clearsBuffs: true,
  },
  ninja: {
    name: 'Ниндзя',
    unlockLevel: 35,
    chanceKey: 'spiderChanceNinja',
    chanceGrowth: { levels: 35, percent: 1 },
    speedPercent: 0,
    damagePercent: 0,
    hits: 1,
    jumpLevelStep: 35,
  },
  burner: {
    name: 'Поджигатель',
    unlockLevel: 5,
    chanceKey: 'spiderChanceBurner',
    chanceGrowth: { levels: 20, percent: 1 },
    speedPercent: 0,
    damagePercent: -50,
    hits: 1,
    burnsEnergy: true,
  },
  tank: {
    name: 'Танк',
    unlockLevel: 15,
    chanceKey: 'spiderChanceTank',
    chanceGrowth: { levels: 15, percent: 1 },
    speedPercent: -40,
    damagePercent: 900,
    hits: 1,
  },
};
export const SPECIAL_SPIDER_ORDER: readonly SpiderType[] = [
  'golden',
  'tank',
  'burner',
  'megaFat',
  'fat',
  'fast',
  'poisonous',
  'cleanser',
  'ninja',
];
