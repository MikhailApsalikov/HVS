export type Difficulty = 'easy' | 'normal' | 'hard';
export type AbilityId = 'freeze' | 'blizzard' | 'prep' | 'heal' | 'volley' | 'stand' | 'armageddon' | 'recharge';
export type TalentId = 'endurance' | 'spiderArmor' | 'tireless' | 'agility' | 'healBoost' | 'hunterMastery' | 'improvedPrep' | 'volleyMastery' | 'rapidFire' | 'dutyBound' | 'blizzardMastery' | 'hunterReward' | 'quickInstinct' | 'hunterArsenal';
export type SpiderType = 'normal' | 'fat' | 'fast' | 'ninja' | 'burner' | 'tank';
export type GamePhase = 'menu' | 'playing' | 'paused' | 'levelUp' | 'gameOver';

export type AbilityResult =
  | 'activated'
  | 'deactivated'
  | 'on_cooldown'
  | 'not_enough_energy'
  | 'level_locked';

export type ShootResult = 'shot' | 'not_enough_energy' | 'blocked';

export interface AbilityConfig {
  readonly cost: number;
  readonly cooldown: number;
}

export interface TalentLevelConfig {
  readonly maxRanks: number;
  readonly unlocksAtLevel: number;
}

export interface DifficultyConfig {
  readonly baseHp: number;
  readonly baseEnergy: number;
  readonly hpRegen: number;
  readonly energyRegen: number;
  readonly coinsPerSec: number;
  readonly startingCoins: number;

  readonly shootCost: number;
  readonly shootCooldown: number;
  readonly arrowTravelTime: number;

  readonly abilities: Readonly<Record<AbilityId, AbilityConfig>>;

  readonly levelTimerBase: number;
  readonly levelTimerStep: number;

  readonly spawnTickInterval: number;
  readonly spawnP0: number;
  readonly spawnDP: number;

  readonly spiderSpeedBase: number;
  readonly spiderSpeedStep: number;
  readonly spiderDamageBase: number;
  readonly spiderDamageStep: number;
  readonly spiderVariance: number;

  readonly spiderChanceFat: number;
  readonly spiderChanceFast: number;
  readonly spiderChanceNinja: number;
  readonly spiderChanceBurner: number;
  readonly spiderChanceTank: number;

  readonly talents: Readonly<Record<TalentId, TalentLevelConfig>>;
}
