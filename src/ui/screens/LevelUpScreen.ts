import type { TalentId } from '../../config/types.js';
import type { TalentSystem } from '../../core/TalentSystem.js';
import type { ItemSystem } from '../../core/ItemSystem.js';
import type { SpriteRegistry } from '../SpriteRegistry.js';
import type { ItemDefinition, ItemRarity } from '../../config/items.js';
import { ITEM_CATALOG } from '../../config/items.js';
import { generateItemSvg } from '../ItemSpriteGenerator.js';

const TALENT_NAMES: Record<TalentId, string> = {
  endurance: 'Выносливость',
  spiderArmor: 'Защита от пауков',
  tireless: 'Неутомимость',
  agility: 'Ловкость',
  healBoost: 'Усиленное лечение',
  hunterMastery: 'Мастерство охотника',
  improvedPrep: 'Улучшенная подготовка',
  volleyMastery: 'Искусный залп',
  rapidFire: 'Скорострельность',
  dutyBound: 'Чувство долга',
  blizzardMastery: 'Беспощадная вьюга',
  hunterReward: 'Награда охотника',
  quickInstinct: 'Быстрое чутьё',
  hunterArsenal: 'Арсенал охотника',
};

const TALENT_DESCRIPTIONS: Record<TalentId, string> = {
  endurance: '+425 макс. HP, +3 энергии за каждого паука, дошедшего до замка',
  spiderArmor: '-7% получаемого урона',
  tireless: '+10% регенерации энергии',
  agility: '+120 макс. энергии',
  healBoost: '+150 HP от Лечения, +2 HP/сек',
  hunterMastery: '-2 стоимость выстрела',
  improvedPrep: '-6 сек кулдаун Подготовки',
  volleyMastery: '+1 орудие в Залпе',
  rapidFire: '-10% кулдаун выстрела/залпа, +10% скорость стрел',
  dutyBound: '+1с длительность и -12с кулдаун Ни шагу назад!',
  blizzardMastery: '+7% замедление и +1с длительность Вьюги',
  hunterReward: '+7% шанс утроить награду за убитого паука',
  quickInstinct: '-1.5% кулдаун всех способностей (кроме выстрелов), мультипликативно',
  hunterArsenal: '+1 слот инвентаря для предметов',
};

const TALENT_SPRITE_MAP: Record<TalentId, string> = {
  endurance: 'TalentEndurance',
  spiderArmor: 'TalentArmor',
  tireless: 'TalentTireless',
  agility: 'TalentAgility',
  healBoost: 'TalentHealBoost',
  hunterMastery: 'TalentHunter',
  improvedPrep: 'TalentPrep',
  volleyMastery: 'TalentVolleyMastery',
  rapidFire: 'TalentRapidFire',
  dutyBound: 'TalentDuty',
  blizzardMastery: 'TalentBlizzardMastery',
  hunterReward: 'TalentHunterReward',
  quickInstinct: 'TalentQuickInstinct',
  hunterArsenal: 'TalentHunter',
};

const RARITY_LABELS: Record<ItemRarity, string> = {
  common: 'Обычный',
  rare: 'Редкий',
  epic: 'Эпический',
  legendary: 'Легендарный',
};

const RARITY_ORDER: ItemRarity[] = ['common', 'rare', 'epic', 'legendary'];

const STAT_LABELS: Record<string, string> = {
  maxHp: 'макс. HP',
  maxEnergy: 'макс. энергия',
  hpRegen: 'HP/сек',
  energyRegen: 'энергия/сек',
  damageReduction: '% сниж. урона',
  coinsPerKill: 'монетки/убийство',
  energyPerKill: 'энергия/убийство',
  energyPerBreach: 'энергия/прорыв',
};

export class LevelUpScreen {
  private _container: HTMLElement;
  private _titleEl: HTMLElement;
  private _pointsEl: HTMLElement;
  private _talentsGrid: HTMLElement;
  private _confirmBtn: HTMLButtonElement;
  private _tooltip: HTMLElement;
  private _onConfirm: (() => void) | null = null;
  private _onTalentUpgrade: ((id: TalentId) => void) | null = null;
  private _onBuyItem: ((itemId: string) => boolean) | null = null;
  private _onSellItem: ((slotIndex: number) => boolean) | null = null;
  private _pendingPoints: number = 0;
  private _talentSystem: TalentSystem | null = null;
  private _itemSystem: ItemSystem | null = null;
  private _playerLevel: number = 1;
  private _coins: number = 0;
  private readonly _spriteRegistry: SpriteRegistry;

  private _shopPanel: HTMLElement;
  private _shopCoinsEl: HTMLElement;
  private _inventoryGrid: HTMLElement;
  private _catalogGrid: HTMLElement;

  public constructor(container: HTMLElement, spriteRegistry: SpriteRegistry) {
    this._container = container;
    this._spriteRegistry = spriteRegistry;
    this._titleEl = document.createElement('div');
    this._pointsEl = document.createElement('div');
    this._talentsGrid = document.createElement('div');
    this._confirmBtn = document.createElement('button') as HTMLButtonElement;
    this._tooltip = document.createElement('div');
    this._shopPanel = document.createElement('div');
    this._shopCoinsEl = document.createElement('div');
    this._inventoryGrid = document.createElement('div');
    this._catalogGrid = document.createElement('div');
    this._build();
  }

  private _build(): void {
    this._container.className = 'level-up-screen';
    this._container.dataset.screen = 'level-up';

    const layout = document.createElement('div');
    layout.className = 'level-up-layout';

    // --- Talent panel (left) ---
    const panel = document.createElement('div');
    panel.className = 'talent-panel';

    const titleBar = document.createElement('div');
    titleBar.className = 'talent-panel__title-bar';

    this._titleEl.className = 'talent-panel__title';
    titleBar.appendChild(this._titleEl);

    this._pointsEl.className = 'talent-panel__points';
    titleBar.appendChild(this._pointsEl);

    panel.appendChild(titleBar);

    this._talentsGrid.className = 'talent-tree';
    this._talentsGrid.dataset.component = 'talents-grid';
    panel.appendChild(this._talentsGrid);

    layout.appendChild(panel);

    // --- Shop panel (right) ---
    this._shopPanel.className = 'shop-panel';

    const shopHeader = document.createElement('div');
    shopHeader.className = 'shop-panel__header';

    const shopTitle = document.createElement('div');
    shopTitle.className = 'shop-panel__title';
    shopTitle.textContent = 'Магазин';
    shopHeader.appendChild(shopTitle);

    this._shopCoinsEl.className = 'shop-panel__coins';
    shopHeader.appendChild(this._shopCoinsEl);

    this._shopPanel.appendChild(shopHeader);

    // Inventory
    const inventorySection = document.createElement('div');
    inventorySection.className = 'shop-panel__inventory-section';

    const inventoryTitle = document.createElement('div');
    inventoryTitle.className = 'shop-panel__section-title';
    inventoryTitle.textContent = 'Инвентарь (2× клик — продать)';
    inventorySection.appendChild(inventoryTitle);

    this._inventoryGrid.className = 'inventory-grid';
    inventorySection.appendChild(this._inventoryGrid);

    this._shopPanel.appendChild(inventorySection);

    // Catalog
    const catalogSection = document.createElement('div');
    catalogSection.className = 'shop-panel__catalog-section';

    const catalogTitle = document.createElement('div');
    catalogTitle.className = 'shop-panel__section-title';
    catalogTitle.textContent = 'Каталог (2× клик — купить)';
    catalogSection.appendChild(catalogTitle);

    this._catalogGrid.className = 'catalog-grid';
    catalogSection.appendChild(this._catalogGrid);

    this._shopPanel.appendChild(catalogSection);

    layout.appendChild(this._shopPanel);

    this._container.appendChild(layout);

    // --- Footer ---
    const footer = document.createElement('div');
    footer.className = 'level-up-footer';

    this._confirmBtn.className = 'talent-panel__confirm';
    this._confirmBtn.textContent = 'Продолжить';
    this._confirmBtn.type = 'button';
    this._confirmBtn.dataset.action = 'confirm';
    this._confirmBtn.addEventListener('click', () => this._handleConfirm());
    footer.appendChild(this._confirmBtn);

    this._container.appendChild(footer);

    this._tooltip.className = 'talent-tooltip';
    document.body.appendChild(this._tooltip);
  }

  public show(
    level: number,
    talentSystem: TalentSystem,
    pendingPoints: number,
    coins: number,
    itemSystem: ItemSystem,
    onConfirm: () => void,
    onTalentUpgrade?: (id: TalentId) => void,
    onBuyItem?: (itemId: string) => boolean,
    onSellItem?: (slotIndex: number) => boolean,
    isInitial?: boolean
  ): void {
    this._onTalentUpgrade = onTalentUpgrade ?? null;
    this._onBuyItem = onBuyItem ?? null;
    this._onSellItem = onSellItem ?? null;
    this._playerLevel = level;
    this._talentSystem = talentSystem;
    this._itemSystem = itemSystem;
    this._pendingPoints = pendingPoints;
    this._coins = coins;
    this._onConfirm = onConfirm;

    this._titleEl.textContent = isInitial ? 'Дерево талантов' : `Дерево талантов — уровень ${level}`;
    this._renderTalents();
    this._updatePointsDisplay();
    this._updateConfirmState();
    this._renderShop();
    this._container.classList.add('level-up-screen--visible');
  }

  public updateCoins(coins: number): void {
    this._coins = coins;
    this._renderShop();
  }

  public hide(): void {
    this._container.classList.remove('level-up-screen--visible');
    this._hideTooltip();
    this._onConfirm = null;
    this._talentSystem = null;
    this._itemSystem = null;
  }

  // ─── Shop ──────────────────────────────────────────────────────

  private _renderShop(): void {
    this._renderCoins();
    this._renderInventory();
    this._renderCatalog();
  }

  private _renderCoins(): void {
    this._shopCoinsEl.innerHTML = '';
    const coinIcon = document.createElement('span');
    coinIcon.className = 'shop-coin-icon';
    coinIcon.innerHTML = this._spriteRegistry.get('Coin');
    this._shopCoinsEl.appendChild(coinIcon);
    const coinText = document.createElement('span');
    coinText.textContent = `${Math.floor(this._coins)}`;
    coinText.className = 'shop-coin-text';
    this._shopCoinsEl.appendChild(coinText);
  }

  private _renderInventory(): void {
    this._inventoryGrid.innerHTML = '';
    const ts = this._talentSystem;
    const is = this._itemSystem;
    if (!ts || !is) return;

    const maxSlots = is.getMaxSlots(ts);
    const totalPossibleSlots = 6;

    for (let i = 0; i < totalPossibleSlots; i++) {
      const slot = document.createElement('button');
      slot.className = 'item-btn';
      slot.type = 'button';

      if (i >= maxSlots) {
        slot.classList.add('item-btn--locked');
        const lockIcon = document.createElement('span');
        lockIcon.className = 'item-btn__lock';
        lockIcon.innerHTML = this._spriteRegistry.get('Lock');
        slot.appendChild(lockIcon);
      } else if (i < is.inventorySize) {
        const item = is.getItemAt(i);
        if (item) {
          slot.classList.add(`item-btn--${item.rarity}`);

          const icon = document.createElement('div');
          icon.className = 'item-btn__icon';
          icon.innerHTML = generateItemSvg(item);
          slot.appendChild(icon);

          if (item.abilityMod && !is.isAbilityModActive(item.id)) {
            slot.classList.add('item-btn--mod-inactive');
          }

          const slotIdx = i;
          slot.addEventListener('dblclick', (e) => {
            e.preventDefault();
            this._handleSellItem(slotIdx);
          });

          slot.addEventListener('mouseenter', (e) => this._showInventoryTooltip(e, item, is));
          slot.addEventListener('mousemove', (e) => this._moveTooltip(e));
          slot.addEventListener('mouseleave', () => this._hideTooltip());
        }
      } else {
        slot.classList.add('item-btn--empty');
      }

      this._inventoryGrid.appendChild(slot);
    }
  }

  private _renderCatalog(): void {
    this._catalogGrid.innerHTML = '';
    const ts = this._talentSystem;
    const is = this._itemSystem;
    if (!ts || !is) return;

    const grouped = new Map<ItemRarity, ItemDefinition[]>();
    for (const r of RARITY_ORDER) grouped.set(r, []);
    for (const item of ITEM_CATALOG) {
      grouped.get(item.rarity)!.push(item);
    }

    for (const rarity of RARITY_ORDER) {
      const items = grouped.get(rarity)!;
      if (items.length === 0) continue;

      const section = document.createElement('div');
      section.className = 'catalog-section';

      const header = document.createElement('div');
      header.className = `catalog-section__header catalog-section__header--${rarity}`;
      header.textContent = `${RARITY_LABELS[rarity]} (${items.length})`;
      section.appendChild(header);

      const grid = document.createElement('div');
      grid.className = 'catalog-section__items';

      for (const item of items) {
        const btn = this._createCatalogItemBtn(item, is, ts);
        grid.appendChild(btn);
      }

      section.appendChild(grid);
      this._catalogGrid.appendChild(section);
    }
  }

  private _createCatalogItemBtn(item: ItemDefinition, is: ItemSystem, ts: TalentSystem): HTMLElement {
    const canBuy = is.canBuy(item.id, this._coins, ts);

    const btn = document.createElement('button');
    btn.className = `item-btn item-btn--${item.rarity}`;
    btn.type = 'button';

    if (!canBuy) {
      btn.classList.add('item-btn--disabled');
    }

    const icon = document.createElement('div');
    icon.className = 'item-btn__icon';
    icon.innerHTML = generateItemSvg(item);
    btn.appendChild(icon);

    btn.addEventListener('dblclick', (e) => {
      e.preventDefault();
      this._handleBuyItem(item.id);
    });

    btn.addEventListener('mouseenter', (e) => this._showCatalogTooltip(e, item, is, ts));
    btn.addEventListener('mousemove', (e) => this._moveTooltip(e));
    btn.addEventListener('mouseleave', () => this._hideTooltip());

    return btn;
  }

  // ─── Item tooltips ──────────────────────────────────────────────

  private _showCatalogTooltip(e: MouseEvent, item: ItemDefinition, is: ItemSystem, ts: TalentSystem): void {
    const canBuy = is.canBuy(item.id, this._coins, ts);
    let html = this._buildItemTooltipBase(item, is);

    html += `<div class="talent-tooltip__rank" style="margin-top:6px">Цена: <span style="color:#ffd700">${item.price}</span></div>`;

    if (!canBuy) {
      if (this._coins < item.price) {
        html += `<div class="talent-tooltip__locked">Недостаточно монеток</div>`;
      } else {
        html += `<div class="talent-tooltip__locked">Нет свободных слотов</div>`;
      }
    } else {
      html += `<div class="talent-tooltip__maxed" style="color:#7bc67b">2× клик — купить</div>`;
    }

    this._tooltip.innerHTML = html;
    this._tooltip.classList.add('talent-tooltip--visible');
    this._moveTooltip(e);
  }

  private _showInventoryTooltip(e: MouseEvent, item: ItemDefinition, is: ItemSystem): void {
    let html = this._buildItemTooltipBase(item, is);

    const sellPrice = Math.floor(item.price / 2);
    html += `<div class="talent-tooltip__rank" style="margin-top:6px">Продажа: <span style="color:#ffd700">${sellPrice}</span></div>`;
    html += `<div class="talent-tooltip__maxed" style="color:#cc8844">2× клик — продать</div>`;

    this._tooltip.innerHTML = html;
    this._tooltip.classList.add('talent-tooltip--visible');
    this._moveTooltip(e);
  }

  private _buildItemTooltipBase(item: ItemDefinition, is: ItemSystem): string {
    const rarityColor = this._getRarityColor(item.rarity);
    let html = `<div class="talent-tooltip__name" style="color:${rarityColor}">${item.name}</div>`;
    html += `<div style="font-size:0.68rem;color:${rarityColor};opacity:0.7;margin-bottom:6px">${RARITY_LABELS[item.rarity]}</div>`;

    for (const stat of item.stats) {
      html += `<div class="talent-tooltip__desc" style="margin-bottom:2px">+${stat.value} ${STAT_LABELS[stat.type] ?? stat.type}</div>`;
    }

    if (item.abilityMod) {
      html += `<div style="font-size:0.78rem;color:#da70d6;margin-top:4px">${item.abilityMod.description}</div>`;
      if (is.wouldBeConflicting(item.id)) {
        html += `<div class="talent-tooltip__locked">Модификация неактивна: уже применена другая модификация этой способности</div>`;
      }
    }

    return html;
  }

  private _getRarityColor(rarity: ItemRarity): string {
    switch (rarity) {
      case 'common': return '#57e657';
      case 'rare': return '#5599ff';
      case 'epic': return '#b855ff';
      case 'legendary': return '#ffd700';
    }
  }

  private _handleBuyItem(itemId: string): void {
    if (!this._onBuyItem) return;
    const success = this._onBuyItem(itemId);
    if (success) {
      this._hideTooltip();
      this._renderShop();
    }
  }

  private _handleSellItem(slotIndex: number): void {
    if (!this._onSellItem) return;
    const success = this._onSellItem(slotIndex);
    if (success) {
      this._hideTooltip();
      this._renderShop();
    }
  }

  // ─── Talents ───────────────────────────────────────────────────

  private _renderTalents(): void {
    this._talentsGrid.innerHTML = '';
    const system = this._talentSystem;
    if (!system) return;

    const tiers = new Map<number, typeof system.talents[number][]>();
    for (const talent of system.talents) {
      const tier = talent.unlocksAtLevel;
      if (!tiers.has(tier)) tiers.set(tier, []);
      tiers.get(tier)!.push(talent);
    }

    const sortedTiers = [...tiers.keys()].sort((a, b) => a - b);

    for (const tierLevel of sortedTiers) {
      const tierTalents = tiers.get(tierLevel)!;

      const tierSection = document.createElement('div');
      tierSection.className = 'talent-tree__tier';

      const tierLabel = document.createElement('div');
      tierLabel.className = 'talent-tree__tier-label';
      tierLabel.textContent = tierLevel <= 1 ? 'Начальные таланты' : `Требуется ${tierLevel} уровень`;
      tierSection.appendChild(tierLabel);

      const tierRow = document.createElement('div');
      tierRow.className = 'talent-tree__tier-row';

      for (const talent of tierTalents) {
        const btn = this._createTalentBtn(
          talent.id,
          talent.rank,
          talent.maxRanks,
          talent.unlocksAtLevel
        );
        tierRow.appendChild(btn);
      }

      tierSection.appendChild(tierRow);
      this._talentsGrid.appendChild(tierSection);
    }
  }

  private _createTalentBtn(
    id: TalentId,
    rank: number,
    maxRanks: number,
    unlocksAtLevel: number
  ): HTMLElement {
    const isLocked = this._playerLevel < unlocksAtLevel;
    const isMaxed = rank >= maxRanks;
    const canUpgrade = this._talentSystem!.canUpgrade(id, this._playerLevel);
    const hasPoints = this._pendingPoints > 0;

    const btn = document.createElement('button');
    btn.className = 'talent-btn';
    btn.type = 'button';
    btn.dataset.talentId = id;

    if (isLocked) {
      btn.classList.add('talent-btn--locked');
    } else if (isMaxed) {
      btn.classList.add('talent-btn--maxed');
    } else if (canUpgrade && hasPoints) {
      btn.classList.add('talent-btn--available');
    }

    const icon = document.createElement('div');
    icon.className = 'talent-btn__icon';
    icon.innerHTML = this._spriteRegistry.get(TALENT_SPRITE_MAP[id]);
    btn.appendChild(icon);

    const rankBadge = document.createElement('div');
    rankBadge.className = 'talent-btn__rank';
    rankBadge.textContent = `${rank}/${maxRanks}`;
    if (isMaxed) rankBadge.classList.add('talent-btn__rank--maxed');
    btn.appendChild(rankBadge);

    if (!isLocked && !isMaxed) {
      btn.addEventListener('click', () => this._handleUpgrade(id));
    }

    btn.addEventListener('mouseenter', (e) =>
      this._showTooltip(e, id, rank, maxRanks, unlocksAtLevel)
    );
    btn.addEventListener('mousemove', (e) => this._moveTooltip(e));
    btn.addEventListener('mouseleave', () => this._hideTooltip());

    return btn;
  }

  // ─── Talent tooltips ───────────────────────────────────────────

  private _showTooltip(
    e: MouseEvent,
    id: TalentId,
    rank: number,
    maxRanks: number,
    unlocksAtLevel: number
  ): void {
    const isLocked = this._playerLevel < unlocksAtLevel;
    const isMaxed = rank >= maxRanks;

    let html = `<div class="talent-tooltip__name">${TALENT_NAMES[id]}</div>`;
    html += `<div class="talent-tooltip__desc">${TALENT_DESCRIPTIONS[id]}</div>`;
    html += `<div class="talent-tooltip__rank">Ранг: <span>${rank} / ${maxRanks}</span></div>`;

    if (isLocked) {
      html += `<div class="talent-tooltip__locked">Требуется ${unlocksAtLevel} уровень</div>`;
    } else if (isMaxed) {
      html += `<div class="talent-tooltip__maxed">Максимальный ранг</div>`;
    }

    this._tooltip.innerHTML = html;
    this._tooltip.classList.add('talent-tooltip--visible');
    this._moveTooltip(e);
  }

  private _moveTooltip(e: MouseEvent): void {
    const offset = 18;
    let x = e.clientX + offset;
    let y = e.clientY + offset;

    const w = this._tooltip.offsetWidth;
    const h = this._tooltip.offsetHeight;
    if (x + w > window.innerWidth - 8) x = e.clientX - w - offset;
    if (y + h > window.innerHeight - 8) y = e.clientY - h - offset;

    this._tooltip.style.left = `${x}px`;
    this._tooltip.style.top = `${y}px`;
  }

  private _hideTooltip(): void {
    this._tooltip.classList.remove('talent-tooltip--visible');
  }

  // ─── Talent actions ───────────────────────────────────────────

  private _updatePointsDisplay(): void {
    if (this._pendingPoints > 0) {
      this._pointsEl.textContent = `Очков таланта: ${this._pendingPoints}`;
      this._pointsEl.className = 'talent-panel__points talent-panel__points--has-points';
    } else {
      this._pointsEl.textContent = 'Очков нет';
      this._pointsEl.className = 'talent-panel__points';
    }
  }

  private _handleUpgrade(id: TalentId): void {
    const system = this._talentSystem;
    if (!system || this._pendingPoints <= 0) return;
    if (!system.canUpgrade(id, this._playerLevel)) return;

    system.upgrade(id);
    this._pendingPoints -= 1;
    this._onTalentUpgrade?.(id);
    this._renderTalents();
    this._updatePointsDisplay();
    this._updateConfirmState();
    this._renderShop();
  }

  private _handleConfirm(): void {
    if (this._canConfirm()) {
      this._onConfirm?.();
    }
  }

  private _canConfirm(): boolean {
    if (this._pendingPoints <= 0) return true;
    const system = this._talentSystem;
    if (!system) return true;
    return !system.hasAvailableUpgrades(this._playerLevel);
  }

  private _updateConfirmState(): void {
    this._confirmBtn.disabled = !this._canConfirm();
  }

  public getContainer(): HTMLElement {
    return this._container;
  }
}
