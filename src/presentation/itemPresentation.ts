import type { ItemDefinition, StatType } from '../domain/itemTypes.js';
import { itemModifiers } from '../domain/rules/itemModifiers.js';
import { ABILITIES } from '../content/abilities.js';
import { formatStat } from './presenters.js';

export interface ItemFilters {
  readonly name: string;
  readonly stat: StatType | '';
}

const normalize = (text: string): string =>
  text.toLocaleLowerCase('ru').replaceAll('ё', 'е').trim().replace(/\s+/g, ' ');

export function filterAndSortItems(
  items: readonly ItemDefinition[],
  filters: ItemFilters,
): ItemDefinition[] {
  const name = normalize(filters.name);
  return items
    .filter(
      (item) =>
        normalize(item.name).includes(name) &&
        (!filters.stat || item.stats.some((stat) => stat.type === filters.stat)),
    )
    .sort((a, b) => a.price - b.price);
}

function counted(value: number, one: string, few: string, many: string): string {
  if (!Number.isInteger(value)) return few;
  const last = Math.abs(value) % 10;
  const lastTwo = Math.abs(value) % 100;
  return last === 1 && lastTwo !== 11
    ? one
    : last >= 2 && last <= 4 && (lastTwo < 12 || lastTwo > 14)
      ? few
      : many;
}

const STAT_NAMES: Record<Exclude<StatType, 'coinsPerKill'>, string> = {
  armor: 'брони',
  endurance: 'выносливости',
  agility: 'ловкости',
  intellect: 'интеллекта',
  hpRegen: 'здоровья в секунду',
  energyRegen: 'энергии в секунду',
  maxEnergy: 'максимальной энергии',
  energyPerKill: 'энергии за убийство',
  criticalShotChance: 'шанса критического выстрела',
};

export function itemStatLines(item: ItemDefinition): string[] {
  const stats = [...item.stats].sort(
    (a, b) => Number(b.type === 'armor') - Number(a.type === 'armor'),
  );
  return stats.map(({ type, value, kind }) => {
    const amount = (kind === 'percent' ? `${value}%` : formatStat(type, value)).replace('.', ',');
    const sign = type !== 'armor' && value > 0 ? '+' : '';
    const name =
      type === 'coinsPerKill'
        ? `${counted(value, 'монета', 'монеты', 'монет')} за убийство`
        : STAT_NAMES[type];
    return `${sign}${amount} ${name}`;
  });
}

export function itemAbilityDescription(item: ItemDefinition): string | null {
  const effect = itemModifiers(item, 'preview')[item.stats.length];
  if (!effect || !item.abilityMod) return null;
  const name = `«${ABILITIES[item.abilityMod.abilityId].name}»`;
  const value = Math.abs(effect.value);
  const amount = (effect.kind === 'percent' ? `${value}%` : formatStat(effect.stat, value)).replace(
    '.',
    ',',
  );
  const seconds = `${amount} ${counted(value, 'секунду', 'секунды', 'секунд')}`;
  if (effect.stat.endsWith('.cooldown'))
    return `Сокращает время восстановления способности ${name} на ${seconds}.`;
  if (effect.stat.endsWith('.cost'))
    return `Снижает расход энергии способности ${name} на ${amount}.`;
  if (effect.stat.endsWith('.duration'))
    return `Увеличивает длительность способности ${name} на ${seconds}.`;
  if (effect.stat === 'volley.lanes')
    return `Увеличивает количество стрел, выпускаемых способностью ${name}, на ${amount}.`;
  if (effect.stat === 'heal.amount')
    return `Увеличивает количество здоровья, восстанавливаемого способностью ${name}, на ${amount}.`;
  if (effect.stat === 'prep.restore')
    return `Увеличивает количество энергии, восстанавливаемой способностью ${name}, на ${amount}.`;
  return item.abilityMod.description;
}
