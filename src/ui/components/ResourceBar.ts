export class ResourceBar {
  private _container: HTMLElement;
  private _fill: HTMLElement;
  private _text: HTMLElement;

  public constructor(parent: HTMLElement, cssClass: string) {
    this._container = document.createElement('div');
    this._container.className = `resource-bar ${cssClass}`;
    this._container.dataset.component = 'resource-bar';

    this._fill = document.createElement('div');
    this._fill.className = 'resource-bar__fill';
    this._container.appendChild(this._fill);

    this._text = document.createElement('div');
    this._text.className = 'resource-bar__text';
    this._container.appendChild(this._text);

    parent.appendChild(this._container);
  }

  public update(current: number, max: number): void {
    const pct = max > 0 ? (current / max) * 100 : 0;
    this._fill.style.setProperty('--fill', `${pct}%`);
    this._text.textContent = `${current} / ${max}`;
  }

  public getContainer(): HTMLElement {
    return this._container;
  }
}
