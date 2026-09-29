import type { AbilityId, TalentId } from '../domain/types.js';
import type { StatId } from '../domain/rules/stats.js';
import { AIMED_FIRE_DELAYS } from '../domain/rules/stats.js';
import { WORLD } from '../domain/rules/world.js';

interface AbilityDefinition {
  readonly name: string;
  readonly key: string;
  readonly code?: string;
  readonly sprite: string;
  readonly unlockLevel: number;
  readonly talent?: TalentId;
  readonly description: string;
  readonly effectStat?: StatId;
  readonly effectKind?: 'flat' | 'percent';
}

export const ABILITIES: Readonly<Record<AbilityId, AbilityDefinition>> = {
  freeze: {
    name: 'Заморозка времени',
    key: 'Q',
    sprite: 'AbilityFreeze',
    unlockLevel: 4,
    description: 'Останавливает время. Повторное нажатие возобновляет игру.',
  },
  blizzard: {
    name: 'Вьюга',
    key: 'T',
    sprite: 'AbilityBlizzard',
    unlockLevel: 20,
    description:
      'Снижает скорость всех пауков на поле на {blizzard.slow} на {blizzard.duration} с.',
    effectStat: 'blizzard.duration',
    effectKind: 'flat',
  },
  prep: {
    name: 'Подготовка',
    key: 'E',
    sprite: 'AbilityPrep',
    unlockLevel: 12,
    description:
      'Восстанавливает {prep.instant} энергии и {prep.overTime} в течение {prep.duration} секунд.',
    effectStat: 'prep.restore',
    effectKind: 'percent',
  },
  heal: {
    name: 'Лечение',
    key: 'R',
    sprite: 'AbilityHeal',
    unlockLevel: 16,
    description: 'Мгновенно восстанавливает {heal.amount} здоровья.',
    effectStat: 'heal.amount',
    effectKind: 'flat',
  },
  volley: {
    name: 'Залп',
    key: 'W',
    sprite: 'AbilityVolley',
    unlockLevel: 8,
    description: 'Выпускает {volley.lanes} стрел из случайных разных линий.',
    effectStat: 'volley.lanes',
    effectKind: 'flat',
  },
  stand: {
    name: 'Божественный щит',
    key: 'I',
    sprite: 'AbilityStand',
    unlockLevel: 30,
    talent: 'divineShield',
    description:
      'Снимает все дебаффы, включая штраф за бездействие, и делает вас неуязвимым на {stand.duration} секунд.',
    effectStat: 'stand.duration',
    effectKind: 'flat',
  },
  armageddon: {
    name: 'Армагеддон',
    key: 'Y',
    sprite: 'AbilityArmageddon',
    unlockLevel: 30,
    description:
      'Сжигает всех пауков на поле.\nТребует {armageddon.charge} с подготовки.\nДействует {armageddon.duration} с и уничтожает также пауков, появляющихся в это время.',
    effectStat: 'armageddon.duration',
    effectKind: 'flat',
  },
  recharge: {
    name: 'Перезарядка',
    key: '[',
    code: 'BracketLeft',
    sprite: 'AbilityRecharge',
    unlockLevel: 60,
    talent: 'recharge',
    description: 'Сбрасывает перезарядку остальных способностей и лучников.',
  },
  lastHope: {
    name: 'Блок последней надежды',
    key: 'O',
    sprite: 'AbilityLastHope',
    unlockLevel: 20,
    talent: 'lastHope',
    description:
      'На {lastHope.duration} секунд повышает вероятность блока на {lastHope.blockChance} и его силу на {endurancePercent} от вашей выносливости.',
    effectStat: 'lastHope.duration',
    effectKind: 'flat',
  },
  adrenaline: {
    name: 'Адреналин',
    key: ']',
    code: 'BracketRight',
    sprite: 'AbilityAdrenaline',
    unlockLevel: 60,
    talent: 'adrenaline',
    description:
      'Даёт {adrenaline.shots} выстрелов без расхода энергии и снижает перезарядку лучников на {adrenaline.shootCooldownReduction}%.\nДействует не более {adrenaline.duration} с и заканчивается при расходовании всех выстрелов.',
    effectStat: 'adrenaline.shots',
    effectKind: 'flat',
  },
  eagleEye: {
    name: 'Зоркость',
    key: 'U',
    sprite: 'AbilityEagleEye',
    unlockLevel: 20,
    talent: 'eagleEye',
    description:
      'Следующие {eagleEye.shots} выстрелов лучников будут критическими со 100% вероятностью.\nДействует не более {eagleEye.duration} с и заканчивается при расходовании всех выстрелов.',
    effectStat: 'eagleEye.shots',
    effectKind: 'flat',
  },
  aimedFire: {
    name: 'Прицельный огонь',
    key: 'P',
    sprite: 'AbilityAimedFire',
    unlockLevel: 60,
    talent: 'aimedFire',
    description: `Через ${AIMED_FIRE_DELAYS[0]} с выпускает ${WORLD.lanes} критических стрел, даже без таланта «Критический выстрел».\nНа ${AIMED_FIRE_DELAYS[1]}-й и ${AIMED_FIRE_DELAYS[2]}-й секунде выпускает ещё по ${WORLD.lanes} стрел с обычным шансом критического выстрела.`,
  },
};
/** Stable storage order; the HUD has its own order by level, then keyboard position. */
export const ABILITY_ORDER = Object.keys(ABILITIES) as AbilityId[];
export const ABILITY_DISPLAY_ORDER: readonly AbilityId[] = [
  'freeze',
  'volley',
  'prep',
  'heal',
  'blizzard',
  'armageddon',
  'eagleEye',
  'stand',
  'lastHope',
  'aimedFire',
  'recharge',
  'adrenaline',
];
