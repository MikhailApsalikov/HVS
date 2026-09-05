import type { AbilityId, TalentId } from '../domain/types.js';
import type { GameState } from '../domain/model/GameState.js';
import type { ResolvedStats, StatId, StatModifier, PrimaryStatId } from '../domain/rules/stats.js';
import { ARMOR_RULES, STATS } from '../domain/rules/stats.js';
import { ABILITIES } from '../content/abilities.js';
import { TALENTS, TALENT_ORDER } from '../content/talents.js';

export function escapeHtml(text: string): string {
  return text.replace(
    /[&<>"']/g,
    (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]!,
  );
}
export function formatStat(id: StatId, value: number): string {
  if (
    id === 'damageFactor' ||
    id === 'armorReduction' ||
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
  const definition = TALENTS[id];
  const descriptions = definition.effects.map((effect) =>
    describeModifier({ ...effect, value: effect.value * rank }),
  );
  if (definition.scaling) {
    const { attribute, step, effect } = definition.scaling;
    descriptions.push(
      `${describeModifier({ ...effect, value: effect.value * rank })} за каждые ${step} ед. характеристики «${STATS[attribute].label}» (вниз)`,
    );
  }
  return descriptions.join('<br>');
}
export function attributeDescription(state: GameState, id: PrimaryStatId | 'armor'): string {
  const title = `<div class="tooltip__title">${STATS[id].label}: ${state.stats[id]}</div>`;
  if (id === 'armor')
    return `${title}${statRows(state.stats, ['armorReduction'])}<p>На уровне ${state.level}. Предел снижения бронёй: ${formatStat('armorReduction', ARMOR_RULES.cap)}.</p>`;
  const talentContributions = TALENT_ORDER.flatMap((talentId) => {
    const { scaling, name } = TALENTS[talentId];
    if (scaling?.attribute !== id) return [];
    return state.rules
      .explain(scaling.effect.stat)
      .modifiers.filter((modifier) => modifier.source === `talent:${talentId}`)
      .map(
        (modifier) =>
          `<div class="tooltip__stat">${describeModifier({ ...modifier, stat: scaling.effect.stat })} (${name})</div>`,
      );
  });
  return `${title}<p>Текущий вклад:</p>${state.rules.attributeEffects[id]
    .map((effect) => `<div class="tooltip__stat">${describeModifier(effect)}</div>`)
    .join('')}${talentContributions.join('')}`;
}
export function abilityDescription(state: GameState, id: AbilityId): string {
  const ability = ABILITIES[id];
  const stats: StatId[] = [`${id}.cost`, `${id}.cooldown`];
  if (ability.effectStat) stats.push(ability.effectStat);
  if (id === 'blizzard') stats.push('blizzard.slow');
  if (id === 'armageddon') stats.push('armageddon.charge');
  const cooldown = state.getAbility(id);
  const reasons = [
    ...(state.level < ability.unlockLevel ? [`Требуется уровень ${ability.unlockLevel}`] : []),
    ...(cooldown.isOnCooldown ? [`Перезарядка: ${cooldown.remainingCooldown.toFixed(2)} с`] : []),
    ...(state.energy < state.stats[`${id}.cost`] && !(id === 'freeze' && state.freezeActive)
      ? ['Недостаточно энергии']
      : []),
  ];
  return `<div class="tooltip__title">${ability.name} [${ability.key}]</div><p>${ability.description}</p>${statRows(state.stats, stats)}<div class="tooltip__stat">Открывается на уровне ${ability.unlockLevel}</div>${reasons.map((reason) => `<div class="action-unavailable">${reason}</div>`).join('')}`;
}
