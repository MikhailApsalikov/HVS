import type { ItemDefinition } from '../itemTypes.js';
import type { StatModifier } from './stats.js';
import { ABILITIES } from '../../content/abilities.js';

export function itemModifiers(
  item: ItemDefinition,
  source: string,
  includeAbility = true,
): StatModifier[] {
  const modifiers: StatModifier[] = item.stats.map((stat) =>
    stat.type === 'damageReduction'
      ? { source, stat: 'incomingDamage', kind: 'percent', value: -stat.value }
      : { source, stat: stat.type, kind: stat.kind ?? 'flat', value: stat.value },
  );
  const mod = item.abilityMod;
  if (!mod || !includeAbility) return modifiers;
  if (mod.modType === 'costReduction' || mod.modType === 'cooldownReduction') {
    modifiers.push({
      source,
      stat: `${mod.abilityId}.${mod.modType === 'costReduction' ? 'cost' : 'cooldown'}`,
      kind: 'flat',
      value: -mod.value,
    });
  } else {
    const ability = ABILITIES[mod.abilityId];
    if (ability.effectStat)
      modifiers.push({
        source,
        stat: ability.effectStat,
        kind: ability.effectKind ?? 'flat',
        value: ability.effectKind === 'percent' ? mod.value * 100 : mod.value,
      });
  }
  return modifiers;
}
