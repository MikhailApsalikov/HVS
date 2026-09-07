import { ARMOR_RULES, ATTRIBUTE_RULES, type PrimaryStatId, type StatModifier } from './stats.js';

export function attributeModifiers(
  values: Readonly<Record<PrimaryStatId, number>>,
): Readonly<Record<PrimaryStatId, readonly StatModifier[]>> {
  const { endurance: e, agility: a, intellect: i } = values;
  const { endurance: er, agility: ar, intellect: ir } = ATTRIBUTE_RULES;
  const effect = (
    attribute: PrimaryStatId,
    stat: StatModifier['stat'],
    value: number,
    kind: StatModifier['kind'] = 'flat',
  ): StatModifier => ({ source: `attribute:${attribute}`, stat, kind, value });
  const shotPercent = Math.min(ar.percentCap, Math.floor(a / ar.shotStep));
  const volleyPercent = Math.min(ar.percentCap, Math.floor(a / ar.volleyStep));
  return {
    endurance: [
      effect('endurance', 'maxHp', Math.max(0, e - er.healthThreshold) * er.healthPerPoint),
      effect('endurance', 'hpRegen', e * er.regenPerPoint),
      effect('endurance', 'energyPerBreach', Math.floor(e / er.breachStep)),
      effect('endurance', 'levelDuration', -Math.floor(e / er.durationStep) * er.durationPerStep),
      effect('endurance', 'coinsPerKill', Math.floor(e / er.killCoinsStep)),
      effect('endurance', 'coinsPerSec', Math.floor(e / er.incomeStep) * er.incomePerStep),
      effect('endurance', 'armor', e * er.armorPerPoint),
      effect('endurance', 'lastHope.blockPower', e * er.lastHopeBlockPerPoint),
    ],
    agility: [
      effect('agility', 'shootCooldown', -shotPercent, 'percent'),
      effect('agility', 'arrowSpeed', shotPercent, 'percent'),
      effect('agility', 'volley.cooldown', -volleyPercent, 'percent'),
      effect('agility', 'energyPerKill', Math.floor(a / ar.killEnergyStep)),
    ],
    intellect: [
      effect('intellect', 'maxEnergy', Math.max(0, i - ir.energyThreshold) * ir.energyPerPoint),
      effect('intellect', 'energyRegen', i * ir.regenPerPoint),
      effect('intellect', 'heal.amount', i * ir.healPerPoint),
      effect('intellect', 'prep.restore', i * ir.prepPerPoint),
    ],
  };
}

export function armorReduction(armor: number, level: number, effectiveness: number): number {
  const levelProgress = Math.max(0, level - 1);
  const inflationProgress = levelProgress / (ARMOR_RULES.inflationReferenceLevel - 1);
  const scale =
    ARMOR_RULES.linearScale *
    (level + ARMOR_RULES.levelOffset) *
    (1 + ARMOR_RULES.inflationStrength * inflationProgress ** ARMOR_RULES.inflationPower);
  return Math.min(ARMOR_RULES.cap, armor / (armor + scale / effectiveness));
}
