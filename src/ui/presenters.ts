import type { AbilityId, TalentId } from '../domain/types.js';
import type { GameState } from '../domain/model/GameState.js';
import type { ResolvedStats, StatId, StatModifier } from '../domain/rules/stats.js';
import { STATS } from '../domain/rules/stats.js';
import { ABILITIES } from '../content/abilities.js';
import { TALENTS } from '../content/talents.js';

export function escapeHtml(text: string): string {
  return text.replace(
    /[&<>"']/g,
    (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]!,
  );
}
export function formatStat(id: StatId, value: number): string {
  if (
    id === 'damageFactor' ||
    id === 'blizzard.slow' ||
    id === 'jackpotChance' ||
    id === 'spawnProbability'
  )
    return `${Number((value * 100).toFixed(4))}%`;
  return String(Number(value.toFixed(STATS[id].policy.digits)));
}
export function statRows(stats: ResolvedStats, ids: readonly StatId[]): string {
  return ids
    .map(
      (id) =>
        `<div class="tooltip__stat">${STATS[id].label}: <b>${formatStat(id, stats[id])}</b></div>`,
    )
    .join('');
}
export function describeModifier(modifier: Omit<StatModifier, 'source'>): string {
  const { stat, kind, value } = modifier;
  const sign = value > 0 ? '+' : '';
  const amount = kind === 'percent' ? `${Number(value.toFixed(4))}%` : formatStat(stat, value);
  const points =
    kind === 'flat' && (stat === 'jackpotChance' || stat === 'blizzard.slow')
      ? ' (процентные пункты)'
      : '';
  return `${STATS[stat].label}: ${sign}${amount}${points}`;
}
export function talentDescription(id: TalentId, rank = 1): string {
  return TALENTS[id].effects
    .map((effect) => describeModifier({ ...effect, value: effect.value * rank }))
    .join('<br>');
}
export function abilityDescription(state: GameState, id: AbilityId): string {
  const ability = ABILITIES[id];
  const stats: StatId[] = [`${id}.cost`, `${id}.cooldown`];
  if (ability.effectStat) stats.push(ability.effectStat);
  if (id === 'blizzard') stats.push('blizzard.slow');
  if (id === 'armageddon') stats.push('armageddon.charge');
  return `<div class="tooltip__title">${ability.name} [${ability.key}]</div><p>${ability.description}</p>${statRows(state.stats, stats)}<div class="tooltip__stat">Открывается на уровне ${ability.unlockLevel}</div>`;
}
