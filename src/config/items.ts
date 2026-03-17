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

export interface ItemDefinition {
  readonly id: string;
  readonly name: string;
  readonly rarity: ItemRarity;
  readonly stats: readonly ItemStat[];
  readonly abilityMod?: AbilityMod;
  readonly price: number;
}

// ─── Ценообразование (справка) ────────────────────────────────────────────────
//
// Кат. А  (maxHp, hpRegen):          f(N) = N · log₂(N+1)
// Кат. Б  (damageReduction, coins):  f(N) = N²
// Кат. В  (maxEnergy, breach):       f(N) = N² · log₂(N+1)
// Кат. Г  (energyRegen, ekill):      f(N) = N³
//
// Базы: maxHp=100, hpRegen=30, dmg=30, coins=2000,
//        maxEnergy=100, breach=400, energyRegen=500, ekill=500
//
// Надбавка: common/rare ×1.0 | epic ×1.15 | legendary ×1.5
// Цена предмета = (∑ base_i · f_i(N_i)) · надбавка
//
// ─────────────────────────────────────────────────────────────────────────────

// ─── ОБЫЧНЫЕ (100 шт.) ────────────────────────────────────────────────────────

const COMMON_ITEMS: readonly ItemDefinition[] = [

  // ── +макс. HP (N 1–15, N1..5 по два варианта) ───────────────────────────
  { id: 'c001', name: 'Аптечные бинты',           rarity: 'common', stats: [{ type: 'maxHp', value: 100  }], price: 100   },
  { id: 'c002', name: 'Охотничий оберег',          rarity: 'common', stats: [{ type: 'maxHp', value: 100  }], price: 100   },
  { id: 'c003', name: 'Кожаная заплата',           rarity: 'common', stats: [{ type: 'maxHp', value: 200  }], price: 317   },
  { id: 'c004', name: 'Хитиновый осколок',         rarity: 'common', stats: [{ type: 'maxHp', value: 200  }], price: 317   },
  { id: 'c005', name: 'Кожаный жилет',             rarity: 'common', stats: [{ type: 'maxHp', value: 300  }], price: 600   },
  { id: 'c006', name: 'Паучья чешуя',              rarity: 'common', stats: [{ type: 'maxHp', value: 300  }], price: 600   },
  { id: 'c007', name: 'Плечевые накладки',         rarity: 'common', stats: [{ type: 'maxHp', value: 400  }], price: 929   },
  { id: 'c008', name: 'Лечебный тотем',            rarity: 'common', stats: [{ type: 'maxHp', value: 400  }], price: 929   },
  { id: 'c009', name: 'Боевая куртка',             rarity: 'common', stats: [{ type: 'maxHp', value: 500  }], price: 1292  },
  { id: 'c010', name: 'Усиленная рубаха',          rarity: 'common', stats: [{ type: 'maxHp', value: 500  }], price: 1292  },
  { id: 'c011', name: 'Кольчужные рукава',         rarity: 'common', stats: [{ type: 'maxHp', value: 600  }], price: 1684  },
  { id: 'c012', name: 'Наплечники охотника',       rarity: 'common', stats: [{ type: 'maxHp', value: 700  }], price: 2100  },
  { id: 'c013', name: 'Бронзовые поножи',          rarity: 'common', stats: [{ type: 'maxHp', value: 800  }], price: 2536  },
  { id: 'c014', name: 'Железный нагрудник',        rarity: 'common', stats: [{ type: 'maxHp', value: 900  }], price: 2990  },
  { id: 'c015', name: 'Стальные наплечники',       rarity: 'common', stats: [{ type: 'maxHp', value: 1000 }], price: 3459  },
  { id: 'c016', name: 'Кованый нагрудник',         rarity: 'common', stats: [{ type: 'maxHp', value: 1100 }], price: 3944  },
  { id: 'c017', name: 'Закалённый щит',            rarity: 'common', stats: [{ type: 'maxHp', value: 1200 }], price: 4440  },
  { id: 'c018', name: 'Латный нагрудник',          rarity: 'common', stats: [{ type: 'maxHp', value: 1300 }], price: 4950  },
  { id: 'c019', name: 'Тяжёлые латы',             rarity: 'common', stats: [{ type: 'maxHp', value: 1400 }], price: 5470  },
  { id: 'c020', name: 'Мифриловая пластина',       rarity: 'common', stats: [{ type: 'maxHp', value: 1500 }], price: 6000  },

  // ── +реген HP/сек (N 1–15) ───────────────────────────────────────────────
  { id: 'c021', name: 'Травяной компресс',         rarity: 'common', stats: [{ type: 'hpRegen', value: 1  }], price: 30   },
  { id: 'c022', name: 'Лечебный настой',           rarity: 'common', stats: [{ type: 'hpRegen', value: 2  }], price: 95   },
  { id: 'c023', name: 'Зелье регенерации',         rarity: 'common', stats: [{ type: 'hpRegen', value: 3  }], price: 180  },
  { id: 'c024', name: 'Берёзовый сок',             rarity: 'common', stats: [{ type: 'hpRegen', value: 4  }], price: 279  },
  { id: 'c025', name: 'Паучий антидот',            rarity: 'common', stats: [{ type: 'hpRegen', value: 5  }], price: 388  },
  { id: 'c026', name: 'Корень жизни',              rarity: 'common', stats: [{ type: 'hpRegen', value: 6  }], price: 505  },
  { id: 'c027', name: 'Эликсир бодрости',          rarity: 'common', stats: [{ type: 'hpRegen', value: 7  }], price: 630  },
  { id: 'c028', name: 'Кровяной тоник',            rarity: 'common', stats: [{ type: 'hpRegen', value: 8  }], price: 761  },
  { id: 'c029', name: 'Сок паутиновника',          rarity: 'common', stats: [{ type: 'hpRegen', value: 9  }], price: 897  },
  { id: 'c030', name: 'Концентрированный бальзам', rarity: 'common', stats: [{ type: 'hpRegen', value: 10 }], price: 1038 },
  { id: 'c031', name: 'Целебные руны',             rarity: 'common', stats: [{ type: 'hpRegen', value: 11 }], price: 1183 },
  { id: 'c032', name: 'Зелье жизнестойкости',      rarity: 'common', stats: [{ type: 'hpRegen', value: 12 }], price: 1332 },
  { id: 'c033', name: 'Тотем исцеления',           rarity: 'common', stats: [{ type: 'hpRegen', value: 13 }], price: 1485 },
  { id: 'c034', name: 'Талисман восстановления',   rarity: 'common', stats: [{ type: 'hpRegen', value: 14 }], price: 1641 },
  { id: 'c035', name: 'Священный бальзам',         rarity: 'common', stats: [{ type: 'hpRegen', value: 15 }], price: 1800 },

  // ── % снижение урона (N 1–15, N1..5 по два варианта) ────────────────────
  { id: 'c036', name: 'Кожаный наруч',             rarity: 'common', stats: [{ type: 'damageReduction', value: 1  }], price: 30   },
  { id: 'c037', name: 'Деревянный щит',            rarity: 'common', stats: [{ type: 'damageReduction', value: 1  }], price: 30   },
  { id: 'c038', name: 'Чешуйчатый наруч',          rarity: 'common', stats: [{ type: 'damageReduction', value: 2  }], price: 120  },
  { id: 'c039', name: 'Плетёный щит',              rarity: 'common', stats: [{ type: 'damageReduction', value: 2  }], price: 120  },
  { id: 'c040', name: 'Кольчужные перчатки',       rarity: 'common', stats: [{ type: 'damageReduction', value: 3  }], price: 270  },
  { id: 'c041', name: 'Хитиновый наруч',           rarity: 'common', stats: [{ type: 'damageReduction', value: 3  }], price: 270  },
  { id: 'c042', name: 'Усиленный наруч',           rarity: 'common', stats: [{ type: 'damageReduction', value: 4  }], price: 480  },
  { id: 'c043', name: 'Чешуйчатый панцирь',        rarity: 'common', stats: [{ type: 'damageReduction', value: 4  }], price: 480  },
  { id: 'c044', name: 'Стальной щит',              rarity: 'common', stats: [{ type: 'damageReduction', value: 5  }], price: 750  },
  { id: 'c045', name: 'Железные перчатки',         rarity: 'common', stats: [{ type: 'damageReduction', value: 5  }], price: 750  },
  { id: 'c046', name: 'Рунный щит',                rarity: 'common', stats: [{ type: 'damageReduction', value: 6  }], price: 1080 },
  { id: 'c047', name: 'Костяной доспех',           rarity: 'common', stats: [{ type: 'damageReduction', value: 7  }], price: 1470 },
  { id: 'c048', name: 'Тяжёлый щит',              rarity: 'common', stats: [{ type: 'damageReduction', value: 8  }], price: 1920 },
  { id: 'c049', name: 'Стальные перчатки',         rarity: 'common', stats: [{ type: 'damageReduction', value: 9  }], price: 2430 },
  { id: 'c050', name: 'Укреплённый доспех',        rarity: 'common', stats: [{ type: 'damageReduction', value: 10 }], price: 3000 },
  { id: 'c051', name: 'Закалённые перчатки',       rarity: 'common', stats: [{ type: 'damageReduction', value: 11 }], price: 3630 },
  { id: 'c052', name: 'Рыцарские поножи',          rarity: 'common', stats: [{ type: 'damageReduction', value: 12 }], price: 4320 },
  { id: 'c053', name: 'Стальная накидка',          rarity: 'common', stats: [{ type: 'damageReduction', value: 13 }], price: 5070 },
  { id: 'c054', name: 'Кованые перчатки',          rarity: 'common', stats: [{ type: 'damageReduction', value: 14 }], price: 5880 },
  { id: 'c055', name: 'Адамантовый щит',           rarity: 'common', stats: [{ type: 'damageReduction', value: 15 }], price: 6750 },

  // ── +макс. энергия (N 1–6, по два варианта) ─────────────────────────────
  { id: 'c056', name: 'Энергетическая склянка',    rarity: 'common', stats: [{ type: 'maxEnergy', value: 10 }], price: 100   },
  { id: 'c057', name: 'Магический кристалл',       rarity: 'common', stats: [{ type: 'maxEnergy', value: 10 }], price: 100   },
  { id: 'c058', name: 'Синий кристалл',            rarity: 'common', stats: [{ type: 'maxEnergy', value: 20 }], price: 634   },
  { id: 'c059', name: 'Зелье концентрации',        rarity: 'common', stats: [{ type: 'maxEnergy', value: 20 }], price: 634   },
  { id: 'c060', name: 'Амулет мудреца',            rarity: 'common', stats: [{ type: 'maxEnergy', value: 30 }], price: 1800  },
  { id: 'c061', name: 'Магический жезл',           rarity: 'common', stats: [{ type: 'maxEnergy', value: 30 }], price: 1800  },
  { id: 'c062', name: 'Сапфировый медальон',       rarity: 'common', stats: [{ type: 'maxEnergy', value: 40 }], price: 3715  },
  { id: 'c063', name: 'Кристалл силы',             rarity: 'common', stats: [{ type: 'maxEnergy', value: 40 }], price: 3715  },
  { id: 'c064', name: 'Лазуритовая сфера',         rarity: 'common', stats: [{ type: 'maxEnergy', value: 50 }], price: 6462  },
  { id: 'c065', name: 'Энергетический тотем',      rarity: 'common', stats: [{ type: 'maxEnergy', value: 50 }], price: 6462  },
  { id: 'c066', name: 'Реликварий знаний',         rarity: 'common', stats: [{ type: 'maxEnergy', value: 60 }], price: 10106 },
  { id: 'c067', name: 'Звёздный камень',           rarity: 'common', stats: [{ type: 'maxEnergy', value: 60 }], price: 10106 },

  // ── +реген энергии/сек (N=1 ×8, N=2 ×2) ─────────────────────────────────
  { id: 'c068', name: 'Стимулятор',                rarity: 'common', stats: [{ type: 'energyRegen', value: 1 }], price: 500  },
  { id: 'c069', name: 'Паутинный концентрат',      rarity: 'common', stats: [{ type: 'energyRegen', value: 1 }], price: 500  },
  { id: 'c070', name: 'Тоник бодрости',            rarity: 'common', stats: [{ type: 'energyRegen', value: 1 }], price: 500  },
  { id: 'c071', name: 'Искра жизни',               rarity: 'common', stats: [{ type: 'energyRegen', value: 1 }], price: 500  },
  { id: 'c072', name: 'Кристалл тока',             rarity: 'common', stats: [{ type: 'energyRegen', value: 1 }], price: 500  },
  { id: 'c073', name: 'Магнит силы',               rarity: 'common', stats: [{ type: 'energyRegen', value: 1 }], price: 500  },
  { id: 'c074', name: 'Янтарный осколок',          rarity: 'common', stats: [{ type: 'energyRegen', value: 1 }], price: 500  },
  { id: 'c075', name: 'Паучий нектар',             rarity: 'common', stats: [{ type: 'energyRegen', value: 1 }], price: 500  },
  { id: 'c076', name: 'Двойной стимулятор',        rarity: 'common', stats: [{ type: 'energyRegen', value: 2 }], price: 4000 },
  { id: 'c077', name: 'Усиленный тоник',           rarity: 'common', stats: [{ type: 'energyRegen', value: 2 }], price: 4000 },

  // ── +энергия за убийство (N=1 ×8, N=2 ×2) ───────────────────────────────
  { id: 'c078', name: 'Адреналин убийцы',          rarity: 'common', stats: [{ type: 'energyPerKill', value: 1 }], price: 500  },
  { id: 'c079', name: 'Кровавый камень',           rarity: 'common', stats: [{ type: 'energyPerKill', value: 1 }], price: 500  },
  { id: 'c080', name: 'Зуб паука',                rarity: 'common', stats: [{ type: 'energyPerKill', value: 1 }], price: 500  },
  { id: 'c081', name: 'Боевой тотем',              rarity: 'common', stats: [{ type: 'energyPerKill', value: 1 }], price: 500  },
  { id: 'c082', name: 'Охотничий нарукавник',      rarity: 'common', stats: [{ type: 'energyPerKill', value: 1 }], price: 500  },
  { id: 'c083', name: 'Берсеркское зелье',         rarity: 'common', stats: [{ type: 'energyPerKill', value: 1 }], price: 500  },
  { id: 'c084', name: 'Кинжал духа',               rarity: 'common', stats: [{ type: 'energyPerKill', value: 1 }], price: 500  },
  { id: 'c085', name: 'Трофейный коготь',          rarity: 'common', stats: [{ type: 'energyPerKill', value: 1 }], price: 500  },
  { id: 'c086', name: 'Двойной адреналин',         rarity: 'common', stats: [{ type: 'energyPerKill', value: 2 }], price: 4000 },
  { id: 'c087', name: 'Усиленный боевой тотем',    rarity: 'common', stats: [{ type: 'energyPerKill', value: 2 }], price: 4000 },

  // ── +энергия при прорыве (N=1 ×6, N=2 ×2) ───────────────────────────────
  { id: 'c088', name: 'Трофейный щит',             rarity: 'common', stats: [{ type: 'energyPerBreach', value: 1 }], price: 400  },
  { id: 'c089', name: 'Камень стойкости',          rarity: 'common', stats: [{ type: 'energyPerBreach', value: 1 }], price: 400  },
  { id: 'c090', name: 'Оберег замка',              rarity: 'common', stats: [{ type: 'energyPerBreach', value: 1 }], price: 400  },
  { id: 'c091', name: 'Стена духа',                rarity: 'common', stats: [{ type: 'energyPerBreach', value: 1 }], price: 400  },
  { id: 'c092', name: 'Паутинный щит',             rarity: 'common', stats: [{ type: 'energyPerBreach', value: 1 }], price: 400  },
  { id: 'c093', name: 'Магический барьер',         rarity: 'common', stats: [{ type: 'energyPerBreach', value: 1 }], price: 400  },
  { id: 'c094', name: 'Талисман стража',           rarity: 'common', stats: [{ type: 'energyPerBreach', value: 2 }], price: 2536 },
  { id: 'c095', name: 'Усиленный оберег',          rarity: 'common', stats: [{ type: 'energyPerBreach', value: 2 }], price: 2536 },

  // ── +монетки за убийство (N=1 ×5) ────────────────────────────────────────
  { id: 'c096', name: 'Кошелёк охотника',          rarity: 'common', stats: [{ type: 'coinsPerKill', value: 1 }], price: 2000 },
  { id: 'c097', name: 'Монетный кулон',            rarity: 'common', stats: [{ type: 'coinsPerKill', value: 1 }], price: 2000 },
  { id: 'c098', name: 'Золотой зуб паука',         rarity: 'common', stats: [{ type: 'coinsPerKill', value: 1 }], price: 2000 },
  { id: 'c099', name: 'Торговый оберег',           rarity: 'common', stats: [{ type: 'coinsPerKill', value: 1 }], price: 2000 },
  { id: 'c100', name: 'Рыночный талисман',         rarity: 'common', stats: [{ type: 'coinsPerKill', value: 1 }], price: 2000 },
];

// ─── РЕДКИЕ (70 шт.) ──────────────────────────────────────────────────────────

const RARE_ITEMS: readonly ItemDefinition[] = [

  // ── Один стат (20 шт., высокий N — концентрация) ────────────────────────
  { id: 'r001', name: 'Грудная пластина бойца',    rarity: 'rare', stats: [{ type: 'maxHp', value: 500  }], price: 1292 },
  { id: 'r002', name: 'Нагрудник воина',           rarity: 'rare', stats: [{ type: 'maxHp', value: 700  }], price: 2100 },
  { id: 'r003', name: 'Латная куртка',             rarity: 'rare', stats: [{ type: 'maxHp', value: 900  }], price: 2990 },
  { id: 'r004', name: 'Панцирь чемпиона',          rarity: 'rare', stats: [{ type: 'maxHp', value: 1200 }], price: 4440 },
  { id: 'r005', name: 'Ядовитый антидот',          rarity: 'rare', stats: [{ type: 'hpRegen', value: 5  }], price: 388  },
  { id: 'r006', name: 'Концентрированное зелье',   rarity: 'rare', stats: [{ type: 'hpRegen', value: 8  }], price: 761  },
  { id: 'r007', name: 'Зелье бессмертия',          rarity: 'rare', stats: [{ type: 'hpRegen', value: 12 }], price: 1332 },
  { id: 'r008', name: 'Защитный панцирь',          rarity: 'rare', stats: [{ type: 'damageReduction', value: 5  }], price: 750  },
  { id: 'r009', name: 'Зачарованный щит',          rarity: 'rare', stats: [{ type: 'damageReduction', value: 8  }], price: 1920 },
  { id: 'r010', name: 'Несокрушимый доспех',       rarity: 'rare', stats: [{ type: 'damageReduction', value: 12 }], price: 4320 },
  { id: 'r011', name: 'Синий тотем',               rarity: 'rare', stats: [{ type: 'maxEnergy', value: 30 }], price: 1800 },
  { id: 'r012', name: 'Магический топаз',          rarity: 'rare', stats: [{ type: 'maxEnergy', value: 40 }], price: 3715 },
  { id: 'r013', name: 'Лазоревый орб',             rarity: 'rare', stats: [{ type: 'maxEnergy', value: 50 }], price: 6462 },
  { id: 'r014', name: 'Серебряный стимулятор',     rarity: 'rare', stats: [{ type: 'energyRegen', value: 1 }], price: 500  },
  { id: 'r015', name: 'Усиленный концентрат',      rarity: 'rare', stats: [{ type: 'energyRegen', value: 2 }], price: 4000 },
  { id: 'r016', name: 'Серебряный адреналин',      rarity: 'rare', stats: [{ type: 'energyPerKill', value: 1 }], price: 500  },
  { id: 'r017', name: 'Усиленный адреналин',       rarity: 'rare', stats: [{ type: 'energyPerKill', value: 2 }], price: 4000 },
  { id: 'r018', name: 'Серебряный оберег',         rarity: 'rare', stats: [{ type: 'energyPerBreach', value: 1 }], price: 400  },
  { id: 'r019', name: 'Усиленный оберег замка',    rarity: 'rare', stats: [{ type: 'energyPerBreach', value: 2 }], price: 2536 },
  { id: 'r020', name: 'Великий оберег',            rarity: 'rare', stats: [{ type: 'energyPerBreach', value: 3 }], price: 7200 },

  // ── Два стата (50 шт.) ───────────────────────────────────────────────────

  // HP + HPRegen
  { id: 'r021', name: 'Живая броня',               rarity: 'rare', stats: [{ type: 'maxHp', value: 200 }, { type: 'hpRegen', value: 2  }], price: 412  },
  { id: 'r022', name: 'Доспех выносливости',       rarity: 'rare', stats: [{ type: 'maxHp', value: 300 }, { type: 'hpRegen', value: 3  }], price: 780  },
  { id: 'r023', name: 'Боевая перевязь',           rarity: 'rare', stats: [{ type: 'maxHp', value: 500 }, { type: 'hpRegen', value: 5  }], price: 1680 },
  { id: 'r024', name: 'Доспех чемпиона',           rarity: 'rare', stats: [{ type: 'maxHp', value: 700 }, { type: 'hpRegen', value: 7  }], price: 2730 },
  { id: 'r025', name: 'Латы долголетия',           rarity: 'rare', stats: [{ type: 'maxHp', value: 1000}, { type: 'hpRegen', value: 10 }], price: 4497 },

  // HP + DmgRed
  { id: 'r026', name: 'Кожаный доспех',            rarity: 'rare', stats: [{ type: 'maxHp', value: 200 }, { type: 'damageReduction', value: 2 }], price: 437  },
  { id: 'r027', name: 'Стальная куртка',           rarity: 'rare', stats: [{ type: 'maxHp', value: 400 }, { type: 'damageReduction', value: 4 }], price: 1409 },
  { id: 'r028', name: 'Закалённый нагрудник',      rarity: 'rare', stats: [{ type: 'maxHp', value: 600 }, { type: 'damageReduction', value: 6 }], price: 2764 },
  { id: 'r029', name: 'Непробиваемые латы',        rarity: 'rare', stats: [{ type: 'maxHp', value: 900 }, { type: 'damageReduction', value: 9 }], price: 5420 },

  // HP + MaxEnergy
  { id: 'r030', name: 'Тактический жилет',         rarity: 'rare', stats: [{ type: 'maxHp', value: 300 }, { type: 'maxEnergy', value: 10 }], price: 700  },
  { id: 'r031', name: 'Нагрудник мага',            rarity: 'rare', stats: [{ type: 'maxHp', value: 500 }, { type: 'maxEnergy', value: 20 }], price: 1926 },
  { id: 'r032', name: 'Броня волшебника',          rarity: 'rare', stats: [{ type: 'maxHp', value: 700 }, { type: 'maxEnergy', value: 30 }], price: 3900 },

  // HP + EnergyRegen
  { id: 'r033', name: 'Зелье воина',               rarity: 'rare', stats: [{ type: 'maxHp', value: 300 }, { type: 'energyRegen', value: 1 }], price: 1100 },
  { id: 'r034', name: 'Тоник воина',               rarity: 'rare', stats: [{ type: 'maxHp', value: 700 }, { type: 'energyRegen', value: 1 }], price: 2600 },

  // HP + EnergyPerKill
  { id: 'r035', name: 'Боевая мазь',               rarity: 'rare', stats: [{ type: 'maxHp', value: 300 }, { type: 'energyPerKill', value: 1 }], price: 1100 },
  { id: 'r036', name: 'Кулон убийцы',              rarity: 'rare', stats: [{ type: 'maxHp', value: 800 }, { type: 'energyPerKill', value: 1 }], price: 3036 },

  // HP + EnergyPerBreach
  { id: 'r037', name: 'Оберег бойца',              rarity: 'rare', stats: [{ type: 'maxHp', value: 300 }, { type: 'energyPerBreach', value: 1 }], price: 1000 },
  { id: 'r038', name: 'Страж воина',               rarity: 'rare', stats: [{ type: 'maxHp', value: 700 }, { type: 'energyPerBreach', value: 1 }], price: 2500 },

  // HP + CoinsPerKill
  { id: 'r039', name: 'Трофейный нагрудник',       rarity: 'rare', stats: [{ type: 'maxHp', value: 300 }, { type: 'coinsPerKill', value: 1 }], price: 2600 },
  { id: 'r040', name: 'Доспех торговца',           rarity: 'rare', stats: [{ type: 'maxHp', value: 800 }, { type: 'coinsPerKill', value: 1 }], price: 4536 },

  // HPRegen + DmgRed
  { id: 'r041', name: 'Быстрая регенерация',       rarity: 'rare', stats: [{ type: 'hpRegen', value: 3 }, { type: 'damageReduction', value: 1 }], price: 210  },
  { id: 'r042', name: 'Рунный жилет',              rarity: 'rare', stats: [{ type: 'hpRegen', value: 5 }, { type: 'damageReduction', value: 3 }], price: 658  },
  { id: 'r043', name: 'Зелье стойкости',           rarity: 'rare', stats: [{ type: 'hpRegen', value: 8 }, { type: 'damageReduction', value: 5 }], price: 1511 },
  { id: 'r044', name: 'Зелье легенды',             rarity: 'rare', stats: [{ type: 'hpRegen', value: 10}, { type: 'damageReduction', value: 7 }], price: 2508 },

  // HPRegen + MaxEnergy
  { id: 'r045', name: 'Тоник мудрости',            rarity: 'rare', stats: [{ type: 'hpRegen', value: 3 }, { type: 'maxEnergy', value: 20 }], price: 814  },
  { id: 'r046', name: 'Зелье концентрата',         rarity: 'rare', stats: [{ type: 'hpRegen', value: 8 }, { type: 'maxEnergy', value: 30 }], price: 2561 },

  // HPRegen + EnergyRegen
  { id: 'r047', name: 'Амулет восстановления',     rarity: 'rare', stats: [{ type: 'hpRegen', value: 5  }, { type: 'energyRegen', value: 1 }], price: 888  },
  { id: 'r048', name: 'Зелье бодрости',            rarity: 'rare', stats: [{ type: 'hpRegen', value: 10 }, { type: 'energyRegen', value: 1 }], price: 1538 },

  // HPRegen + EnergyPerKill
  { id: 'r049', name: 'Кровавый настой',           rarity: 'rare', stats: [{ type: 'hpRegen', value: 5  }, { type: 'energyPerKill', value: 1 }], price: 888  },
  { id: 'r050', name: 'Зелье жатвы',               rarity: 'rare', stats: [{ type: 'hpRegen', value: 12 }, { type: 'energyPerKill', value: 1 }], price: 1832 },

  // HPRegen + EnergyPerBreach
  { id: 'r051', name: 'Тоник стражника',           rarity: 'rare', stats: [{ type: 'hpRegen', value: 5  }, { type: 'energyPerBreach', value: 1 }], price: 788  },
  { id: 'r052', name: 'Эликсир стражника',         rarity: 'rare', stats: [{ type: 'hpRegen', value: 10 }, { type: 'energyPerBreach', value: 1 }], price: 1438 },

  // HPRegen + CoinsPerKill
  { id: 'r053', name: 'Торговое зелье',            rarity: 'rare', stats: [{ type: 'hpRegen', value: 5 }, { type: 'coinsPerKill', value: 1 }], price: 2388 },

  // DmgRed + MaxEnergy
  { id: 'r054', name: 'Магическая броня',          rarity: 'rare', stats: [{ type: 'damageReduction', value: 3 }, { type: 'maxEnergy', value: 20 }], price: 904  },
  { id: 'r055', name: 'Рунная броня',              rarity: 'rare', stats: [{ type: 'damageReduction', value: 6 }, { type: 'maxEnergy', value: 30 }], price: 2880 },

  // DmgRed + EnergyRegen
  { id: 'r056', name: 'Кольчужная жилетка',        rarity: 'rare', stats: [{ type: 'damageReduction', value: 3 }, { type: 'energyRegen', value: 1 }], price: 770  },
  { id: 'r057', name: 'Броня тактика',             rarity: 'rare', stats: [{ type: 'damageReduction', value: 7 }, { type: 'energyRegen', value: 1 }], price: 1970 },

  // DmgRed + EnergyPerKill
  { id: 'r058', name: 'Боевой доспех',             rarity: 'rare', stats: [{ type: 'damageReduction', value: 3 }, { type: 'energyPerKill', value: 1 }], price: 770  },
  { id: 'r059', name: 'Доспех убийцы',             rarity: 'rare', stats: [{ type: 'damageReduction', value: 8 }, { type: 'energyPerKill', value: 1 }], price: 2420 },

  // DmgRed + EnergyPerBreach
  { id: 'r060', name: 'Щит стражника',             rarity: 'rare', stats: [{ type: 'damageReduction', value: 3 }, { type: 'energyPerBreach', value: 1 }], price: 670  },
  { id: 'r061', name: 'Оберег крепости',           rarity: 'rare', stats: [{ type: 'damageReduction', value: 7 }, { type: 'energyPerBreach', value: 1 }], price: 1870 },

  // DmgRed + CoinsPerKill
  { id: 'r062', name: 'Золотая броня',             rarity: 'rare', stats: [{ type: 'damageReduction', value: 4 }, { type: 'coinsPerKill', value: 1 }], price: 2480 },

  // MaxEnergy + EnergyRegen
  { id: 'r063', name: 'Синий амулет',              rarity: 'rare', stats: [{ type: 'maxEnergy', value: 20 }, { type: 'energyRegen', value: 1 }], price: 1134 },
  { id: 'r064', name: 'Реликвия скорости',         rarity: 'rare', stats: [{ type: 'maxEnergy', value: 30 }, { type: 'energyRegen', value: 1 }], price: 2300 },

  // MaxEnergy + EnergyPerKill
  { id: 'r065', name: 'Кристалл убийцы',          rarity: 'rare', stats: [{ type: 'maxEnergy', value: 20 }, { type: 'energyPerKill', value: 1 }], price: 1134 },

  // MaxEnergy + EnergyPerBreach
  { id: 'r066', name: 'Кристалл стражника',        rarity: 'rare', stats: [{ type: 'maxEnergy', value: 20 }, { type: 'energyPerBreach', value: 1 }], price: 1034 },

  // MaxEnergy + CoinsPerKill
  { id: 'r067', name: 'Сапфировый кошелёк',       rarity: 'rare', stats: [{ type: 'maxEnergy', value: 20 }, { type: 'coinsPerKill', value: 1 }], price: 2634 },

  // EnergyRegen + EnergyPerKill
  { id: 'r068', name: 'Кольцо берсерка',           rarity: 'rare', stats: [{ type: 'energyRegen', value: 1 }, { type: 'energyPerKill', value: 1 }], price: 1000 },

  // EnergyRegen + EnergyPerBreach
  { id: 'r069', name: 'Кольцо стража',             rarity: 'rare', stats: [{ type: 'energyRegen', value: 1 }, { type: 'energyPerBreach', value: 1 }], price: 900  },

  // EnergyRegen + CoinsPerKill
  { id: 'r070', name: 'Кольцо казначея',           rarity: 'rare', stats: [{ type: 'energyRegen', value: 1 }, { type: 'coinsPerKill', value: 1 }], price: 2500 },
];

// ─── ЭПИЧЕСКИЕ (40 шт., ×1.15) ────────────────────────────────────────────────

const EPIC_ITEMS: readonly ItemDefinition[] = [

  // ── Один стат — концентрированные (8 шт.) ────────────────────────────────
  { id: 'e001', name: 'Монолит здоровья',          rarity: 'epic', stats: [{ type: 'maxHp', value: 900  }], price: 3439  },
  { id: 'e002', name: 'Стальная твердыня',         rarity: 'epic', stats: [{ type: 'maxHp', value: 1200 }], price: 5106  },
  { id: 'e003', name: 'Живой источник',            rarity: 'epic', stats: [{ type: 'hpRegen', value: 9  }], price: 1032  },
  { id: 'e004', name: 'Щит предков',               rarity: 'epic', stats: [{ type: 'damageReduction', value: 9  }], price: 2795  },
  { id: 'e005', name: 'Средоточие энергии',        rarity: 'epic', stats: [{ type: 'maxEnergy', value: 60 }], price: 11622 },
  { id: 'e006', name: 'Руна потока',               rarity: 'epic', stats: [{ type: 'energyRegen', value: 2 }], price: 4600  },
  { id: 'e007', name: 'Клинок жатвы',              rarity: 'epic', stats: [{ type: 'energyPerKill', value: 2 }], price: 4600  },
  { id: 'e008', name: 'Страж замка',               rarity: 'epic', stats: [{ type: 'energyPerBreach', value: 3 }], price: 8280  },

  // ── Два стата (16 шт.) ───────────────────────────────────────────────────
  { id: 'e009', name: 'Доспех воина',              rarity: 'epic', stats: [{ type: 'maxHp', value: 500 }, { type: 'damageReduction', value: 5  }], price: 2348 },
  { id: 'e010', name: 'Живая броня воителя',       rarity: 'epic', stats: [{ type: 'maxHp', value: 700 }, { type: 'hpRegen', value: 7        }], price: 3140 },
  { id: 'e011', name: 'Тактический жезл',          rarity: 'epic', stats: [{ type: 'maxHp', value: 500 }, { type: 'maxEnergy', value: 20     }], price: 2215 },
  { id: 'e012', name: 'Реликвия воина',            rarity: 'epic', stats: [{ type: 'maxHp', value: 700 }, { type: 'energyRegen', value: 1    }], price: 2990 },
  { id: 'e013', name: 'Клинок охотника',           rarity: 'epic', stats: [{ type: 'maxHp', value: 700 }, { type: 'energyPerKill', value: 1  }], price: 2990 },
  { id: 'e014', name: 'Трофей удачи',              rarity: 'epic', stats: [{ type: 'maxHp', value: 800 }, { type: 'coinsPerKill', value: 1   }], price: 5216 },
  { id: 'e015', name: 'Рунный доспех',             rarity: 'epic', stats: [{ type: 'hpRegen', value: 7 }, { type: 'damageReduction', value: 5 }], price: 1587 },
  { id: 'e016', name: 'Доспех тактика',            rarity: 'epic', stats: [{ type: 'hpRegen', value: 8 }, { type: 'energyRegen', value: 1    }], price: 1450 },
  { id: 'e017', name: 'Магический щит',            rarity: 'epic', stats: [{ type: 'damageReduction', value: 6 }, { type: 'maxEnergy', value: 30 }], price: 3312 },
  { id: 'e018', name: 'Реликвия концентрации',     rarity: 'epic', stats: [{ type: 'maxEnergy', value: 30 }, { type: 'energyRegen', value: 1  }], price: 2645 },
  { id: 'e019', name: 'Посох богатства',           rarity: 'epic', stats: [{ type: 'maxEnergy', value: 40 }, { type: 'coinsPerKill', value: 1 }], price: 6572 },
  { id: 'e020', name: 'Амулет берсерка',           rarity: 'epic', stats: [{ type: 'energyRegen', value: 2 }, { type: 'energyPerBreach', value: 2 }], price: 7516 },
  { id: 'e021', name: 'Парный амулет',             rarity: 'epic', stats: [{ type: 'energyRegen', value: 1 }, { type: 'energyPerKill', value: 1  }], price: 1150 },
  { id: 'e022', name: 'Кошелёк скорости',          rarity: 'epic', stats: [{ type: 'energyRegen', value: 1 }, { type: 'coinsPerKill', value: 1   }], price: 2875 },
  { id: 'e023', name: 'Амулет охотника',           rarity: 'epic', stats: [{ type: 'energyPerKill', value: 2 }, { type: 'energyPerBreach', value: 2 }], price: 7516 },
  { id: 'e024', name: 'Трофейный кошелёк',         rarity: 'epic', stats: [{ type: 'energyPerBreach', value: 2 }, { type: 'coinsPerKill', value: 1 }], price: 5216 },

  // ── Три стата (16 шт.) ───────────────────────────────────────────────────
  { id: 'e025', name: 'Пояс выносливости',         rarity: 'epic', stats: [{ type: 'maxHp', value: 500 }, { type: 'hpRegen', value: 5 }, { type: 'damageReduction', value: 5 }], price: 2795 },
  { id: 'e026', name: 'Реликвия мудрости',         rarity: 'epic', stats: [{ type: 'maxHp', value: 500 }, { type: 'maxEnergy', value: 20 }, { type: 'energyRegen', value: 1 }], price: 2790 },
  { id: 'e027', name: 'Нагрудник воителя',         rarity: 'epic', stats: [{ type: 'maxHp', value: 700 }, { type: 'hpRegen', value: 5 }, { type: 'damageReduction', value: 5 }], price: 3724 },
  { id: 'e028', name: 'Талисман охотника',         rarity: 'epic', stats: [{ type: 'maxHp', value: 500 }, { type: 'hpRegen', value: 5 }, { type: 'maxEnergy', value: 20 }], price: 2661 },
  { id: 'e029', name: 'Дух победителя',            rarity: 'epic', stats: [{ type: 'maxHp', value: 700 }, { type: 'energyRegen', value: 1 }, { type: 'coinsPerKill', value: 1 }], price: 5290 },
  { id: 'e030', name: 'Клинок силы',               rarity: 'epic', stats: [{ type: 'maxHp', value: 700 }, { type: 'energyPerKill', value: 1 }, { type: 'maxEnergy', value: 20 }], price: 3719 },
  { id: 'e031', name: 'Доспех богача',             rarity: 'epic', stats: [{ type: 'maxHp', value: 800 }, { type: 'hpRegen', value: 7 }, { type: 'coinsPerKill', value: 1 }], price: 5941 },
  { id: 'e032', name: 'Боевой жилет',              rarity: 'epic', stats: [{ type: 'hpRegen', value: 7 }, { type: 'damageReduction', value: 5 }, { type: 'energyRegen', value: 1 }], price: 2162 },
  { id: 'e033', name: 'Зелье героя',               rarity: 'epic', stats: [{ type: 'hpRegen', value: 8 }, { type: 'maxEnergy', value: 30 }, { type: 'energyPerKill', value: 1 }], price: 3520 },
  { id: 'e034', name: 'Кулон стратега',            rarity: 'epic', stats: [{ type: 'hpRegen', value: 10 }, { type: 'damageReduction', value: 7 }, { type: 'coinsPerKill', value: 1 }], price: 5184 },
  { id: 'e035', name: 'Доспех мага',               rarity: 'epic', stats: [{ type: 'damageReduction', value: 5 }, { type: 'maxEnergy', value: 30 }, { type: 'energyRegen', value: 1 }], price: 3508 },
  { id: 'e036', name: 'Броня казначея',            rarity: 'epic', stats: [{ type: 'damageReduction', value: 7 }, { type: 'maxEnergy', value: 30 }, { type: 'coinsPerKill', value: 1 }], price: 6061 },
  { id: 'e037', name: 'Амулет авантюриста',        rarity: 'epic', stats: [{ type: 'energyRegen', value: 1 }, { type: 'energyPerKill', value: 1 }, { type: 'maxHp', value: 500 }], price: 2636 },
  { id: 'e038', name: 'Кольцо стража',             rarity: 'epic', stats: [{ type: 'energyRegen', value: 1 }, { type: 'energyPerBreach', value: 1 }, { type: 'maxEnergy', value: 20 }], price: 1764 },
  { id: 'e039', name: 'Ожерелье берсерка',         rarity: 'epic', stats: [{ type: 'energyPerKill', value: 2 }, { type: 'coinsPerKill', value: 1 }, { type: 'maxHp', value: 700 }], price: 9315 },
  { id: 'e040', name: 'Оберег крепости',           rarity: 'epic', stats: [{ type: 'energyPerBreach', value: 2 }, { type: 'energyRegen', value: 1 }, { type: 'coinsPerKill', value: 1 }], price: 5791 },
];

// ─── ЛЕГЕНДАРНЫЕ (20 шт., ×1.5) ───────────────────────────────────────────────
// Каждый предмет: 3 стата + уникальная модификация способности.

const LEGENDARY_ITEMS: readonly ItemDefinition[] = [

  // ── Армагеддон (3 предмета) ───────────────────────────────────────────────
  {
    id: 'l001', name: 'Реликвия Армагеддона', rarity: 'legendary',
    stats: [{ type: 'maxHp', value: 500 }, { type: 'damageReduction', value: 5 }, { type: 'energyRegen', value: 1 }],
    abilityMod: { abilityId: 'armageddon', modType: 'cooldownReduction', value: 30, description: '«Армагеддон»: кулдаун −30 сек' },
    price: 3813,
  },
  {
    id: 'l002', name: 'Гримуар Армагеддона', rarity: 'legendary',
    stats: [{ type: 'maxHp', value: 900 }, { type: 'hpRegen', value: 5 }, { type: 'coinsPerKill', value: 1 }],
    abilityMod: { abilityId: 'armageddon', modType: 'effectBoost', value: 1, description: '«Армагеддон»: длительность +1 сек.' },
    price: 8067,
  },
  {
    id: 'l003', name: 'Доспех Армагеддона', rarity: 'legendary',
    stats: [{ type: 'maxEnergy', value: 30 }, { type: 'energyRegen', value: 1 }, { type: 'damageReduction', value: 5 }],
    abilityMod: { abilityId: 'armageddon', modType: 'costReduction', value: 50, description: '«Армагеддон»: стоимость −50 энергии' },
    price: 4575,
  },

  // ── Вьюга (3 предмета) ────────────────────────────────────────────────────
  {
    id: 'l004', name: 'Клинок Вьюги', rarity: 'legendary',
    stats: [{ type: 'maxEnergy', value: 30 }, { type: 'energyPerKill', value: 1 }, { type: 'coinsPerKill', value: 1 }],
    abilityMod: { abilityId: 'blizzard', modType: 'effectBoost', value: 2, description: '«Вьюга»: длительность +2 сек' },
    price: 6450,
  },
  {
    id: 'l005', name: 'Корона Вьюги', rarity: 'legendary',
    stats: [{ type: 'maxHp', value: 700 }, { type: 'damageReduction', value: 5 }, { type: 'energyRegen', value: 1 }],
    abilityMod: { abilityId: 'blizzard', modType: 'cooldownReduction', value: 3, description: '«Вьюга»: кулдаун −3 сек' },
    price: 5025,
  },
  {
    id: 'l006', name: 'Мантия Вьюги', rarity: 'legendary',
    stats: [{ type: 'maxEnergy', value: 40 }, { type: 'energyPerBreach', value: 1 }, { type: 'damageReduction', value: 3 }],
    abilityMod: { abilityId: 'blizzard', modType: 'costReduction', value: 30, description: '«Вьюга»: стоимость −30 энергии' },
    price: 6578,
  },

  // ── Залп (3 предмета) ─────────────────────────────────────────────────────
  {
    id: 'l007', name: 'Оберег Залпа', rarity: 'legendary',
    stats: [{ type: 'maxHp', value: 500 }, { type: 'hpRegen', value: 5 }, { type: 'coinsPerKill', value: 1 }],
    abilityMod: { abilityId: 'volley', modType: 'effectBoost', value: 4, description: '«Залп»: +4 дополнительные линии' },
    price: 5520,
  },
  {
    id: 'l008', name: 'Перчатки Залпа', rarity: 'legendary',
    stats: [{ type: 'maxHp', value: 500 }, { type: 'maxEnergy', value: 30 }, { type: 'energyRegen', value: 1 }],
    abilityMod: { abilityId: 'volley', modType: 'costReduction', value: 20, description: '«Залп»: стоимость −20 энергии' },
    price: 5388,
  },
  {
    id: 'l009', name: 'Тетива Залпа', rarity: 'legendary',
    stats: [{ type: 'maxEnergy', value: 30 }, { type: 'energyPerKill', value: 1 }, { type: 'damageReduction', value: 5 }],
    abilityMod: { abilityId: 'volley', modType: 'cooldownReduction', value: 1, description: '«Залп»: кулдаун −1 сек' },
    price: 4575,
  },

  // ── Ни шагу назад! (2 предмета) ──────────────────────────────────────────
  {
    id: 'l010', name: 'Щит Ни шагу назад!', rarity: 'legendary',
    stats: [{ type: 'maxHp', value: 900 }, { type: 'hpRegen', value: 5 }, { type: 'damageReduction', value: 5 }],
    abilityMod: { abilityId: 'stand', modType: 'cooldownReduction', value: 10, description: '«Ни шагу назад!»: кулдаун −10 сек' },
    price: 6192,
  },
  {
    id: 'l011', name: 'Оберег стойкости', rarity: 'legendary',
    stats: [{ type: 'maxHp', value: 700 }, { type: 'damageReduction', value: 7 }, { type: 'energyPerBreach', value: 2 }],
    abilityMod: { abilityId: 'stand', modType: 'effectBoost', value: 3, description: '«Ни шагу назад!»: длительность +3 сек' },
    price: 9159,
  },

  // ── Подготовка (2 предмета) ───────────────────────────────────────────────
  {
    id: 'l012', name: 'Амулет Подготовки', rarity: 'legendary',
    stats: [{ type: 'maxEnergy', value: 30 }, { type: 'energyRegen', value: 1 }, { type: 'damageReduction', value: 5 }],
    abilityMod: { abilityId: 'prep', modType: 'cooldownReduction', value: 8, description: '«Подготовка»: кулдаун −8 сек' },
    price: 4575,
  },
  {
    id: 'l013', name: 'Кулон Подготовки', rarity: 'legendary',
    stats: [{ type: 'maxEnergy', value: 40 }, { type: 'energyPerKill', value: 1 }, { type: 'coinsPerKill', value: 1 }],
    abilityMod: { abilityId: 'prep', modType: 'effectBoost', value: 0.5, description: '«Подготовка»: количество восстанавливаемой энергии +150' },
    price: 9323,
  },

  // ── Заморозка (1 предмет) ────────────────────────────────────────────────
  {
    id: 'l015', name: 'Ледяная корона', rarity: 'legendary',
    stats: [{ type: 'maxEnergy', value: 30 }, { type: 'energyRegen', value: 1 }, { type: 'energyPerBreach', value: 2 }],
    abilityMod: { abilityId: 'freeze', modType: 'costReduction', value: 45, description: '«Заморозка»: стоимость −45 энергии' },
    price: 7254,
  },

  // ── Лечение (2 предмета) ──────────────────────────────────────────────────
  {
    id: 'l016', name: 'Амулет Лечения', rarity: 'legendary',
    stats: [{ type: 'maxHp', value: 700 }, { type: 'hpRegen', value: 8 }, { type: 'energyRegen', value: 1 }],
    abilityMod: { abilityId: 'heal', modType: 'effectBoost', value: 1500, description: '«Лечение»: количество восстанавливаемого HP +1500' },
    price: 5042,
  },
  {
    id: 'l017', name: 'Оберег Лечения', rarity: 'legendary',
    stats: [{ type: 'maxHp', value: 1000 }, { type: 'hpRegen', value: 10 }, { type: 'damageReduction', value: 3 }],
    abilityMod: { abilityId: 'heal', modType: 'cooldownReduction', value: 3, description: '«Лечение»: кулдаун −3 сек' },
    price: 7151,
  },

  // ── Обновление (2 предмета) ───────────────────────────────────────────────
  {
    id: 'l018', name: 'Кристалл Обновления', rarity: 'legendary',
    stats: [{ type: 'maxEnergy', value: 40 }, { type: 'energyRegen', value: 1 }, { type: 'energyPerKill', value: 1 }],
    abilityMod: { abilityId: 'recharge', modType: 'cooldownReduction', value: 60, description: '«Обновление»: кулдаун −60 сек' },
    price: 7073,
  },
  {
    id: 'l020', name: 'Посох Обновления', rarity: 'legendary',
    stats: [{ type: 'maxEnergy', value: 30 }, { type: 'energyRegen', value: 1 }, { type: 'coinsPerKill', value: 1 }],
    abilityMod: { abilityId: 'recharge', modType: 'costReduction', value: 30, description: '«Обновление»: стоимость −30 энергии' },
    price: 6450,
  },
];

// ─── Полный каталог ────────────────────────────────────────────────────────────

export const ITEM_CATALOG: readonly ItemDefinition[] = [
  ...COMMON_ITEMS,
  ...RARE_ITEMS,
  ...EPIC_ITEMS,
  ...LEGENDARY_ITEMS,
];

export const ITEM_MAP: ReadonlyMap<string, ItemDefinition> = new Map(
  ITEM_CATALOG.map((item) => [item.id, item])
);
