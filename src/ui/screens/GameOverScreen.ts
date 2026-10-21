import type { GameState } from '../../domain/model/GameState.js';
import { SPIDERS } from '../../content/spiders.js';
import { formatStat } from '../presenters.js';

export class GameOverScreen {
  private _container: HTMLElement;
  private _titleEl: HTMLElement;
  private _levelEl: HTMLElement;
  private _recordEl: HTMLElement;
  private _causeEl: HTMLElement;
  private readonly _onReturnToMenu: () => void;

  public constructor(container: HTMLElement, onReturnToMenu: () => void) {
    this._container = container;
    this._onReturnToMenu = onReturnToMenu;
    this._titleEl = document.createElement('h1');
    this._levelEl = document.createElement('p');
    this._recordEl = document.createElement('p');
    this._causeEl = document.createElement('p');
    this._build();
  }

  private _build(): void {
    this._container.className = 'game-over-screen';
    this._container.dataset.screen = 'game-over';

    this._titleEl.className = 'game-over__title';
    this._container.appendChild(this._titleEl);

    this._levelEl.className = 'game-over__level';
    this._container.appendChild(this._levelEl);

    this._causeEl.className = 'game-over__cause';
    this._container.appendChild(this._causeEl);

    this._recordEl.className = 'game-over__record';
    this._container.appendChild(this._recordEl);

    const btn = document.createElement('button');
    btn.className = 'game-over__btn';
    btn.type = 'button';
    btn.textContent = 'В меню';
    btn.dataset.action = 'menu';
    btn.addEventListener('click', () => this._onReturnToMenu());
    this._container.appendChild(btn);
  }

  public render(state: GameState): void {
    const { level, record, isVictory, fatalHit } = state;
    this._titleEl.textContent = isVictory ? 'ПОБЕДА!' : 'ПОРАЖЕНИЕ';
    this._titleEl.classList.toggle('game-over__title--victory', isVictory);
    this._titleEl.classList.toggle('game-over__title--defeat', !isVictory);

    this._levelEl.textContent = isVictory
      ? `Вы достигли уровня ${level}`
      : `Вы пали на уровне ${level}`;
    this._causeEl.textContent =
      !isVictory && fatalHit
        ? `Вас убил паук «${SPIDERS[fatalHit.spider].name}», нанеся ${formatStat('incomingDamage', fatalHit.damage)} урона.`
        : '';
    this._recordEl.textContent = `Рекорд: ${record}`;
  }

  public getContainer(): HTMLElement {
    return this._container;
  }
}
