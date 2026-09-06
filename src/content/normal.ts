import type { DifficultyConfig } from '../domain/types.js';
import { STATS } from '../domain/rules/stats.js';
import { ABILITY_ORDER } from './abilities.js';

export const normalConfig: DifficultyConfig = {
  baseHp: STATS.maxHp.base,
  baseEnergy: STATS.maxEnergy.base,
  hpRegen: STATS.hpRegen.base,
  energyRegen: STATS.energyRegen.base,
  coinsPerSec: STATS.coinsPerSec.base,
  startingCoins: 100,

  shootCost: STATS.shootCost.base,
  shootCooldown: STATS.shootCooldown.base,
  arrowTravelTime: 1 / STATS.arrowSpeed.base,

  abilities: Object.fromEntries(
    ABILITY_ORDER.map((id) => [
      id,
      {
        cost: STATS[`${id}.cost`].base,
        cooldown: STATS[`${id}.cooldown`].base,
      },
    ]),
  ) as DifficultyConfig['abilities'],

  levelTimerBase: 15,
  levelTimerStep: 2,

  spawnTickInterval: STATS.spawnInterval.base,
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
    endurance: { maxRanks: 7, unlocksAtLevel: 0 },
    spiderArmor: { maxRanks: 10, unlocksAtLevel: 10 },
    tireless: { maxRanks: 5, unlocksAtLevel: 0 },
    agility: { maxRanks: 5, unlocksAtLevel: 10 },
    healBoost: { maxRanks: 15, unlocksAtLevel: 30 },
    hunterMastery: { maxRanks: 10, unlocksAtLevel: 0 },
    improvedPrep: { maxRanks: 5, unlocksAtLevel: 20 },
    volleyMastery: { maxRanks: 5, unlocksAtLevel: 20 },
    rapidFire: { maxRanks: 7, unlocksAtLevel: 10 },
    dutyBound: { maxRanks: 5, unlocksAtLevel: 40 },
    blizzardMastery: { maxRanks: 6, unlocksAtLevel: 30 },
    hunterReward: { maxRanks: 5, unlocksAtLevel: 20 },
    quickInstinct: { maxRanks: 10, unlocksAtLevel: 40 },
    hunterArsenal: { maxRanks: 5, unlocksAtLevel: 40 },
    improvedEndurance: { maxRanks: 7, unlocksAtLevel: 0 },
    improvedAgility: { maxRanks: 7, unlocksAtLevel: 0 },
    improvedIntellect: { maxRanks: 7, unlocksAtLevel: 0 },
    magicArmor: { maxRanks: 7, unlocksAtLevel: 20 },
    divineShield: { maxRanks: 1, unlocksAtLevel: 30 },
    shieldBlock: { maxRanks: 12, unlocksAtLevel: 10 },
    lastHope: { maxRanks: 1, unlocksAtLevel: 20 },
    improvedLastHope: { maxRanks: 5, unlocksAtLevel: 30 },
    bestDefense: { maxRanks: 10, unlocksAtLevel: 40 },
  },
};
