import type { AbilityId } from './types.js';
import type { PrimaryStatId } from './rules/stats.js';

export type ItemRarity = 'common' | 'rare' | 'epic' | 'legendary';
export type StatType =
  | PrimaryStatId
  | 'maxHp'
  | 'maxEnergy'
  | 'hpRegen'
  | 'energyRegen'
  | 'damageReduction'
  | 'coinsPerKill'
  | 'energyPerKill'
  | 'energyPerBreach';
export type AbilityModType = 'cooldownReduction' | 'effectBoost' | 'costReduction';
export interface ItemStat {
  readonly type: StatType;
  readonly value: number;
  readonly kind?: 'flat' | 'percent';
}
export interface AbilityMod {
  readonly abilityId: AbilityId;
  readonly modType: AbilityModType;
  readonly value: number;
  readonly description: string;
}
export interface ItemConfig {
  readonly id: string;
  readonly name: string;
  readonly rarity: ItemRarity;
  readonly stats: readonly ItemStat[];
  readonly abilityMod?: AbilityMod;
}
export interface ItemDefinition extends ItemConfig {
  readonly price: number;
}
