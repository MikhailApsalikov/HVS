import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { AudioManager } from '../src/infrastructure/audio/AudioManager.js';
import { SoundEffect } from '../src/infrastructure/audio/catalog.js';

class AudioDouble {
  static instances: AudioDouble[] = [];
  preload = '';
  loop = false;
  volume = 1;
  currentTime = 0;
  play = vi.fn(() => Promise.resolve());
  pause = vi.fn();
  constructor(readonly src: string) {
    AudioDouble.instances.push(this);
  }
  cloneNode(): AudioDouble {
    return new AudioDouble(this.src);
  }
}

beforeEach(() => {
  AudioDouble.instances = [];
  vi.stubGlobal('Audio', AudioDouble);
  vi.spyOn(performance, 'now').mockReturnValue(0);
});
afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe('selected audio assets without a browser', () => {
  it.each([
    [SoundEffect.ADRENALINE_ACTIVATE, 'bloodlust_player_cast_head.ogg'],
    [SoundEffect.EAGLE_EYE_ACTIVATE, 'InnerFireC.ogg'],
    [SoundEffect.LIGHTNING_ARROWS_ACTIVATE, 'SPELL_LightningBolt_Impact_04.ogg'],
    [SoundEffect.LIGHTNING_SHIELD_ACTIVATE, 'LightningShieldImpact.ogg'],
    [SoundEffect.AIMED_FIRE_ACTIVATE, 'BowPullback.ogg'],
    [SoundEffect.VICTORY, 'greed_main.mp3'],
    [SoundEffect.FULL_BLOCK, 'WoodenShieldBlock1.ogg'],
    [SoundEffect.PARTIAL_BLOCK, 'WoodenShieldBlock2.ogg'],
    [SoundEffect.LAST_HOPE_ACTIVATE, 'ShieldWallTarget.ogg'],
    [SoundEffect.KILL_GOLDEN_SPIDER, 'LootCoinSmall.ogg'],
    [SoundEffect.TANK_DAMAGE, 'Takedmg.mp3'],
    [SoundEffect.PIERCING_DAMAGE, 'Takedmg.mp3'],
    [SoundEffect.PARTIAL_DEFENSE_DAMAGE, 'Takedmg.mp3'],
  ] as const)('loads and plays %s using %s', (effect, filename) => {
    const audio = new AudioManager();
    const preloaded = AudioDouble.instances.length;
    audio.playSfx(effect);
    expect(AudioDouble.instances).toHaveLength(preloaded + 1);
    const played = AudioDouble.instances.at(-1)!;
    expect(played.src).toContain(filename);
    expect(played.play).toHaveBeenCalledOnce();
    expect(played.volume).toBe(0.5);
  });

  it('sounds every rapid button press while still limiting repeated combat effects', () => {
    const audio = new AudioManager();
    const preloaded = AudioDouble.instances.length;
    audio.playSfx(SoundEffect.MENU_SELECT);
    audio.playSfx(SoundEffect.MENU_SELECT);
    audio.playSfx(SoundEffect.MENU_BACK);
    audio.playSfx(SoundEffect.MENU_BACK);
    audio.playSfx(SoundEffect.SHOOT);
    audio.playSfx(SoundEffect.SHOOT);
    expect(AudioDouble.instances).toHaveLength(preloaded + 5);
  });
});
