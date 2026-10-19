import type { AbilityId, TalentId } from '../domain/types.js';
import type { StatId } from '../domain/rules/stats.js';
import { AIMED_FIRE, ATTRIBUTE_RULES } from '../domain/rules/stats.js';

interface AbilityDefinition {
  readonly name: string;
  readonly key: string;
  readonly code?: string;
  readonly sprite: string;
  readonly unlockLevel: number;
  readonly talent?: TalentId;
  readonly clearsSpiderDebuffs?: boolean;
  readonly usableWhileStunned?: boolean;
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
    usableWhileStunned: true,
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
    clearsSpiderDebuffs: true,
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
    clearsSpiderDebuffs: true,
    description:
      'Следующие {eagleEye.shots} выстрелов лучников будут критическими со 100% вероятностью.\nСнимает все дебаффы от пауков.\nДействует не более {eagleEye.duration} с и заканчивается при расходовании всех выстрелов.',
    effectStat: 'eagleEye.shots',
    effectKind: 'flat',
  },
  aimedFire: {
    name: 'Прицельный огонь',
    key: 'P',
    sprite: 'AbilityAimedFire',
    unlockLevel: 60,
    talent: 'aimedFire',
    description: `Все лучники стреляют каждые ${AIMED_FIRE.interval} секунды в течение {aimedFire.duration} секунд. Первый выстрел — через ${AIMED_FIRE.firstDelay} секунду.\nПервые стрелы всех лучников гарантированно критические, даже без таланта «Критический выстрел». Последующие используют обычный шанс критического выстрела.`,
    effectStat: 'aimedFire.waves',
    effectKind: 'flat',
  },
  lightningArrows: {
    name: 'Стрелы молний',
    key: 'F',
    sprite: 'AbilityLightningArrows',
    unlockLevel: 10,
    talent: 'lightningArrows',
    description:
      'Заряжает всех лучников молнией. Следующая атака каждого лучника становится электрической и при попадании в паука запускает цепную молнию, атакующую до {lightningArrows.jumps} пауков. Паук выбирается случайно среди тех, кто находится на одной из соседних линий.',
  },
  lightningShield: {
    name: 'Щит молний',
    key: 'G',
    sprite: 'AbilityLightningShield',
    unlockLevel: 30,
    talent: 'lightningShield',
    description: `Окружает вас щитом молний на 3 минуты, поглощающим до {lightningShield.absorption} урона. Каждая единица интеллекта увеличивает прочность щита на ${ATTRIBUTE_RULES.intellect.shieldAbsorptionPerPoint}.\nЕсли изучены «Стрелы молний», поглощение урона выпускает в пауков ответную цепную молнию не чаще раза в {lightningShield.procCooldown} с.`,
  },
};
/** Stable storage order; the HUD has its own order by level, then keyboard position. */
export const ABILITY_ORDER = Object.keys(ABILITIES) as AbilityId[];
export const ABILITY_DISPLAY_ORDER: readonly AbilityId[] = [
  'freeze',
  'volley',
  'lightningArrows',
  'prep',
  'heal',
  'blizzard',
  'armageddon',
  'eagleEye',
  'stand',
  'lastHope',
  'lightningShield',
  'aimedFire',
  'recharge',
  'adrenaline',
];
