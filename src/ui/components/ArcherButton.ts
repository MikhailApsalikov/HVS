export class ArcherButton {
  private _container: HTMLElement;
  private _lane: number;

  public constructor(
    parent: HTMLElement,
    lane: number,
    onClick: (lane: number) => void
  ) {
    this._lane = lane;
    this._container = document.createElement('div');
    this._container.className = 'archer-btn';
    this._container.dataset.lane = String(lane);
    this._container.dataset.component = 'archer-btn';

    const numberSpan = document.createElement('span');
    numberSpan.className = 'archer-btn__number';
    numberSpan.textContent = String(lane + 1);
    this._container.appendChild(numberSpan);

    const cooldownBar = document.createElement('div');
    cooldownBar.className = 'archer-btn__cooldown-bar';
    this._container.appendChild(cooldownBar);

    this._container.addEventListener('click', () => {
      onClick(this._lane);
    });

    parent.appendChild(this._container);
  }

  public update(
    isReady: boolean,
    cooldownFraction: number,
    hasEnergy: boolean
  ): void {
    this._container.style.setProperty(
      '--cd-pct',
      `${cooldownFraction * 100}%`
    );
    this._container.classList.toggle('archer-btn--cooldown', !isReady);
    this._container.classList.toggle('archer-btn--no-energy', !hasEnergy);
  }

  public getContainer(): HTMLElement {
    return this._container;
  }
}
