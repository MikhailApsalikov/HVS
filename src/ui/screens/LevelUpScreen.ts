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
  private _levelEl: HTMLElement;
  private _talentsGrid: HTMLElement;
  private _confirmBtn: HTMLButtonElement;
  private _onConfirm: (() => void) | null = null;
  private _onTalentUpgrade: ((id: TalentId) => void) | null = null;
  private _pendingPoints: number = 0;
  private _talentSystem: TalentSystem | null = null;
  private _playerLevel: number = 1;
  private readonly _spriteRegistry: SpriteRegistry;

  public constructor(container: HTMLElement, spriteRegistry: SpriteRegistry) {
    this._container = container;
    this._spriteRegistry = spriteRegistry;
    this._levelEl = document.createElement('h2');
    this._talentsGrid = document.createElement('div');
    this._confirmBtn = document.createElement('button') as HTMLButtonElement;
    this._build();
  }

  private _build(): void {
    this._container.className = 'level-up-screen';
    this._container.dataset.screen = 'level-up';

    this._levelEl.className = 'level-up__title';
    this._container.appendChild(this._levelEl);

    this._talentsGrid.className = 'level-up__talents';
    this._talentsGrid.dataset.component = 'talents-grid';
    this._container.appendChild(this._talentsGrid);

    this._confirmBtn.className = 'level-up__confirm';
    this._confirmBtn.textContent = 'Продолжить';
    this._confirmBtn.dataset.action = 'confirm';
    this._confirmBtn.addEventListener('click', () => this._handleConfirm());
    this._container.appendChild(this._confirmBtn);
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

    this._levelEl.textContent = isInitial
      ? 'Выберите первый талант!'
      : `Уровень ${level} пройден!`;
    this._renderTalents();
    this._updateConfirmState();
    this._container.classList.add('level-up-screen--visible');
  }

  public hide(): void {
    this._container.classList.remove('level-up-screen--visible');
    this._onConfirm = null;
    this._talentSystem = null;
  }

  private _renderTalents(): void {
    this._talentsGrid.innerHTML = '';
    const system = this._talentSystem;
    if (!system) return;

    const sorted = [...system.talents].sort((a, b) => a.unlocksAtLevel - b.unlocksAtLevel);
    for (const talent of sorted) {
      const card = this._createTalentCard(talent.id, talent.rank, talent.maxRanks, talent.unlocksAtLevel);
      this._talentsGrid.appendChild(card);
    }
  }

  private _createTalentCard(
    id: TalentId,
    rank: number,
    maxRanks: number,
    unlocksAtLevel: number
  ): HTMLElement {
    const card = document.createElement('div');
    card.className = 'talent-card';
    card.dataset.talentId = id;

    const system = this._talentSystem!;
    const canUpgrade = system.canUpgrade(id, this._playerLevel);
    const hasPoints = this._pendingPoints > 0;

    const icon = document.createElement('div');
    icon.className = 'talent-card__icon';
    icon.innerHTML = this._spriteRegistry.get(TALENT_SPRITE_MAP[id]);
    card.appendChild(icon);

    const name = document.createElement('div');
    name.className = 'talent-card__name';
    name.textContent = TALENT_NAMES[id];
    card.appendChild(name);

    const desc = document.createElement('div');
    desc.className = 'talent-card__desc';
    desc.textContent = TALENT_DESCRIPTIONS[id];
    card.appendChild(desc);

    const rankEl = document.createElement('div');
    rankEl.className = 'talent-card__rank';
    rankEl.textContent = `${rank} / ${maxRanks}`;
    card.appendChild(rankEl);

    const upgradeBtn = document.createElement('button');
    upgradeBtn.className = 'talent-card__upgrade';
    upgradeBtn.type = 'button';
    upgradeBtn.textContent = 'Улучшить';
    upgradeBtn.dataset.talentId = id;
    upgradeBtn.disabled = !canUpgrade || !hasPoints;
    upgradeBtn.addEventListener('click', () => this._handleUpgrade(id));
    card.appendChild(upgradeBtn);

    if (this._playerLevel < unlocksAtLevel) {
      card.classList.add('talent-card--locked');
      upgradeBtn.textContent = `Требуется ${unlocksAtLevel} ур.`;
    }

    return card;
  }

  private _handleUpgrade(id: TalentId): void {
    const system = this._talentSystem;
    if (!system || this._pendingPoints <= 0) return;
    if (!system.canUpgrade(id, this._playerLevel)) return;

    system.upgrade(id);
    this._pendingPoints -= 1;
    this._onTalentUpgrade?.(id);
    this._renderTalents();
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
