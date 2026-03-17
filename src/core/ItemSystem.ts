import type { AbilityId } from '../config/types.js';
import type { TalentSystem } from './TalentSystem.js';
import type { ItemDefinition, AbilityModType } from '../config/items.js';
import { ITEM_MAP } from '../config/items.js';

export interface ItemBonuses {
  readonly maxHp: number;
  readonly maxEnergy: number;
  readonly hpRegen: number;
  readonly energyRegen: number;
  readonly damageReduction: number;
  readonly coinsPerKill: number;
  readonly energyPerKill: number;
  readonly energyPerBreach: number;
}

export interface ActiveAbilityMod {
  readonly abilityId: AbilityId;
  readonly modType: AbilityModType;
  readonly value: number;
  readonly sourceItemId: string;
}

const ZERO_BONUSES: ItemBonuses = {
  maxHp: 0,
  maxEnergy: 0,
  hpRegen: 0,
  energyRegen: 0,
  damageReduction: 0,
  coinsPerKill: 0,
  energyPerKill: 0,
  energyPerBreach: 0,
};

export class ItemSystem {
  private _inventory: string[] = [];
  private _cachedBonuses: ItemBonuses = ZERO_BONUSES;
  private _cachedAbilityMods: ActiveAbilityMod[] = [];
  private _dirty = true;

  public get inventory(): readonly string[] {
    return this._inventory;
  }

  public get inventorySize(): number {
    return this._inventory.length;
  }

  public getMaxSlots(talentSystem: TalentSystem): number {
    return talentSystem.getInventorySlots();
  }

  public hasFreeSlot(talentSystem: TalentSystem): boolean {
    return this._inventory.length < this.getMaxSlots(talentSystem);
  }

  public canBuy(itemId: string, coins: number, talentSystem: TalentSystem): boolean {
    const item = ITEM_MAP.get(itemId);
    if (!item) return false;
    if (coins < item.price) return false;
    if (!this.hasFreeSlot(talentSystem)) return false;
    return true;
  }

  public buyItem(itemId: string): boolean {
    const item = ITEM_MAP.get(itemId);
    if (!item) return false;
    this._inventory.push(itemId);
    this._dirty = true;
    return true;
  }

  public sellItem(slotIndex: number): { itemId: string; refund: number } | null {
    if (slotIndex < 0 || slotIndex >= this._inventory.length) return null;
    const itemId = this._inventory[slotIndex];
    const item = ITEM_MAP.get(itemId);
    if (!item) return null;
    const refund = Math.floor(item.price / 2);
    this._inventory.splice(slotIndex, 1);
    this._dirty = true;
    return { itemId, refund };
  }

  public getItemAt(slotIndex: number): ItemDefinition | null {
    const itemId = this._inventory[slotIndex];
    if (!itemId) return null;
    return ITEM_MAP.get(itemId) ?? null;
  }

  public getBonuses(): ItemBonuses {
    if (this._dirty) this._recalculate();
    return this._cachedBonuses;
  }

  public getActiveAbilityMods(): readonly ActiveAbilityMod[] {
    if (this._dirty) this._recalculate();
    return this._cachedAbilityMods;
  }

  public getAbilityMod(abilityId: AbilityId, modType: AbilityModType): ActiveAbilityMod | null {
    return this.getActiveAbilityMods().find(
      (m) => m.abilityId === abilityId && m.modType === modType
    ) ?? null;
  }

  public isAbilityModActive(itemId: string): boolean {
    const item = ITEM_MAP.get(itemId);
    if (!item?.abilityMod) return false;
    const activeMods = this.getActiveAbilityMods();
    return activeMods.some((m) => m.sourceItemId === itemId);
  }

  public isAbilityModConflicting(itemId: string): boolean {
    const item = ITEM_MAP.get(itemId);
    if (!item?.abilityMod) return false;
    const activeMods = this.getActiveAbilityMods();
    const conflict = activeMods.find(
      (m) =>
        m.abilityId === item.abilityMod!.abilityId &&
        m.modType === item.abilityMod!.modType &&
        m.sourceItemId !== itemId
    );
    return conflict !== undefined;
  }

  public wouldBeConflicting(itemId: string): boolean {
    const item = ITEM_MAP.get(itemId);
    if (!item?.abilityMod) return false;
    const activeMods = this.getActiveAbilityMods();
    return activeMods.some(
      (m) =>
        m.abilityId === item.abilityMod!.abilityId &&
        m.modType === item.abilityMod!.modType
    );
  }

  public clearInventory(): void {
    this._inventory = [];
    this._dirty = true;
  }

  public toSaveData(): string[] {
    return [...this._inventory];
  }

  public loadFromSave(itemIds: string[]): void {
    this._inventory = itemIds.filter((id) => ITEM_MAP.has(id));
    this._dirty = true;
  }

  private _recalculate(): void {
    let maxHp = 0;
    let maxEnergy = 0;
    let hpRegen = 0;
    let energyRegen = 0;
    let damagePassthrough = 1;
    let coinsPerKill = 0;
    let energyPerKill = 0;
    let energyPerBreach = 0;

    const seenMods = new Map<string, ActiveAbilityMod>();

    for (const itemId of this._inventory) {
      const item = ITEM_MAP.get(itemId);
      if (!item) continue;

      for (const stat of item.stats) {
        switch (stat.type) {
          case 'maxHp': maxHp += stat.value; break;
          case 'maxEnergy': maxEnergy += stat.value; break;
          case 'hpRegen': hpRegen += stat.value; break;
          case 'energyRegen': energyRegen += stat.value; break;
          case 'damageReduction': damagePassthrough *= (1 - stat.value / 100); break;
          case 'coinsPerKill': coinsPerKill += stat.value; break;
          case 'energyPerKill': energyPerKill += stat.value; break;
          case 'energyPerBreach': energyPerBreach += stat.value; break;
        }
      }

      if (item.abilityMod) {
        const modKey = `${item.abilityMod.abilityId}:${item.abilityMod.modType}`;
        if (!seenMods.has(modKey)) {
          seenMods.set(modKey, {
            abilityId: item.abilityMod.abilityId,
            modType: item.abilityMod.modType,
            value: item.abilityMod.value,
            sourceItemId: itemId,
          });
        }
      }
    }

    this._cachedBonuses = {
      maxHp,
      maxEnergy,
      hpRegen,
      energyRegen,
      damageReduction: (1 - damagePassthrough) * 100,
      coinsPerKill,
      energyPerKill,
      energyPerBreach,
    };
    this._cachedAbilityMods = [...seenMods.values()];
    this._dirty = false;
  }
}
