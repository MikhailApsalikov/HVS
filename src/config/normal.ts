import type { DifficultyConfig } from './types.js';

export const normalConfig: DifficultyConfig = {
  baseHp: 500,
  baseEnergy: 100,
  hpRegen: 1,
  energyRegen: 10,
  coinsPerSec: 0.3,

  shootCost: 35,
  shootCooldown: 1.5,
  arrowTravelTime: 1.5,

  abilities: {
    freeze: { cost: 50, cooldown: 0 },
    blizzard: { cost: 40, cooldown: 15 },
    prep: { cost: 0, cooldown: 60 },
    heal: { cost: 100, cooldown: 10 },
    volley: { cost: 100, cooldown: 12 },
    stand: { cost: 15, cooldown: 120 },
    armageddon: { cost: 100, cooldown: 120 },
    recharge: { cost: 65, cooldown: 300 },
  },

  levelTimerBase: 15,
  levelTimerStep: 2,

  spawnTickInterval: 0.02,
  spawnP0: 0.0006,
  spawnDP: 0.00005,

  spiderSpeedBase: 0.08,
  spiderSpeedStep: 0.004,
  spiderDamageBase: 20,
  spiderDamageStep: 7,
  spiderVariance: 0.3,

  spiderChanceFat: 0.05,
  spiderChanceFast: 0.03,
  spiderChanceNinja: 0.02,
  spiderChanceBurner: 0.01,
  spiderChanceTank: 0.02,

  talents: {
    endurance: { maxRanks: 7, unlocksAtLevel: 1 },
    spiderArmor: { maxRanks: 10, unlocksAtLevel: 10 },
    tireless: { maxRanks: 5, unlocksAtLevel: 1 },
    agility: { maxRanks: 5, unlocksAtLevel: 10 },
    healBoost: { maxRanks: 15, unlocksAtLevel: 30 },
    hunterMastery: { maxRanks: 10, unlocksAtLevel: 1 },
    improvedPrep: { maxRanks: 5, unlocksAtLevel: 20 },
    volleyMastery: { maxRanks: 5, unlocksAtLevel: 20 },
    rapidFire: { maxRanks: 7, unlocksAtLevel: 10 },
    dutyBound: { maxRanks: 5, unlocksAtLevel: 30 },
    blizzardMastery: { maxRanks: 6, unlocksAtLevel: 30 },
    hunterReward: { maxRanks: 5, unlocksAtLevel: 20 },
    quickInstinct: { maxRanks: 10, unlocksAtLevel: 40 },
    hunterArsenal: { maxRanks: 5, unlocksAtLevel: 40 },
  },
};
