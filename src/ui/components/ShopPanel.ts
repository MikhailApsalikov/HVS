import type { GameState } from '../../domain/model/GameState.js';
import type { TalentSystem } from '../../domain/model/TalentSystem.js';
import type { ItemSystem } from '../../domain/model/ItemSystem.js';
import type { ItemDefinition, ItemRarity } from '../../domain/itemTypes.js';
import { ITEM_CATALOG } from '../../content/items.js';
import { generateItemSvg } from '../ItemSpriteGenerator.js';
import { salePrice } from '../../domain/rules/economy.js';
import { itemModifiers } from '../../domain/rules/itemModifiers.js';
import { describeModifier, escapeHtml } from '../presenters.js';
import { TooltipManager } from './TooltipManager.js';

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
  render(state: GameState, talents: TalentSystem, items: ItemSystem, actions: ShopActions): void {
    this.container.className = 'shop-panel';
    this.container.innerHTML = `<div class="shop-panel__header"><div class="shop-panel__title">Магазин</div><div class="shop-panel__coins">${state.coins} монет</div></div>`;
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
            `Продажа: ${salePrice(item.price)} монет`,
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
    catalog.innerHTML = '<div class="shop-panel__section-title">Каталог (2× клик — купить)</div>';
    const grid = document.createElement('div');
    grid.className = 'catalog-grid';
    for (const rarity of Object.keys(RARITIES) as ItemRarity[]) {
      const section = document.createElement('div');
      section.className = 'catalog-section';
      section.innerHTML = `<div class="catalog-section__header catalog-section__header--${rarity}">${RARITIES[rarity]}</div>`;
      const row = document.createElement('div');
      row.className = 'catalog-section__items';
      for (const item of ITEM_CATALOG.filter((item) => item.rarity === rarity)) {
        const canBuy = items.canBuy(item.id, state.coins, state.stats.inventorySlots);
        const reason = canBuy
          ? '2× клик — купить'
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
            `Цена: ${item.price} монет<br>${reason}`,
          ),
        );
      }
      section.append(row);
      grid.append(section);
    }
    catalog.append(grid);
    this.container.append(inventory, catalog);
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
    button.addEventListener('mouseenter', () =>
      this.tooltip.show(
        button,
        `<div class="tooltip__title">${escapeHtml(item.name)}</div>${itemModifiers(item, 'preview')
          .map((modifier) => `<div class="tooltip__stat">${describeModifier(modifier)}</div>`)
          .join('')}<p>${footer}</p>`,
      ),
    );
    button.addEventListener('mouseleave', () => this.tooltip.hide());
    return button;
  }
}
