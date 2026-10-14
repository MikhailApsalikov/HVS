export const DEBUFFS = {
  goldLock: {
    name: 'Потеря дохода',
    duration: 40,
    incomePercentPerLevel: 3,
    maxIncomeReductionPercent: 100,
  },
  healingReduction: {
    name: 'Ослабленное лечение',
    duration: 4,
    durationPerLevel: 0.6,
    healingPercentPerLevel: 1,
    maxHealingReductionPercent: 100,
  },
  poison: {
    name: 'Яд',
    duration: 10,
    durationPerLevel: 0.5,
    interval: 2,
    damagePercent: 12,
    armorPercentPerLevel: 1,
    maxArmorReductionPercent: 100,
    maxStacks: 10,
  },
} as const;
