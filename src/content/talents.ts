import type { TalentId } from '../domain/types.js';
import type { StatModifier } from '../domain/rules/stats.js';
import { ABILITY_ORDER } from './abilities.js';

type Effect = Omit<StatModifier, 'source'>;
interface TalentDefinition {
  readonly name: string;
  readonly sprite: string;
  readonly effects: readonly Effect[];
}
const flat = (stat: Effect['stat'], value: number): Effect => ({ stat, kind: 'flat', value });
const percent = (stat: Effect['stat'], value: number): Effect => ({ stat, kind: 'percent', value });

/** Per-rank strength; a talent contributes ONE modifier per affected stat. */
export const TALENTS: Readonly<Record<TalentId, TalentDefinition>> = {
  endurance: {
    name: 'Выносливость',
    sprite: 'TalentEndurance',
    effects: [flat('maxHp', 425), flat('energyPerBreach', 3)],
  },
  spiderArmor: {
    name: 'Защита от пауков',
    sprite: 'TalentArmor',
    effects: [percent('incomingDamage', -7)],
  },
  tireless: {
    name: 'Неутомимость',
    sprite: 'TalentTireless',
    effects: [percent('energyRegen', 10)],
  },
  agility: { name: 'Ловкость', sprite: 'TalentAgility', effects: [flat('maxEnergy', 120)] },
  healBoost: {
    name: 'Усиленное лечение',
    sprite: 'TalentHealBoost',
    effects: [flat('heal.amount', 150), flat('hpRegen', 2)],
  },
  hunterMastery: {
    name: 'Мастерство охотника',
    sprite: 'TalentHunter',
    effects: [flat('shootCost', -2)],
  },
  improvedPrep: {
    name: 'Улучшенная подготовка',
    sprite: 'TalentPrep',
    effects: [flat('prep.cooldown', -6)],
  },
  volleyMastery: {
    name: 'Искусный залп',
    sprite: 'TalentVolleyMastery',
    effects: [flat('volley.lanes', 1)],
  },
  rapidFire: {
    name: 'Скорострельность',
    sprite: 'TalentRapidFire',
    effects: [
      percent('shootCooldown', -10),
      percent('volley.cooldown', -10),
      percent('arrowSpeed', 10),
    ],
  },
  dutyBound: {
    name: 'Чувство долга',
    sprite: 'TalentDuty',
    effects: [flat('stand.duration', 1), flat('stand.cooldown', -12)],
  },
  blizzardMastery: {
    name: 'Беспощадная вьюга',
    sprite: 'TalentBlizzardMastery',
    effects: [flat('blizzard.slow', 0.07), flat('blizzard.duration', 1)],
  },
  hunterReward: {
    name: 'Награда охотника',
    sprite: 'TalentHunterReward',
    effects: [flat('jackpotChance', 0.07)],
  },
  quickInstinct: {
    name: 'Быстрое чутьё',
    sprite: 'TalentQuickInstinct',
    effects: ABILITY_ORDER.map((id) => percent(`${id}.cooldown`, -1.5)),
  },
  hunterArsenal: {
    name: 'Арсенал охотника',
    sprite: 'TalentHunter',
    effects: [flat('inventorySlots', 1)],
  },
};
export const TALENT_ORDER = Object.keys(TALENTS) as TalentId[];
