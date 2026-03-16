import { SpriteRegistry } from './ui/SpriteRegistry.js';
import { App } from './ui/App.js';
import { GameEngine } from './core/GameEngine.js';
import { InputHandler } from './input/InputHandler.js';
import { FreezeOverlay } from './ui/overlays/FreezeOverlay.js';
import { ArmageddonOverlay } from './ui/overlays/ArmageddonOverlay.js';
import type { GameState } from './core/GameState.js';

const root = document.getElementById('app');
if (!root) throw new Error('Root element #app not found');

const spriteRegistry = new SpriteRegistry();
spriteRegistry.loadAll();

const app = new App(root, spriteRegistry);

let freezeOverlay: FreezeOverlay | null = null;
let armageddonOverlay: ArmageddonOverlay | null = null;

const engine = new GameEngine((state: GameState) => {
  app.renderGameState(state);

  if (freezeOverlay) {
    if (state.freezeActive) {
      freezeOverlay.show();
    } else {
      freezeOverlay.hide();
    }
  }

  if (armageddonOverlay) {
    if (state.armageddonPhase === 'firing') {
      armageddonOverlay.show();
    } else {
      armageddonOverlay.hide();
    }
  }
});

engine.setPhaseChangeCallback((phase, state) => {
  if (phase === 'gameOver') {
    const record = Math.max(state.record, state.level);
    const isNewRecord = state.level >= state.record;
    app.showGameOver(state.level, record, isNewRecord);
  } else if (phase === 'levelUp') {
    const talentSystem = engine.getTalentSystem();
    const currentState = engine.getState();
    if (talentSystem && currentState) {
      app.showLevelUp(
        state.level,
        talentSystem,
        state.pendingTalentPoints,
        () => {
          engine.confirmLevelUp();
          app.getLevelUpScreen().hide();
        },
        () => {
          currentState.spendTalentPoint();
        }
      );
    }
  }
});

app.setEngine({
  startNewGame: (difficulty) => {
    engine.startNewGame(difficulty);
    initOverlays();
  },
  loadGame: () => {
    engine.loadGame();
    initOverlays();
  },
});
app.setSaveSystem(engine.getSaveSystem());
app.init();

const inputHandler = new InputHandler(
  (lane) => engine.shootLane(lane),
  (abilityId) => engine.activateAbility(abilityId)
);

function initOverlays(): void {
  const gameFieldContainer = app.getGameScreen().getGameField().getContainer();
  if (!freezeOverlay) {
    freezeOverlay = new FreezeOverlay(gameFieldContainer, spriteRegistry);
  }
  if (!armageddonOverlay) {
    armageddonOverlay = new ArmageddonOverlay(gameFieldContainer);
  }
}

const archerBtnsContainer = app.getGameScreen().getHud().getArcherButtonsContainer();
archerBtnsContainer.addEventListener('click', (e: Event) => {
  const target = (e.target as HTMLElement).closest('.archer-btn');
  if (!target) return;
  const lane = parseInt((target as HTMLElement).dataset.lane ?? '', 10);
  if (!isNaN(lane)) engine.shootLane(lane);
});

const abilityBtnsContainer = app.getGameScreen().getHud().getAbilityButtonsContainer();
abilityBtnsContainer.addEventListener('click', (e: Event) => {
  const target = (e.target as HTMLElement).closest('.ability-btn');
  if (!target) return;
  const abilityId = (target as HTMLElement).dataset.ability;
  if (abilityId) {
    engine.activateAbility(abilityId as Parameters<typeof engine.activateAbility>[0]);
  }
});

void inputHandler;
