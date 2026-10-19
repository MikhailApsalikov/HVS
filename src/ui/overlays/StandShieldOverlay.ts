import type { SpriteRegistry } from '../SpriteRegistry.js';
import { ABILITIES } from '../../content/abilities.js';
import { formatSeconds } from '../presenters.js';

export class StandShieldOverlay {
  private _container: HTMLElement;
  private _timerText: HTMLElement;
  private _visible: boolean = false;
  private readonly _absorption: boolean;

  public constructor(
    parent: HTMLElement,
    spriteRegistry: SpriteRegistry,
    ability: 'stand' | 'lastHope' | 'lightningShield' = 'stand',
  ) {
    this._container = document.createElement('div');
    this._absorption = ability === 'lightningShield';
    this._container.className = `shield-overlay ${ability === 'stand' ? 'stand-shield-overlay' : ability === 'lightningShield' ? 'lightning-shield-overlay' : 'last-hope-overlay'}`;
    this._container.setAttribute('aria-label', ABILITIES[ability].name);
    this._timerText = document.createElement('div');
    this._createDOM(parent, spriteRegistry);
  }

  private _createDOM(parent: HTMLElement, spriteRegistry: SpriteRegistry): void {
    const readout = document.createElement('div');
    readout.className = 'shield-overlay__readout';
    const shieldIcon = document.createElement('div');
    shieldIcon.className = 'shield-overlay__icon';
    shieldIcon.innerHTML = spriteRegistry.get(
      this._absorption ? 'AbilityLightningShield' : 'Shield',
    );
    readout.appendChild(shieldIcon);

    this._timerText = document.createElement('div');
    this._timerText.className = 'shield-overlay__timer';
    this._timerText.textContent = '0 с';
    readout.appendChild(this._timerText);
    this._container.appendChild(readout);
    if (this._absorption) {
      const discharges = document.createElement('div');
      discharges.className = 'lightning-shield-overlay__discharges';
      discharges.setAttribute('aria-hidden', 'true');
      for (let index = 0; index < 48; index++) {
        const arc = document.createElement('span');
        arc.className = 'lightning-shield-overlay__arc';
        arc.style.setProperty(
          '--arc-x',
          `${(((index % 12) + 0.15 + ((index * 7) % 5) * 0.14) / 12) * 100}%`,
        );
        arc.style.setProperty('--arc-y', `${8 + Math.floor(index / 12) * 21 + (index % 3) * 3}%`);
        arc.style.setProperty('--arc-delay', `${-(index * 0.17)}s`);
        arc.style.setProperty('--arc-duration', `${0.45 + (index % 5) * 0.12}s`);
        arc.style.setProperty('--arc-rotation', `${(index * 47) % 360}deg`);
        arc.innerHTML =
          '<svg viewBox="0 0 28 24" fill="none" stroke-linecap="round"><path d="M3 3L12 8L8 13L22 20M12 8L20 5L25 10" stroke="#45baff" stroke-width="3"/><path d="M3 3L12 8L8 13L22 20M12 8L20 5L25 10" stroke="#e4fcff" stroke-width="1"/></svg>';
        discharges.appendChild(arc);
      }
      this._container.appendChild(discharges);
    }

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
    this._timerText.textContent = this._absorption
      ? String(Math.ceil(remaining))
      : `${formatSeconds(remaining)} с`;
  }

  public isVisible(): boolean {
    return this._visible;
  }
}
