import { SpriteRegistry } from './ui/SpriteRegistry.js';
import { App } from './ui/App.js';
import { GameEngine } from './core/GameEngine.js';
import { AudioManager } from './core/AudioManager.js';
import { InputHandler } from './input/InputHandler.js';
import { FreezeOverlay } from './ui/overlays/FreezeOverlay.js';
import { ArmageddonOverlay } from './ui/overlays/ArmageddonOverlay.js';
import { BlizzardOverlay } from './ui/overlays/BlizzardOverlay.js';
import { StandShieldOverlay } from './ui/overlays/StandShieldOverlay.js';
import { SoundEffect, MusicTrack } from './config/audio.js';
import type { AbilityId } from './config/types.js';
import type { GameState } from './core/GameState.js';

const root = document.getElementById('app');
if (!root) throw new Error('Root element #app not found');

const spriteRegistry = new SpriteRegistry();
spriteRegistry.loadAll();

const app = new App(root, spriteRegistry);
const audioManager = new AudioManager();

let freezeOverlay: FreezeOverlay | null = null;
let armageddonOverlay: ArmageddonOverlay | null = null;
let blizzardOverlay: BlizzardOverlay | null = null;
let standShieldOverlay: StandShieldOverlay | null = null;
let blizzardTotalDuration = 0;

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

  if (blizzardOverlay) {
    if (state.blizzardActive) {
      if (!blizzardOverlay.isVisible()) {
        blizzardTotalDuration = state.blizzardTimer;
      }
      blizzardOverlay.show();
      blizzardOverlay.updateTimer(state.blizzardTimer, blizzardTotalDuration);
    } else {
      blizzardOverlay.hide();
    }
  }

  if (standShieldOverlay) {
    if (state.isInvulnerable) {
      standShieldOverlay.show();
      standShieldOverlay.updateTimer(state.invulnerableTimer);
    } else {
      standShieldOverlay.hide();
    }
  }
});

const ABILITY_SOUND_MAP: Partial<Record<AbilityId, SoundEffect>> = {
  freeze: SoundEffect.FREEZE_ACTIVATE,
  blizzard: SoundEffect.BLIZZARD_ACTIVATE,
  prep: SoundEffect.PREP_ACTIVATE,
  heal: SoundEffect.HEAL,
  volley: SoundEffect.VOLLEY_ACTIVATE,
  stand: SoundEffect.STAND_ACTIVATE,
  armageddon: SoundEffect.ARMAGEDDON_ACTIVATE,
  recharge: SoundEffect.RECHARGE_ACTIVATE,
};

function handleShoot(lane: number): void {
  const result = engine.shootLane(lane);
  if (result === 'shot') {
    audioManager.playSfx(SoundEffect.SHOOT);
  } else if (result === 'not_enough_energy') {
    audioManager.playSfx(SoundEffect.NOT_ENOUGH_ENERGY);
  }
}

function handleAbilityActivation(abilityId: AbilityId): void {
  const result = engine.activateAbility(abilityId);

  switch (result) {
    case 'activated': {
      const sfx = ABILITY_SOUND_MAP[abilityId];
      if (sfx) audioManager.playSfx(sfx);
      break;
    }
    case 'deactivated':
      audioManager.playSfx(SoundEffect.FREEZE_DEACTIVATE);
      break;
    case 'on_cooldown':
      audioManager.playSfx(SoundEffect.ABILITY_COOLDOWN);
      break;
    case 'not_enough_energy':
      audioManager.playSfx(SoundEffect.NOT_ENOUGH_ENERGY);
      break;
  }
}

engine.setPhaseChangeCallback((phase, state) => {
  if (phase === 'gameOver') {
    audioManager.stopMusic();
    audioManager.playSfx(SoundEffect.GAME_OVER);

    const record = Math.max(state.record, state.level);
    const isNewRecord = state.level >= state.record;
    app.showGameOver(state.level, record, isNewRecord);
  } else if (phase === 'levelUp') {
    audioManager.playSfx(SoundEffect.LEVEL_COMPLETE);
    audioManager.playMusic(MusicTrack.TALENT_SCREEN);

    const talentSystem = engine.getTalentSystem();
    const itemSystem = engine.getItemSystem();
    const currentState = engine.getState();
    if (talentSystem && currentState && itemSystem) {
      const isInitial = engine.isInitialTalentPick;
      app.showLevelUp(
        state.level,
        talentSystem,
        state.pendingTalentPoints,
        Math.floor(currentState.coins),
        itemSystem,
        () => {
          engine.confirmLevelUp();
          app.getLevelUpScreen().hide();
          audioManager.playMusic(MusicTrack.GAMEPLAY);
        },
        () => {
          currentState.spendTalentPoint();
        },
        (itemId: string) => {
          const success = engine.buyItem(itemId);
          if (success) {
            app.getLevelUpScreen().updateCoins(Math.floor(currentState.coins));
          }
          return success;
        },
        (slotIndex: number) => {
          const success = engine.sellItem(slotIndex);
          if (success) {
            app.getLevelUpScreen().updateCoins(Math.floor(currentState.coins));
          }
          return success;
        },
        isInitial
      );
    }
  }
});

app.setEngine({
  startNewGame: (difficulty) => {
    engine.startNewGame(difficulty);
    audioManager.playMusic(MusicTrack.GAMEPLAY);
    initGame();
  },
  loadGame: () => {
    engine.loadGame();
    audioManager.playMusic(MusicTrack.GAMEPLAY);
    initGame();
  },
});
app.setSaveSystem(engine.getSaveSystem());
app.init();

audioManager.playMusic(MusicTrack.MAIN_MENU);

const inputHandler = new InputHandler(
  (lane) => handleShoot(lane),
  (abilityId) => handleAbilityActivation(abilityId)
);

function initGame(): void {
  const gameField = app.getGameScreen().getGameField();
  const gameFieldContainer = gameField.getContainer();
  if (!freezeOverlay) {
    freezeOverlay = new FreezeOverlay(gameFieldContainer, spriteRegistry);
  }
  if (!armageddonOverlay) {
    armageddonOverlay = new ArmageddonOverlay(gameFieldContainer, spriteRegistry);
  }
  if (!blizzardOverlay) {
    blizzardOverlay = new BlizzardOverlay(gameFieldContainer);
  }
  if (!standShieldOverlay) {
    standShieldOverlay = new StandShieldOverlay(gameFieldContainer, spriteRegistry);
  }

  const ts = engine.getTalentSystem();
  const is = engine.getItemSystem();
  const hud = app.getGameScreen().getHud();
  if (ts) {
    hud.setTalentSystem(ts);
  }
  if (is) {
    hud.setItemSystem(is);
  }
  gameField.setHud(hud);

  engine.setCoinDropCallback((spiderId, coins, isJackpot) => {
    gameField.showCoinDrop(spiderId, coins, isJackpot);
    audioManager.playSfx(SoundEffect.KILL_SPIDER);
  });

  engine.setDamagePopCallback((spiderId, hpDamage, energyBurn) => {
    gameField.showDamagePop(spiderId, hpDamage, energyBurn);
    audioManager.playSfx(SoundEffect.PLAYER_TAKE_DAMAGE);

    if (energyBurn > 0) {
      audioManager.playSfx(SoundEffect.BURNER_DRAIN);
    }

    const state = engine.getState();
    if (state && state.hp > 0 && state.hp / state.maxHp < 0.05) {
      audioManager.playSfx(SoundEffect.LOW_HP_WARNING);
    }
  });

  engine.setAbsorbCallback(() => {
    audioManager.playSfx(SoundEffect.ABSORB_DAMAGE);
  });
}

const archerBtnsContainer = app.getGameScreen().getGameField().getArchersRow();
archerBtnsContainer.addEventListener('click', (e: Event) => {
  const target = (e.target as HTMLElement).closest('.archer-btn');
  if (!target) return;
  const lane = parseInt((target as HTMLElement).dataset.lane ?? '', 10);
  if (!isNaN(lane)) handleShoot(lane);
});

const abilityBtnsContainer = app.getGameScreen().getHud().getAbilityButtonsContainer();
abilityBtnsContainer.addEventListener('click', (e: Event) => {
  const target = (e.target as HTMLElement).closest('.ability-btn');
  if (!target) return;
  const abilityId = (target as HTMLElement).dataset.ability;
  if (abilityId) {
    handleAbilityActivation(abilityId as AbilityId);
  }
});

const menuContainer = app.getMenuScreen().getContainer();
menuContainer.addEventListener('click', (e: Event) => {
  const target = (e.target as HTMLElement).closest('button');
  if (target) {
    audioManager.playSfx(SoundEffect.MENU_SELECT);
  }
});

const gameOverContainer = app.getGameOverScreen().getContainer();
gameOverContainer.addEventListener('click', (e: Event) => {
  const target = (e.target as HTMLElement).closest('button');
  if (target) {
    audioManager.playMusic(MusicTrack.MAIN_MENU);
  }
});

void inputHandler;
