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
    armorPercentPerLevel: 0.5,
    maxArmorReductionPercent: 100,
    maxStacks: 10,
  },
  disorientation: {
    name: 'Дезориентация',
    unlockLevel: 55,
    duration: 10,
    durationPerLevel: 3,
    blockPercentPerLevel: 3,
    agilityDodgePercentPerLevel: 1,
    maxReductionPercent: 100,
  },
} as const;
