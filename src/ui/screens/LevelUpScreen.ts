import type { TalentId } from '../../config/types.js';
import type { TalentSystem } from '../../core/TalentSystem.js';
import type { SpriteRegistry } from '../SpriteRegistry.js';

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
  private _pendingPoints: number = 0;
  private _talentSystem: TalentSystem | null = null;
  private _playerLevel: number = 1;
  private readonly _spriteRegistry: SpriteRegistry;

  public constructor(container: HTMLElement, spriteRegistry: SpriteRegistry) {
    this._container = container;
    this._spriteRegistry = spriteRegistry;
    this._titleEl = document.createElement('div');
    this._pointsEl = document.createElement('div');
    this._talentsGrid = document.createElement('div');
    this._confirmBtn = document.createElement('button') as HTMLButtonElement;
    this._tooltip = document.createElement('div');
    this._build();
  }

  private _build(): void {
    this._container.className = 'level-up-screen';
    this._container.dataset.screen = 'level-up';

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

    const footer = document.createElement('div');
    footer.className = 'talent-panel__footer';

    this._confirmBtn.className = 'talent-panel__confirm';
    this._confirmBtn.textContent = 'Продолжить';
    this._confirmBtn.type = 'button';
    this._confirmBtn.dataset.action = 'confirm';
    this._confirmBtn.addEventListener('click', () => this._handleConfirm());
    footer.appendChild(this._confirmBtn);

    panel.appendChild(footer);
    this._container.appendChild(panel);

    this._tooltip.className = 'talent-tooltip';
    document.body.appendChild(this._tooltip);
  }

  public show(
    level: number,
    talentSystem: TalentSystem,
    pendingPoints: number,
    onConfirm: () => void,
    onTalentUpgrade?: (id: TalentId) => void,
    isInitial?: boolean
  ): void {
    this._onTalentUpgrade = onTalentUpgrade ?? null;
    this._playerLevel = level;
    this._talentSystem = talentSystem;
    this._pendingPoints = pendingPoints;
    this._onConfirm = onConfirm;

    this._titleEl.textContent = isInitial ? 'Дерево талантов' : `Дерево талантов — уровень ${level}`;
    this._renderTalents();
    this._updatePointsDisplay();
    this._updateConfirmState();
    this._container.classList.add('level-up-screen--visible');
  }

  public hide(): void {
    this._container.classList.remove('level-up-screen--visible');
    this._hideTooltip();
    this._onConfirm = null;
    this._talentSystem = null;
  }

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
