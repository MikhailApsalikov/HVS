export const DEBUFFS = {
  goldLock: { name: 'Потеря дохода', duration: 40, incomePercent: -100 },
  healingReduction: {
    name: 'Ослабленное лечение',
    duration: 2,
    durationPerLevel: 0.3,
    healingPercent: -75,
  },
  poison: {
    name: 'Яд',
    duration: 40,
    interval: 2,
    damagePercent: 15,
    armorPercent: -75,
    maxStacks: 5,
  },
} as const;
