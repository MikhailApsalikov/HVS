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
  endurance: { unit: 5, base: 38.4, curve: logarithmic },
  agility: { unit: 5, base: 38.4, curve: logarithmic },
  intellect: { unit: 5, base: 38.4, curve: logarithmic },
  hpRegen: { unit: 0.5, base: 28.8, curve: logarithmic },
  armor: { unit: 1, base: 1, curve: (n) => n },
  coinsPerKill: { unit: 1, base: 480, curve: quadratic },
  maxEnergy: { unit: 10, base: 43.2, curve: quadratic },
  criticalShotChance: { unit: 0.01, base: 600, curve: quadratic },
  energyRegen: { unit: 1, base: 480, curve: cubic },
  energyPerKill: { unit: 1, base: 480, curve: cubic },
};
const RARITY_PERCENT: Record<ItemRarity, number> = { common: 0, rare: 15, epic: 33, legendary: 74 };

export function computeItemPrice(item: ItemConfig): number {
  let armorPrice = 0;
  const base = item.stats.reduce((sum, stat) => {
    const rule = PRICES[stat.type];
    const value = rule.base * rule.curve(Math.abs(stat.value) / rule.unit);
    if (stat.type === 'armor') {
      armorPrice += value;
      return sum;
    }
    return sum + value;
  }, 0);
  const adjusted = calculate(
    base,
    [{ source: `rarity:${item.rarity}`, kind: 'percent', value: RARITY_PERCENT[item.rarity] }],
    { digits: 0, min: 0 },
  ).afterPercentBonuses;
  return calculate(adjusted + armorPrice, [], { digits: 0, min: 0 }).value;
}
export function salePrice(price: number): number {
  return calculate(
    price,
    [{ source: 'sale', kind: 'percent', value: (WORLD.saleFactor - 1) * 100 }],
    { digits: 0, min: 0, rounding: 'floor' },
  ).value;
}
