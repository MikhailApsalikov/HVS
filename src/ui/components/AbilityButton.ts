import type { AbilityId } from '../../config/types.js';
import type { SpriteRegistry } from '../SpriteRegistry.js';

export class AbilityButton {
  private _container: HTMLElement;
  private _cooldownOverlay: HTMLElement;
  private _cooldownText: HTMLElement;
  private _lockOverlay: HTMLElement;

  public constructor(
    parent: HTMLElement,
    abilityId: AbilityId,
    hotkey: string,
    name: string,
    cost: number,
    onClick: () => void,
    spriteRegistry: SpriteRegistry
  ) {
    this._container = document.createElement('div');
    this._container.className = 'ability-btn';
    this._container.dataset.ability = abilityId;
    this._container.dataset.component = 'ability-btn';

    const iconDiv = document.createElement('div');
    iconDiv.className = 'ability-btn__icon';
    iconDiv.innerHTML = spriteRegistry.get(this._getSpriteName(abilityId));
    this._container.appendChild(iconDiv);

    const infoDiv = document.createElement('div');
    infoDiv.className = 'ability-btn__info';
    const nameSpan = document.createElement('span');
    nameSpan.className = 'ability-btn__name';
    nameSpan.textContent = name;
    const hotkeySpan = document.createElement('span');
    hotkeySpan.className = 'ability-btn__hotkey';
    hotkeySpan.textContent = `[${hotkey}]`;
    const costSpan = document.createElement('span');
    costSpan.className = 'ability-btn__cost';
    costSpan.textContent = `${cost} EN`;
    infoDiv.appendChild(nameSpan);
    infoDiv.appendChild(hotkeySpan);
    infoDiv.appendChild(costSpan);
    this._container.appendChild(infoDiv);

    this._cooldownOverlay = document.createElement('div');
    this._cooldownOverlay.className = 'ability-btn__cooldown-overlay';
    this._container.appendChild(this._cooldownOverlay);

    this._cooldownText = document.createElement('div');
    this._cooldownText.className = 'ability-btn__cooldown-text';
    this._container.appendChild(this._cooldownText);

    this._lockOverlay = document.createElement('div');
    this._lockOverlay.className = 'ability-btn__lock-overlay';
    this._container.appendChild(this._lockOverlay);

    this._container.addEventListener('click', () => {
      onClick();
    });

    parent.appendChild(this._container);
  }

  private _getSpriteName(id: AbilityId): string {
    const map: Record<AbilityId, string> = {
      freeze: 'AbilityFreeze',
      blizzard: 'AbilityBlizzard',
      prep: 'AbilityPrep',
      heal: 'AbilityHeal',
      volley: 'AbilityVolley',
      stand: 'AbilityStand',
      armageddon: 'AbilityArmageddon',
      recharge: 'AbilityRecharge',
    };
    return map[id] ?? 'AbilityFreeze';
  }

  public update(
    _isAvailable: boolean,
    isOnCooldown: boolean,
    cooldownFraction: number,
    remainingCooldown: number,
    hasEnergy: boolean,
    isLocked: boolean,
    unlockLevel: number
  ): void {
    this._container.style.setProperty(
      '--cd-pct',
      `${cooldownFraction * 100}%`
    );
    this._container.classList.toggle('ability-btn--cooldown', isOnCooldown);
    this._container.classList.toggle('ability-btn--no-energy', !hasEnergy);
    this._container.classList.toggle('ability-btn--locked', isLocked);

    this._cooldownText.textContent =
      isOnCooldown && remainingCooldown > 0
        ? String(Math.ceil(remainingCooldown))
        : '';

    this._lockOverlay.textContent = isLocked ? `🔒 Уровень ${unlockLevel}` : '';
  }

  public getContainer(): HTMLElement {
    return this._container;
  }
}
