import type { Difficulty, TalentId } from '../config/types.js';
import type { GameState } from '../core/GameState.js';
import type { TalentSystem } from '../core/TalentSystem.js';
import type { ItemSystem } from '../core/ItemSystem.js';
import type { IGameEngine } from './types.js';
import type { SpriteRegistry } from './SpriteRegistry.js';
import type { SaveSystem } from '../core/SaveSystem.js';
import { MainMenuScreen } from './screens/MainMenuScreen.js';
import { GameScreen } from './screens/GameScreen.js';
import { GameOverScreen } from './screens/GameOverScreen.js';
import { LevelUpScreen } from './screens/LevelUpScreen.js';

export class App {
  private _root: HTMLElement;
  private _menuScreen: MainMenuScreen;
  private _gameScreen: GameScreen;
  private _gameOverScreen: GameOverScreen;
  private _levelUpScreen: LevelUpScreen;
  private _engine: IGameEngine | null = null;
  private _saveSystem: SaveSystem | null = null;

  public constructor(root: HTMLElement, spriteRegistry: SpriteRegistry) {
    this._root = root;

    const menuContainer = document.createElement('div');
    this._menuScreen = new MainMenuScreen(
      menuContainer,
      (d) => this.startNewGame(d),
      () => this.loadGame()
    );

    const gameContainer = document.createElement('div');
    this._gameScreen = new GameScreen(gameContainer, spriteRegistry);

    const gameOverContainer = document.createElement('div');
    this._gameOverScreen = new GameOverScreen(gameOverContainer, () =>
      this._showScreen('menu')
    );

    const levelUpContainer = document.createElement('div');
    this._levelUpScreen = new LevelUpScreen(levelUpContainer, spriteRegistry);
  }

  public setEngine(engine: IGameEngine): void {
    this._engine = engine;
  }

  public setSaveSystem(saveSystem: SaveSystem): void {
    this._saveSystem = saveSystem;
  }

  public init(): void {
    this._root.innerHTML = '';
    this._root.className = 'app';

    const screensWrapper = document.createElement('div');
    screensWrapper.className = 'app__screens';

    screensWrapper.appendChild(this._menuScreen.getContainer());
    screensWrapper.appendChild(this._gameScreen.getContainer());
    screensWrapper.appendChild(this._gameOverScreen.getContainer());

    this._root.appendChild(screensWrapper);
    this._root.appendChild(this._levelUpScreen.getContainer());

    this._menuScreen.render(this._saveSystem?.hasSave() ?? false);
    this._showScreen('menu');
  }

  private _showScreen(screen: 'menu' | 'game' | 'gameover'): void {
    const screens = this._root.querySelectorAll('[data-screen]');
    screens.forEach((el) => el.classList.remove('screen--active'));

    const screenMap = {
      menu: 'main-menu',
      game: 'game',
      gameover: 'game-over',
    };
    const target = this._root.querySelector(`[data-screen="${screenMap[screen]}"]`);
    target?.classList.add('screen--active');
  }

  public startNewGame(difficulty: Difficulty): void {
    this._engine?.startNewGame(difficulty);
    this._menuScreen.render(this._saveSystem?.hasSave() ?? false);
    this._showScreen('game');
  }

  public loadGame(): void {
    this._engine?.loadGame();
    this._menuScreen.render(this._saveSystem?.hasSave() ?? false);
    this._showScreen('game');
  }

  public showGameOver(
    level: number,
    record: number,
    isNewRecord: boolean
  ): void {
    this._gameOverScreen.render(level, record, isNewRecord);
    this._showScreen('gameover');
  }

  public showLevelUp(
    level: number,
    talentSystem: TalentSystem,
    pendingPoints: number,
    coins: number,
    itemSystem: ItemSystem,
    onConfirm: () => void,
    onTalentUpgrade?: (id: TalentId) => void,
    onBuyItem?: (itemId: string) => boolean,
    onSellItem?: (slotIndex: number) => boolean,
    isInitial?: boolean
  ): void {
    this._levelUpScreen.show(level, talentSystem, pendingPoints, coins, itemSystem, onConfirm, onTalentUpgrade, onBuyItem, onSellItem, isInitial);
  }

  public renderGameState(state: GameState): void {
    this._gameScreen.render(state);
  }

  public getMenuScreen(): MainMenuScreen {
    return this._menuScreen;
  }

  public getGameScreen(): GameScreen {
    return this._gameScreen;
  }

  public getGameOverScreen(): GameOverScreen {
    return this._gameOverScreen;
  }

  public getLevelUpScreen(): LevelUpScreen {
    return this._levelUpScreen;
  }
}
