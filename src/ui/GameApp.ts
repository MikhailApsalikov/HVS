import type { Difficulty } from '../domain/types.js';
import type { GameState } from '../domain/model/GameState.js';
import type { TalentSystem } from '../domain/model/TalentSystem.js';
import type { ItemSystem } from '../domain/model/ItemSystem.js';
import type { SpriteRegistry } from './SpriteRegistry.js';
import { MainMenuScreen } from './screens/MainMenuScreen.js';
import { GameScreen } from './screens/GameScreen.js';
import { GameOverScreen } from './screens/GameOverScreen.js';
import { LevelUpScreen, type LevelUpActions } from './screens/ProgressionScreen.js';
import { FreezeOverlay } from './overlays/FreezeOverlay.js';
import { ArmageddonOverlay } from './overlays/ArmageddonOverlay.js';
import { BlizzardOverlay } from './overlays/BlizzardOverlay.js';
import { StandShieldOverlay } from './overlays/StandShieldOverlay.js';

export interface MenuActions {
  start(difficulty: Difficulty): void;
  load(): boolean;
  hasSave(): boolean;
  menu(): void;
}

export class GameApp {
  readonly game: GameScreen;
  private readonly menu: MainMenuScreen;
  private readonly over: GameOverScreen;
  private readonly progression: LevelUpScreen;
  private readonly freeze: FreezeOverlay;
  private readonly armageddon: ArmageddonOverlay;
  private readonly blizzard: BlizzardOverlay;
  private readonly shield: StandShieldOverlay;
  private readonly saveStatus = document.createElement('div');

  constructor(
    private readonly root: HTMLElement,
    sprites: SpriteRegistry,
    private readonly actions: MenuActions,
  ) {
    this.menu = new MainMenuScreen(
      document.createElement('div'),
      (difficulty) => {
        this.game.getGameField().reset();
        actions.start(difficulty);
        this.show('game');
      },
      () => {
        if (actions.load()) {
          this.game.getGameField().reset();
          this.show('game');
        }
      },
    );
    this.game = new GameScreen(document.createElement('div'), sprites);
    this.over = new GameOverScreen(document.createElement('div'), () => {
      actions.menu();
      this.showMenu();
    });
    this.progression = new LevelUpScreen(document.createElement('div'), sprites);
    const field = this.game.getGameField();
    field.setHud(this.game.getHud());
    this.freeze = new FreezeOverlay(field.getContainer(), sprites);
    this.armageddon = new ArmageddonOverlay(field.getContainer(), sprites);
    this.blizzard = new BlizzardOverlay(field.getContainer());
    this.shield = new StandShieldOverlay(field.getContainer(), sprites);
    const wrapper = document.createElement('div');
    wrapper.className = 'app__screens';
    wrapper.append(this.menu.getContainer(), this.game.getContainer(), this.over.getContainer());
    this.saveStatus.className = 'save-status';
    this.saveStatus.setAttribute('role', 'status');
    root.className = 'app';
    root.replaceChildren(wrapper, this.progression.getContainer(), this.saveStatus);
    this.showMenu();
  }
  private show(screen: string): void {
    for (const element of this.root.querySelectorAll<HTMLElement>('[data-screen]'))
      element.classList.toggle('screen--active', element.dataset.screen === screen);
  }
  showMenu(): void {
    this.menu.render(this.actions.hasSave());
    this.progression.hide();
    this.show('main-menu');
  }
  showLevelUp(
    state: GameState,
    talents: TalentSystem,
    items: ItemSystem,
    actions: LevelUpActions,
  ): void {
    this.progression.show(state, talents, items, actions);
  }
  showGameOver(state: GameState): void {
    this.progression.hide();
    this.over.render(state.level, state.record, state.level >= state.record);
    this.show('game-over');
  }
  render(state: GameState, saveError: string | null): void {
    this.game.render(state);
    this.saveStatus.textContent = saveError ?? '';
    this.saveStatus.hidden = !saveError;
    if (state.freezeActive) this.freeze.show();
    else this.freeze.hide();
    if (state.armageddonPhase === 'firing') this.armageddon.show();
    else this.armageddon.hide();
    if (state.blizzardActive) {
      this.blizzard.show();
      this.blizzard.updateTimer(state.blizzardTimer, state.stats['blizzard.duration']);
    } else this.blizzard.hide();
    if (state.isInvulnerable) {
      this.shield.show();
      this.shield.updateTimer(state.invulnerableTimer);
    } else this.shield.hide();
  }
}
