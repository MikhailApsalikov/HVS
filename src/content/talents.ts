import type { TalentId, TalentBranch } from '../domain/types.js';
import type { StatModifier, PrimaryStatId } from '../domain/rules/stats.js';
import { ABILITY_ORDER } from './abilities.js';

type Effect = Omit<StatModifier, 'source'>;
interface TalentDefinition {
  readonly name: string;
  readonly sprite: string;
  readonly branch: TalentBranch;
  readonly effects: readonly Effect[];
  readonly description?: string;
  readonly fixedEffects?: readonly Effect[];
  readonly prerequisite?: { readonly id: TalentId; readonly rank: number };
  readonly column?: 1 | 2 | 3;
  readonly scaling?: {
    readonly attribute: PrimaryStatId;
    readonly step: number;
    readonly effect: Effect;
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
    effects: [flat('maxHp', 425), flat('energyPerBreach', 3)],
    description:
      'Увеличивает максимальное здоровье на {maxHp} единиц.\nКогда паук доходит до вас и наносит вам урон, вы получаете {energyPerBreach} энергии.',
  },
  spiderArmor: {
    branch: 'defense',
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
    effects: [flat('heal.amount', 150), flat('hpRegen', 2)],
    description:
      '«Лечение» восстанавливает на {heal.amount} здоровья больше.\nТакже вы восстанавливаете дополнительно {hpRegen} здоровья каждую секунду.',
  },
  hunterMastery: {
    branch: 'shooting',
    name: 'Мастерство охотника',
    sprite: 'TalentHunter',
    effects: [flat('shootCost', -2)],
    description: 'Каждый выстрел лучника расходует на {shootCost} энергии меньше.',
  },
  improvedPrep: {
    branch: 'magic',
    name: 'Улучшенная подготовка',
    sprite: 'TalentPrep',
    effects: [flat('prep.cooldown', -6)],
    description: 'Сокращает перезарядку «Подготовки» на {prep.cooldown} с.',
  },
  volleyMastery: {
    branch: 'shooting',
    name: 'Искусный залп',
    sprite: 'TalentVolleyMastery',
    effects: [flat('volley.lanes', 1)],
    description: 'Увеличивает число стрел «Залпа» на {volley.lanes}.',
  },
  rapidFire: {
    branch: 'shooting',
    name: 'Скорострельность',
    sprite: 'TalentRapidFire',
    effects: [
      percent('shootCooldown', -5),
      percent('volley.cooldown', -5),
      percent('arrowSpeed', 5),
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
    branch: 'shooting',
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
    description: 'Увеличивает выносливость на {endurance}.',
  },
  improvedAgility: {
    name: 'Улучшенная ловкость',
    branch: 'shooting',
    sprite: 'TalentImprovedAgility',
    effects: [percent('agility', 5)],
    description: 'Увеличивает ловкость на {agility}.',
  },
  improvedIntellect: {
    name: 'Улучшенный интеллект',
    branch: 'magic',
    sprite: 'TalentImprovedIntellect',
    effects: [percent('intellect', 5)],
    description: 'Увеличивает интеллект на {intellect}.',
  },
  magicArmor: {
    name: 'Магическая броня',
    branch: 'magic',
    sprite: 'TalentMagicArmor',
    effects: [],
    scaling: { attribute: 'intellect', step: 5, effect: flat('armor', 3) },
    description: 'Каждые {scaling.step} полных единиц интеллекта дают {scaling.value} брони.',
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
    effects: [flat('blockChance', 0.08)],
    fixedEffects: [flat('blockPower', 50)],
    description:
      'Позволяет заблокировать атаку паука с вероятностью {blockChance}.\nПри блоке поглощает до {blockPower} урона.',
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
    effects: [flat('lastHope.cooldown', -10), flat('lastHope.cost', -4)],
    description:
      '«Блок последней надежды» перезаряжается на {lastHope.cooldown} с быстрее и расходует на {lastHope.cost} энергии меньше.',
  },
  bestDefense: {
    name: 'Лучшая защита - это нападение',
    branch: 'defense',
    column: 2,
    sprite: 'TalentBestDefense',
    effects: [flat('blockVolleyChance', 0.02)],
    description:
      'При успешном блоке с вероятностью {blockVolleyChance} выпускает «Залп» со всеми его улучшениями.\nЭтот залп не расходует энергию и может сработать во время перезарядки. Перезарядка «Залпа» и лучников при этом не меняется.',
  },
  warriorArmor: {
    name: 'Броня воина',
    branch: 'defense',
    column: 1,
    sprite: 'TalentWarriorArmor',
    effects: [flat('armor', 80)],
    description: 'Увеличивает броню на {armor} единиц.',
  },
  titanArmor: {
    name: 'Броня титана',
    branch: 'defense',
    column: 1,
    sprite: 'TalentTitanArmor',
    effects: [percent('armor', 25)],
    description: 'Увеличивает броню на {armor}.',
  },
};
export const TALENT_ORDER = Object.keys(TALENTS) as TalentId[];
