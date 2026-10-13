export const DEBUFFS = {
  goldLock: { name: 'Потеря дохода', duration: 40, incomePercent: -100 },
  healingReduction: {
    name: 'Ослабленное лечение',
    duration: 4,
    durationPerLevel: 0.6,
    healingPercentPerLevel: 1,
    maxHealingReductionPercent: 100,
  },
  poison: {
    name: 'Яд',
    duration: 20,
    durationPerLevel: 0.5,
    interval: 2,
    damagePercent: 12,
    armorPercent: -75,
    maxStacks: 10,
  },
} as const;
