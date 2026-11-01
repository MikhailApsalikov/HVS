import { GameApp } from './ui/GameApp.js';
import { SpriteRegistry } from './ui/SpriteRegistry.js';
import { GameEngine } from './application/GameEngine.js';
import { musicForState } from './application/music.js';
import {
  ABILITY_SOUNDS,
  buttonSound,
  gameOverSound,
  soundsForEvent,
} from './application/sounds.js';
import { AudioManager } from './infrastructure/audio/AudioManager.js';
import { SoundEffect, MusicTrack } from './infrastructure/audio/catalog.js';
import { SaveSystem, type StoragePort } from './infrastructure/storage/SaveSystem.js';
import { InputHandler } from './infrastructure/browser/InputHandler.js';
import type { AbilityId } from './domain/types.js';
import type { NewGameOptions } from './domain/GameSession.js';

export function parseNewGameOptions(search: string): NewGameOptions {
  const params = new URLSearchParams(search);
  const integer = (name: string, minimum: number): number | undefined => {
    const raw = params.get(name);
    if (raw === null || !/^\d+$/.test(raw)) return undefined;
    const value = Number(raw);
    return Number.isSafeInteger(value) && value >= minimum ? value : undefined;
  };
  return { level: integer('test', 1), coins: integer('money', 0) };
}

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
    },
    load: () => engine.loadGame(),
    hasSave: () => saves.hasSave(),
    menu: () => audio.playMusic(MusicTrack.MAIN_MENU),
    help: () => audio.playMusic(MusicTrack.HELP),
  });
  const engine = new GameEngine(
    (state) => {
      app.render(state, saves.lastError);
      const music = musicForState(state);
      if (music === null) audio.stopMusic();
      else audio.playMusic(music);
    },
    saves,
    undefined,
    parseNewGameOptions(window.location.search),
  );
  const shoot = (lane: number) => {
    const result = engine.shootLane(lane);
    if (result === 'shot') audio.playSfx(SoundEffect.SHOOT);
    else if (result === 'not_enough_energy') audio.playSfx(SoundEffect.NOT_ENOUGH_ENERGY);
  };
  const activate = (id: AbilityId) => {
    const result = engine.activateAbility(id);
    if (result === 'activated') audio.playSfx(ABILITY_SOUNDS[id]);
    else if (result === 'deactivated') audio.playSfx(SoundEffect.FREEZE_DEACTIVATE);
    else if (result === 'on_cooldown') audio.playSfx(SoundEffect.ABILITY_COOLDOWN);
    else if (result === 'not_enough_energy') audio.playSfx(SoundEffect.NOT_ENOUGH_ENERGY);
  };
  const input = new InputHandler(shoot, activate);
  const clicks = (event: Event) => {
    const target =
      event.target instanceof Element ? event.target.closest<HTMLButtonElement>('button') : null;
    if (!target || target.disabled) return;
    const clickSound = buttonSound({
      screen: target.closest<HTMLElement>('[data-screen]')?.dataset.screen,
      action: target.dataset.action,
    });
    if (clickSound !== null) audio.playSfx(clickSound);
    if (target?.dataset.lane) shoot(Number(target.dataset.lane));
    if (target?.dataset.ability) activate(target.dataset.ability as AbilityId);
  };
  root.addEventListener('click', clicks, true);
  engine.setEventCallback((event) => {
    for (const sound of soundsForEvent(event)) audio.playSfx(sound);
  });
  engine.setPhaseChangeCallback((phase, state) => {
    if (phase === 'gameOver') {
      audio.playSfx(gameOverSound(state));
      app.showGameOver(state);
    } else if (phase === 'levelUp') {
      app.showLevelUp(state, engine.getTalentSystem()!, engine.getItemSystem()!, {
        upgrade: (id) => engine.upgradeTalent(id),
        buy: (id) => engine.buyItem(id),
        sell: (index) => engine.sellItem(index),
        confirm: () => engine.confirmLevelUp(),
      });
    }
  });
  const field = app.game.getGameField();
  engine.setMagicEffectCallback((event) => field.showMagicEffect(event));
  engine.setCoinDropCallback((id, coins, jackpot) => {
    field.showCoinDrop(id, coins, jackpot);
  });
  engine.setDamagePopCallback((id, hp, energy, blockedDamage, dodged, piercing, absorbedDamage) => {
    field.showDamagePop(id, hp, energy, blockedDamage, dodged, piercing, absorbedDamage);
    const state = engine.getState();
    if (state && state.hp > 0 && state.hp / state.maxHp < 0.05)
      audio.playSfx(SoundEffect.LOW_HP_WARNING);
  });
  engine.setResourceGainCallback((id, hp, energy, reason) => {
    field.showResourceGain(id, hp, energy, reason);
  });
  const persist = () => engine.persist();
  window.addEventListener('pagehide', persist);
  return () => {
    engine.persist();
    engine.stopLoop();
    input.destroy();
    audio.stopMusic();
    root.removeEventListener('click', clicks, true);
    window.removeEventListener('pagehide', persist);
  };
}
