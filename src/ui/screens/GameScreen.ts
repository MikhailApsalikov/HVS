import type { GameState } from '../../core/GameState.js';
import type { SpriteRegistry } from '../SpriteRegistry.js';
import { GameField } from '../components/GameField.js';
import { HUD } from '../components/HUD.js';

export class GameScreen {
  private _container: HTMLElement;
  private _gameField: GameField;
  private _hud: HUD;

  public constructor(container: HTMLElement, spriteRegistry: SpriteRegistry) {
    this._container = container;
    this._gameField = new GameField(
      this._createGameFieldContainer(),
      spriteRegistry
    );
    this._hud = new HUD(this._createHudContainer(), spriteRegistry);
    this._build();
  }

  private _createGameFieldContainer(): HTMLElement {
    const el = document.createElement('div');
    el.id = 'game-field';
    el.className = 'game-field-wrapper';
    return el;
  }

  private _createHudContainer(): HTMLElement {
    const el = document.createElement('div');
    el.id = 'hud';
    el.className = 'hud-wrapper';
    return el;
  }

  private _build(): void {
    this._container.className = 'game-screen';
    this._container.dataset.screen = 'game';

    const gameFieldWrapper = this._gameField.getContainer();
    this._container.appendChild(gameFieldWrapper);

    const hudWrapper = this._hud.getContainer();
    this._container.appendChild(hudWrapper);
  }

  public render(state: GameState): void {
    this._gameField.render(state);
    this._hud.render(state);
  }

  public getContainer(): HTMLElement {
    return this._container;
  }

  public getGameField(): GameField {
    return this._gameField;
  }

  public getHud(): HUD {
    return this._hud;
  }
}
