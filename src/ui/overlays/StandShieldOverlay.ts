import type { SpriteRegistry } from '../SpriteRegistry.js';

export class StandShieldOverlay {
  private _container: HTMLElement;
  private _timerText: HTMLElement;
  private _visible: boolean = false;

  public constructor(parent: HTMLElement, spriteRegistry: SpriteRegistry) {
    this._container = document.createElement('div');
    this._container.className = 'stand-shield-overlay';
    this._timerText = document.createElement('div');
    this._createDOM(parent, spriteRegistry);
  }

  private _createDOM(parent: HTMLElement, spriteRegistry: SpriteRegistry): void {
    const shieldIcon = document.createElement('div');
    shieldIcon.className = 'stand-shield-overlay__icon';
    shieldIcon.innerHTML = spriteRegistry.get('Shield');
    this._container.appendChild(shieldIcon);

    this._timerText = document.createElement('div');
    this._timerText.className = 'stand-shield-overlay__timer';
    this._timerText.textContent = '0.0';
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
    this._timerText.textContent = remaining.toFixed(1);
  }

  public isVisible(): boolean {
    return this._visible;
  }
}
