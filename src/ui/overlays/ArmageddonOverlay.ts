import type { SpriteRegistry } from '../SpriteRegistry.js';

export class ArmageddonOverlay {
  private _container: HTMLElement;
  private _visible: boolean = false;

  public constructor(parent: HTMLElement, spriteRegistry: SpriteRegistry) {
    this._container = this._createDOM(parent, spriteRegistry);
  }

  private _createDOM(parent: HTMLElement, spriteRegistry: SpriteRegistry): HTMLElement {
    const overlay = document.createElement('div');
    overlay.className = 'armageddon-overlay';

    const fireSvg = spriteRegistry.get('Fire');
    if (fireSvg) {
      const encoded = 'data:image/svg+xml,' + encodeURIComponent(fireSvg);
      overlay.style.backgroundImage = `url("${encoded}")`;
      overlay.style.backgroundRepeat = 'repeat';
      overlay.style.backgroundSize = '64px 64px';
    }

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
