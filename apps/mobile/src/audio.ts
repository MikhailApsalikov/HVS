import Sound from 'react-native-sound';
import { Image } from 'react-native';
import {
  SOUND_FILES,
  MUSIC_FILES,
  SoundEffect,
  MusicTrack,
  type MobileFeedback,
  type AbilityId,
} from '@hvs/game';
import { AUDIO } from './generated/resources';

const abilitySounds: Record<AbilityId, SoundEffect> = {
  freeze: SoundEffect.FREEZE_ACTIVATE,
  blizzard: SoundEffect.BLIZZARD_ACTIVATE,
  prep: SoundEffect.PREP_ACTIVATE,
  heal: SoundEffect.HEAL,
  volley: SoundEffect.VOLLEY_ACTIVATE,
  stand: SoundEffect.STAND_ACTIVATE,
  armageddon: SoundEffect.ARMAGEDDON_ACTIVATE,
  recharge: SoundEffect.RECHARGE_ACTIVATE,
  lastHope: SoundEffect.ABSORB_DAMAGE,
  adrenaline: SoundEffect.PREP_ACTIVATE,
  eagleEye: SoundEffect.PREP_ACTIVATE,
  aimedFire: SoundEffect.VOLLEY_ACTIVATE,
};
export class MobileAudio {
  private readonly sounds = new Map<string, Sound>();
  private readonly loading = new Set<string>();
  private readonly lastPlayed = new Map<string, number>();
  private music: Sound | null = null;
  private track: MusicTrack | null = null;
  private generation = 0;
  effectsEnabled = true;
  musicEnabled = true;
  active = true;
  effect(id: SoundEffect): void {
    if (!this.effectsEnabled || !this.active) return;
    const file = SOUND_FILES[id];
    if (this.loading.has(file)) return;
    const now = Date.now();
    if (now - (this.lastPlayed.get(file) ?? 0) < 100) return;
    this.lastPlayed.set(file, now);
    const cached = this.sounds.get(file);
    if (cached) {
      cached.stop(() => {
        if (this.active && this.effectsEnabled) cached.play();
      });
      return;
    }
    const uri = Image.resolveAssetSource(AUDIO[file])?.uri;
    if (!uri) return;
    this.loading.add(file);
    const sound = new Sound(uri, '', (error) => {
      this.loading.delete(file);
      if (error) {
        sound.release();
        return;
      }
      this.sounds.set(file, sound);
      sound.setVolume(0.5);
      if (this.active && this.effectsEnabled) sound.play();
    });
  }
  playMusic(track: MusicTrack): void {
    if (this.track === track && this.music) {
      if (this.active && this.musicEnabled) this.music.play();
      return;
    }
    this.stopMusic();
    const uri = Image.resolveAssetSource(AUDIO[MUSIC_FILES[track]])?.uri;
    if (!uri) return;
    this.track = track;
    const generation = this.generation;
    const sound = new Sound(uri, '', (error) => {
      if (error || generation !== this.generation) {
        sound.release();
        return;
      }
      this.music = sound;
      sound.setNumberOfLoops(-1);
      sound.setVolume(0.25);
      if (this.active && this.musicEnabled) sound.play();
    });
  }
  stopMusic(): void {
    this.generation++;
    this.music?.stop();
    this.music?.release();
    this.music = null;
    this.track = null;
  }
  pause(): void {
    this.active = false;
    this.music?.pause();
    for (const sound of this.sounds.values()) sound.stop();
  }
  resume(): void {
    this.active = true;
    if (this.musicEnabled) this.music?.play();
  }
  configure(effects: boolean, music: boolean): void {
    this.effectsEnabled = effects;
    this.musicEnabled = music;
    if (!music) this.music?.pause();
    else if (this.active) this.music?.play();
  }
  feedback(event: MobileFeedback): void {
    if (event.type === 'shoot')
      this.effect(event.result === 'shot' ? SoundEffect.SHOOT : SoundEffect.NOT_ENOUGH_ENERGY);
    else if (event.type === 'ability') {
      if (event.result === 'activated') this.effect(abilitySounds[event.id]);
      else if (event.result === 'deactivated') this.effect(SoundEffect.FREEZE_DEACTIVATE);
      else if (event.result === 'on_cooldown') this.effect(SoundEffect.ABILITY_COOLDOWN);
      else if (event.result === 'not_enough_energy') this.effect(SoundEffect.NOT_ENOUGH_ENERGY);
    } else if (event.type === 'coinDrop') this.effect(SoundEffect.KILL_SPIDER);
    else if (event.type === 'damage')
      this.effect(event.hp > 0 ? SoundEffect.PLAYER_TAKE_DAMAGE : SoundEffect.ABSORB_DAMAGE);
    else if (event.type === 'absorb') this.effect(SoundEffect.ABSORB_DAMAGE);
    else if (event.type === 'phase') {
      if (event.phase === 'gameOver') {
        this.stopMusic();
        this.effect(SoundEffect.GAME_OVER);
      } else if (event.phase === 'levelUp') this.playMusic(MusicTrack.TALENT_SCREEN);
      else if (event.phase === 'playing') this.playMusic(MusicTrack.GAMEPLAY);
    }
  }
}
