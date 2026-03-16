export class BlizzardOverlay {
  private _container: HTMLElement;
  private _visible: boolean = false;
  private _timerBar: HTMLElement;

  public constructor(parent: HTMLElement) {
    this._container = document.createElement('div');
    this._container.className = 'blizzard-overlay';
    this._timerBar = document.createElement('div');

    this._createDOM(parent);
  }

  private _createDOM(parent: HTMLElement): void {
    const windLayer = document.createElement('div');
    windLayer.className = 'blizzard-overlay__wind';
    this._container.appendChild(windLayer);

    for (let i = 0; i < 30; i++) {
      const flake = document.createElement('div');
      flake.className = 'blizzard-overlay__flake';
      flake.style.left = `${Math.random() * 100}%`;
      flake.style.animationDelay = `${Math.random() * 2}s`;
      flake.style.animationDuration = `${1.2 + Math.random() * 1.5}s`;
      const size = 3 + Math.random() * 5;
      flake.style.width = `${size}px`;
      flake.style.height = `${size}px`;
      flake.style.opacity = `${0.4 + Math.random() * 0.6}`;
      this._container.appendChild(flake);
    }

    const label = document.createElement('div');
    label.className = 'blizzard-overlay__label';
    label.textContent = 'ВЬЮГА';
    this._container.appendChild(label);

    this._timerBar = document.createElement('div');
    this._timerBar.className = 'blizzard-overlay__timer';
    const timerFill = document.createElement('div');
    timerFill.className = 'blizzard-overlay__timer-fill';
    this._timerBar.appendChild(timerFill);
    this._container.appendChild(this._timerBar);

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

  public updateTimer(remaining: number, total: number): void {
    const fill = this._timerBar.firstElementChild as HTMLElement | null;
    if (fill) {
      const pct = total > 0 ? (remaining / total) * 100 : 0;
      fill.style.width = `${pct}%`;
    }
  }

  public isVisible(): boolean {
    return this._visible;
  }
}
