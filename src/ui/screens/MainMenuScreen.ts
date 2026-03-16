import type { Difficulty } from '../../config/types.js';

export class MainMenuScreen {
  private _container: HTMLElement;
  private _loadButton: HTMLButtonElement;
  private readonly _onStartGame: (difficulty: Difficulty) => void;
  private readonly _onLoadGame: () => void;

  public constructor(
    container: HTMLElement,
    onStartGame: (difficulty: Difficulty) => void,
    onLoadGame: () => void
  ) {
    this._container = container;
    this._onStartGame = onStartGame;
    this._onLoadGame = onLoadGame;
    this._loadButton = document.createElement('button') as HTMLButtonElement;
    this._build();
  }

  private _build(): void {
    this._container.className = 'main-menu-screen';
    this._container.dataset.screen = 'main-menu';

    const title = document.createElement('h1');
    title.className = 'main-menu__title';
    title.textContent = 'HUNTERS VERSUS SPIDERS';
    this._container.appendChild(title);

    const subtitle = document.createElement('p');
    subtitle.className = 'main-menu__subtitle';
    subtitle.textContent = 'Hunters Versus Spiders';
    this._container.appendChild(subtitle);

    const buttons = document.createElement('div');
    buttons.className = 'main-menu__buttons';

    this._loadButton.className = 'main-menu__btn main-menu__btn--load';
    this._loadButton.textContent = 'Загрузить игру';
    this._loadButton.dataset.action = 'load';
    this._loadButton.addEventListener('click', () => this._onLoadGame());
    buttons.appendChild(this._loadButton);

    const difficulties: { key: Difficulty; label: string }[] = [
      { key: 'easy', label: 'Лёгкий' },
      { key: 'normal', label: 'Средний' },
      { key: 'hard', label: 'Сложный' },
    ];

    for (const { key, label } of difficulties) {
      const btn = document.createElement('button');
      btn.className = 'main-menu__btn main-menu__btn--difficulty';
      btn.type = 'button';
      btn.textContent = label;
      btn.dataset.difficulty = key;
      btn.dataset.action = 'start';
      btn.addEventListener('click', () => this._onStartGame(key));
      buttons.appendChild(btn);
    }

    this._container.appendChild(buttons);
  }

  public render(hasSave: boolean): void {
    this._loadButton.classList.toggle('main-menu__btn--hidden', !hasSave);
    this._loadButton.hidden = !hasSave;
  }

  public getContainer(): HTMLElement {
    return this._container;
  }
}
