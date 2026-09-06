import type { SpriteRegistry } from '../SpriteRegistry.js';
import { ABILITIES } from '../../content/abilities.js';
import { formatSeconds } from '../presenters.js';

export class StandShieldOverlay {
  private _container: HTMLElement;
  private _timerText: HTMLElement;
  private _visible: boolean = false;

  public constructor(
    parent: HTMLElement,
    spriteRegistry: SpriteRegistry,
    ability: 'stand' | 'lastHope' = 'stand',
  ) {
    this._container = document.createElement('div');
    this._container.className = `shield-overlay ${ability === 'stand' ? 'stand-shield-overlay' : 'last-hope-overlay'}`;
    this._container.setAttribute('aria-label', ABILITIES[ability].name);
    this._timerText = document.createElement('div');
    this._createDOM(parent, spriteRegistry, ability);
  }

  private _createDOM(
    parent: HTMLElement,
    spriteRegistry: SpriteRegistry,
    ability: 'stand' | 'lastHope',
  ): void {
    const shieldIcon = document.createElement('div');
    shieldIcon.className = 'shield-overlay__icon';
    shieldIcon.innerHTML = spriteRegistry.get('Shield');
    this._container.appendChild(shieldIcon);

    const label = document.createElement('div');
    label.className = 'shield-overlay__label';
    label.textContent = ABILITIES[ability].name;
    this._container.appendChild(label);

    this._timerText = document.createElement('div');
    this._timerText.className = 'shield-overlay__timer';
    this._timerText.textContent = '0 с';
    this._container.appendChild(this._timerText);

    parent.appendChild(this._container);
  }

  public show(): void {
    if (this._visible) return;
    this._container.classList.add('active');
    this._visible = true;
  }

  public hide(): void {
    if (!this._visible) return;
    this._container.classList.remove('active');
    this._visible = false;
  }

  public updateTimer(remaining: number): void {
    this._timerText.textContent = `${formatSeconds(remaining)} с`;
  }

  public isVisible(): boolean {
    return this._visible;
  }
}
