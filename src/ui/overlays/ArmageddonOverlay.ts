export class ArmageddonOverlay {
  private _container: HTMLElement;
  private _visible: boolean = false;

  public constructor(parent: HTMLElement) {
    this._container = this._createDOM(parent);
  }

  private _createDOM(parent: HTMLElement): HTMLElement {
    const overlay = document.createElement('div');
    overlay.className = 'armageddon-overlay';

    const fire = document.createElement('div');
    fire.className = 'armageddon-overlay__fire';

    const text = document.createElement('div');
    text.className = 'armageddon-overlay__text';
    text.textContent = 'АРМАГЕДДОН';

    overlay.appendChild(fire);
    overlay.appendChild(text);
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
