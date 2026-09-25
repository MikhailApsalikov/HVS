import { describe, expect, it } from 'vitest';
import { ITEM_CATALOG, ITEM_MAP } from '../src/content/items.js';
import type { ItemDefinition, StatType } from '../src/domain/itemTypes.js';
import { GameSession } from '../src/domain/GameSession.js';
import { parseSave, restore, snapshot } from '../src/domain/save.js';
import {
  filterAndSortItems,
  itemAbilityDescription,
  itemStatLines,
} from '../src/ui/itemPresentation.js';

const item = (id: string) => ITEM_MAP.get(id)!;

describe('whole item bonuses and common price steps', () => {
  it('offers at most three distinct common price steps per stat, with no fractional bonuses', () => {
    for (const equipment of ITEM_CATALOG) {
      for (const stat of equipment.stats) {
        const amount = stat.type === 'criticalShotChance' ? stat.value * 100 : stat.value;
        expect(Number.isInteger(amount), `${equipment.name}: ${stat.type}`).toBe(true);
      }
    }
    const common = ITEM_CATALOG.filter((equipment) => equipment.rarity === 'common');
    for (const stat of new Set(common.map((equipment) => equipment.stats[0].type))) {
      const variants = common
        .filter((equipment) => equipment.stats[0].type === stat)
        .sort((a, b) => a.price - b.price);
      expect(variants.length, stat).toBeLessThanOrEqual(3);
      for (let index = 1; index < variants.length; index++) {
        expect(variants[index].price, stat).toBeGreaterThanOrEqual(variants[index - 1].price * 1.5);
      }
    }
    for (const stat of ['armor', 'endurance', 'agility', 'intellect', 'hpRegen', 'maxEnergy']) {
      expect(common.filter((equipment) => equipment.stats[0].type === stat)).toHaveLength(3);
    }
  });

  it.each([
    ['c025', 'hpRegen', 3, 485],
    ['c030', 'hpRegen', 6, 1279],
    ['e003', 'hpRegen', 30, 13630],
    ['e005', 'maxEnergy', 150, 12928],
    ['e006', 'energyRegen', 4, 53453],
  ] as const)(
    'applies the corrected %s bonus and price through purchase and reload',
    (id, stat, bonus, price) => {
      const session = new GameSession('normal');
      const before = session.state.stats[stat];
      session.state.coins = price;
      expect(session.buyItem(id)).toBe(true);
      expect(session.state.coins).toBe(0);
      expect(session.state.stats[stat]).toBe(before + bonus);
      const loaded = restore(parseSave(snapshot(session))!);
      expect(loaded.state.stats[stat]).toBe(before + bonus);
      expect(loaded.sellItem(0)).toBe(true);
      expect(loaded.state.stats[stat]).toBe(before);
    },
  );

  it.each([
    ['c021', 29],
    ['e-coins', 10214],
  ] as const)('refunds newly removed %s from a version 12 save only once', (id, price) => {
    const session = new GameSession('normal');
    const previous = { ...snapshot(session), version: 12, inventory: [id] };
    const loaded = restore(parseSave(previous)!);
    expect(loaded.items.inventory).toEqual([]);
    expect(loaded.state.coins).toBe(session.state.coins + price);
    expect(loaded.buyItem(id)).toBe(false);
    const saved = snapshot(loaded);
    expect(snapshot(restore(parseSave(saved)!))).toEqual(saved);
  });
});

describe('shop sorting and combined filters', () => {
  it('sorts the whole catalog by actual price, preserves input order and includes the expensive rune last', () => {
    const input = [...ITEM_CATALOG].reverse();
    const before = [...input];
    const sorted = filterAndSortItems(input, { name: '', stat: '' });
    expect(input).toEqual(before);
    expect(sorted).toHaveLength(ITEM_CATALOG.length);
    expect(sorted.map((equipment) => equipment.price)).toEqual(
      sorted.map((equipment) => equipment.price).sort((a, b) => a - b),
    );
    expect(sorted.at(-1)?.id).toBe('e006');
  });
  it('matches partial names without case, edge whitespace or е/ё distinctions', () => {
    expect(
      filterAndSortItems(ITEM_CATALOG, { name: '  КОШЕЛЕК  ', stat: '' }).map(
        (equipment) => equipment.name,
      ),
    ).toEqual(['Кошелёк охотника', 'Кошелёк наёмника', 'Сапфировый кошелёк', 'Кошелёк скорости']);
    expect(
      filterAndSortItems(ITEM_CATALOG, { name: 'руна   потока', stat: '' }).map(
        (equipment) => equipment.id,
      ),
    ).toEqual(['e006']);
  });
  it.each([
    ...new Set(ITEM_CATALOG.flatMap((equipment) => equipment.stats.map((stat) => stat.type))),
  ])('filters %s by its direct presence in any position', (stat) => {
    const matches = filterAndSortItems(ITEM_CATALOG, { name: '', stat });
    expect(matches.length).toBeGreaterThan(0);
    expect(new Set(matches.map((equipment) => equipment.id))).toEqual(
      new Set(
        ITEM_CATALOG.filter((equipment) =>
          equipment.stats.some((bonus) => bonus.type === stat),
        ).map((equipment) => equipment.id),
      ),
    );
  });
  it('combines both filters and excludes derived stats, supports clearing and empty results', () => {
    expect(
      filterAndSortItems(ITEM_CATALOG, { name: 'залп', stat: 'coinsPerKill' }).map(
        (equipment) => equipment.id,
      ),
    ).toEqual(['l007', 'l008']);
    expect(
      filterAndSortItems([item('c015'), item('c055')], { name: '', stat: 'armor' }).map(
        (equipment) => equipment.id,
      ),
    ).toEqual(['c055']);
    expect(
      filterAndSortItems(ITEM_CATALOG, { name: 'несуществующая вещь', stat: 'intellect' }),
    ).toEqual([]);
    expect(filterAndSortItems(ITEM_CATALOG, { name: '', stat: '' })).toHaveLength(
      ITEM_CATALOG.length,
    );
  });
});

describe('item tooltip wording and order', () => {
  it.each([
    ['c055', ['900 брони']],
    ['c015', ['+50 выносливости']],
    ['c015-agility', ['+50 ловкости']],
    ['c015-intellect', ['+50 интеллекта']],
    ['c030', ['+6 здоровья в секунду']],
    ['c068', ['+1 энергии в секунду']],
    ['c078', ['+1 энергии за убийство']],
    ['e005', ['+150 максимальной энергии']],
    ['c088', ['+1% шанса критического выстрела']],
    ['c096', ['+1 монета за убийство']],
    ['r-coins', ['+2 монеты за убийство']],
    ['l007', ['+200 выносливости', '+20 здоровья в секунду', '+1 монета за убийство']],
    ['e025', ['2000 брони', '+130 выносливости', '+12 здоровья в секунду']],
    [
      'l010',
      [
        '11111 брони',
        '+80 выносливости',
        '+25 ловкости',
        '+25 интеллекта',
        '+5 здоровья в секунду',
      ],
    ],
  ] as const)('%s has natural stat lines, with armor first', (id, lines) => {
    const before = [...item(id).stats];
    expect(itemStatLines(item(id))).toEqual(lines);
    expect(item(id).stats).toEqual(before);
  });
  it.each([
    ['l001', 'Сокращает время восстановления способности «Армагеддон» на 30 секунд.'],
    ['l002', 'Увеличивает длительность способности «Армагеддон» на 1 секунду.'],
    ['l003', 'Снижает расход энергии способности «Армагеддон» на 50.'],
    ['l004', 'Увеличивает длительность способности «Вьюга» на 2 секунды.'],
    ['l007', 'Увеличивает количество стрел, выпускаемых способностью «Залп», на 3.'],
    ['l009', 'Сокращает время восстановления способности «Залп» на 1 секунду.'],
    [
      'l013',
      'Увеличивает количество энергии, восстанавливаемой способностью «Подготовка», на 50%.',
    ],
    [
      'l016',
      'Увеличивает количество здоровья, восстанавливаемого способностью «Лечение», на 1500.',
    ],
    ['l018', 'Сокращает время восстановления способности «Перезарядка» на 60 секунд.'],
  ])('%s describes its actual spell modifier in a sentence', (id, text) => {
    expect(itemAbilityDescription(item(id))).toBe(text);
  });
  it('uses domain modifier values when an ability bonus changes and describes bonuses on any rarity', () => {
    const modified: ItemDefinition = {
      ...item('l013'),
      rarity: 'epic',
      abilityMod: { ...item('l013').abilityMod!, value: 0.25 },
    };
    expect(itemAbilityDescription(modified)).toBe(
      'Увеличивает количество энергии, восстанавливаемой способностью «Подготовка», на 25%.',
    );
    expect(itemAbilityDescription(item('e006'))).toBeNull();
  });
  it('declines larger coin counts correctly', () => {
    const withCoins = (value: number): ItemDefinition => ({
      ...item('c096'),
      stats: [{ type: 'coinsPerKill' as StatType, value }],
    });
    expect(itemStatLines(withCoins(5))).toEqual(['+5 монет за убийство']);
    expect(itemStatLines(withCoins(11))).toEqual(['+11 монет за убийство']);
    expect(itemStatLines(withCoins(21))).toEqual(['+21 монета за убийство']);
  });
});
