import { SoundEffect, MusicTrack, SOUND_FILES, MUSIC_FILES } from '../config/audio.js';

const allAudioModules = import.meta.glob(
  ['../sprites/Звуки/**/*.{mp3,wav}', '../sprites/Музыка/**/*.{mp3,wav}'],
  { query: '?url', eager: true, import: 'default' }
) as Record<string, string>;

function resolveUrl(filename: string): string | null {
  for (const [path, url] of Object.entries(allAudioModules)) {
    if (path.endsWith('/' + filename)) return url;
  }
  return null;
}

const SFX_THROTTLE_MS = 80;

export class AudioManager {
  private readonly _sfxCache = new Map<SoundEffect, HTMLAudioElement>();
  private readonly _musicCache = new Map<MusicTrack, HTMLAudioElement>();
  private readonly _lastPlayTime = new Map<SoundEffect, number>();

  private _sfxVolume = 0.5;
  private _musicVolume = 0.3;
  private _currentMusic: MusicTrack | null = null;
  private _muted = false;

  public constructor() {
    this._preload();
  }

  private _preload(): void {
    for (const [effect, filename] of Object.entries(SOUND_FILES)) {
      const url = resolveUrl(filename);
      if (url) {
        const audio = new Audio(url);
        audio.preload = 'auto';
        this._sfxCache.set(effect as SoundEffect, audio);
      }
    }

    for (const [track, filename] of Object.entries(MUSIC_FILES)) {
      const url = resolveUrl(filename);
      if (url) {
        const audio = new Audio(url);
        audio.preload = 'auto';
        audio.loop = true;
        this._musicCache.set(track as MusicTrack, audio);
      }
    }
  }

  public playSfx(id: SoundEffect): void {
    if (this._muted) return;

    const now = performance.now();
    const last = this._lastPlayTime.get(id) ?? 0;
    if (now - last < SFX_THROTTLE_MS) return;
    this._lastPlayTime.set(id, now);

    const source = this._sfxCache.get(id);
    if (!source) return;

    const clone = source.cloneNode() as HTMLAudioElement;
    clone.volume = this._sfxVolume;
    clone.play().catch(() => {});
  }

  public playMusic(track: MusicTrack): void {
    if (this._currentMusic === track) return;

    this._stopCurrentMusic();
    this._currentMusic = track;

    const audio = this._musicCache.get(track);
    if (!audio) return;

    audio.currentTime = 0;
    audio.volume = this._muted ? 0 : this._musicVolume;
    audio.play().catch(() => {});
  }

  public stopMusic(): void {
    this._stopCurrentMusic();
    this._currentMusic = null;
  }

  public pauseMusic(): void {
    if (this._currentMusic === null) return;
    const audio = this._musicCache.get(this._currentMusic);
    audio?.pause();
  }

  public resumeMusic(): void {
    if (this._currentMusic === null) return;
    const audio = this._musicCache.get(this._currentMusic);
    if (audio) {
      audio.play().catch(() => {});
    }
  }

  public get sfxVolume(): number {
    return this._sfxVolume;
  }

  public set sfxVolume(value: number) {
    this._sfxVolume = Math.max(0, Math.min(1, value));
  }

  public get musicVolume(): number {
    return this._musicVolume;
  }

  public set musicVolume(value: number) {
    this._musicVolume = Math.max(0, Math.min(1, value));
    if (this._currentMusic !== null) {
      const audio = this._musicCache.get(this._currentMusic);
      if (audio) {
        audio.volume = this._muted ? 0 : this._musicVolume;
      }
    }
  }

  public get muted(): boolean {
    return this._muted;
  }

  public set muted(value: boolean) {
    this._muted = value;
    if (this._currentMusic !== null) {
      const audio = this._musicCache.get(this._currentMusic);
      if (audio) {
        audio.volume = value ? 0 : this._musicVolume;
      }
    }
  }

  private _stopCurrentMusic(): void {
    if (this._currentMusic === null) return;
    const audio = this._musicCache.get(this._currentMusic);
    if (audio) {
      audio.pause();
      audio.currentTime = 0;
    }
  }
}
