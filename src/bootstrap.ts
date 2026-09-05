import { GameApp } from './ui/GameApp.js';
import { SpriteRegistry } from './ui/SpriteRegistry.js';
import { GameEngine } from './application/GameEngine.js';
import { AudioManager } from './infrastructure/audio/AudioManager.js';
import { SoundEffect, MusicTrack } from './infrastructure/audio/catalog.js';
import { SaveSystem, type StoragePort } from './infrastructure/storage/SaveSystem.js';
import { InputHandler } from './infrastructure/browser/InputHandler.js';
import type { AbilityId } from './domain/types.js';

/** Composition root: the only place wiring browser services to the game. */
export function bootstrap(root: HTMLElement): () => void {
  const sprites = new SpriteRegistry();
  sprites.loadAll();
  const audio = new AudioManager();
  const storage: StoragePort = {
    getItem: (key) => window.localStorage.getItem(key),
    setItem: (key, value) => window.localStorage.setItem(key, value),
    removeItem: (key) => window.localStorage.removeItem(key),
  };
  const saves = new SaveSystem(storage);
  const app = new GameApp(root, sprites, {
    start: (difficulty) => {
      engine.startNewGame(difficulty);
      audio.playSfx(SoundEffect.MENU_SELECT);
    },
    load: () => engine.loadGame(),
    hasSave: () => saves.hasSave(),
    menu: () => audio.playMusic(MusicTrack.MAIN_MENU),
  });
  const engine = new GameEngine((state) => app.render(state, saves.lastError), saves);
  const sounds: Record<AbilityId, SoundEffect> = {
    freeze: SoundEffect.FREEZE_ACTIVATE,
    blizzard: SoundEffect.BLIZZARD_ACTIVATE,
    prep: SoundEffect.PREP_ACTIVATE,
    heal: SoundEffect.HEAL,
    volley: SoundEffect.VOLLEY_ACTIVATE,
    stand: SoundEffect.STAND_ACTIVATE,
    armageddon: SoundEffect.ARMAGEDDON_ACTIVATE,
    recharge: SoundEffect.RECHARGE_ACTIVATE,
  };
  const shoot = (lane: number) => {
    const result = engine.shootLane(lane);
    if (result === 'shot') audio.playSfx(SoundEffect.SHOOT);
    else if (result === 'not_enough_energy') audio.playSfx(SoundEffect.NOT_ENOUGH_ENERGY);
  };
  const activate = (id: AbilityId) => {
    const result = engine.activateAbility(id);
    if (result === 'activated') audio.playSfx(sounds[id]);
    else if (result === 'deactivated') audio.playSfx(SoundEffect.FREEZE_DEACTIVATE);
    else if (result === 'on_cooldown') audio.playSfx(SoundEffect.ABILITY_COOLDOWN);
    else if (result === 'not_enough_energy') audio.playSfx(SoundEffect.NOT_ENOUGH_ENERGY);
  };
  const input = new InputHandler(shoot, activate);
  const clicks = (event: Event) => {
    const target =
      event.target instanceof Element ? event.target.closest<HTMLElement>('button') : null;
    if (target?.dataset.lane) shoot(Number(target.dataset.lane));
    if (target?.dataset.ability) activate(target.dataset.ability as AbilityId);
  };
  root.addEventListener('click', clicks);
  engine.setPhaseChangeCallback((phase, state) => {
    if (phase === 'gameOver') {
      audio.stopMusic();
      audio.playSfx(SoundEffect.GAME_OVER);
      app.showGameOver(state);
    } else if (phase === 'levelUp') {
      audio.playSfx(SoundEffect.LEVEL_COMPLETE);
      audio.playMusic(MusicTrack.TALENT_SCREEN);
      app.showLevelUp(state, engine.getTalentSystem()!, engine.getItemSystem()!, {
        upgrade: (id) => engine.upgradeTalent(id),
        buy: (id) => engine.buyItem(id),
        sell: (index) => engine.sellItem(index),
        confirm: () => engine.confirmLevelUp(),
      });
    } else if (phase === 'playing') audio.playMusic(MusicTrack.GAMEPLAY);
  });
  const field = app.game.getGameField();
  engine.setCoinDropCallback((id, coins, jackpot) => {
    field.showCoinDrop(id, coins, jackpot);
    audio.playSfx(SoundEffect.KILL_SPIDER);
  });
  engine.setDamagePopCallback((id, hp, energy) => {
    field.showDamagePop(id, hp, energy);
    audio.playSfx(SoundEffect.PLAYER_TAKE_DAMAGE);
    if (energy > 0) audio.playSfx(SoundEffect.BURNER_DRAIN);
    const state = engine.getState();
    if (state && state.hp > 0 && state.hp / state.maxHp < 0.05)
      audio.playSfx(SoundEffect.LOW_HP_WARNING);
  });
  engine.setAbsorbCallback(() => audio.playSfx(SoundEffect.ABSORB_DAMAGE));
  const persist = () => engine.persist();
  window.addEventListener('pagehide', persist);
  audio.playMusic(MusicTrack.MAIN_MENU);
  return () => {
    engine.persist();
    engine.stopLoop();
    input.destroy();
    audio.stopMusic();
    root.removeEventListener('click', clicks);
    window.removeEventListener('pagehide', persist);
  };
}
