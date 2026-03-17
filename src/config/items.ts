import type { AbilityId } from './types.js';

// ─── Типы ────────────────────────────────────────────────────────────────────

export type ItemRarity = 'common' | 'rare' | 'epic' | 'legendary';

export type StatType =
  | 'maxHp'
  | 'maxEnergy'
  | 'hpRegen'
  | 'energyRegen'
  | 'damageReduction'
  | 'coinsPerKill'
  | 'energyPerKill'
  | 'energyPerBreach';

export type AbilityModType = 'cooldownReduction' | 'effectBoost' | 'costReduction';

export interface ItemStat {
  readonly type: StatType;
  readonly value: number;
}

export interface AbilityMod {
  readonly abilityId: AbilityId;
  readonly modType: AbilityModType;
  readonly value: number;
  readonly description: string;
}

export interface ItemConfig {
  readonly id: string;
  readonly name: string;
  readonly rarity: ItemRarity;
  readonly stats: readonly ItemStat[];
  readonly abilityMod?: AbilityMod;
}

export interface ItemDefinition extends ItemConfig {
  readonly price: number;
}

// ─── Ценообразование ─────────────────────────────────────────────────────────

interface StatPricingRule {
  readonly unit: number;
  readonly base: number;
  readonly f: (n: number) => number;
}

const log2 = Math.log2;

const STAT_PRICING: Record<StatType, StatPricingRule> = {
  maxHp:           { unit: 100, base: 40,  f: (n) => n * log2(n + 1) },
  hpRegen:         { unit: 1,   base: 30,   f: (n) => n * log2(n + 1) },
  damageReduction: { unit: 1,   base: 15,   f: (n) => n * n },
  coinsPerKill:    { unit: 1,   base: 2000, f: (n) => n * n },
  maxEnergy:       { unit: 10,  base: 45,  f: (n) => n * n },
  energyPerBreach: { unit: 1,   base: 400,  f: (n) => n * n * log2(n + 1) },
  energyRegen:     { unit: 1,   base: 500,  f: (n) => n * n * n },
  energyPerKill:   { unit: 1,   base: 500,  f: (n) => n * n * n },
};

const RARITY_MULTIPLIER: Record<ItemRarity, number> = {
  common: 1.0,
  rare: 1.0,
  epic: 1.15,
  legendary: 1.5,
};

export function computeItemPrice(item: ItemConfig): number {
  let sum = 0;
  for (const stat of item.stats) {
    const rule = STAT_PRICING[stat.type];
    const n = stat.value / rule.unit;
    sum += rule.base * rule.f(n);
  }
  return Math.round(sum * RARITY_MULTIPLIER[item.rarity]);
}

// ─── ОБЫЧНЫЕ (58 шт.) ────────────────────────────────────────────────────────

const COMMON_ITEMS: readonly ItemConfig[] = [

  // ── +макс. HP (N 1–15) ─────────────────────────────────────────────────
  { id: 'c001', name: 'Аптечные бинты',           rarity: 'common', stats: [{ type: 'maxHp', value: 100  }] },
  { id: 'c003', name: 'Кожаная заплата',           rarity: 'common', stats: [{ type: 'maxHp', value: 200  }] },
  { id: 'c005', name: 'Кожаный жилет',             rarity: 'common', stats: [{ type: 'maxHp', value: 300  }] },
  { id: 'c007', name: 'Плечевые накладки',         rarity: 'common', stats: [{ type: 'maxHp', value: 400  }] },
  { id: 'c009', name: 'Боевая куртка',             rarity: 'common', stats: [{ type: 'maxHp', value: 500  }] },
  { id: 'c011', name: 'Кольчужные рукава',         rarity: 'common', stats: [{ type: 'maxHp', value: 600  }] },
  { id: 'c012', name: 'Наплечники охотника',       rarity: 'common', stats: [{ type: 'maxHp', value: 700  }] },
  { id: 'c013', name: 'Бронзовые поножи',          rarity: 'common', stats: [{ type: 'maxHp', value: 800  }] },
  { id: 'c014', name: 'Железный нагрудник',        rarity: 'common', stats: [{ type: 'maxHp', value: 900  }] },
  { id: 'c015', name: 'Стальные наплечники',       rarity: 'common', stats: [{ type: 'maxHp', value: 1000 }] },
  { id: 'c016', name: 'Кованый нагрудник',         rarity: 'common', stats: [{ type: 'maxHp', value: 1100 }] },
  { id: 'c017', name: 'Закалённый щит',            rarity: 'common', stats: [{ type: 'maxHp', value: 1200 }] },
  { id: 'c018', name: 'Латный нагрудник',          rarity: 'common', stats: [{ type: 'maxHp', value: 1300 }] },
  { id: 'c019', name: 'Тяжёлые латы',             rarity: 'common', stats: [{ type: 'maxHp', value: 1400 }] },
  { id: 'c020', name: 'Мифриловая пластина',       rarity: 'common', stats: [{ type: 'maxHp', value: 1500 }] },

  // ── +реген HP/сек (N 1–15) ─────────────────────────────────────────────
  { id: 'c021', name: 'Травяной компресс',         rarity: 'common', stats: [{ type: 'hpRegen', value: 1  }] },
  { id: 'c022', name: 'Лечебный настой',           rarity: 'common', stats: [{ type: 'hpRegen', value: 2  }] },
  { id: 'c023', name: 'Зелье регенерации',         rarity: 'common', stats: [{ type: 'hpRegen', value: 3  }] },
  { id: 'c024', name: 'Берёзовый сок',             rarity: 'common', stats: [{ type: 'hpRegen', value: 4  }] },
  { id: 'c025', name: 'Паучий антидот',            rarity: 'common', stats: [{ type: 'hpRegen', value: 5  }] },
  { id: 'c026', name: 'Корень жизни',              rarity: 'common', stats: [{ type: 'hpRegen', value: 6  }] },
  { id: 'c027', name: 'Эликсир бодрости',          rarity: 'common', stats: [{ type: 'hpRegen', value: 7  }] },
  { id: 'c028', name: 'Кровяной тоник',            rarity: 'common', stats: [{ type: 'hpRegen', value: 8  }] },
  { id: 'c029', name: 'Сок паутиновника',          rarity: 'common', stats: [{ type: 'hpRegen', value: 9  }] },
  { id: 'c030', name: 'Концентрированный бальзам', rarity: 'common', stats: [{ type: 'hpRegen', value: 10 }] },
  { id: 'c031', name: 'Целебные руны',             rarity: 'common', stats: [{ type: 'hpRegen', value: 11 }] },
  { id: 'c032', name: 'Зелье жизнестойкости',      rarity: 'common', stats: [{ type: 'hpRegen', value: 12 }] },
  { id: 'c033', name: 'Тотем исцеления',           rarity: 'common', stats: [{ type: 'hpRegen', value: 13 }] },
  { id: 'c034', name: 'Талисман восстановления',   rarity: 'common', stats: [{ type: 'hpRegen', value: 14 }] },
  { id: 'c035', name: 'Священный бальзам',         rarity: 'common', stats: [{ type: 'hpRegen', value: 15 }] },

  // ── % снижение урона (N 1–15) ──────────────────────────────────────────
  { id: 'c036', name: 'Кожаный наруч',             rarity: 'common', stats: [{ type: 'damageReduction', value: 1  }] },
  { id: 'c038', name: 'Чешуйчатый наруч',          rarity: 'common', stats: [{ type: 'damageReduction', value: 2  }] },
  { id: 'c040', name: 'Кольчужные перчатки',       rarity: 'common', stats: [{ type: 'damageReduction', value: 3  }] },
  { id: 'c042', name: 'Усиленный наруч',           rarity: 'common', stats: [{ type: 'damageReduction', value: 4  }] },
  { id: 'c044', name: 'Стальной щит',              rarity: 'common', stats: [{ type: 'damageReduction', value: 5  }] },
  { id: 'c046', name: 'Рунный щит',                rarity: 'common', stats: [{ type: 'damageReduction', value: 6  }] },
  { id: 'c047', name: 'Костяной доспех',           rarity: 'common', stats: [{ type: 'damageReduction', value: 7  }] },
  { id: 'c048', name: 'Тяжёлый щит',              rarity: 'common', stats: [{ type: 'damageReduction', value: 8  }] },
  { id: 'c049', name: 'Стальные перчатки',         rarity: 'common', stats: [{ type: 'damageReduction', value: 9  }] },
  { id: 'c050', name: 'Укреплённый доспех',        rarity: 'common', stats: [{ type: 'damageReduction', value: 10 }] },
  { id: 'c051', name: 'Закалённые перчатки',       rarity: 'common', stats: [{ type: 'damageReduction', value: 11 }] },
  { id: 'c052', name: 'Рыцарские поножи',          rarity: 'common', stats: [{ type: 'damageReduction', value: 12 }] },
  { id: 'c053', name: 'Стальная накидка',          rarity: 'common', stats: [{ type: 'damageReduction', value: 13 }] },
  { id: 'c054', name: 'Кованые перчатки',          rarity: 'common', stats: [{ type: 'damageReduction', value: 14 }] },
  { id: 'c055', name: 'Адамантовый щит',           rarity: 'common', stats: [{ type: 'damageReduction', value: 15 }] },

  // ── +макс. энергия (N 1–6) ─────────────────────────────────────────────
  { id: 'c056', name: 'Энергетическая склянка',    rarity: 'common', stats: [{ type: 'maxEnergy', value: 10 }] },
  { id: 'c058', name: 'Синий кристалл',            rarity: 'common', stats: [{ type: 'maxEnergy', value: 20 }] },
  { id: 'c060', name: 'Амулет мудреца',            rarity: 'common', stats: [{ type: 'maxEnergy', value: 30 }] },
  { id: 'c062', name: 'Сапфировый медальон',       rarity: 'common', stats: [{ type: 'maxEnergy', value: 40 }] },
  { id: 'c064', name: 'Лазуритовая сфера',         rarity: 'common', stats: [{ type: 'maxEnergy', value: 50 }] },
  { id: 'c066', name: 'Реликварий знаний',         rarity: 'common', stats: [{ type: 'maxEnergy', value: 60 }] },

  // ── +реген энергии/сек ─────────────────────────────────────────────────
  { id: 'c068', name: 'Стимулятор',                rarity: 'common', stats: [{ type: 'energyRegen', value: 1 }] },
  { id: 'c076', name: 'Двойной стимулятор',        rarity: 'common', stats: [{ type: 'energyRegen', value: 2 }] },

  // ── +энергия за убийство ───────────────────────────────────────────────
  { id: 'c078', name: 'Адреналин убийцы',          rarity: 'common', stats: [{ type: 'energyPerKill', value: 1 }] },
  { id: 'c086', name: 'Двойной адреналин',         rarity: 'common', stats: [{ type: 'energyPerKill', value: 2 }] },

  // ── +энергия при прорыве ───────────────────────────────────────────────
  { id: 'c088', name: 'Трофейный щит',             rarity: 'common', stats: [{ type: 'energyPerBreach', value: 1 }] },
  { id: 'c094', name: 'Талисман стража',           rarity: 'common', stats: [{ type: 'energyPerBreach', value: 2 }] },

  // ── +монетки за убийство ───────────────────────────────────────────────
  { id: 'c096', name: 'Кошелёк охотника',          rarity: 'common', stats: [{ type: 'coinsPerKill', value: 1 }] },
];

// ─── РЕДКИЕ (70 шт.) ──────────────────────────────────────────────────────────

const RARE_ITEMS: readonly ItemConfig[] = [

  // ── Один стат (20 шт.) — значения выше потолка Common ────────────────────
  { id: 'r001', name: 'Грудная пластина бойца',    rarity: 'rare', stats: [{ type: 'maxHp', value: 1800 }] },
  { id: 'r002', name: 'Нагрудник воина',           rarity: 'rare', stats: [{ type: 'maxHp', value: 2200 }] },
  { id: 'r003', name: 'Латная куртка',             rarity: 'rare', stats: [{ type: 'maxHp', value: 2700 }] },
  { id: 'r004', name: 'Панцирь чемпиона',          rarity: 'rare', stats: [{ type: 'maxHp', value: 3300 }] },
  { id: 'r005', name: 'Ядовитый антидот',          rarity: 'rare', stats: [{ type: 'hpRegen', value: 18 }] },
  { id: 'r006', name: 'Концентрированное зелье',   rarity: 'rare', stats: [{ type: 'hpRegen', value: 22 }] },
  { id: 'r007', name: 'Зелье бессмертия',          rarity: 'rare', stats: [{ type: 'hpRegen', value: 28 }] },
  { id: 'r008', name: 'Защитный панцирь',          rarity: 'rare', stats: [{ type: 'damageReduction', value: 18 }] },
  { id: 'r009', name: 'Зачарованный щит',          rarity: 'rare', stats: [{ type: 'damageReduction', value: 22 }] },
  { id: 'r010', name: 'Несокрушимый доспех',       rarity: 'rare', stats: [{ type: 'damageReduction', value: 28 }] },
  { id: 'r011', name: 'Синий тотем',               rarity: 'rare', stats: [{ type: 'maxEnergy', value: 80  }] },
  { id: 'r012', name: 'Магический топаз',          rarity: 'rare', stats: [{ type: 'maxEnergy', value: 100 }] },
  { id: 'r013', name: 'Лазоревый орб',             rarity: 'rare', stats: [{ type: 'maxEnergy', value: 120 }] },
  { id: 'r014', name: 'Серебряный стимулятор',     rarity: 'rare', stats: [{ type: 'energyRegen', value: 3 }] },
  { id: 'r015', name: 'Усиленный концентрат',      rarity: 'rare', stats: [{ type: 'energyRegen', value: 4 }] },
  { id: 'r016', name: 'Серебряный адреналин',      rarity: 'rare', stats: [{ type: 'energyPerKill', value: 3 }] },
  { id: 'r017', name: 'Усиленный адреналин',       rarity: 'rare', stats: [{ type: 'energyPerKill', value: 4 }] },
  { id: 'r018', name: 'Серебряный оберег',         rarity: 'rare', stats: [{ type: 'energyPerBreach', value: 3 }] },
  { id: 'r019', name: 'Усиленный оберег замка',    rarity: 'rare', stats: [{ type: 'energyPerBreach', value: 4 }] },
  { id: 'r020', name: 'Великий оберег',            rarity: 'rare', stats: [{ type: 'energyPerBreach', value: 5 }] },

  // ── Два стата (50 шт.) ───────────────────────────────────────────────────

  // HP + HPRegen
  { id: 'r021', name: 'Живая броня',               rarity: 'rare', stats: [{ type: 'maxHp', value: 200 }, { type: 'hpRegen', value: 2  }] },
  { id: 'r022', name: 'Доспех выносливости',       rarity: 'rare', stats: [{ type: 'maxHp', value: 300 }, { type: 'hpRegen', value: 3  }] },
  { id: 'r023', name: 'Боевая перевязь',           rarity: 'rare', stats: [{ type: 'maxHp', value: 500 }, { type: 'hpRegen', value: 5  }] },
  { id: 'r024', name: 'Доспех чемпиона',           rarity: 'rare', stats: [{ type: 'maxHp', value: 700 }, { type: 'hpRegen', value: 7  }] },
  { id: 'r025', name: 'Латы долголетия',           rarity: 'rare', stats: [{ type: 'maxHp', value: 1000}, { type: 'hpRegen', value: 10 }] },

  // HP + DmgRed
  { id: 'r026', name: 'Кожаный доспех',            rarity: 'rare', stats: [{ type: 'maxHp', value: 200 }, { type: 'damageReduction', value: 2 }] },
  { id: 'r027', name: 'Стальная куртка',           rarity: 'rare', stats: [{ type: 'maxHp', value: 400 }, { type: 'damageReduction', value: 4 }] },
  { id: 'r028', name: 'Закалённый нагрудник',      rarity: 'rare', stats: [{ type: 'maxHp', value: 600 }, { type: 'damageReduction', value: 6 }] },
  { id: 'r029', name: 'Непробиваемые латы',        rarity: 'rare', stats: [{ type: 'maxHp', value: 900 }, { type: 'damageReduction', value: 9 }] },

  // HP + MaxEnergy
  { id: 'r030', name: 'Тактический жилет',         rarity: 'rare', stats: [{ type: 'maxHp', value: 300 }, { type: 'maxEnergy', value: 10 }] },
  { id: 'r031', name: 'Нагрудник мага',            rarity: 'rare', stats: [{ type: 'maxHp', value: 500 }, { type: 'maxEnergy', value: 20 }] },
  { id: 'r032', name: 'Броня волшебника',          rarity: 'rare', stats: [{ type: 'maxHp', value: 700 }, { type: 'maxEnergy', value: 30 }] },

  // HP + EnergyRegen
  { id: 'r033', name: 'Зелье воина',               rarity: 'rare', stats: [{ type: 'maxHp', value: 300 }, { type: 'energyRegen', value: 1 }] },
  { id: 'r034', name: 'Тоник воина',               rarity: 'rare', stats: [{ type: 'maxHp', value: 700 }, { type: 'energyRegen', value: 1 }] },

  // HP + EnergyPerKill
  { id: 'r035', name: 'Боевая мазь',               rarity: 'rare', stats: [{ type: 'maxHp', value: 300 }, { type: 'energyPerKill', value: 1 }] },
  { id: 'r036', name: 'Кулон убийцы',              rarity: 'rare', stats: [{ type: 'maxHp', value: 800 }, { type: 'energyPerKill', value: 1 }] },

  // HP + EnergyPerBreach
  { id: 'r037', name: 'Оберег бойца',              rarity: 'rare', stats: [{ type: 'maxHp', value: 300 }, { type: 'energyPerBreach', value: 1 }] },
  { id: 'r038', name: 'Страж воина',               rarity: 'rare', stats: [{ type: 'maxHp', value: 700 }, { type: 'energyPerBreach', value: 1 }] },

  // HP + CoinsPerKill
  { id: 'r039', name: 'Трофейный нагрудник',       rarity: 'rare', stats: [{ type: 'maxHp', value: 300 }, { type: 'coinsPerKill', value: 1 }] },
  { id: 'r040', name: 'Доспех торговца',           rarity: 'rare', stats: [{ type: 'maxHp', value: 800 }, { type: 'coinsPerKill', value: 1 }] },

  // HPRegen + DmgRed
  { id: 'r041', name: 'Быстрая регенерация',       rarity: 'rare', stats: [{ type: 'hpRegen', value: 3 }, { type: 'damageReduction', value: 1 }] },
  { id: 'r042', name: 'Рунный жилет',              rarity: 'rare', stats: [{ type: 'hpRegen', value: 5 }, { type: 'damageReduction', value: 3 }] },
  { id: 'r043', name: 'Зелье стойкости',           rarity: 'rare', stats: [{ type: 'hpRegen', value: 8 }, { type: 'damageReduction', value: 5 }] },
  { id: 'r044', name: 'Зелье легенды',             rarity: 'rare', stats: [{ type: 'hpRegen', value: 10}, { type: 'damageReduction', value: 7 }] },

  // HPRegen + MaxEnergy
  { id: 'r045', name: 'Тоник мудрости',            rarity: 'rare', stats: [{ type: 'hpRegen', value: 3 }, { type: 'maxEnergy', value: 20 }] },
  { id: 'r046', name: 'Зелье концентрата',         rarity: 'rare', stats: [{ type: 'hpRegen', value: 8 }, { type: 'maxEnergy', value: 30 }] },

  // HPRegen + EnergyRegen
  { id: 'r047', name: 'Амулет восстановления',     rarity: 'rare', stats: [{ type: 'hpRegen', value: 5  }, { type: 'energyRegen', value: 1 }] },
  { id: 'r048', name: 'Зелье бодрости',            rarity: 'rare', stats: [{ type: 'hpRegen', value: 10 }, { type: 'energyRegen', value: 1 }] },

  // HPRegen + EnergyPerKill
  { id: 'r049', name: 'Кровавый настой',           rarity: 'rare', stats: [{ type: 'hpRegen', value: 5  }, { type: 'energyPerKill', value: 1 }] },
  { id: 'r050', name: 'Зелье жатвы',               rarity: 'rare', stats: [{ type: 'hpRegen', value: 12 }, { type: 'energyPerKill', value: 1 }] },

  // HPRegen + EnergyPerBreach
  { id: 'r051', name: 'Тоник стражника',           rarity: 'rare', stats: [{ type: 'hpRegen', value: 5  }, { type: 'energyPerBreach', value: 1 }] },
  { id: 'r052', name: 'Эликсир стражника',         rarity: 'rare', stats: [{ type: 'hpRegen', value: 10 }, { type: 'energyPerBreach', value: 1 }] },

  // HPRegen + CoinsPerKill
  { id: 'r053', name: 'Торговое зелье',            rarity: 'rare', stats: [{ type: 'hpRegen', value: 5 }, { type: 'coinsPerKill', value: 1 }] },

  // DmgRed + MaxEnergy
  { id: 'r054', name: 'Магическая броня',          rarity: 'rare', stats: [{ type: 'damageReduction', value: 3 }, { type: 'maxEnergy', value: 20 }] },
  { id: 'r055', name: 'Рунная броня',              rarity: 'rare', stats: [{ type: 'damageReduction', value: 6 }, { type: 'maxEnergy', value: 30 }] },

  // DmgRed + EnergyRegen
  { id: 'r056', name: 'Кольчужная жилетка',        rarity: 'rare', stats: [{ type: 'damageReduction', value: 3 }, { type: 'energyRegen', value: 1 }] },
  { id: 'r057', name: 'Броня тактика',             rarity: 'rare', stats: [{ type: 'damageReduction', value: 7 }, { type: 'energyRegen', value: 1 }] },

  // DmgRed + EnergyPerKill
  { id: 'r058', name: 'Боевой доспех',             rarity: 'rare', stats: [{ type: 'damageReduction', value: 3 }, { type: 'energyPerKill', value: 1 }] },
  { id: 'r059', name: 'Доспех убийцы',             rarity: 'rare', stats: [{ type: 'damageReduction', value: 8 }, { type: 'energyPerKill', value: 1 }] },

  // DmgRed + EnergyPerBreach
  { id: 'r060', name: 'Щит стражника',             rarity: 'rare', stats: [{ type: 'damageReduction', value: 3 }, { type: 'energyPerBreach', value: 1 }] },
  { id: 'r061', name: 'Оберег крепости',           rarity: 'rare', stats: [{ type: 'damageReduction', value: 7 }, { type: 'energyPerBreach', value: 1 }] },

  // DmgRed + CoinsPerKill
  { id: 'r062', name: 'Золотая броня',             rarity: 'rare', stats: [{ type: 'damageReduction', value: 4 }, { type: 'coinsPerKill', value: 1 }] },

  // MaxEnergy + EnergyRegen
  { id: 'r063', name: 'Синий амулет',              rarity: 'rare', stats: [{ type: 'maxEnergy', value: 20 }, { type: 'energyRegen', value: 1 }] },
  { id: 'r064', name: 'Реликвия скорости',         rarity: 'rare', stats: [{ type: 'maxEnergy', value: 30 }, { type: 'energyRegen', value: 1 }] },

  // MaxEnergy + EnergyPerKill
  { id: 'r065', name: 'Кристалл убийцы',          rarity: 'rare', stats: [{ type: 'maxEnergy', value: 20 }, { type: 'energyPerKill', value: 1 }] },

  // MaxEnergy + EnergyPerBreach
  { id: 'r066', name: 'Кристалл стражника',        rarity: 'rare', stats: [{ type: 'maxEnergy', value: 20 }, { type: 'energyPerBreach', value: 1 }] },

  // MaxEnergy + CoinsPerKill
  { id: 'r067', name: 'Сапфировый кошелёк',       rarity: 'rare', stats: [{ type: 'maxEnergy', value: 20 }, { type: 'coinsPerKill', value: 1 }] },

  // EnergyRegen + EnergyPerKill
  { id: 'r068', name: 'Кольцо берсерка',           rarity: 'rare', stats: [{ type: 'energyRegen', value: 1 }, { type: 'energyPerKill', value: 1 }] },

  // EnergyRegen + EnergyPerBreach
  { id: 'r069', name: 'Кольцо стража',             rarity: 'rare', stats: [{ type: 'energyRegen', value: 1 }, { type: 'energyPerBreach', value: 1 }] },

  // EnergyRegen + CoinsPerKill
  { id: 'r070', name: 'Кольцо казначея',           rarity: 'rare', stats: [{ type: 'energyRegen', value: 1 }, { type: 'coinsPerKill', value: 1 }] },
];

// ─── ЭПИЧЕСКИЕ (40 шт., ×1.15) ────────────────────────────────────────────────

const EPIC_ITEMS: readonly ItemConfig[] = [

  // ── Один стат (8 шт.) — значения выше потолка Rare 1-stat ────────────────
  { id: 'e001', name: 'Монолит здоровья',          rarity: 'epic', stats: [{ type: 'maxHp', value: 3600 }] },
  { id: 'e002', name: 'Стальная твердыня',         rarity: 'epic', stats: [{ type: 'maxHp', value: 4200 }] },
  { id: 'e003', name: 'Живой источник',            rarity: 'epic', stats: [{ type: 'hpRegen', value: 50 }] },
  { id: 'e004', name: 'Щит предков',               rarity: 'epic', stats: [{ type: 'damageReduction', value: 33 }] },
  { id: 'e005', name: 'Средоточие энергии',        rarity: 'epic', stats: [{ type: 'maxEnergy', value: 140 }] },
  { id: 'e006', name: 'Руна потока',               rarity: 'epic', stats: [{ type: 'energyRegen', value: 5 }] },
  { id: 'e007', name: 'Клинок жатвы',              rarity: 'epic', stats: [{ type: 'energyPerKill', value: 5 }] },
  { id: 'e008', name: 'Страж замка',               rarity: 'epic', stats: [{ type: 'energyPerBreach', value: 6 }] },

  // ── Два стата (16 шт.) — каждый стат выше потолка Rare 2-stat ──────────
  { id: 'e009', name: 'Доспех воина',              rarity: 'epic', stats: [{ type: 'maxHp', value: 1500 }, { type: 'damageReduction', value: 12 }] },
  { id: 'e010', name: 'Живая броня воителя',       rarity: 'epic', stats: [{ type: 'maxHp', value: 1800 }, { type: 'hpRegen', value: 16       }] },
  { id: 'e011', name: 'Тактический жезл',          rarity: 'epic', stats: [{ type: 'maxHp', value: 1500 }, { type: 'maxEnergy', value: 40     }] },
  { id: 'e012', name: 'Реликвия воина',            rarity: 'epic', stats: [{ type: 'maxHp', value: 1800 }, { type: 'energyRegen', value: 2    }] },
  { id: 'e013', name: 'Клинок охотника',           rarity: 'epic', stats: [{ type: 'maxHp', value: 1800 }, { type: 'energyPerKill', value: 2  }] },
  { id: 'e014', name: 'Трофей удачи',              rarity: 'epic', stats: [{ type: 'maxHp', value: 2000 }, { type: 'coinsPerKill', value: 2   }] },
  { id: 'e015', name: 'Рунный доспех',             rarity: 'epic', stats: [{ type: 'hpRegen', value: 16 }, { type: 'damageReduction', value: 12 }] },
  { id: 'e016', name: 'Доспех тактика',            rarity: 'epic', stats: [{ type: 'hpRegen', value: 16 }, { type: 'energyRegen', value: 2    }] },
  { id: 'e017', name: 'Магический щит',            rarity: 'epic', stats: [{ type: 'damageReduction', value: 12 }, { type: 'maxEnergy', value: 40 }] },
  { id: 'e018', name: 'Реликвия концентрации',     rarity: 'epic', stats: [{ type: 'maxEnergy', value: 40 }, { type: 'energyRegen', value: 2  }] },
  { id: 'e019', name: 'Посох богатства',           rarity: 'epic', stats: [{ type: 'maxEnergy', value: 50 }, { type: 'coinsPerKill', value: 2 }] },
  { id: 'e020', name: 'Амулет берсерка',           rarity: 'epic', stats: [{ type: 'energyRegen', value: 3 }, { type: 'energyPerBreach', value: 3 }] },
  { id: 'e021', name: 'Парный амулет',             rarity: 'epic', stats: [{ type: 'energyRegen', value: 2 }, { type: 'energyPerKill', value: 2  }] },
  { id: 'e022', name: 'Кошелёк скорости',          rarity: 'epic', stats: [{ type: 'energyRegen', value: 2 }, { type: 'coinsPerKill', value: 2   }] },
  { id: 'e023', name: 'Амулет охотника',           rarity: 'epic', stats: [{ type: 'energyPerKill', value: 3 }, { type: 'energyPerBreach', value: 3 }] },
  { id: 'e024', name: 'Трофейный кошелёк',         rarity: 'epic', stats: [{ type: 'energyPerBreach', value: 3 }, { type: 'coinsPerKill', value: 2 }] },

  // ── Три стата (16 шт.) ───────────────────────────────────────────────────
  { id: 'e025', name: 'Пояс выносливости',         rarity: 'epic', stats: [{ type: 'maxHp', value: 500 }, { type: 'hpRegen', value: 5 }, { type: 'damageReduction', value: 5 }] },
  { id: 'e026', name: 'Реликвия мудрости',         rarity: 'epic', stats: [{ type: 'maxHp', value: 500 }, { type: 'maxEnergy', value: 20 }, { type: 'energyRegen', value: 1 }] },
  { id: 'e027', name: 'Нагрудник воителя',         rarity: 'epic', stats: [{ type: 'maxHp', value: 700 }, { type: 'hpRegen', value: 5 }, { type: 'damageReduction', value: 5 }] },
  { id: 'e028', name: 'Талисман охотника',         rarity: 'epic', stats: [{ type: 'maxHp', value: 500 }, { type: 'hpRegen', value: 5 }, { type: 'maxEnergy', value: 20 }] },
  { id: 'e029', name: 'Дух победителя',            rarity: 'epic', stats: [{ type: 'maxHp', value: 700 }, { type: 'energyRegen', value: 1 }, { type: 'coinsPerKill', value: 1 }] },
  { id: 'e030', name: 'Клинок силы',               rarity: 'epic', stats: [{ type: 'maxHp', value: 700 }, { type: 'energyPerKill', value: 1 }, { type: 'maxEnergy', value: 20 }] },
  { id: 'e031', name: 'Доспех богача',             rarity: 'epic', stats: [{ type: 'maxHp', value: 800 }, { type: 'hpRegen', value: 7 }, { type: 'coinsPerKill', value: 1 }] },
  { id: 'e032', name: 'Боевой жилет',              rarity: 'epic', stats: [{ type: 'hpRegen', value: 7 }, { type: 'damageReduction', value: 5 }, { type: 'energyRegen', value: 1 }] },
  { id: 'e033', name: 'Зелье героя',               rarity: 'epic', stats: [{ type: 'hpRegen', value: 8 }, { type: 'maxEnergy', value: 30 }, { type: 'energyPerKill', value: 1 }] },
  { id: 'e034', name: 'Кулон стратега',            rarity: 'epic', stats: [{ type: 'hpRegen', value: 10 }, { type: 'damageReduction', value: 7 }, { type: 'coinsPerKill', value: 1 }] },
  { id: 'e035', name: 'Доспех мага',               rarity: 'epic', stats: [{ type: 'damageReduction', value: 5 }, { type: 'maxEnergy', value: 30 }, { type: 'energyRegen', value: 1 }] },
  { id: 'e036', name: 'Броня казначея',            rarity: 'epic', stats: [{ type: 'damageReduction', value: 7 }, { type: 'maxEnergy', value: 30 }, { type: 'coinsPerKill', value: 1 }] },
  { id: 'e037', name: 'Амулет авантюриста',        rarity: 'epic', stats: [{ type: 'energyRegen', value: 1 }, { type: 'energyPerKill', value: 1 }, { type: 'maxHp', value: 500 }] },
  { id: 'e038', name: 'Кольцо стража',             rarity: 'epic', stats: [{ type: 'energyRegen', value: 1 }, { type: 'energyPerBreach', value: 1 }, { type: 'maxEnergy', value: 20 }] },
  { id: 'e039', name: 'Ожерелье берсерка',         rarity: 'epic', stats: [{ type: 'energyPerKill', value: 2 }, { type: 'coinsPerKill', value: 1 }, { type: 'maxHp', value: 700 }] },
  { id: 'e040', name: 'Оберег крепости',           rarity: 'epic', stats: [{ type: 'energyPerBreach', value: 2 }, { type: 'energyRegen', value: 1 }, { type: 'coinsPerKill', value: 1 }] },
];

// ─── ЛЕГЕНДАРНЫЕ (20 шт., ×1.5) ───────────────────────────────────────────────
// Каждый предмет: 3 стата + уникальная модификация способности.

const LEGENDARY_ITEMS: readonly ItemConfig[] = [

  // ── Армагеддон (3 предмета) ───────────────────────────────────────────────
  {
    id: 'l001', name: 'Реликвия Армагеддона', rarity: 'legendary',
    stats: [{ type: 'maxHp', value: 500 }, { type: 'damageReduction', value: 5 }, { type: 'energyRegen', value: 1 }],
    abilityMod: { abilityId: 'armageddon', modType: 'cooldownReduction', value: 30, description: '«Армагеддон»: кулдаун −30 сек' },
  },
  {
    id: 'l002', name: 'Гримуар Армагеддона', rarity: 'legendary',
    stats: [{ type: 'maxHp', value: 900 }, { type: 'hpRegen', value: 5 }, { type: 'coinsPerKill', value: 1 }],
    abilityMod: { abilityId: 'armageddon', modType: 'effectBoost', value: 1, description: '«Армагеддон»: длительность +1 сек.' },
  },
  {
    id: 'l003', name: 'Доспех Армагеддона', rarity: 'legendary',
    stats: [{ type: 'maxEnergy', value: 30 }, { type: 'energyRegen', value: 1 }, { type: 'damageReduction', value: 5 }],
    abilityMod: { abilityId: 'armageddon', modType: 'costReduction', value: 50, description: '«Армагеддон»: стоимость −50 энергии' },
  },

  // ── Вьюга (3 предмета) ────────────────────────────────────────────────────
  {
    id: 'l004', name: 'Клинок Вьюги', rarity: 'legendary',
    stats: [{ type: 'maxEnergy', value: 30 }, { type: 'energyPerKill', value: 1 }, { type: 'coinsPerKill', value: 1 }],
    abilityMod: { abilityId: 'blizzard', modType: 'effectBoost', value: 2, description: '«Вьюга»: длительность +2 сек' },
  },
  {
    id: 'l005', name: 'Корона Вьюги', rarity: 'legendary',
    stats: [{ type: 'maxHp', value: 700 }, { type: 'damageReduction', value: 5 }, { type: 'energyRegen', value: 1 }],
    abilityMod: { abilityId: 'blizzard', modType: 'cooldownReduction', value: 3, description: '«Вьюга»: кулдаун −3 сек' },
  },
  {
    id: 'l006', name: 'Мантия Вьюги', rarity: 'legendary',
    stats: [{ type: 'maxEnergy', value: 40 }, { type: 'energyPerBreach', value: 1 }, { type: 'damageReduction', value: 3 }],
    abilityMod: { abilityId: 'blizzard', modType: 'costReduction', value: 30, description: '«Вьюга»: стоимость −30 энергии' },
  },

  // ── Залп (3 предмета) ─────────────────────────────────────────────────────
  {
    id: 'l007', name: 'Оберег Залпа', rarity: 'legendary',
    stats: [{ type: 'maxHp', value: 500 }, { type: 'hpRegen', value: 5 }, { type: 'coinsPerKill', value: 1 }],
    abilityMod: { abilityId: 'volley', modType: 'effectBoost', value: 4, description: '«Залп»: +4 дополнительные линии' },
  },
  {
    id: 'l008', name: 'Перчатки Залпа', rarity: 'legendary',
    stats: [{ type: 'maxHp', value: 500 }, { type: 'maxEnergy', value: 30 }, { type: 'energyRegen', value: 1 }],
    abilityMod: { abilityId: 'volley', modType: 'costReduction', value: 20, description: '«Залп»: стоимость −20 энергии' },
  },
  {
    id: 'l009', name: 'Тетива Залпа', rarity: 'legendary',
    stats: [{ type: 'maxEnergy', value: 30 }, { type: 'energyPerKill', value: 1 }, { type: 'damageReduction', value: 5 }],
    abilityMod: { abilityId: 'volley', modType: 'cooldownReduction', value: 1, description: '«Залп»: кулдаун −1 сек' },
  },

  // ── Ни шагу назад! (2 предмета) ──────────────────────────────────────────
  {
    id: 'l010', name: 'Щит Ни шагу назад!', rarity: 'legendary',
    stats: [{ type: 'maxHp', value: 900 }, { type: 'hpRegen', value: 5 }, { type: 'damageReduction', value: 5 }],
    abilityMod: { abilityId: 'stand', modType: 'cooldownReduction', value: 10, description: '«Ни шагу назад!»: кулдаун −10 сек' },
  },
  {
    id: 'l011', name: 'Оберег стойкости', rarity: 'legendary',
    stats: [{ type: 'maxHp', value: 700 }, { type: 'damageReduction', value: 7 }, { type: 'energyPerBreach', value: 2 }],
    abilityMod: { abilityId: 'stand', modType: 'effectBoost', value: 3, description: '«Ни шагу назад!»: длительность +3 сек' },
  },

  // ── Подготовка (2 предмета) ───────────────────────────────────────────────
  {
    id: 'l012', name: 'Амулет Подготовки', rarity: 'legendary',
    stats: [{ type: 'maxEnergy', value: 30 }, { type: 'energyRegen', value: 1 }, { type: 'damageReduction', value: 5 }],
    abilityMod: { abilityId: 'prep', modType: 'cooldownReduction', value: 8, description: '«Подготовка»: кулдаун −8 сек' },
  },
  {
    id: 'l013', name: 'Кулон Подготовки', rarity: 'legendary',
    stats: [{ type: 'maxEnergy', value: 40 }, { type: 'energyPerKill', value: 1 }, { type: 'coinsPerKill', value: 1 }],
    abilityMod: { abilityId: 'prep', modType: 'effectBoost', value: 0.5, description: '«Подготовка»: количество восстанавливаемой энергии +150' },
  },

  // ── Заморозка (1 предмет) ────────────────────────────────────────────────
  {
    id: 'l015', name: 'Ледяная корона', rarity: 'legendary',
    stats: [{ type: 'maxEnergy', value: 30 }, { type: 'energyRegen', value: 1 }, { type: 'energyPerBreach', value: 2 }],
    abilityMod: { abilityId: 'freeze', modType: 'costReduction', value: 45, description: '«Заморозка»: стоимость −45 энергии' },
  },

  // ── Лечение (2 предмета) ──────────────────────────────────────────────────
  {
    id: 'l016', name: 'Амулет Лечения', rarity: 'legendary',
    stats: [{ type: 'maxHp', value: 700 }, { type: 'hpRegen', value: 8 }, { type: 'energyRegen', value: 1 }],
    abilityMod: { abilityId: 'heal', modType: 'effectBoost', value: 1500, description: '«Лечение»: количество восстанавливаемого HP +1500' },
  },
  {
    id: 'l017', name: 'Оберег Лечения', rarity: 'legendary',
    stats: [{ type: 'maxHp', value: 1000 }, { type: 'hpRegen', value: 10 }, { type: 'damageReduction', value: 3 }],
    abilityMod: { abilityId: 'heal', modType: 'cooldownReduction', value: 3, description: '«Лечение»: кулдаун −3 сек' },
  },

  // ── Обновление (2 предмета) ───────────────────────────────────────────────
  {
    id: 'l018', name: 'Кристалл Обновления', rarity: 'legendary',
    stats: [{ type: 'maxEnergy', value: 40 }, { type: 'energyRegen', value: 1 }, { type: 'energyPerKill', value: 1 }],
    abilityMod: { abilityId: 'recharge', modType: 'cooldownReduction', value: 60, description: '«Обновление»: кулдаун −60 сек' },
  },
  {
    id: 'l020', name: 'Посох Обновления', rarity: 'legendary',
    stats: [{ type: 'maxEnergy', value: 30 }, { type: 'energyRegen', value: 1 }, { type: 'coinsPerKill', value: 1 }],
    abilityMod: { abilityId: 'recharge', modType: 'costReduction', value: 30, description: '«Обновление»: стоимость −30 энергии' },
  },
];

// ─── Полный каталог ────────────────────────────────────────────────────────────

function withPrice(cfg: ItemConfig): ItemDefinition {
  return { ...cfg, price: computeItemPrice(cfg) };
}

export const ITEM_CATALOG: readonly ItemDefinition[] = [
  ...COMMON_ITEMS,
  ...RARE_ITEMS,
  ...EPIC_ITEMS,
  ...LEGENDARY_ITEMS,
].map(withPrice);

export const ITEM_MAP: ReadonlyMap<string, ItemDefinition> = new Map(
  ITEM_CATALOG.map((item) => [item.id, item])
);

