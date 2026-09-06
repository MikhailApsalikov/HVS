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
    description: 'Замедляет пауков, находящихся на поле.',
    effectStat: 'blizzard.duration',
    effectKind: 'flat',
  },
  prep: {
    name: 'Подготовка',
    key: 'E',
    sprite: 'AbilityPrep',
    unlockLevel: 12,
    description: 'Мгновенно восстанавливает энергию.',
    effectStat: 'prep.restore',
    effectKind: 'percent',
  },
  heal: {
    name: 'Лечение',
    key: 'R',
    sprite: 'AbilityHeal',
    unlockLevel: 16,
    description: 'Мгновенно восстанавливает здоровье.',
    effectStat: 'heal.amount',
    effectKind: 'flat',
  },
  volley: {
    name: 'Залп',
    key: 'T',
    sprite: 'AbilityVolley',
    unlockLevel: 20,
    description: 'Выпускает стрелы из случайных разных линий.',
    effectStat: 'volley.lanes',
    effectKind: 'flat',
  },
  stand: {
    name: 'Божественный щит',
    key: 'Y',
    sprite: 'AbilityStand',
    unlockLevel: 30,
    talent: 'divineShield',
    description: 'Даёт временную неуязвимость.',
    effectStat: 'stand.duration',
    effectKind: 'flat',
  },
  armageddon: {
    name: 'Армагеддон',
    key: 'U',
    sprite: 'AbilityArmageddon',
    unlockLevel: 30,
    description: 'После подготовки сжигает всех пауков, включая появляющихся во время действия.',
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
      'Временно повышает силу блока на 10% итоговой выносливости и шанс блока на 30 процентных пунктов.',
    effectStat: 'lastHope.duration',
    effectKind: 'flat',
  },
};
export const ABILITY_ORDER = Object.keys(ABILITIES) as AbilityId[];
