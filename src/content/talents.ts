import type { TalentId, TalentBranch } from '../domain/types.js';
import type { StatModifier, PrimaryStatId } from '../domain/rules/stats.js';
import { ABILITY_ORDER } from './abilities.js';

type Effect = Omit<StatModifier, 'source'>;
interface TalentDefinition {
  readonly name: string;
  readonly sprite: string;
  readonly branch: TalentBranch;
  readonly effects: readonly Effect[];
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
export const TALENT_TIER_RULES = { levelsPerTier: 10, pointsPerTier: 5 } as const;
const flat = (stat: Effect['stat'], value: number): Effect => ({ stat, kind: 'flat', value });
const percent = (stat: Effect['stat'], value: number): Effect => ({ stat, kind: 'percent', value });

/** Per-rank strength; a talent contributes ONE modifier per affected stat. */
export const TALENTS: Readonly<Record<TalentId, TalentDefinition>> = {
  endurance: {
    name: 'Стойкость',
    branch: 'defense',
    sprite: 'TalentEndurance',
    effects: [flat('maxHp', 425), flat('energyPerBreach', 3)],
  },
  spiderArmor: {
    branch: 'defense',
    name: 'Защита от пауков',
    sprite: 'TalentArmor',
    effects: [percent('incomingDamage', -7)],
  },
  tireless: {
    branch: 'magic',
    name: 'Неутомимость',
    sprite: 'TalentTireless',
    effects: [flat('energyRegen', 1)],
  },
  agility: {
    name: 'Эффективность',
    branch: 'magic',
    sprite: 'TalentAgility',
    effects: [flat('maxEnergy', 60)],
  },
  healBoost: {
    branch: 'magic',
    name: 'Усиленное лечение',
    sprite: 'TalentHealBoost',
    effects: [flat('heal.amount', 150), flat('hpRegen', 2)],
  },
  hunterMastery: {
    branch: 'shooting',
    name: 'Мастерство охотника',
    sprite: 'TalentHunter',
    effects: [flat('shootCost', -2)],
  },
  improvedPrep: {
    branch: 'magic',
    name: 'Улучшенная подготовка',
    sprite: 'TalentPrep',
    effects: [flat('prep.cooldown', -6)],
  },
  volleyMastery: {
    branch: 'shooting',
    name: 'Искусный залп',
    sprite: 'TalentVolleyMastery',
    effects: [flat('volley.lanes', 1)],
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
  },
  dutyBound: {
    branch: 'defense',
    name: 'Чувство долга',
    sprite: 'TalentDuty',
    effects: [flat('stand.duration', 1), flat('stand.cooldown', -12)],
  },
  blizzardMastery: {
    branch: 'shooting',
    name: 'Беспощадная вьюга',
    sprite: 'TalentBlizzardMastery',
    effects: [flat('blizzard.slow', 0.07), flat('blizzard.duration', 1)],
  },
  hunterReward: {
    branch: 'defense',
    name: 'Награда охотника',
    sprite: 'TalentHunterReward',
    effects: [flat('jackpotChance', 0.07)],
  },
  quickInstinct: {
    branch: 'magic',
    name: 'Быстрое чутьё',
    sprite: 'TalentQuickInstinct',
    effects: ABILITY_ORDER.map((id) => percent(`${id}.cooldown`, -1.5)),
  },
  hunterArsenal: {
    branch: 'magic',
    name: 'Арсенал охотника',
    sprite: 'TalentHunter',
    effects: [flat('inventorySlots', 1)],
  },
  improvedEndurance: {
    name: 'Улучшенная выносливость',
    branch: 'defense',
    sprite: 'TalentEndurance',
    effects: [percent('endurance', 5)],
  },
  improvedAgility: {
    name: 'Улучшенная ловкость',
    branch: 'shooting',
    sprite: 'TalentAgility',
    effects: [percent('agility', 5)],
  },
  improvedIntellect: {
    name: 'Улучшенный интеллект',
    branch: 'magic',
    sprite: 'TalentTireless',
    effects: [percent('intellect', 5)],
  },
  magicArmor: {
    name: 'Магическая броня',
    branch: 'magic',
    sprite: 'TalentArmor',
    effects: [],
    scaling: { attribute: 'intellect', step: 5, effect: flat('armor', 1) },
  },
};
export const TALENT_ORDER = Object.keys(TALENTS) as TalentId[];
