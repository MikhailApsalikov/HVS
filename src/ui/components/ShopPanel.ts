import type { GameState } from '../../domain/model/GameState.js';
import type { TalentSystem } from '../../domain/model/TalentSystem.js';
import type { ItemSystem } from '../../domain/model/ItemSystem.js';
import type { ItemDefinition, ItemRarity, StatType } from '../../domain/itemTypes.js';
import { ITEM_CATALOG } from '../../content/items.js';
import { generateItemSvg } from '../ItemSpriteGenerator.js';
import { salePrice } from '../../domain/rules/economy.js';
import { STATS } from '../../domain/rules/stats.js';
import { escapeHtml } from '../presenters.js';
import {
  filterAndSortItems,
  itemStatLines,
  itemAbilityDescription,
  type ItemFilters,
} from '../itemPresentation.js';
import { TooltipManager } from './TooltipManager.js';
import { coinAmount } from '../coins.js';

const RARITIES: Record<ItemRarity, string> = {
  common: 'Обычные',
  rare: 'Редкие',
  epic: 'Эпические',
  legendary: 'Легендарные',
};
export interface ShopActions {
  buy(id: string): boolean;
  sell(index: number): boolean;
}

export class ShopPanel {
  readonly container = document.createElement('div');
  private readonly tooltip = TooltipManager.getInstance();
  private filters: ItemFilters = { name: '', stat: '' };
  render(state: GameState, talents: TalentSystem, items: ItemSystem, actions: ShopActions): void {
    this.container.className = 'shop-panel';
    this.container.innerHTML = `<div class="shop-panel__header"><div class="shop-panel__title">Магазин</div><div class="shop-panel__coins">${coinAmount(state.coins)}</div></div>`;
    const inventory = document.createElement('div');
    inventory.className = 'shop-panel__inventory-section';
    inventory.innerHTML =
      '<div class="shop-panel__section-title">Инвентарь (2× клик — продать)</div>';
    const slots = document.createElement('div');
    slots.className = 'inventory-grid';
    const capacity = state.stats.inventorySlots;
    for (let index = 0; index < capacity; index++) {
      const item = items.getItemAt(index);
      const button = item
        ? this.itemButton(
            item,
            true,
            () => {
              if (actions.sell(index)) {
                this.tooltip.hide();
                this.render(state, talents, items, actions);
              }
            },
            `Продажа: ${coinAmount(salePrice(item.price))}`,
          )
        : document.createElement('button');
      if (!item) {
        button.className = 'item-btn item-btn--empty';
        button.setAttribute('aria-label', `Пустой слот ${index + 1}`);
      }
      slots.append(button);
    }
    inventory.append(slots);
    const catalog = document.createElement('div');
    catalog.className = 'shop-panel__catalog-section';
    catalog.setAttribute('aria-label', 'Каталог предметов, по возрастанию цены');
    const filters = document.createElement('div');
    filters.className = 'shop-panel__filters';
    const nameLabel = document.createElement('label');
    nameLabel.className = 'shop-panel__search';
    nameLabel.innerHTML =
      '<svg viewBox="0 0 20 20" aria-hidden="true"><circle cx="8.5" cy="8.5" r="5.5"/><path d="m13 13 4 4"/></svg>';
    const search = document.createElement('input');
    search.type = 'search';
    search.placeholder = 'Название…';
    search.setAttribute('aria-label', 'Поиск предметов по названию');
    search.value = this.filters.name;
    nameLabel.append(search);
    const statLabel = document.createElement('label');
    statLabel.className = 'shop-panel__stat-filter';
    const statSelect = document.createElement('select');
    statSelect.setAttribute('aria-label', 'Фильтр по характеристике');
    const statTypes = [
      ...new Set(ITEM_CATALOG.flatMap((item) => item.stats.map((stat) => stat.type))),
    ];
    const all = document.createElement('option');
    all.value = '';
    all.textContent = 'Все характеристики';
    statSelect.append(all);
    for (const stat of statTypes.sort((a, b) =>
      STATS[a].label.localeCompare(STATS[b].label, 'ru'),
    )) {
      const option = document.createElement('option');
      option.value = stat;
      option.textContent = STATS[stat].label;
      statSelect.append(option);
    }
    statSelect.value = this.filters.stat;
    statLabel.append(statSelect);
    const chevron = document.createElement('span');
    chevron.className = 'shop-panel__chevron';
    chevron.setAttribute('aria-hidden', 'true');
    statLabel.append(chevron);
    filters.append(nameLabel, statLabel);
    const grid = document.createElement('div');
    grid.className = 'catalog-grid';
    const renderCatalog = () => {
      this.tooltip.hide();
      grid.replaceChildren();
      const visible = filterAndSortItems(ITEM_CATALOG, this.filters);
      statLabel.classList.toggle('shop-panel__stat-filter--active', !!this.filters.stat);
      if (visible.length === 0) {
        const empty = document.createElement('p');
        empty.className = 'shop-panel__empty';
        empty.textContent = 'Предметы не найдены. Измените название или характеристику.';
        grid.append(empty);
      }
      let lastRarity: ItemRarity | undefined;
      let row: HTMLDivElement | undefined;
      for (const item of visible) {
        const rarity = item.rarity;
        if (!row || rarity !== lastRarity) {
          const section = document.createElement('div');
          section.className = 'catalog-section';
          section.innerHTML = `<div class="catalog-section__header catalog-section__header--${rarity}">${RARITIES[rarity]}</div>`;
          row = document.createElement('div');
          row.className = 'catalog-section__items';
          section.append(row);
          grid.append(section);
          lastRarity = rarity;
        }
        const canBuy = items.canBuy(item.id, state.coins, state.stats.inventorySlots);
        const reason = canBuy
          ? '2× клик — купить'
          : items.owns(item.id)
            ? 'Уже надето'
            : state.coins < item.price
              ? 'Недостаточно монет'
              : 'Нет свободных слотов';
        row.append(
          this.itemButton(
            item,
            canBuy,
            () => {
              if (actions.buy(item.id)) {
                this.tooltip.hide();
                this.render(state, talents, items, actions);
              }
            },
            `Цена: ${coinAmount(item.price)}<br><span class="${canBuy ? '' : 'action-unavailable'}">${reason}</span>`,
          ),
        );
      }
    };
    search.addEventListener('input', () => {
      this.filters = { ...this.filters, name: search.value };
      renderCatalog();
    });
    statSelect.addEventListener('change', () => {
      this.filters = { ...this.filters, stat: statSelect.value as StatType | '' };
      renderCatalog();
    });
    renderCatalog();
    catalog.append(grid);
    this.container.append(inventory, filters, catalog);
  }
  private itemButton(
    item: ItemDefinition,
    enabled: boolean,
    action: () => void,
    footer: string,
  ): HTMLButtonElement {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = `item-btn item-btn--${item.rarity}${enabled ? '' : ' item-btn--disabled'}`;
    button.dataset.item = item.id;
    button.setAttribute('aria-label', item.name);
    button.setAttribute('aria-disabled', String(!enabled));
    button.innerHTML = `<div class="item-btn__icon">${generateItemSvg(item)}</div>`;
    button.addEventListener('dblclick', (event) => {
      event.preventDefault();
      if (enabled) action();
    });
    const showTooltip = () => {
      const ability = itemAbilityDescription(item);
      this.tooltip.show(
        button,
        `<div class="tooltip__title">${escapeHtml(item.name)}</div>${itemStatLines(item)
          .map((line) => `<div class="tooltip__stat">${escapeHtml(line)}</div>`)
          .join(
            '',
          )}${ability ? `<p class="tooltip__effect">${escapeHtml(ability)}</p>` : ''}<p>${footer}</p>`,
      );
    };
    button.addEventListener('mouseenter', showTooltip);
    button.addEventListener('focus', showTooltip);
    button.addEventListener('mouseleave', () => this.tooltip.hide());
    button.addEventListener('blur', () => this.tooltip.hide());
    return button;
  }
}
