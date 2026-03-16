import type { TalentId } from '../../config/types.js';
import type { SpriteRegistry } from '../SpriteRegistry.js';

export class TalentCard {
  private _container: HTMLElement;
  private _rankEl: HTMLElement;
  private _upgradeBtn: HTMLButtonElement;
  private _onUpgradeCallback: (() => void) | null = null;

  public constructor(
    parent: HTMLElement,
    talentId: TalentId,
    name: string,
    description: string,
    spriteRegistry: SpriteRegistry
  ) {
    this._container = document.createElement('div');
    this._container.className = 'talent-card';
    this._container.dataset.talent = talentId;
    this._container.dataset.component = 'talent-card';

    const iconDiv = document.createElement('div');
    iconDiv.className = 'talent-card__icon';
    iconDiv.innerHTML = spriteRegistry.get(this._getSpriteName(talentId));
    this._container.appendChild(iconDiv);

    const nameDiv = document.createElement('div');
    nameDiv.className = 'talent-card__name';
    nameDiv.textContent = name;
    this._container.appendChild(nameDiv);

    const descDiv = document.createElement('div');
    descDiv.className = 'talent-card__desc';
    descDiv.textContent = description;
    this._container.appendChild(descDiv);

    this._rankEl = document.createElement('div');
    this._rankEl.className = 'talent-card__rank';
    this._container.appendChild(this._rankEl);

    this._upgradeBtn = document.createElement('button');
    this._upgradeBtn.className = 'talent-card__upgrade-btn';
    this._upgradeBtn.textContent = '+';
    this._upgradeBtn.type = 'button';
    this._upgradeBtn.addEventListener('click', () => {
      if (this._onUpgradeCallback) {
        this._onUpgradeCallback();
      }
    });
    this._container.appendChild(this._upgradeBtn);

    parent.appendChild(this._container);
  }

  private _getSpriteName(id: TalentId): string {
    const map: Record<TalentId, string> = {
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
    return map[id] ?? 'TalentEndurance';
  }

  public update(
    rank: number,
    maxRanks: number,
    canUpgrade: boolean,
    isLocked: boolean
  ): void {
    this._rankEl.textContent = `${rank} / ${maxRanks}`;
    this._container.classList.toggle('talent-card--maxed', rank >= maxRanks);
    this._container.classList.toggle('talent-card--locked', isLocked);
    this._container.classList.toggle('talent-card--available', canUpgrade);
  }

  public setOnUpgrade(callback: () => void): void {
    this._onUpgradeCallback = callback;
  }

  public getContainer(): HTMLElement {
    return this._container;
  }
}
