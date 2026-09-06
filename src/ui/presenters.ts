import type { AbilityId, TalentId } from '../domain/types.js';
import type { GameState } from '../domain/model/GameState.js';
import type { ResolvedStats, StatId, StatModifier, PrimaryStatId } from '../domain/rules/stats.js';
import { ARMOR_RULES, ATTRIBUTE_RULES, STATS } from '../domain/rules/stats.js';
import { ABILITIES, ABILITY_ORDER } from '../content/abilities.js';
import { TALENTS, TALENT_ORDER } from '../content/talents.js';
import { talentRankEffects } from '../domain/model/TalentSystem.js';

export function escapeHtml(text: string): string {
  return text.replace(
    /[&<>"']/g,
    (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]!,
  );
}
export function formatSeconds(value: number): string {
  return String(Math.ceil(Math.max(0, value)));
}
export function formatStat(id: StatId, value: number): string {
  if (
    id.endsWith('.cooldown') ||
    id.endsWith('.duration') ||
    id === 'armageddon.charge' ||
    id === 'shootCooldown' ||
    id === 'levelDuration' ||
    id === 'spawnInterval'
  )
    return value < 0 ? `-${formatSeconds(-value)}` : formatSeconds(value);
  if (id === 'damageFactor' || id === 'armorReduction')
    return `${Number((value * 100).toFixed(1))}%`;
  if (
    id === 'blockChance' ||
    id === 'blockVolleyChance' ||
    id === 'lastHope.blockChance' ||
    id === 'blizzard.slow' ||
    id === 'jackpotChance' ||
    id === 'spawnProbability'
  )
    return `${Number((value * 100).toFixed(4))}%`;
  return String(Number(value.toFixed(STATS[id].policy.digits)));
}
export function describeModifier(modifier: Omit<StatModifier, 'source'>): string {
  const { stat, kind, value } = modifier;
  const sign = value > 0 ? '+' : '';
  const amount = kind === 'percent' ? `${Number(value.toFixed(4))}%` : formatStat(stat, value);
  const points =
    kind === 'flat' &&
    (stat === 'jackpotChance' ||
      stat === 'blizzard.slow' ||
      stat === 'blockChance' ||
      stat === 'blockVolleyChance')
      ? ' (процентные пункты)'
      : '';
  return `${STATS[stat].label}: ${sign}${amount}${points}`;
}
function fillDescription(template: string, value: (key: string) => string): string {
  return template.replace(/\{([\w.]+)\}/g, (_, key: string) => value(key));
}
function percentagePoints(value: number): string {
  return `${Number((value * 100).toFixed(4))} процентных пунктов`;
}
export function descriptionParagraphs(text: string): string {
  return text
    .split('\n')
    .filter(Boolean)
    .map((line) => `<p class="tooltip__effect">${escapeHtml(line)}</p>`)
    .join('');
}
export function talentDescription(id: TalentId, rank: number, stats: ResolvedStats): string {
  const definition = TALENTS[id];
  const effects = talentRankEffects(id, rank);
  if (definition.description)
    return fillDescription(definition.description, (key) => {
      if (key === 'scaling.step') return String(definition.scaling!.step);
      if (key === 'scaling.value') return String(definition.scaling!.effect.value * rank);
      const effect = effects.find(({ stat }) => stat === key)!;
      const amount = Math.abs(effect.value);
      if (effect.kind === 'percent') return `${Number(amount.toFixed(4))}%`;
      if (effect.stat === 'blizzard.slow') return percentagePoints(amount);
      return formatStat(effect.stat, amount);
    });
  const abilityId = ABILITY_ORDER.find((abilityId) => ABILITIES[abilityId].talent === id)!;
  return `Открывает способность «${ABILITIES[abilityId].name}».\n${abilityEffectDescription(abilityId, stats)}\n${abilityUsageDescription(abilityId, stats)}`;
}

const ATTRIBUTE_EFFECT_TEXT: Partial<Record<StatId, string>> = {
  maxHp: 'Увеличивает максимальное здоровье на {value} единиц.',
  hpRegen: 'Восстанавливает дополнительно {value} здоровья каждую секунду.',
  energyPerBreach: 'Когда паук доходит до вас, вы получаете дополнительно {value} энергии.',
  levelDuration: 'Сокращает длительность уровня на {value} с.',
  coinsPerKill: 'Каждый убитый паук приносит дополнительно {value} монет.',
  coinsPerSec: 'Приносит дополнительно {value} монет каждую секунду.',
  armor: 'Увеличивает броню на {value} единиц.',
  shootCooldown: 'Сокращает перезарядку выстрела и увеличивает скорость стрел на {value}.',
  'volley.cooldown': 'Сокращает перезарядку «Залпа» на {value}.',
  energyPerKill: 'Каждый убитый паук восстанавливает дополнительно {value} энергии.',
  maxEnergy: 'Увеличивает максимальный запас энергии на {value} единиц.',
  energyRegen: 'Восстанавливает дополнительно {value} энергии каждую секунду.',
  'heal.amount': '«Лечение» восстанавливает на {value} здоровья больше.',
  'prep.restore': '«Подготовка» восстанавливает на {value} энергии больше.',
};
function attributeEffectDescription(effect: StatModifier): string {
  const value =
    effect.kind === 'percent'
      ? `${Number(Math.abs(effect.value).toFixed(4))}%`
      : formatStat(effect.stat, Math.abs(effect.value));
  return fillDescription(ATTRIBUTE_EFFECT_TEXT[effect.stat]!, () => value);
}
export function attributeDescription(state: GameState, id: PrimaryStatId | 'armor'): string {
  const title = `<div class="tooltip__title">${STATS[id].label}: ${formatStat(id, state.stats[id])}</div>`;
  if (id === 'armor')
    return `${title}${descriptionParagraphs(`${state.stats.armorReduction > 0 ? `Броня снижает урон от атак пауков на ${formatStat('armorReduction', state.stats.armorReduction)} на вашем уровне.\n` : ''}Максимальное снижение от брони — ${formatStat('armorReduction', ARMOR_RULES.cap)}. От сжигания энергии броня не защищает.`)}`;
  const contributions = state.rules.attributeEffects[id]
    .filter(
      (effect) =>
        effect.stat !== 'lastHope.blockPower' && effect.stat !== 'arrowSpeed' && effect.value !== 0,
    )
    .map(attributeEffectDescription);
  for (const talentId of TALENT_ORDER) {
    const { scaling, name } = TALENTS[talentId];
    if (scaling?.attribute !== id) continue;
    for (const modifier of state.rules.explain(scaling.effect.stat).modifiers) {
      if (modifier.source === `talent:${talentId}` && modifier.value !== 0)
        contributions.push(
          `Благодаря таланту «${name}» даёт ещё ${formatStat(scaling.effect.stat, modifier.value)} брони.`,
        );
    }
  }
  return `${title}${descriptionParagraphs(contributions.join('\n'))}`;
}
function abilityEffectDescription(id: AbilityId, stats: ResolvedStats): string {
  const description = ABILITIES[id].description
    .split('\n')
    .filter((line) =>
      [...line.matchAll(/\{([\w.]+)\}/g)].every(
        ([, key]) => key === 'endurancePercent' || stats[key as StatId] !== 0,
      ),
    )
    .join('\n');
  return fillDescription(description, (key) =>
    key === 'endurancePercent'
      ? formatStat('blockChance', ATTRIBUTE_RULES.endurance.lastHopeBlockPerPoint)
      : formatStat(key as StatId, stats[key as StatId]),
  );
}
function abilityUsageDescription(id: AbilityId, stats: ResolvedStats): string {
  return [
    stats[`${id}.cost`] > 0
      ? `Расходует ${formatStat(`${id}.cost`, stats[`${id}.cost`])} энергии.`
      : '',
    stats[`${id}.cooldown`] > 0
      ? `Перезарядка — ${formatStat(`${id}.cooldown`, stats[`${id}.cooldown`])} с.`
      : '',
  ]
    .filter(Boolean)
    .join('\n');
}
export function abilityDescription(state: GameState, id: AbilityId): string {
  const ability = ABILITIES[id];
  const unlock = ability.talent
    ? `Требуется талант «${TALENTS[ability.talent].name}»`
    : `Требуется уровень ${ability.unlockLevel}`;
  const cooldown = state.getAbility(id);
  const reasons = [
    ...(!state.isAbilityUnlocked(id) ? [unlock] : []),
    ...(cooldown.isOnCooldown
      ? [`Будет готово через ${formatSeconds(cooldown.remainingCooldown)} с`]
      : []),
    ...(state.energy < state.stats[`${id}.cost`] && !(id === 'freeze' && state.freezeActive)
      ? ['Недостаточно энергии']
      : []),
  ];
  const activeTimer =
    id === 'lastHope' ? state.lastHopeTimer : id === 'stand' ? state.invulnerableTimer : 0;
  return `<div class="tooltip__title">${ability.name} [${ability.key}]</div>${descriptionParagraphs(abilityEffectDescription(id, state.stats))}${descriptionParagraphs(abilityUsageDescription(id, state.stats))}${activeTimer > 0 ? `<div>Действует ещё ${formatSeconds(activeTimer)} с</div>` : ''}${reasons.map((reason) => `<div class="action-unavailable">${reason}</div>`).join('')}`;
}
export function resourceDescription(state: GameState, id: string): string {
  const value = (stat: StatId) => formatStat(stat, state.stats[stat]);
  if (id === 'hp')
    return `<div class="tooltip__title">Здоровье</div>${descriptionParagraphs(
      [
        state.stats.hpRegen > 0 ? `Восстанавливается ${value('hpRegen')} в секунду.` : '',
        state.stats.damageFactor < 1
          ? `Общее снижение урона - ${formatStat('damageFactor', 1 - state.stats.damageFactor)}.`
          : '',
      ].join('\n'),
    )}`;
  if (id === 'energy')
    return `<div class="tooltip__title">Энергия</div>${descriptionParagraphs(
      [
        state.stats.energyRegen > 0 ? `Восстанавливается ${value('energyRegen')} в секунду.` : '',
        state.stats.energyPerKill > 0
          ? `Каждый убитый паук возвращает ${value('energyPerKill')} энергии.`
          : '',
        state.stats.energyPerBreach > 0
          ? `Когда паук доходит до вас, вы получаете ${value('energyPerBreach')} энергии.`
          : '',
      ].join('\n'),
    )}`;
  return `<div class="tooltip__title">Время уровня</div>${descriptionParagraphs(`Продержитесь до конца таймера, чтобы пройти уровень.\nЭтот уровень длится ${formatSeconds(state.levelTimerMax)} с.`)}`;
}
export function coinsDescription(state: GameState): string {
  const value = (stat: StatId) => formatStat(stat, state.stats[stat]);
  return `<div class="tooltip__title">Монеты</div>${descriptionParagraphs(
    [
      state.stats.coinsPerSec > 0 ? `${value('coinsPerSec')} монет в секунду.` : '',
      state.stats.coinsPerKill > 0
        ? `За каждого убитого паука награда увеличена на +${value('coinsPerKill')}.`
        : '',
      state.stats.jackpotChance > 0
        ? `Вероятность тройной награды — ${value('jackpotChance')}.`
        : '',
    ].join('\n'),
  )}`;
}
export function shootDescription(state: GameState, lane: number): string {
  return `<div class="tooltip__title">Лучник ${lane}</div>${descriptionParagraphs(
    [
      'Выпускает стрелу, которая поражает первого паука на этой линии.',
      state.stats.shootCost > 0
        ? `Выстрел расходует ${formatStat('shootCost', state.stats.shootCost)} энергии.`
        : '',
      state.stats.shootCooldown > 0
        ? `Перезарядка выстрела — ${formatStat('shootCooldown', state.stats.shootCooldown)} с.`
        : '',
    ].join('\n'),
  )}${state.energy < state.stats.shootCost ? '<div class="action-unavailable">Недостаточно энергии</div>' : ''}${state.archers[lane - 1].isOnCooldown ? '<div class="action-unavailable">Выстрел перезаряжается</div>' : ''}`;
}
