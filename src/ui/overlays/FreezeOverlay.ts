import type { SpriteRegistry } from '../SpriteRegistry.js';

export class FreezeOverlay {
  private _container: HTMLElement;
  private _visible: boolean = false;

  public constructor(parent: HTMLElement, spriteRegistry: SpriteRegistry) {
    this._container = this._createDOM(parent, spriteRegistry);
  }

  private _createDOM(parent: HTMLElement, spriteRegistry: SpriteRegistry): HTMLElement {
    const overlay = document.createElement('div');
    overlay.className = 'freeze-overlay';

    const snowflake = document.createElement('div');
    snowflake.className = 'freeze-overlay__snowflake';
    snowflake.innerHTML = spriteRegistry.get('Snowflake');

    const text = document.createElement('div');
    text.className = 'freeze-overlay__text';
    text.textContent = 'ЗАМОРОЗКА';

    const hint = document.createElement('div');
    hint.className = 'freeze-overlay__hint';
    hint.textContent = 'Нажмите Q чтобы продолжить';

    overlay.appendChild(snowflake);
    overlay.appendChild(text);
    overlay.appendChild(hint);
    parent.appendChild(overlay);

    return overlay;
  }

  public show(): void {
    this._container.style.display = 'flex';
    this._container.classList.add('active');
    this._visible = true;
  }

  public hide(): void {
    this._container.style.display = 'none';
    this._container.classList.remove('active');
    this._visible = false;
  }

  public isVisible(): boolean {
    return this._visible;
  }
}
