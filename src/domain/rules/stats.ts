import type { NumberPolicy, Modifier } from './numbers.js';
import { WORLD } from './world.js';

const integer = { digits: 0, min: 0 } as const;
const decimal = { digits: 2, min: 0 } as const;
const duration = { digits: 2, min: 0 } as const;
const speed = { digits: 6, min: 0 } as const;
const probability = { digits: 6, min: 0, max: 1 } as const;

function stat(label: string, base: number, policy: NumberPolicy) {
  return { label, base, policy };
}

/** Policies apply to resolved values, never to per-frame resource/timer increments. */
export const STATS = {
  endurance: stat('Выносливость', 0, integer),
  agility: stat('Ловкость', 0, integer),
  intellect: stat('Интеллект', 0, integer),
  maxHp: stat('Максимальное HP', 500, integer),
  maxEnergy: stat('Максимальная энергия', 100, integer),
  hpRegen: stat('Восстановление HP/с', 1, decimal),
  energyRegen: stat('Восстановление энергии/с', 10, decimal),
  shootCost: stat('Стоимость выстрела', 35, integer),
  shootCooldown: stat('Перезарядка выстрела, с', 1.5, duration),
  arrowSpeed: stat('Скорость стрелы, поля/с', 1 / 1.5, speed),
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
  'prep.restore': stat('Восстановление энергии: Подготовка', 300, integer),
  'heal.cost': stat('Стоимость: Лечение', 100, integer),
  'heal.cooldown': stat('Перезарядка: Лечение, с', 10, duration),
  'heal.amount': stat('Восстановление HP: Лечение', 150, integer),
  'volley.cost': stat('Стоимость: Залп', 100, integer),
  'volley.cooldown': stat('Перезарядка: Залп, с', 12, duration),
  'volley.lanes': stat('Количество стрел: Залп', 4, { ...integer, max: WORLD.lanes }),
  'stand.cost': stat('Стоимость: Ни шагу назад!', 15, integer),
  'stand.cooldown': stat('Перезарядка: Ни шагу назад!, с', 120, duration),
  'stand.duration': stat('Длительность: Ни шагу назад!, с', 7, duration),
  'armageddon.cost': stat('Стоимость: Армагеддон', 100, integer),
  'armageddon.cooldown': stat('Перезарядка: Армагеддон, с', 120, duration),
  'armageddon.charge': stat('Подготовка: Армагеддон, с', 2.5, duration),
  'armageddon.duration': stat('Длительность: Армагеддон, с', 3, duration),
  'recharge.cost': stat('Стоимость: Перезарядка', 65, integer),
  'recharge.cooldown': stat('Перезарядка: Перезарядка, с', 300, duration),
} as const;

export type StatId = keyof typeof STATS;
export type PrimaryStatId = 'endurance' | 'agility' | 'intellect';
export const PRIMARY_STATS: readonly PrimaryStatId[] = ['endurance', 'agility', 'intellect'];
export interface StatModifier extends Modifier {
  readonly stat: StatId;
}
export type ResolvedStats = Readonly<Record<StatId, number>>;
export type StatBases = Partial<Record<StatId, number>>;
