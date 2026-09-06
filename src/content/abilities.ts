import type { AbilityId, TalentId } from '../domain/types.js';
import type { StatId } from '../domain/rules/stats.js';

interface AbilityDefinition {
  readonly name: string;
  readonly key: string;
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
    key: 'W',
    sprite: 'AbilityBlizzard',
    unlockLevel: 8,
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
    description: 'Мгновенно восстанавливает {prep.restore} энергии.',
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
    key: 'T',
    sprite: 'AbilityVolley',
    unlockLevel: 20,
    description: 'Выпускает {volley.lanes} стрел из случайных разных линий.',
    effectStat: 'volley.lanes',
    effectKind: 'flat',
  },
  stand: {
    name: 'Божественный щит',
    key: 'Y',
    sprite: 'AbilityStand',
    unlockLevel: 30,
    talent: 'divineShield',
    description: 'Призывает силу света и делает вас неуязвимым на {stand.duration} секунд.',
    effectStat: 'stand.duration',
    effectKind: 'flat',
  },
  armageddon: {
    name: 'Армагеддон',
    key: 'U',
    sprite: 'AbilityArmageddon',
    unlockLevel: 30,
    description:
      'Сжигает всех пауков на поле.\nТребует {armageddon.charge} с подготовки.\nДействует {armageddon.duration} с и уничтожает также пауков, появляющихся в это время.',
    effectStat: 'armageddon.duration',
    effectKind: 'flat',
  },
  recharge: {
    name: 'Перезарядка',
    key: 'I',
    sprite: 'AbilityRecharge',
    unlockLevel: 50,
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
};
export const ABILITY_ORDER = Object.keys(ABILITIES) as AbilityId[];
