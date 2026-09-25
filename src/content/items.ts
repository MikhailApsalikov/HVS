import type { ItemConfig, ItemDefinition } from '../domain/itemTypes.js';
import { computeItemPrice } from '../domain/rules/economy.js';
export type {
  ItemConfig,
  ItemDefinition,
  ItemRarity,
  StatType,
  AbilityModType,
} from '../domain/itemTypes.js';

const COMMON_ITEMS: readonly ItemConfig[] = [
  {
    id: 'c-shield',
    name: 'Деревянный щит',
    rarity: 'common',
    stats: [{ type: 'armor', value: 50 }],
  },
  {
    id: 'c022',
    name: 'Лечебный настой',
    rarity: 'common',
    stats: [{ type: 'hpRegen', value: 1 }],
  },
  {
    id: 'c046',
    name: 'Рунный щит',
    rarity: 'common',
    stats: [{ type: 'armor', value: 300 }],
  },
  {
    id: 'c055',
    name: 'Адамантовый щит',
    rarity: 'common',
    stats: [{ type: 'armor', value: 900 }],
  },
  {
    id: 'c001',
    name: 'Аптечные бинты',
    rarity: 'common',
    stats: [{ type: 'endurance', value: 5 }],
  },
  {
    id: 'c001-agility',
    name: 'Перчатки стрелка',
    rarity: 'common',
    stats: [{ type: 'agility', value: 5 }],
  },
  {
    id: 'c001-intellect',
    name: 'Записки ученика',
    rarity: 'common',
    stats: [{ type: 'intellect', value: 5 }],
  },
  {
    id: 'c009',
    name: 'Боевая куртка',
    rarity: 'common',
    stats: [{ type: 'endurance', value: 25 }],
  },
  {
    id: 'c009-agility',
    name: 'Наручи охотника',
    rarity: 'common',
    stats: [{ type: 'agility', value: 25 }],
  },
  {
    id: 'c009-intellect',
    name: 'Посох чародея',
    rarity: 'common',
    stats: [{ type: 'intellect', value: 25 }],
  },
  {
    id: 'c015',
    name: 'Стальные наплечники',
    rarity: 'common',
    stats: [{ type: 'endurance', value: 50 }],
  },
  {
    id: 'c015-agility',
    name: 'Перчатки меткости',
    rarity: 'common',
    stats: [{ type: 'agility', value: 50 }],
  },
  {
    id: 'c015-intellect',
    name: 'Гримуар мага',
    rarity: 'common',
    stats: [{ type: 'intellect', value: 50 }],
  },
  {
    id: 'c025',
    name: 'Паучий антидот',
    rarity: 'common',
    stats: [{ type: 'hpRegen', value: 3 }],
  },
  {
    id: 'c030',
    name: 'Концентрированный бальзам',
    rarity: 'common',
    stats: [{ type: 'hpRegen', value: 6 }],
  },
  {
    id: 'c056',
    name: 'Энергетическая склянка',
    rarity: 'common',
    stats: [{ type: 'maxEnergy', value: 10 }],
  },
  {
    id: 'c060',
    name: 'Амулет мудреца',
    rarity: 'common',
    stats: [{ type: 'maxEnergy', value: 30 }],
  },
  {
    id: 'c064',
    name: 'Лазуритовая сфера',
    rarity: 'common',
    stats: [{ type: 'maxEnergy', value: 50 }],
  },
  {
    id: 'c068',
    name: 'Стимулятор',
    rarity: 'common',
    stats: [{ type: 'energyRegen', value: 1 }],
  },
  {
    id: 'c078',
    name: 'Адреналин убийцы',
    rarity: 'common',
    stats: [{ type: 'energyPerKill', value: 1 }],
  },
  {
    id: 'c096',
    name: 'Кошелёк охотника',
    rarity: 'common',
    stats: [{ type: 'coinsPerKill', value: 1 }],
  },
  {
    id: 'c088',
    name: 'Наконечник меткости',
    rarity: 'common',
    stats: [{ type: 'criticalShotChance', value: 0.01 }],
  },
];

const RARE_ITEMS: readonly ItemConfig[] = [
  {
    id: 'r009',
    name: 'Зачарованный щит',
    rarity: 'rare',
    stats: [{ type: 'armor', value: 2500 }],
  },
  {
    id: 'r010',
    name: 'Несокрушимый доспех',
    rarity: 'rare',
    stats: [{ type: 'armor', value: 6490 }],
  },
  {
    id: 'r001',
    name: 'Грудная пластина бойца',
    rarity: 'rare',
    stats: [{ type: 'endurance', value: 90 }],
  },
  {
    id: 'r001-agility',
    name: 'Плащ следопыта',
    rarity: 'rare',
    stats: [{ type: 'agility', value: 90 }],
  },
  {
    id: 'r001-intellect',
    name: 'Посох провидца',
    rarity: 'rare',
    stats: [{ type: 'intellect', value: 90 }],
  },
  {
    id: 'r003',
    name: 'Латная куртка',
    rarity: 'rare',
    stats: [{ type: 'endurance', value: 135 }],
  },
  {
    id: 'r003-agility',
    name: 'Сапоги танцующего ветра',
    rarity: 'rare',
    stats: [{ type: 'agility', value: 135 }],
  },
  {
    id: 'r003-intellect',
    name: 'Гримуар тайных знаний',
    rarity: 'rare',
    stats: [{ type: 'intellect', value: 135 }],
  },
  {
    id: 'r005',
    name: 'Ядовитый антидот',
    rarity: 'rare',
    stats: [{ type: 'hpRegen', value: 9 }],
  },
  {
    id: 'r007',
    name: 'Зелье бессмертия',
    rarity: 'rare',
    stats: [{ type: 'hpRegen', value: 14 }],
  },
  {
    id: 'r011',
    name: 'Синий тотем',
    rarity: 'rare',
    stats: [{ type: 'maxEnergy', value: 80 }],
  },
  {
    id: 'r012',
    name: 'Магический топаз',
    rarity: 'rare',
    stats: [{ type: 'maxEnergy', value: 100 }],
  },
  {
    id: 'c076',
    name: 'Двойной стимулятор',
    rarity: 'rare',
    stats: [{ type: 'energyRegen', value: 2 }],
  },
  {
    id: 'c086',
    name: 'Двойной адреналин',
    rarity: 'rare',
    stats: [{ type: 'energyPerKill', value: 2 }],
  },
  {
    id: 'r018',
    name: 'Серебряный прицел',
    rarity: 'rare',
    stats: [{ type: 'criticalShotChance', value: 0.02 }],
  },
  {
    id: 'r-coins',
    name: 'Кошелёк наёмника',
    rarity: 'rare',
    stats: [{ type: 'coinsPerKill', value: 2 }],
  },
  {
    id: 'r021',
    name: 'Живая броня',
    rarity: 'rare',
    stats: [
      { type: 'endurance', value: 50 },
      { type: 'hpRegen', value: 5 },
    ],
  },
  {
    id: 'r025',
    name: 'Латы долголетия',
    rarity: 'rare',
    stats: [
      { type: 'endurance', value: 90 },
      { type: 'hpRegen', value: 9 },
    ],
  },
  {
    id: 'r026',
    name: 'Кожаный доспех',
    rarity: 'rare',
    stats: [
      { type: 'endurance', value: 50 },
      { type: 'armor', value: 500 },
    ],
  },
  {
    id: 'r029',
    name: 'Непробиваемые латы',
    rarity: 'rare',
    stats: [
      { type: 'endurance', value: 90 },
      { type: 'armor', value: 2500 },
    ],
  },
  {
    id: 'r039',
    name: 'Трофейный нагрудник',
    rarity: 'rare',
    stats: [
      { type: 'endurance', value: 75 },
      { type: 'coinsPerKill', value: 1 },
    ],
  },
  {
    id: 'r030',
    name: 'Тактический жилет',
    rarity: 'rare',
    stats: [
      { type: 'endurance', value: 90 },
      { type: 'intellect', value: 45 },
    ],
  },
  {
    id: 'r035',
    name: 'Боевая мазь',
    rarity: 'rare',
    stats: [
      { type: 'agility', value: 50 },
      { type: 'energyPerKill', value: 1 },
    ],
  },
  {
    id: 'r036',
    name: 'Кулон убийцы',
    rarity: 'rare',
    stats: [
      { type: 'agility', value: 50 },
      { type: 'energyPerKill', value: 2 },
    ],
  },
  {
    id: 'r037',
    name: 'Оберег стрелка',
    rarity: 'rare',
    stats: [
      { type: 'agility', value: 50 },
      { type: 'criticalShotChance', value: 0.01 },
    ],
  },
  {
    id: 'r038',
    name: 'Талисман меткости',
    rarity: 'rare',
    stats: [
      { type: 'agility', value: 80 },
      { type: 'criticalShotChance', value: 0.02 },
    ],
  },
  {
    id: 'r040',
    name: 'Плащ торговца',
    rarity: 'rare',
    stats: [
      { type: 'agility', value: 75 },
      { type: 'coinsPerKill', value: 1 },
    ],
  },
  {
    id: 'r068',
    name: 'Кольцо берсерка',
    rarity: 'rare',
    stats: [
      { type: 'agility', value: 90 },
      { type: 'endurance', value: 45 },
    ],
  },
  {
    id: 'r033',
    name: 'Зелье чародея',
    rarity: 'rare',
    stats: [
      { type: 'intellect', value: 50 },
      { type: 'energyRegen', value: 1 },
    ],
  },
  {
    id: 'r034',
    name: 'Тоник чародея',
    rarity: 'rare',
    stats: [
      { type: 'intellect', value: 50 },
      { type: 'energyRegen', value: 2 },
    ],
  },
  {
    id: 'r031',
    name: 'Нагрудник мага',
    rarity: 'rare',
    stats: [
      { type: 'intellect', value: 60 },
      { type: 'maxEnergy', value: 40 },
    ],
  },
  {
    id: 'r032',
    name: 'Броня волшебника',
    rarity: 'rare',
    stats: [
      { type: 'intellect', value: 80 },
      { type: 'maxEnergy', value: 70 },
    ],
  },
  {
    id: 'r067',
    name: 'Сапфировый кошелёк',
    rarity: 'rare',
    stats: [
      { type: 'intellect', value: 75 },
      { type: 'coinsPerKill', value: 1 },
    ],
  },
  {
    id: 'r064',
    name: 'Реликвия скорости',
    rarity: 'rare',
    stats: [
      { type: 'intellect', value: 90 },
      { type: 'agility', value: 45 },
    ],
  },
];

const EPIC_ITEMS: readonly ItemConfig[] = [
  {
    id: 'e-shield',
    name: 'Щит бастиона',
    rarity: 'epic',
    stats: [{ type: 'armor', value: 10000 }],
  },
  {
    id: 'e002',
    name: 'Стальная твердыня',
    rarity: 'epic',
    stats: [{ type: 'endurance', value: 210 }],
  },
  {
    id: 'e002-agility',
    name: 'Крылья сокола',
    rarity: 'epic',
    stats: [{ type: 'agility', value: 210 }],
  },
  {
    id: 'e002-intellect',
    name: 'Око вечности',
    rarity: 'epic',
    stats: [{ type: 'intellect', value: 210 }],
  },
  {
    id: 'e003',
    name: 'Живой источник',
    rarity: 'epic',
    stats: [{ type: 'hpRegen', value: 30 }],
  },
  {
    id: 'e005',
    name: 'Средоточие энергии',
    rarity: 'epic',
    stats: [{ type: 'maxEnergy', value: 150 }],
  },
  {
    id: 'e008',
    name: 'Око сокола',
    rarity: 'epic',
    stats: [{ type: 'criticalShotChance', value: 0.04 }],
  },
  {
    id: 'e009',
    name: 'Доспех воина',
    rarity: 'epic',
    stats: [
      { type: 'endurance', value: 150 },
      { type: 'armor', value: 3000 },
    ],
  },
  {
    id: 'e010',
    name: 'Живая броня воителя',
    rarity: 'epic',
    stats: [
      { type: 'endurance', value: 150 },
      { type: 'hpRegen', value: 15 },
    ],
  },
  {
    id: 'e014',
    name: 'Трофей удачи',
    rarity: 'epic',
    stats: [
      { type: 'endurance', value: 160 },
      { type: 'coinsPerKill', value: 2 },
    ],
  },
  {
    id: 'e016',
    name: 'Доспех тактика',
    rarity: 'epic',
    stats: [
      { type: 'endurance', value: 150 },
      { type: 'agility', value: 90 },
    ],
  },
  {
    id: 'e013',
    name: 'Клинок охотника',
    rarity: 'epic',
    stats: [
      { type: 'agility', value: 150 },
      { type: 'energyPerKill', value: 2 },
    ],
  },
  {
    id: 'e023',
    name: 'Амулет охотника',
    rarity: 'epic',
    stats: [
      { type: 'agility', value: 130 },
      { type: 'criticalShotChance', value: 0.03 },
    ],
  },
  {
    id: 'e022',
    name: 'Кошелёк скорости',
    rarity: 'epic',
    stats: [
      { type: 'agility', value: 160 },
      { type: 'coinsPerKill', value: 2 },
    ],
  },
  {
    id: 'e021',
    name: 'Парный амулет',
    rarity: 'epic',
    stats: [
      { type: 'agility', value: 150 },
      { type: 'intellect', value: 90 },
    ],
  },
  {
    id: 'e018',
    name: 'Реликвия концентрации',
    rarity: 'epic',
    stats: [
      { type: 'intellect', value: 150 },
      { type: 'energyRegen', value: 2 },
    ],
  },
  {
    id: 'e011',
    name: 'Тактический жезл',
    rarity: 'epic',
    stats: [
      { type: 'intellect', value: 150 },
      { type: 'maxEnergy', value: 80 },
    ],
  },
  {
    id: 'e019',
    name: 'Посох богатства',
    rarity: 'epic',
    stats: [
      { type: 'intellect', value: 160 },
      { type: 'coinsPerKill', value: 2 },
    ],
  },
  {
    id: 'e012',
    name: 'Реликвия чародея',
    rarity: 'epic',
    stats: [
      { type: 'intellect', value: 150 },
      { type: 'endurance', value: 90 },
    ],
  },
  {
    id: 'e025',
    name: 'Пояс выносливости',
    rarity: 'epic',
    stats: [
      { type: 'endurance', value: 130 },
      { type: 'hpRegen', value: 12 },
      { type: 'armor', value: 2000 },
    ],
  },
  {
    id: 'e031',
    name: 'Доспех богача',
    rarity: 'epic',
    stats: [
      { type: 'endurance', value: 140 },
      { type: 'hpRegen', value: 10 },
      { type: 'coinsPerKill', value: 2 },
    ],
  },
  {
    id: 'e029',
    name: 'Дух победителя',
    rarity: 'epic',
    stats: [
      { type: 'endurance', value: 140 },
      { type: 'agility', value: 70 },
      { type: 'coinsPerKill', value: 2 },
    ],
  },
  {
    id: 'e027',
    name: 'Нагрудник воителя',
    rarity: 'epic',
    stats: [
      { type: 'endurance', value: 140 },
      { type: 'agility', value: 80 },
      { type: 'intellect', value: 40 },
    ],
  },
  {
    id: 'e030',
    name: 'Клинок силы',
    rarity: 'epic',
    stats: [
      { type: 'agility', value: 100 },
      { type: 'energyPerKill', value: 2 },
      { type: 'criticalShotChance', value: 0.02 },
    ],
  },
  {
    id: 'e039',
    name: 'Ожерелье берсерка',
    rarity: 'epic',
    stats: [
      { type: 'agility', value: 130 },
      { type: 'energyPerKill', value: 2 },
      { type: 'coinsPerKill', value: 1 },
    ],
  },
  {
    id: 'e037',
    name: 'Амулет авантюриста',
    rarity: 'epic',
    stats: [
      { type: 'agility', value: 140 },
      { type: 'intellect', value: 70 },
      { type: 'coinsPerKill', value: 2 },
    ],
  },
  {
    id: 'e028',
    name: 'Талисман охотника',
    rarity: 'epic',
    stats: [
      { type: 'agility', value: 140 },
      { type: 'intellect', value: 80 },
      { type: 'endurance', value: 40 },
    ],
  },
  {
    id: 'e026',
    name: 'Реликвия мудрости',
    rarity: 'epic',
    stats: [
      { type: 'intellect', value: 100 },
      { type: 'maxEnergy', value: 80 },
      { type: 'energyRegen', value: 2 },
    ],
  },
  {
    id: 'e036',
    name: 'Мантия казначея',
    rarity: 'epic',
    stats: [
      { type: 'intellect', value: 140 },
      { type: 'maxEnergy', value: 80 },
      { type: 'coinsPerKill', value: 1 },
    ],
  },
  {
    id: 'e034',
    name: 'Кулон стратега',
    rarity: 'epic',
    stats: [
      { type: 'intellect', value: 140 },
      { type: 'endurance', value: 70 },
      { type: 'coinsPerKill', value: 2 },
    ],
  },
  {
    id: 'e035',
    name: 'Доспех мага',
    rarity: 'epic',
    stats: [
      { type: 'intellect', value: 140 },
      { type: 'endurance', value: 80 },
      { type: 'agility', value: 40 },
    ],
  },
];

const LEGENDARY_ITEMS: readonly ItemConfig[] = [
  {
    id: 'e006',
    name: 'Руна потока',
    rarity: 'legendary',
    stats: [{ type: 'energyRegen', value: 4 }],
  },
  {
    id: 'l007',
    name: 'Оберег Залпа',
    rarity: 'legendary',
    stats: [
      { type: 'endurance', value: 200 },
      { type: 'hpRegen', value: 20 },
      { type: 'coinsPerKill', value: 1 },
    ],
    abilityMod: {
      abilityId: 'volley',
      modType: 'effectBoost',
      value: 3,
      description: '«Залп»: +3 дополнительные линии',
    },
  },
  {
    id: 'l010',
    name: 'Щит Ни шагу назад!',
    rarity: 'legendary',
    stats: [
      { type: 'armor', value: 11111 },
      { type: 'endurance', value: 80 },
      { type: 'agility', value: 25 },
      { type: 'intellect', value: 25 },
      { type: 'hpRegen', value: 5 },
    ],
    abilityMod: {
      abilityId: 'stand',
      modType: 'cooldownReduction',
      value: 15,
      description: '«Божественный щит»: кулдаун −15 сек',
    },
  },
  {
    id: 'l001',
    name: 'Реликвия Армагеддона',
    rarity: 'legendary',
    stats: [
      { type: 'endurance', value: 200 },
      { type: 'hpRegen', value: 10 },
      { type: 'armor', value: 3000 },
    ],
    abilityMod: {
      abilityId: 'armageddon',
      modType: 'cooldownReduction',
      value: 30,
      description: '«Армагеддон»: кулдаун −30 сек',
    },
  },
  {
    id: 'l002',
    name: 'Гримуар Армагеддона',
    rarity: 'legendary',
    stats: [
      { type: 'intellect', value: 200 },
      { type: 'agility', value: 100 },
      { type: 'coinsPerKill', value: 2 },
    ],
    abilityMod: {
      abilityId: 'armageddon',
      modType: 'effectBoost',
      value: 1,
      description: '«Армагеддон»: длительность +1 сек.',
    },
  },
  {
    id: 'l003',
    name: 'Доспех Армагеддона',
    rarity: 'legendary',
    stats: [
      { type: 'endurance', value: 220 },
      { type: 'armor', value: 5000 },
    ],
    abilityMod: {
      abilityId: 'armageddon',
      modType: 'costReduction',
      value: 50,
      description: '«Армагеддон»: стоимость −50 энергии',
    },
  },
  {
    id: 'l004',
    name: 'Клинок Вьюги',
    rarity: 'legendary',
    stats: [
      { type: 'agility', value: 180 },
      { type: 'energyPerKill', value: 2 },
      { type: 'coinsPerKill', value: 2 },
    ],
    abilityMod: {
      abilityId: 'blizzard',
      modType: 'effectBoost',
      value: 2,
      description: '«Вьюга»: длительность +2 сек',
    },
  },
  {
    id: 'l005',
    name: 'Корона Вьюги',
    rarity: 'legendary',
    stats: [
      { type: 'intellect', value: 180 },
      { type: 'maxEnergy', value: 120 },
      { type: 'energyRegen', value: 1 },
    ],
    abilityMod: {
      abilityId: 'blizzard',
      modType: 'cooldownReduction',
      value: 3,
      description: '«Вьюга»: кулдаун −3 сек',
    },
  },
  {
    id: 'l006',
    name: 'Мантия Вьюги',
    rarity: 'legendary',
    stats: [
      { type: 'intellect', value: 200 },
      { type: 'endurance', value: 120 },
      { type: 'coinsPerKill', value: 2 },
    ],
    abilityMod: {
      abilityId: 'blizzard',
      modType: 'costReduction',
      value: 30,
      description: '«Вьюга»: стоимость −30 энергии',
    },
  },
  {
    id: 'l008',
    name: 'Перчатки Залпа',
    rarity: 'legendary',
    stats: [
      { type: 'agility', value: 200 },
      { type: 'criticalShotChance', value: 0.03 },
      { type: 'coinsPerKill', value: 2 },
    ],
    abilityMod: {
      abilityId: 'volley',
      modType: 'costReduction',
      value: 20,
      description: '«Залп»: стоимость −20 энергии',
    },
  },
  {
    id: 'l009',
    name: 'Тетива Залпа',
    rarity: 'legendary',
    stats: [
      { type: 'agility', value: 240 },
      { type: 'energyPerKill', value: 1 },
    ],
    abilityMod: {
      abilityId: 'volley',
      modType: 'cooldownReduction',
      value: 1,
      description: '«Залп»: кулдаун −1 сек',
    },
  },
  {
    id: 'l011',
    name: 'Оберег стойкости',
    rarity: 'legendary',
    stats: [
      { type: 'endurance', value: 200 },
      { type: 'hpRegen', value: 15 },
      { type: 'coinsPerKill', value: 2 },
    ],
    abilityMod: {
      abilityId: 'stand',
      modType: 'effectBoost',
      value: 3,
      description: '«Божественный щит»: длительность +3 сек',
    },
  },
  {
    id: 'l012',
    name: 'Амулет Подготовки',
    rarity: 'legendary',
    stats: [
      { type: 'intellect', value: 200 },
      { type: 'energyRegen', value: 2 },
      { type: 'maxEnergy', value: 80 },
    ],
    abilityMod: {
      abilityId: 'prep',
      modType: 'cooldownReduction',
      value: 8,
      description: '«Подготовка»: кулдаун −8 сек',
    },
  },
  {
    id: 'l013',
    name: 'Кулон Подготовки',
    rarity: 'legendary',
    stats: [
      { type: 'agility', value: 200 },
      { type: 'intellect', value: 100 },
      { type: 'coinsPerKill', value: 2 },
    ],
    abilityMod: {
      abilityId: 'prep',
      modType: 'effectBoost',
      value: 0.5,
      description: '«Подготовка»: количество восстанавливаемой энергии +150',
    },
  },
  {
    id: 'l015',
    name: 'Ледяная корона',
    rarity: 'legendary',
    stats: [
      { type: 'intellect', value: 240 },
      { type: 'maxEnergy', value: 80 },
    ],
    abilityMod: {
      abilityId: 'freeze',
      modType: 'costReduction',
      value: 45,
      description: '«Заморозка»: стоимость −45 энергии',
    },
  },
  {
    id: 'l016',
    name: 'Амулет Лечения',
    rarity: 'legendary',
    stats: [
      { type: 'endurance', value: 220 },
      { type: 'hpRegen', value: 12 },
      { type: 'armor', value: 3500 },
    ],
    abilityMod: {
      abilityId: 'heal',
      modType: 'effectBoost',
      value: 1500,
      description: '«Лечение»: количество восстанавливаемого HP +1500',
    },
  },
  {
    id: 'l017',
    name: 'Оберег Лечения',
    rarity: 'legendary',
    stats: [
      { type: 'endurance', value: 240 },
      { type: 'agility', value: 100 },
      { type: 'intellect', value: 60 },
    ],
    abilityMod: {
      abilityId: 'heal',
      modType: 'cooldownReduction',
      value: 3,
      description: '«Лечение»: кулдаун −3 сек',
    },
  },
  {
    id: 'l018',
    name: 'Кристалл Обновления',
    rarity: 'legendary',
    stats: [
      { type: 'intellect', value: 200 },
      { type: 'agility', value: 100 },
      { type: 'endurance', value: 60 },
    ],
    abilityMod: {
      abilityId: 'recharge',
      modType: 'cooldownReduction',
      value: 60,
      description: '«Обновление»: кулдаун −60 сек',
    },
  },
  {
    id: 'l020',
    name: 'Посох Обновления',
    rarity: 'legendary',
    stats: [
      { type: 'intellect', value: 210 },
      { type: 'energyRegen', value: 2 },
      { type: 'coinsPerKill', value: 2 },
    ],
    abilityMod: {
      abilityId: 'recharge',
      modType: 'costReduction',
      value: 30,
      description: '«Обновление»: стоимость −30 энергии',
    },
  },
];

export const ITEM_CATALOG: readonly ItemDefinition[] = [
  ...COMMON_ITEMS,
  ...RARE_ITEMS,
  ...EPIC_ITEMS,
  ...LEGENDARY_ITEMS,
].map((item) => ({ ...item, price: computeItemPrice(item) }));

export const ITEM_MAP: ReadonlyMap<string, ItemDefinition> = new Map(
  ITEM_CATALOG.map((item) => [item.id, item]),
);
