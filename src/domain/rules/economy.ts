import type { ItemConfig, ItemRarity, StatType } from '../itemTypes.js';
import { calculate } from './numbers.js';
import { WORLD } from './world.js';

interface PriceRule {
  readonly unit: number;
  readonly base: number;
  readonly curve: (value: number) => number;
}
const quadratic = (n: number) => n * n;
const cubic = (n: number) => n * n * n;
const logarithmic = (n: number) => n * Math.log2(n + 1);
const PRICES: Record<StatType, PriceRule> = {
  endurance: { unit: 10, base: 32, curve: logarithmic },
  agility: { unit: 1, base: 32, curve: quadratic },
  intellect: { unit: 1, base: 32, curve: quadratic },
  hpRegen: { unit: 1, base: 24, curve: logarithmic },
  damageReduction: { unit: 1, base: 12, curve: quadratic },
  coinsPerKill: { unit: 1, base: 400, curve: quadratic },
  maxEnergy: { unit: 10, base: 36, curve: quadratic },
  energyPerBreach: { unit: 1, base: 40, curve: quadratic },
  energyRegen: { unit: 1, base: 400, curve: cubic },
  energyPerKill: { unit: 1, base: 400, curve: cubic },
};
const RARITY_PERCENT: Record<ItemRarity, number> = { common: 0, rare: 15, epic: 33, legendary: 74 };

export function computeItemPrice(item: ItemConfig): number {
  const base = item.stats.reduce((sum, stat) => {
    const rule = PRICES[stat.type];
    return sum + rule.base * rule.curve(Math.abs(stat.value) / rule.unit);
  }, 0);
  return calculate(
    base,
    [{ source: `rarity:${item.rarity}`, kind: 'percent', value: RARITY_PERCENT[item.rarity] }],
    { digits: 0, min: 0 },
  ).value;
}
export function salePrice(price: number): number {
  return calculate(
    price,
    [{ source: 'sale', kind: 'percent', value: (WORLD.saleFactor - 1) * 100 }],
    { digits: 0, min: 0, rounding: 'floor' },
  ).value;
}
