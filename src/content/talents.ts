import type { TalentId, TalentBranch } from '../domain/types.js';
import type { StatModifier, PrimaryStatId } from '../domain/rules/stats.js';
import {
  ATTRIBUTE_RULES,
  BEST_DEFENSE_COOLDOWN,
  CRITICAL_SHOT_POWER,
  HUNTER_REWARD,
  IMPROVED_CRITICAL_SHOT_POWER,
  LEARNING_FROM_MISTAKES,
  FIRE_EXPLOSION,
  MASOCHISM,
  ICE_ARROWS,
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
    readonly mode?: 'steps' | 'continuous';
    readonly effect: Effect;
    readonly additionalEffects?: readonly (Effect & { readonly basePerRank?: number })[];
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
    effects: [percent('incomingDamage', -5)],
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
    effects: [flat('heal.cooldown', -2), flat('hpRegen', 5)],
    scaling: { attribute: 'endurance', step: 1, effect: flat('heal.amount', 0.4) },
    description:
      '«Лечение» восстанавливает дополнительно {scaling.percent}% от выносливости и перезаряжается на {heal.cooldown} с быстрее.\nТакже вы восстанавливаете дополнительно {hpRegen} здоровья каждую секунду.',
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
    effects: [flat('criticalShotChance', 0.03)],
    description: `Каждый выстрел, кроме стрел «Залпа», с вероятностью {criticalShotChance} становится критическим.\nКритическая стрела убивает до ${CRITICAL_SHOT_POWER} пауков. Энергия даётся только за первого паука в цепочке.`,
  },
  eagleEye: {
    branch: 'shooting',
    column: 2,
    name: 'Зоркость',
    sprite: 'AbilityEagleEye',
    prerequisite: { id: 'criticalShot', rank: 5 },
    effects: [],
  },
  improvedCriticalShot: {
    branch: 'shooting',
    column: 3,
    name: 'Улучшенный критический выстрел',
    sprite: 'TalentImprovedCriticalShot',
    prerequisite: { id: 'eagleEye', rank: 1 },
    effects: [],
    scaling: {
      attribute: 'agility',
      step: 50,
      basePerRank: 0.04,
      effect: flat('improvedCriticalShotChance', 0.001),
      additionalEffects: [
        { ...flat('eagleEye.improvedCriticalShotChance', 0.00075), basePerRank: 0.03 },
      ],
    },
    description: `С вероятностью {scaling.base} критическая стрела убивает до ${IMPROVED_CRITICAL_SHOT_POWER} пауков вместо ${CRITICAL_SHOT_POWER}.\nШанс дополнительно повышается на {scaling.value} за каждые {scaling.step} полных единиц ловкости. Во время «Зоркости» весь бонус этого таланта увеличен на 75%.`,
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
    scaling: {
      attribute: 'agility',
      step: 40,
      basePerRank: 5,
      mode: 'continuous',
      effect: flat('hpPerKill', 1),
    },
    description:
      'При убийстве паука восстанавливает {scaling.base} здоровья и дополнительно {scaling.value} за каждые {scaling.step} единиц ловкости.\nПрибавка от ловкости рассчитывается точно; итоговое лечение округляется до целого.',
  },
  masochism: {
    branch: 'shooting',
    column: 3,
    name: 'Мазохизм',
    sprite: 'TalentMasochism',
    effects: [],
    description: `При нехватке энергии выстрелы, «Залп» и «Прицельный огонь» расходуют здоровье: {masochismHealthPerEnergy} за единицу энергии.\nЗдоровье при этом не опускается ниже {masochismMinHpPercent}% максимума.\nЕсли удар паука оставляет вам меньше ${MASOCHISM.triggerHpFraction * 100}% здоровья, вы получаете +{masochismAgility} ловкости на ${MASOCHISM.duration} секунд.`,
  },
  improvedPrep: {
    branch: 'magic',
    name: 'Улучшенная подготовка',
    sprite: 'TalentPrep',
    effects: [flat('prep.cooldown', -2), flat('prep.duration', 1)],
    description:
      'Сокращает перезарядку «Подготовки» на {prep.cooldown} с и продлевает усиленное восстановление энергии на {prep.duration} с.',
  },
  recharge: {
    branch: 'magic',
    column: 2,
    name: 'Перезарядка',
    sprite: 'AbilityRecharge',
    prerequisite: { id: 'quickInstinct', rank: 10 },
    effects: [],
  },
  permafrost: {
    branch: 'magic',
    name: 'Вечная мерзлота',
    sprite: 'TalentPermafrost',
    effects: [flat('permafrostSlow', 0.06)],
    description: 'Снижает скорость передвижения всех пауков на {permafrostSlow}.',
  },
  lightningArrows: {
    branch: 'magic',
    column: 3,
    name: 'Стрелы молний',
    sprite: 'AbilityLightningArrows',
    effects: [],
  },
  improvedLightning: {
    branch: 'magic',
    column: 3,
    name: 'Улучшенные молнии',
    sprite: 'TalentImprovedLightning',
    prerequisite: { id: 'lightningArrows', rank: 1 },
    effects: [flat('lightningArrows.jumps', 1), flat('lightningArrows.delay', -0.05)],
    description:
      'Увеличивает число перескоков «Стрел молний» на {lightningArrows.jumps} и незначительно ускоряет цепь молний.',
  },
  fireExplosion: {
    branch: 'magic',
    column: 2,
    name: 'Огненный взрыв',
    sprite: 'TalentFireExplosion',
    effects: [flat('fireExplosion.radius', 0.12 * 1.3)],
    fixedEffects: [flat('fireExplosion.chance', FIRE_EXPLOSION.chance)],
    description: `Убийство паука стрелой с вероятностью {explosionChance} вызывает огненный взрыв, поражающий пауков рядом. Каждый ранг увеличивает область взрыва, а с ${FIRE_EXPLOSION.adjacentRank}-го ранга он задевает и соседние линии. Не расходует энергию.`,
  },
  improvedArmageddon: {
    branch: 'magic',
    column: 2,
    name: 'Улучшенный армагеддон',
    sprite: 'TalentImprovedArmageddon',
    effects: [flat('armageddon.cooldown', -10), flat('armageddon.duration', 0.5)],
    description:
      'Снижает перезарядку «Армагеддона» на {armageddon.cooldown} с и увеличивает его длительность на {armageddon.duration} с.',
  },
  lightningShield: {
    branch: 'magic',
    column: 3,
    name: 'Щит молний',
    sprite: 'AbilityLightningShield',
    effects: [],
  },
  titanPreparation: {
    branch: 'shooting',
    column: 2,
    name: 'Подготовка титана',
    sprite: 'TalentTitanPreparation',
    effects: [flat('prep.stacks', 2)],
    description:
      '«Подготовка» доводит число эффектов «Череды убийств» до {prep.stacks}, даже если этот талант не изучен.',
  },
  aimedFire: {
    branch: 'shooting',
    column: 2,
    name: 'Прицельный огонь',
    sprite: 'AbilityAimedFire',
    prerequisite: { id: 'titanPreparation', rank: 5 },
    effects: [],
  },
  killingStreak: {
    branch: 'shooting',
    column: 1,
    name: 'Череда убийств',
    sprite: 'TalentKillingStreak',
    effects: [flat('killingStreak.interval', -5)],
    description:
      'Каждые {streakInterval} с без урона получаете эффект «Череда убийств»: выстрелы стоят на 1 энергию меньше.\nЭффект складывается до {streakBaseStacks} раз. Урон от паука снимает один эффект.',
  },
  enthusiasm: {
    branch: 'shooting',
    column: 1,
    name: 'Увлеченность',
    sprite: 'TalentEnthusiasm',
    prerequisite: { id: 'killingStreak', rank: 5 },
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
    effects: [
      flat('volley.lanes', 1),
      percent('volley.cooldown', -4),
      percent('aimedFire.cooldown', -4),
      flat('volley.cost', -2),
    ],
    description:
      'Увеличивает число стрел «Залпа» на {volley.lanes} и снижает его стоимость на {volley.cost} энергии.\nСокращает перезарядку «Залпа» и «Прицельного огня» на {volley.cooldown}.',
  },
  rapidFire: {
    branch: 'shooting',
    column: 3,
    name: 'Скорострельность',
    sprite: 'TalentRapidFire',
    effects: [
      percent('shootCooldown', -7),
      percent('volley.cooldown', -7),
      percent('aimedFire.cooldown', -7),
    ],
    description:
      'Сокращает перезарядку выстрела на {shootCooldown}, а «Залпа» и «Прицельного огня» — на {volley.cooldown}.',
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
    column: 1,
    name: 'Беспощадная вьюга',
    sprite: 'TalentBlizzardMastery',
    effects: [flat('blizzard.slow', 0.04), flat('blizzard.duration', 1)],
    description:
      'Усиливает замедление пауков от «Вьюги» на {blizzard.slow} и продлевает её действие на {blizzard.duration} с.',
  },
  hunterReward: {
    branch: 'defense',
    name: 'Награда охотника',
    sprite: 'TalentHunterReward',
    prerequisite: { id: 'greed', rank: 5 },
    column: 3,
    effects: [flat('jackpotChance', 0.07), flat('goldenJackpotChance', 0.2)],
    description: `С вероятностью {jackpotChance} вы получаете тройную награду за убитого паука; для золотого паука шанс — {goldenJackpotChance}.\nТройная награда за убийство золотого паука даёт «Награду охотника» на ${HUNTER_REWARD.duration} с: +${HUNTER_REWARD.incomePercent}% пассивного золота и +${HUNTER_REWARD.armorPercent}% брони.`,
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
    column: 2,
    name: 'Быстрое чутьё',
    sprite: 'TalentQuickInstinct',
    effects: ABILITY_ORDER.map((id) => percent(`${id}.cooldown`, -2)),
    description: 'Сокращает перезарядку всех способностей на {prep.cooldown}.',
  },
  iceArrows: {
    branch: 'magic',
    column: 1,
    name: 'Ледяные стрелы',
    sprite: 'TalentIceArrows',
    prerequisite: { id: 'blizzardMastery', rank: 6 },
    effects: [flat('iceArrows.chance', 0.12), flat('iceArrows.adjacentChance', 0.04)],
    description: `При каждом попадании любой стрелы с вероятностью {iceArrows.chance} примораживает к земле всех живых пауков на линии попадания на ${ICE_ARROWS.duration} с.\nВ эту вероятность входит {iceArrows.adjacentChance} на одновременную заморозку своей и соседних линий. Действует со стрелами залпа, критическими и электрическими стрелами.`,
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
    column: 3,
    prerequisite: { id: 'lightningShield', rank: 1 },
    sprite: 'TalentMagicArmor',
    effects: [],
    scaling: {
      attribute: 'intellect',
      step: 1,
      effect: flat('armor', 15),
      additionalEffects: [flat('spiderDebuffResistance', 0.0001)],
    },
    description:
      'Каждая единица интеллекта даёт {scaling.value} брони и снижает эффективность дебаффов пауков на {scaling.spiderDebuffResistance}.\nПри снижении эффективности на 100% вы становитесь невосприимчивы к дебаффам пауков, кроме «Оглушения».',
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
    effects: [flat('blockChance', 0.06)],
    fixedEffects: [flat('blockPower', 40)],
    description: `Позволяет заблокировать атаку паука с вероятностью {blockChance}.\nПри блоке поглощает до {blockPower} + ${ATTRIBUTE_RULES.endurance.shieldBlockPerPoint * 100}% от выносливости урона.`,
  },
  lastHope: {
    name: 'Блок последней надежды',
    branch: 'defense',
    sprite: 'AbilityLastHope',
    prerequisite: { id: 'shieldBlock', rank: 7 },
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
    effects: [flat('blockVolleyChance', 0.006)],
    description: `Когда паук доходит до вас, с вероятностью {blockVolleyChance} выпускает бесплатный «Залп» со всеми улучшениями.\nСрабатывает не чаще одного раза в ${BEST_DEFENSE_COOLDOWN} с и не мешает обычным выстрелам и способностям.`,
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
    effects: [percent('armor', 75)],
    description:
      'Увеличивает броню на {armor}.\nЕсли на вас нет дебаффов от пауков, дополнительно снижает урон от пауков на {titanDamageReduction}%.',
  },
  learningFromMistakes: {
    name: 'Обучение на ошибках',
    branch: 'shooting',
    column: 1,
    sprite: 'AbilityStand',
    effects: [],
    description: `Получая от одного удара паука урон не меньше {learningDamageThreshold}% максимального здоровья после брони и блока, вы снимаете все дебаффы от пауков и становитесь неуязвимы на {learningShieldDuration} с. Срабатывает не чаще раза в ${LEARNING_FROM_MISTAKES.shieldCooldown} с.\nСмертельный удар оставляет вам 1 здоровья и даёт {learningFatalShieldDuration} с неуязвимости, даже если первый эффект ещё восстанавливается.\nПосле спасения вы получаете «Истощение» на ${LEARNING_FROM_MISTAKES.exhaustionDuration / 60} минут: ловкость снижена на ${LEARNING_FROM_MISTAKES.exhaustionAgilityPercent}%, талант и получение неуязвимости недоступны. «Истощение» нельзя снять.\nДлительность неуязвимости от таланта нельзя увеличить.`,
  },
  willToWin: {
    name: 'Воля к победе',
    branch: 'shooting',
    column: 3,
    sprite: 'TalentWillToWin',
    effects: [flat('levelDuration', -15), flat('shopDiscount', 6)],
    description:
      'Сокращает длительность уровня на {levelDuration} с.\nСнижает цену покупки всех предметов в лавке на {shopDiscount}%. Цена продажи не меняется.',
  },
  poisonResistance: {
    name: 'Устойчивость к ядам',
    branch: 'defense',
    column: 3,
    sprite: 'TalentPoisonResistance',
    effects: [percent('spiderDebuffDuration', -8)],
    description: 'Сокращает длительность всех дебаффов от пауков на {spiderDebuffDuration}.',
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
      'Когда паук доходит до вас, вы получаете {breachRewardFraction} обычной награды за его убийство, с учётом всех прибавок и шанса тройной награды. Дополнительное золото золотого паука при прорыве не начисляется.',
  },
};
export const TALENT_ORDER = Object.keys(TALENTS) as TalentId[];
