import type { NumberPolicy, Modifier } from './numbers.js';
import { WORLD } from './world.js';

const integer = { digits: 0, min: 0 } as const;
const decimal = { digits: 2, min: 0 } as const;
const duration = { digits: 2, min: 0 } as const;
const speed = { digits: 6, min: 0 } as const;
const probability = { digits: 6, min: 0, max: 1 } as const;
export const BEST_DEFENSE_COOLDOWN = 3;
export const LEARNING_FROM_MISTAKES = {
  shieldDurationPerRank: 0.15,
  shieldCooldown: 4,
  fatalShieldDurations: [1, 2, 4, 7, 10],
  damageThresholds: [0.1, 0.08, 0.07, 0.06, 0.05],
  exhaustionDuration: 300,
  exhaustionAgilityPercent: 15,
} as const;
export const TITAN_ARMOR_DAMAGE_REDUCTION_PER_RANK = 2;
export const CRITICAL_SHOT_POWER = 2;
export const IMPROVED_CRITICAL_SHOT_POWER = 3;
export function learningFatalShieldDuration(rank: number): number {
  return LEARNING_FROM_MISTAKES.fatalShieldDurations[rank - 1] ?? 0;
}
export function learningDamageThreshold(rank: number): number {
  return LEARNING_FROM_MISTAKES.damageThresholds[rank - 1] ?? 1;
}
export const KILLING_STREAK = { maxStacks: 10, decayInterval: 1.5 } as const;
export const AIMED_FIRE = { firstDelay: 1, interval: 2 } as const;
export const MAGIC_HIT_DAMAGE = 1;
export const ICE_ARROWS = { duration: 4 } as const;
export const FIRE_EXPLOSION = {
  chance: 0.35,
  adjacentRank: 6,
  verticalReach: 1.3,
} as const;
export const LIGHTNING_SHIELD = {
  duration: 300,
  procCooldown: 2,
  energyThreshold: 100,
  procEnergyCost: 20,
} as const;
export const RECHARGE_COOLDOWN_PER_USE = 60;
export const MASOCHISM = {
  healthPerEnergy: [10, 9, 8, 7, 6],
  minHpFraction: [0.9, 0.8, 0.7, 0.6, 0.5],
  agilityPerRank: 60,
  duration: 75,
  triggerHpFraction: 0.3,
} as const;
export function masochismHealthPerEnergy(rank: number): number {
  return MASOCHISM.healthPerEnergy[rank - 1] ?? 0;
}
export function masochismMinHpFraction(rank: number): number {
  return MASOCHISM.minHpFraction[rank - 1] ?? 1;
}
export function aimedFireDuration(waves: number): number {
  return AIMED_FIRE.firstDelay + (waves - 1) * AIMED_FIRE.interval;
}
export const BURNER_ENERGY_PER_LEVEL = 2;
export const GOLDEN_SPIDER_REWARD = { base: 10, perLevel: 1 } as const;
export const HUNTER_REWARD = { duration: 15, incomePercent: 50, armorPercent: 50 } as const;
/** Linear speed growth in fields per second for each difficulty. */
export const SPIDER_SPEED = {
  easy: { base: 0.056, perLevel: 0.0024 },
  normal: { base: 0.064, perLevel: 0.0032 },
  hard: { base: 0.072, perLevel: 0.004 },
} as const;
/** Rounded quadratic damage growth for each difficulty, with a base of 10. */
export const SPIDER_DAMAGE = {
  base: 10,
  growth: {
    easy: 0.09,
    normal: 0.12,
    hard: 0.15,
  },
} as const;
export const INITIAL_ASSISTANCE = {
  endLevel: 30,
  hpRegenPerLevel: 0.4,
  energyRegenPerLevel: 0.1,
} as const;
export function initialAssistance(level: number, multiplier: number) {
  const remainingLevels = Math.max(0, INITIAL_ASSISTANCE.endLevel - level);
  return {
    hpRegen: remainingLevels * INITIAL_ASSISTANCE.hpRegenPerLevel * multiplier,
    energyRegen: remainingLevels * INITIAL_ASSISTANCE.energyRegenPerLevel * multiplier,
  };
}
export const DODGE_CAP = 0.75;
export const ANTI_AFK = {
  unlockLevel: 10,
  idleDuration: 3,
  recoveryDuration: 10,
  damagePerStack: 10,
} as const;
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
  dodgeChance: stat('Шанс уклонения', 0, { ...probability, max: DODGE_CAP }),
  enthusiasmChance: stat('Шанс уклонения: Увлечённость', 0, probability),
  'killingStreak.interval': stat('Время набора: Череда убийств, с', 35, { ...duration, min: 1 }),
  'killingStreak.maxStacks': stat('Максимум эффектов: Череда убийств', 5, {
    ...integer,
    max: KILLING_STREAK.maxStacks,
  }),
  'killingStreak.killAdvance': stat('Ускорение за убийство: Череда убийств, с', 0, decimal),
  blockPower: stat('Сила блока', 0, integer),
  blockVolleyChance: stat('Шанс бесплатного «Залпа» при прорыве паука', 0, probability),
  armorReduction: stat('Снижение урона бронёй', 0, { ...probability, max: ARMOR_RULES.cap }),
  maxHp: stat('Максимальное HP', 100, integer),
  maxEnergy: stat('Максимальная энергия', 100, integer),
  hpRegen: stat('Восстановление HP/с', 0, decimal),
  healingReceived: stat('Получаемое лечение и регенерация', 1, speed),
  'poison.tickDamage': stat('Урон яда за тик', 0, decimal),
  spiderDebuffDuration: stat('Длительность дебаффов пауков, с', 0, duration),
  spiderDebuffResistance: stat('Сопротивление дебаффам пауков', 0, probability),
  shopDiscount: stat('Скидка на покупку предметов, %', 0, { ...decimal, max: 100 }),
  energyRegen: stat('Восстановление энергии/с', 8, decimal),
  shootCost: stat('Стоимость выстрела', 35, integer),
  shootCooldown: stat('Перезарядка выстрела, с', 3, duration),
  arrowSpeed: stat('Скорость стрелы, поля/с', 1 / 3, speed),
  criticalShotChance: stat('Шанс критического выстрела', 0, probability),
  improvedCriticalShotChance: stat('Шанс усиления критического выстрела', 0, probability),
  'eagleEye.improvedCriticalShotChance': stat(
    'Дополнительный шанс усиления: Зоркость',
    0,
    probability,
  ),
  hpPerKill: stat('Здоровье за убийство', 0, integer),
  incomingDamage: stat('Получаемый урон', 0, integer),
  damageFactor: stat('Доля получаемого урона', 1, { digits: 6, min: 0 }),
  coinsPerSec: stat('Монеты/с', 4, decimal),
  coinsPerKill: stat('Монеты за убийство', 0, integer),
  energyPerKill: stat('Энергия за убийство', 0, integer),
  energyPerBreach: stat('Энергия за прорыв', 0, integer),
  jackpotChance: stat('Шанс тройной награды', 0, probability),
  goldenJackpotChance: stat('Шанс тройной награды за золотого паука', 0, probability),
  breachRewardFraction: stat('Доля награды за дошедшего паука', 0, probability),
  inventorySlots: stat('Слоты инвентаря', 1, integer),
  itemEffectiveness: stat('Эффективность предметов', 1, speed),
  levelDuration: stat('Длительность уровня, с', 0, { ...duration, min: 10 }),
  spawnProbability: stat('Вероятность появления паука', 0, probability),
  spiderTypeProbability: stat('Вероятность выбора вида паука', 0, probability),
  spawnInterval: stat('Интервал появления, с', 0.02, { ...duration, min: 0.01 }),
  spiderSpeed: stat('Скорость паука, поля/с', 0, speed),
  permafrostSlow: stat('Замедление: Вечная мерзлота', 0, { ...probability, max: 0.6 }),
  globalSpiderSlow: stat('Замедление пауков от предметов', 0, probability),
  'iceArrows.chance': stat('Шанс: Ледяные стрелы', 0, probability),
  'iceArrows.adjacentChance': stat('Шанс соседних линий: Ледяные стрелы', 0, probability),
  spiderDamage: stat('Урон паука', SPIDER_DAMAGE.base, integer),
  burnerEnergy: stat('Сжигание энергии', 90, integer),
  'freeze.cost': stat('Стоимость: Заморозка времени', 25, integer),
  'freeze.cooldown': stat('Перезарядка: Заморозка времени, с', 0, duration),
  'blizzard.cost': stat('Стоимость: Вьюга', 40, integer),
  'blizzard.cooldown': stat('Перезарядка: Вьюга, с', 15, duration),
  'blizzard.duration': stat('Длительность: Вьюга, с', 4, duration),
  'blizzard.slow': stat('Замедление: Вьюга', 0.4, probability),
  'prep.cost': stat('Стоимость: Подготовка', 0, integer),
  'prep.cooldown': stat('Перезарядка: Подготовка, с', 60, duration),
  'prep.restore': stat('Общее восстановление энергии: Подготовка', 250, integer),
  'prep.duration': stat('Длительность: Подготовка, с', 5, { ...duration, max: 10 }),
  'prep.energyRegen': stat('Восстановление энергии/с: Подготовка', 30, decimal),
  'prep.overTime': stat('Постепенное восстановление энергии: Подготовка', 0, decimal),
  'prep.instant': stat('Мгновенное восстановление энергии: Подготовка', 0, integer),
  'prep.stacks': stat('Эффекты Череды убийств: Подготовка титана', 0, {
    ...integer,
    max: KILLING_STREAK.maxStacks,
  }),
  'heal.cost': stat('Стоимость: Лечение', 100, integer),
  'heal.cooldown': stat('Перезарядка: Лечение, с', 17, duration),
  'heal.amount': stat('Восстановление HP: Лечение', 150, integer),
  'volley.cost': stat('Стоимость: Залп', 100, integer),
  'volley.cooldown': stat('Перезарядка: Залп, с', 36, duration),
  'volley.lanes': stat('Количество стрел: Залп', 4, { ...integer, max: WORLD.lanes }),
  'aimedFire.cost': stat('Стоимость: Прицельный огонь', 100, integer),
  'aimedFire.cooldown': stat('Перезарядка: Прицельный огонь, с', 100, duration),
  'aimedFire.waves': stat('Выстрелов каждого лучника: Прицельный огонь', 3, { ...integer, max: 5 }),
  'aimedFire.duration': stat('Длительность: Прицельный огонь, с', 0, duration),
  'stand.cost': stat('Стоимость: Божественный щит', 15, integer),
  'stand.cooldown': stat('Перезарядка: Божественный щит, с', 180, duration),
  'stand.duration': stat('Длительность: Божественный щит, с', 7, duration),
  'lastHope.cost': stat('Стоимость: Блок последней надежды', 45, integer),
  'lastHope.cooldown': stat('Перезарядка: Блок последней надежды, с', 40, duration),
  'lastHope.duration': stat('Длительность: Блок последней надежды, с', 6, duration),
  'lastHope.blockChance': stat('Прибавка к шансу блока', 0.4, probability),
  'lastHope.blockPower': stat('Прибавка к силе блока от выносливости', 0, integer),
  'armageddon.cost': stat('Стоимость: Армагеддон', 100, integer),
  'armageddon.cooldown': stat('Перезарядка: Армагеддон, с', 180, duration),
  'armageddon.charge': stat('Подготовка: Армагеддон, с', 2.5, duration),
  'armageddon.duration': stat('Длительность: Армагеддон, с', 3, duration),
  'lightningArrows.cost': stat('Стоимость: Стрелы молний', 70, integer),
  'lightningArrows.cooldown': stat('Перезарядка: Стрелы молний, с', 90, duration),
  'lightningArrows.jumps': stat('Перескоки: Стрелы молний', 1, { ...integer, max: 11 }),
  'lightningArrows.charges': stat('Зарядов каждого лучника: Стрелы молний', 1, {
    ...integer,
    max: 2,
  }),
  'lightningArrows.sameLane': stat('Молнии на текущей линии', 0, { ...integer, max: 1 }),
  'lightningArrows.delay': stat('Задержка: Стрелы молний, с', 0.65, { ...duration, min: 0.25 }),
  'lightningShield.cost': stat('Стоимость: Щит молний', 0, integer),
  'lightningShield.cooldown': stat('Перезарядка: Щит молний, с', 300, duration),
  'lightningShield.duration': stat(
    'Длительность: Щит молний, с',
    LIGHTNING_SHIELD.duration,
    duration,
  ),
  'lightningShield.absorption': stat('Поглощение: Щит молний', 3500, integer),
  'lightningShield.procCooldown': stat(
    'Интервал ответных молний, с',
    LIGHTNING_SHIELD.procCooldown,
    duration,
  ),
  'lightningShield.procCost': stat(
    'Стоимость ответной молнии',
    LIGHTNING_SHIELD.procEnergyCost,
    integer,
  ),
  'fireExplosion.chance': stat('Шанс: Огненный взрыв', 0, probability),
  'fireExplosion.radius': stat('Радиус: Огненный взрыв, ширин линии', 0.33 * 1.3, decimal),
  'recharge.cost': stat('Стоимость: Перезарядка', 65, integer),
  'recharge.cooldown': stat('Перезарядка: Перезарядка, с', 120, duration),
  'adrenaline.cost': stat('Стоимость: Адреналин', 0, integer),
  'eagleEye.cost': stat('Стоимость: Зоркость', 20, integer),
  'eagleEye.cooldown': stat('Перезарядка: Зоркость, с', 45, duration),
  'eagleEye.duration': stat('Длительность: Зоркость, с', 20, { ...duration, max: 20 }),
  'eagleEye.shots': stat('Критические выстрелы: Зоркость', 5, { ...integer, max: 20 }),
  'adrenaline.cooldown': stat('Перезарядка: Адреналин, с', 120, duration),
  'adrenaline.duration': stat('Длительность: Адреналин, с', 20, { ...duration, max: 20 }),
  'adrenaline.shots': stat('Бесплатные выстрелы: Адреналин', 20, { ...integer, max: 35 }),
  'adrenaline.shootCooldownReduction': stat('Сокращение перезарядки выстрела: Адреналин, %', 100, {
    ...integer,
    max: 100,
  }),
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
    regenPerPoint: 0.04,
    breachStep: 100,
    durationStep: 25,
    durationPerStep: 1,
    killCoinsStep: 240,
    incomeStep: 40,
    incomePerStep: 0.1,
    armorPerPoint: 2,
    shieldBlockPerPoint: 0.1,
    lastHopeBlockPerPoint: 0.05,
  },
  agility: {
    dodgeThreshold: 100,
    dodgePerPoint: 0.0003,
    shotCooldownHalfLife: 800,
    volleyCooldownHalfLife: 1200,
    percentCap: 70,
    killEnergyStep: 240,
    criticalShotStep: 130,
  },
  intellect: {
    energyThreshold: 100,
    energyPerPoint: 1,
    regenPerPoint: 0.01,
    healPerPoint: 2,
    prepStep: 3,
    prepPerStep: 1,
    shieldAbsorptionThreshold: 300,
    shieldAbsorptionPerPoint: 10,
  },
} as const;
export interface StatModifier extends Modifier {
  readonly stat: StatId;
}
export type ResolvedStats = Readonly<Record<StatId, number>>;
export type StatBases = Partial<Record<StatId, number>>;
