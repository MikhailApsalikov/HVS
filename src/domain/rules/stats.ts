import type { NumberPolicy, Modifier } from './numbers.js';
import { WORLD } from './world.js';

const integer = { digits: 0, min: 0 } as const;
const decimal = { digits: 2, min: 0 } as const;
const duration = { digits: 2, min: 0 } as const;
const speed = { digits: 6, min: 0 } as const;
const probability = { digits: 6, min: 0, max: 1 } as const;
/** Armor inflation is negligible through level 10 and accelerates quartically afterwards. */
export const ARMOR_RULES = {
  linearScale: 24,
  levelOffset: 8,
  inflationStrength: 8.75,
  inflationReferenceLevel: 50,
  inflationPower: 4,
  cap: 0.75,
} as const;

function stat(label: string, base: number, policy: NumberPolicy) {
  return { label, base, policy };
}

/** Policies apply to resolved values, never to per-frame resource/timer increments. */
export const STATS = {
  endurance: stat('Выносливость', 27, integer),
  agility: stat('Ловкость', 23, integer),
  intellect: stat('Интеллект', 16, integer),
  armor: stat('Броня', 0, integer),
  blockChance: stat('Шанс блока', 0, probability),
  blockPower: stat('Сила блока', 0, integer),
  blockVolleyChance: stat('Шанс бесплатного «Залпа» при блокировании', 0, probability),
  armorReduction: stat('Снижение урона бронёй', 0, { ...probability, max: ARMOR_RULES.cap }),
  maxHp: stat('Максимальное HP', 100, integer),
  maxEnergy: stat('Максимальная энергия', 100, integer),
  hpRegen: stat('Восстановление HP/с', 0, decimal),
  energyRegen: stat('Восстановление энергии/с', 8, decimal),
  shootCost: stat('Стоимость выстрела', 35, integer),
  shootCooldown: stat('Перезарядка выстрела, с', 3, duration),
  arrowSpeed: stat('Скорость стрелы, поля/с', 1 / 3, speed),
  incomingDamage: stat('Получаемый урон', 0, integer),
  damageFactor: stat('Доля получаемого урона', 1, probability),
  coinsPerSec: stat('Монеты/с', 0.4, decimal),
  coinsPerKill: stat('Монеты за убийство', 0, integer),
  energyPerKill: stat('Энергия за убийство', 0, integer),
  energyPerBreach: stat('Энергия за прорыв', 0, integer),
  jackpotChance: stat('Шанс тройной награды', 0, probability),
  inventorySlots: stat('Слоты инвентаря', 1, integer),
  levelDuration: stat('Длительность уровня, с', 0, duration),
  spawnProbability: stat('Вероятность появления паука', 0, probability),
  spawnInterval: stat('Интервал появления, с', 0.02, { ...duration, min: 0.01 }),
  spiderSpeed: stat('Скорость паука, поля/с', 0, speed),
  spiderDamage: stat('Урон паука', 0, integer),
  burnerEnergy: stat('Сжигание энергии', 90, integer),
  'freeze.cost': stat('Стоимость: Заморозка времени', 50, integer),
  'freeze.cooldown': stat('Перезарядка: Заморозка времени, с', 0, duration),
  'blizzard.cost': stat('Стоимость: Вьюга', 40, integer),
  'blizzard.cooldown': stat('Перезарядка: Вьюга, с', 15, duration),
  'blizzard.duration': stat('Длительность: Вьюга, с', 4, duration),
  'blizzard.slow': stat('Замедление: Вьюга', 0.4, probability),
  'prep.cost': stat('Стоимость: Подготовка', 0, integer),
  'prep.cooldown': stat('Перезарядка: Подготовка, с', 60, duration),
  'prep.restore': stat('Восстановление энергии: Подготовка', 250, integer),
  'heal.cost': stat('Стоимость: Лечение', 100, integer),
  'heal.cooldown': stat('Перезарядка: Лечение, с', 10, duration),
  'heal.amount': stat('Восстановление HP: Лечение', 150, integer),
  'volley.cost': stat('Стоимость: Залп', 100, integer),
  'volley.cooldown': stat('Перезарядка: Залп, с', 36, duration),
  'volley.lanes': stat('Количество стрел: Залп', 4, { ...integer, max: WORLD.lanes }),
  'stand.cost': stat('Стоимость: Божественный щит', 15, integer),
  'stand.cooldown': stat('Перезарядка: Божественный щит, с', 180, duration),
  'stand.duration': stat('Длительность: Божественный щит, с', 7, duration),
  'lastHope.cost': stat('Стоимость: Блок последней надежды', 45, integer),
  'lastHope.cooldown': stat('Перезарядка: Блок последней надежды, с', 65, duration),
  'lastHope.duration': stat('Длительность: Блок последней надежды, с', 6, duration),
  'lastHope.blockChance': stat('Прибавка к шансу блока', 0.3, probability),
  'lastHope.blockPower': stat('Прибавка к силе блока от выносливости', 0, integer),
  'armageddon.cost': stat('Стоимость: Армагеддон', 100, integer),
  'armageddon.cooldown': stat('Перезарядка: Армагеддон, с', 180, duration),
  'armageddon.charge': stat('Подготовка: Армагеддон, с', 2.5, duration),
  'armageddon.duration': stat('Длительность: Армагеддон, с', 3, duration),
  'recharge.cost': stat('Стоимость: Перезарядка', 65, integer),
  'recharge.cooldown': stat('Перезарядка: Перезарядка, с', 300, duration),
} as const;

export type StatId = keyof typeof STATS;
export type PrimaryStatId = 'endurance' | 'agility' | 'intellect';
export const PRIMARY_STATS: readonly PrimaryStatId[] = ['endurance', 'agility', 'intellect'];
export const PRIMARY_GROWTH: Readonly<Record<PrimaryStatId, number>> = {
  endurance: 3,
  agility: 1,
  intellect: 2,
};
export const ATTRIBUTE_RULES = {
  endurance: {
    healthThreshold: 40,
    healthPerPoint: 10,
    regenPerPoint: 0.02,
    breachStep: 100,
    durationStep: 80,
    killCoinsStep: 240,
    incomeStep: 10,
    incomePerStep: 0.1,
    armorPerPoint: 2,
    lastHopeBlockPerPoint: 0.2,
  },
  agility: { shotStep: 12, volleyStep: 18, percentCap: 70, killEnergyStep: 240 },
  intellect: {
    energyThreshold: 100,
    energyPerPoint: 2,
    regenPerPoint: 0.01,
    healPerPoint: 2,
    prepPerPoint: 1,
  },
} as const;
export interface StatModifier extends Modifier {
  readonly stat: StatId;
}
export type ResolvedStats = Readonly<Record<StatId, number>>;
export type StatBases = Partial<Record<StatId, number>>;
