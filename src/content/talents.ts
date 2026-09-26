import type { TalentId, TalentBranch } from '../domain/types.js';
import type { StatModifier, PrimaryStatId } from '../domain/rules/stats.js';
import {
  ATTRIBUTE_RULES,
  BEST_DEFENSE_COOLDOWN,
  CRITICAL_SHOT_POWER,
  IMPROVED_CRITICAL_SHOT_POWER,
} from '../domain/rules/stats.js';
import { ABILITY_ORDER } from './abilities.js';

type Effect = Omit<StatModifier, 'source'>;
interface TalentDefinition {
  readonly name: string;
  readonly sprite: string;
  readonly branch: TalentBranch;
  readonly effects: readonly Effect[];
  readonly description?: string;
  readonly fixedEffects?: readonly Effect[];
  /** Added to the attribute's per-level growth for every talent rank. */
  readonly growth?: { readonly stat: PrimaryStatId; readonly value: number };
  readonly prerequisite?: { readonly id: TalentId; readonly rank: number };
  readonly column?: 1 | 2 | 3;
  readonly scaling?: {
    readonly attribute: PrimaryStatId;
    readonly step: number;
    readonly effect: Effect;
    readonly basePerRank?: number;
  };
}
export const TALENT_BRANCHES: Readonly<Record<TalentBranch, string>> = {
  defense: 'Защита',
  shooting: 'Стрельба',
  magic: 'Магия',
};
export const TALENT_TIER_RULES = { levelsPerTier: 10, pointsPerTier: 7 } as const;
const flat = (stat: Effect['stat'], value: number): Effect => ({ stat, kind: 'flat', value });
const percent = (stat: Effect['stat'], value: number): Effect => ({ stat, kind: 'percent', value });

/** Per-rank strength; a talent contributes ONE modifier per affected stat. */
export const TALENTS: Readonly<Record<TalentId, TalentDefinition>> = {
  endurance: {
    name: 'Стойкость',
    branch: 'defense',
    sprite: 'TalentEndurance',
    effects: [flat('maxHp', 425), flat('energyPerBreach', 2)],
    description:
      'Увеличивает максимальное здоровье на {maxHp} единиц.\nКогда паук доходит до вас, вы получаете {energyPerBreach} энергии.',
  },
  spiderArmor: {
    branch: 'defense',
    column: 1,
    prerequisite: { id: 'warriorArmor', rank: 5 },
    name: 'Защита от пауков',
    sprite: 'TalentArmor',
    effects: [percent('incomingDamage', -6)],
    description: 'Снижает урон от атак пауков на {incomingDamage}.',
  },
  tireless: {
    branch: 'magic',
    name: 'Неутомимость',
    sprite: 'TalentTireless',
    effects: [flat('energyRegen', 1)],
    description: 'Восстанавливает дополнительно {energyRegen} энергии каждую секунду.',
  },
  agility: {
    name: 'Эффективность',
    branch: 'magic',
    sprite: 'TalentAgility',
    effects: [flat('maxEnergy', 60)],
    description: 'Увеличивает максимальный запас энергии на {maxEnergy} единиц.',
  },
  healBoost: {
    branch: 'defense',
    column: 3,
    name: 'Усиленное лечение',
    sprite: 'TalentHealBoost',
    effects: [flat('heal.amount', 350), flat('hpRegen', 5)],
    description:
      '«Лечение» восстанавливает на {heal.amount} здоровья больше.\nТакже вы восстанавливаете дополнительно {hpRegen} здоровья каждую секунду.',
  },
  hunterMastery: {
    branch: 'shooting',
    column: 1,
    name: 'Мастерство охотника',
    sprite: 'TalentHunter',
    effects: [flat('shootCost', -2)],
    description: 'Каждый выстрел лучника расходует на {shootCost} энергии меньше.',
  },
  piercingReward: {
    branch: 'shooting',
    column: 1,
    name: 'Есть пробитие',
    sprite: 'TalentPiercingReward',
    effects: [flat('energyPerKill', 1)],
    description: 'Увеличивает получаемую за убийство энергию на {energyPerKill}.',
  },
  criticalShot: {
    branch: 'shooting',
    column: 2,
    name: 'Критический выстрел',
    sprite: 'TalentCriticalShot',
    effects: [flat('criticalShotChance', 0.02)],
    description: `Каждый выстрел, кроме стрел «Залпа», с вероятностью {criticalShotChance} становится критическим.\nКритическая стрела убивает до ${CRITICAL_SHOT_POWER} пауков. Энергия даётся только за первого паука в цепочке.`,
  },
  eagleEye: {
    branch: 'shooting',
    column: 2,
    name: 'Зоркость',
    sprite: 'AbilityEagleEye',
    prerequisite: { id: 'criticalShot', rank: 10 },
    effects: [],
  },
  improvedCriticalShot: {
    branch: 'shooting',
    column: 3,
    name: 'Улучшенный критический выстрел',
    sprite: 'TalentImprovedCriticalShot',
    prerequisite: { id: 'eagleEye', rank: 1 },
    effects: [
      flat('improvedCriticalShotChance', 0.08),
      flat('eagleEye.improvedCriticalShotChance', 0.04),
    ],
    description: `С вероятностью {improvedCriticalShotChance} критическая стрела убивает до ${IMPROVED_CRITICAL_SHOT_POWER} пауков вместо ${CRITICAL_SHOT_POWER}.\nВо время «Зоркости» вероятность повышается до {eagleEyeImprovedChance}.`,
  },
  agileCriticalShot: {
    branch: 'shooting',
    column: 2,
    name: 'Ловкий критический выстрел',
    sprite: 'TalentAgileCriticalShot',
    prerequisite: { id: 'eagleEye', rank: 1 },
    effects: [flat('eagleEye.shots', 2)],
    scaling: { attribute: 'agility', step: 3, effect: flat('criticalShotChance', 0.0001) },
    description:
      'Увеличивает шанс «Критического выстрела» на {scaling.value} за каждые {scaling.step} полных единицы ловкости.\n«Зоркость» даёт на {eagleEye.shots} критических стрел больше.',
  },
  vampirism: {
    branch: 'shooting',
    column: 3,
    name: 'Вампиризм',
    sprite: 'TalentVampirism',
    effects: [],
    scaling: { attribute: 'agility', step: 10, effect: flat('hpPerKill', 1) },
    description:
      'При убийстве паука восстанавливает {scaling.value} здоровья за каждые {scaling.step} полных единиц ловкости.',
  },
  improvedPrep: {
    branch: 'magic',
    name: 'Улучшенная подготовка',
    sprite: 'TalentPrep',
    effects: [flat('prep.cooldown', -6)],
    description: 'Сокращает перезарядку «Подготовки» на {prep.cooldown} с.',
  },
  recharge: {
    branch: 'magic',
    column: 1,
    name: 'Перезарядка',
    sprite: 'AbilityRecharge',
    prerequisite: { id: 'quickInstinct', rank: 10 },
    effects: [],
  },
  permafrost: {
    branch: 'magic',
    name: 'Вечная мерзлота',
    sprite: 'TalentPermafrost',
    effects: [],
    scaling: {
      attribute: 'intellect',
      step: 20,
      basePerRank: 0.01,
      effect: flat('permafrostSlow', 0.001),
    },
    description:
      'Снижает скорость передвижения всех пауков на {scaling.base} + {scaling.value} за каждые {scaling.step} полных единиц интеллекта.\nЗамедление от этого таланта не может превышать 50%.',
  },
  volley: {
    branch: 'shooting',
    column: 3,
    name: 'Залп',
    sprite: 'TalentVolley',
    effects: [],
  },
  killingStreak: {
    branch: 'shooting',
    column: 1,
    name: 'Череда убийств',
    sprite: 'TalentKillingStreak',
    effects: [flat('killingStreak.interval', -1)],
    description:
      'Каждые {streakInterval} с без урона получаете эффект «Череда убийств»: выстрелы стоят на 1 энергию меньше.\nЭффект складывается до {streakBaseStacks} раз. Урон от паука снимает один эффект.',
  },
  enthusiasm: {
    branch: 'shooting',
    column: 1,
    name: 'Увлеченность',
    sprite: 'TalentEnthusiasm',
    prerequisite: { id: 'killingStreak', rank: 10 },
    effects: [flat('enthusiasmChance', 0.2)],
    description:
      'Дает {enthusiasmChance} вероятности уклониться от урона.\nТребует активной «Череды убийств» и расходует один эффект.',
  },
  improvedKillingStreak: {
    branch: 'shooting',
    column: 1,
    name: 'Улучшенная череда убийств',
    sprite: 'TalentImprovedKillingStreak',
    prerequisite: { id: 'enthusiasm', rank: 5 },
    effects: [flat('killingStreak.maxStacks', 1)],
    scaling: { attribute: 'agility', step: 50, effect: flat('killingStreak.killAdvance', 0.01) },
    description:
      'Увеличивает максимум эффектов «Череды убийств» на {killingStreak.maxStacks}.\nКаждое убийство приближает следующий эффект на {scaling.value} с за каждые {scaling.step} ловкости.',
  },
  volleyMastery: {
    branch: 'shooting',
    column: 3,
    name: 'Искусный залп',
    sprite: 'TalentVolleyMastery',
    prerequisite: { id: 'volley', rank: 1 },
    effects: [flat('volley.lanes', 1), percent('volley.cooldown', -4), flat('volley.cost', -2)],
    description:
      'Увеличивает число стрел «Залпа» на {volley.lanes}, сокращает его перезарядку на {volley.cooldown} и снижает стоимость на {volley.cost} энергии.',
  },
  rapidFire: {
    branch: 'shooting',
    column: 3,
    name: 'Скорострельность',
    sprite: 'TalentRapidFire',
    effects: [
      percent('shootCooldown', -7),
      percent('volley.cooldown', -7),
      percent('arrowSpeed', 7),
    ],
    description:
      'Сокращает перезарядку выстрела на {shootCooldown}, а «Залпа» — на {volley.cooldown}.\nСтрелы летят на {arrowSpeed} быстрее.',
  },
  dutyBound: {
    branch: 'defense',
    name: 'Улучшенный божественный щит',
    sprite: 'TalentDuty',
    prerequisite: { id: 'divineShield', rank: 1 },
    column: 1,
    effects: [flat('stand.duration', 1), flat('stand.cooldown', -12)],
    description:
      '«Божественный щит» действует на {stand.duration} с дольше и перезаряжается на {stand.cooldown} с быстрее.',
  },
  blizzardMastery: {
    branch: 'magic',
    name: 'Беспощадная вьюга',
    sprite: 'TalentBlizzardMastery',
    effects: [flat('blizzard.slow', 0.07), flat('blizzard.duration', 1)],
    description:
      'Усиливает замедление пауков от «Вьюги» на {blizzard.slow} и продлевает её действие на {blizzard.duration} с.',
  },
  hunterReward: {
    branch: 'defense',
    name: 'Награда охотника',
    sprite: 'TalentHunterReward',
    prerequisite: { id: 'greed', rank: 5 },
    column: 3,
    effects: [flat('jackpotChance', 0.07)],
    description: 'С вероятностью {jackpotChance} вы получаете тройную награду за убитого паука.',
  },
  greed: {
    branch: 'defense',
    name: 'Алчность',
    sprite: 'TalentGreed',
    column: 3,
    effects: [flat('coinsPerKill', 1)],
    description: 'Увеличивает награду за убийство паука на {coinsPerKill} золота.',
  },
  quickInstinct: {
    branch: 'magic',
    name: 'Быстрое чутьё',
    sprite: 'TalentQuickInstinct',
    effects: ABILITY_ORDER.map((id) => percent(`${id}.cooldown`, -1.5)),
    description: 'Сокращает перезарядку всех способностей на {prep.cooldown}.',
  },
  hunterArsenal: {
    branch: 'magic',
    name: 'Арсенал охотника',
    sprite: 'TalentArsenal',
    effects: [flat('inventorySlots', 1)],
    description: 'Увеличивает количество мест для предметов в инвентаре на {inventorySlots}.',
  },
  improvedEndurance: {
    name: 'Улучшенная выносливость',
    branch: 'defense',
    column: 2,
    sprite: 'TalentImprovedEndurance',
    effects: [percent('endurance', 5)],
    growth: { stat: 'endurance', value: 1 },
    description:
      'Увеличивает выносливость на {endurance}.\nУвеличивает её прирост за уровень на 1 за ранг, включая уже полученные уровни.',
  },
  improvedAgility: {
    name: 'Улучшенная ловкость',
    branch: 'shooting',
    column: 2,
    sprite: 'TalentImprovedAgility',
    effects: [percent('agility', 5)],
    growth: { stat: 'agility', value: 1 },
    description:
      'Увеличивает ловкость на {agility}.\nУвеличивает её прирост за уровень на 1 за ранг, включая уже полученные уровни.',
  },
  improvedIntellect: {
    name: 'Улучшенный интеллект',
    branch: 'magic',
    sprite: 'TalentImprovedIntellect',
    effects: [percent('intellect', 5)],
    growth: { stat: 'intellect', value: 1 },
    description:
      'Увеличивает интеллект на {intellect}.\nУвеличивает его прирост за уровень на 1 за ранг, включая уже полученные уровни.',
  },
  magicArmor: {
    name: 'Магическая броня',
    branch: 'magic',
    sprite: 'TalentMagicArmor',
    effects: [],
    scaling: { attribute: 'intellect', step: 1, effect: flat('armor', 4) },
    description: 'Каждая единица интеллекта даёт {scaling.value} брони.',
  },
  divineShield: {
    name: 'Божественный щит',
    branch: 'defense',
    sprite: 'AbilityStand',
    column: 1,
    effects: [],
  },
  shieldBlock: {
    name: 'Блок щитом',
    branch: 'defense',
    sprite: 'TalentShieldBlock',
    column: 2,
    effects: [flat('blockChance', 0.05)],
    fixedEffects: [flat('blockPower', 50)],
    description: `Позволяет заблокировать атаку паука с вероятностью {blockChance}.\nПри блоке поглощает до {blockPower} + ${ATTRIBUTE_RULES.endurance.shieldBlockPerPoint * 100}% от выносливости урона.`,
  },
  lastHope: {
    name: 'Блок последней надежды',
    branch: 'defense',
    sprite: 'AbilityLastHope',
    prerequisite: { id: 'shieldBlock', rank: 8 },
    column: 2,
    effects: [],
  },
  improvedLastHope: {
    name: 'Улучшенный блок последней надежды',
    branch: 'defense',
    sprite: 'TalentImprovedLastHope',
    prerequisite: { id: 'lastHope', rank: 1 },
    column: 2,
    effects: [flat('lastHope.cooldown', -5), flat('lastHope.cost', -4)],
    description:
      '«Блок последней надежды» перезаряжается на {lastHope.cooldown} с быстрее и расходует на {lastHope.cost} энергии меньше.',
  },
  bestDefense: {
    name: 'Лучшая защита - это нападение',
    branch: 'defense',
    column: 2,
    sprite: 'TalentBestDefense',
    effects: [flat('blockVolleyChance', 0.01)],
    description: `Когда паук доходит до вас, с вероятностью {blockVolleyChance} выпускает бесплатный «Залп» со всеми улучшениями, даже если он не изучен.\nСрабатывает не чаще одного раза в ${BEST_DEFENSE_COOLDOWN} с и не мешает обычным выстрелам и способностям.`,
  },
  warriorArmor: {
    name: 'Броня воина',
    branch: 'defense',
    column: 1,
    sprite: 'TalentWarriorArmor',
    effects: [flat('armor', 250)],
    description: 'Увеличивает броню на {armor} единиц.',
  },
  titanArmor: {
    name: 'Броня титана',
    branch: 'defense',
    column: 1,
    sprite: 'TalentTitanArmor',
    effects: [percent('armor', 125)],
    description: 'Увеличивает броню на {armor}.',
  },
  willToWin: {
    name: 'Воля к победе',
    branch: 'defense',
    column: 3,
    sprite: 'TalentWillToWin',
    effects: [flat('levelDuration', -10)],
    description: 'Сокращает длительность уровня на {levelDuration} с.',
  },
  adrenaline: {
    name: 'Адреналин',
    branch: 'defense',
    column: 2,
    sprite: 'AbilityAdrenaline',
    prerequisite: { id: 'bestDefense', rank: 10 },
    effects: [],
  },
  marauder: {
    name: 'Мародер',
    branch: 'defense',
    column: 3,
    sprite: 'TalentMarauder',
    prerequisite: { id: 'hunterReward', rank: 5 },
    effects: [flat('breachRewardFraction', 0.15)],
    description:
      'Когда паук доходит до вас, вы получаете {breachRewardFraction} золота, которое он оставил бы при убийстве, с учётом всех прибавок и шанса тройной награды.',
  },
};
export const TALENT_ORDER = Object.keys(TALENTS) as TalentId[];
