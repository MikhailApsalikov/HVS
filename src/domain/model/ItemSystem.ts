import type { ItemDefinition } from '../itemTypes.js';
import { ITEM_MAP } from '../../content/items.js';
import { itemModifiers } from '../rules/itemModifiers.js';
import { salePrice } from '../rules/economy.js';
import type { StatModifier } from '../rules/stats.js';

export class ItemSystem {
  private items: string[] = [];
  get inventory(): readonly string[] {
    return this.items;
  }
  get inventorySize(): number {
    return this.items.length;
  }
  hasFreeSlot(capacity: number): boolean {
    return this.items.length < capacity;
  }
  owns(id: string): boolean {
    return this.items.includes(id);
  }
  canBuy(id: string, coins: number, capacity: number): boolean {
    const item = ITEM_MAP.get(id);
    return !!item && !this.owns(id) && coins >= item.price && this.hasFreeSlot(capacity);
  }
  buyItem(id: string): boolean {
    if (!ITEM_MAP.has(id) || this.owns(id)) return false;
    this.items.push(id);
    return true;
  }
  sellItem(index: number): { itemId: string; refund: number } | null {
    if (!Number.isInteger(index) || index < 0 || index >= this.items.length) return null;
    const item = this.getItemAt(index);
    if (!item) return null;
    this.items.splice(index, 1);
    return { itemId: item.id, refund: salePrice(item.price) };
  }
  getItemAt(index: number): ItemDefinition | null {
    return ITEM_MAP.get(this.items[index]) ?? null;
  }
  getModifiers(): StatModifier[] {
    return this.items.flatMap((id, index) => {
      const item = ITEM_MAP.get(id);
      return item ? itemModifiers(item, `item:${index}:${id}`) : [];
    });
  }
  toSaveData(): string[] {
    return [...this.items];
  }
  loadFromSave(ids: readonly string[], slots: number): number {
    const unique = new Set<string>();
    let refund = 0;
    for (const id of ids) {
      const item = ITEM_MAP.get(id);
      if (!item) continue;
      if (unique.has(id)) refund += item.price;
      else unique.add(id);
    }
    this.items = [...unique].slice(0, slots);
    return refund;
  }
}
