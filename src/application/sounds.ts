import type { GameEvent } from '../domain/events.js';
import type { GameState } from '../domain/model/GameState.js';
import type { AbilityId } from '../domain/types.js';
import { SoundEffect } from '../infrastructure/audio/catalog.js';

export const ABILITY_SOUNDS: Readonly<Record<AbilityId, SoundEffect>> = {
  freeze: SoundEffect.FREEZE_ACTIVATE,
  blizzard: SoundEffect.BLIZZARD_ACTIVATE,
  prep: SoundEffect.PREP_ACTIVATE,
  heal: SoundEffect.HEAL,
  volley: SoundEffect.VOLLEY_ACTIVATE,
  aimedFire: SoundEffect.AIMED_FIRE_ACTIVATE,
  stand: SoundEffect.STAND_ACTIVATE,
  lastHope: SoundEffect.LAST_HOPE_ACTIVATE,
  adrenaline: SoundEffect.ADRENALINE_ACTIVATE,
  eagleEye: SoundEffect.EAGLE_EYE_ACTIVATE,
  armageddon: SoundEffect.ARMAGEDDON_ACTIVATE,
  recharge: SoundEffect.RECHARGE_ACTIVATE,
  lightningArrows: SoundEffect.LIGHTNING_ARROWS_ACTIVATE,
  lightningShield: SoundEffect.LIGHTNING_SHIELD_ACTIVATE,
};

export function buttonSound(action?: string): SoundEffect {
  return action === 'back' ? SoundEffect.MENU_BACK : SoundEffect.MENU_SELECT;
}

export function gameOverSound(state: Pick<GameState, 'isVictory'>): SoundEffect {
  return state.isVictory ? SoundEffect.VICTORY : SoundEffect.GAME_OVER;
}

export function soundsForEvent(event: GameEvent): readonly SoundEffect[] {
  switch (event.type) {
    case 'aimedFireVolley':
      return [SoundEffect.SHOOT];
    case 'levelComplete':
      return [SoundEffect.LEVEL_COMPLETE];
    case 'spiderKilled':
      return [
        event.spiderType === 'golden' ? SoundEffect.KILL_GOLDEN_SPIDER : SoundEffect.KILL_SPIDER,
      ];
    case 'absorb':
      return [SoundEffect.ABSORB_DAMAGE];
    case 'damage': {
      const sounds: SoundEffect[] = [];
      const absorbed = event.absorbedDamage ?? 0;
      if (event.hp > 0) {
        // A hit has one damage cue: piercing, heavy, partly protected, or ordinary.
        const damage = event.piercing
          ? SoundEffect.PIERCING_DAMAGE
          : event.rawDamageMultiplier !== undefined
            ? SoundEffect.TANK_DAMAGE
            : (event.blockedDamage ?? 0) > 0 || absorbed > 0
              ? SoundEffect.PARTIAL_DEFENSE_DAMAGE
              : SoundEffect.PLAYER_TAKE_DAMAGE;
        sounds.push(damage);
      }
      if (event.blockedDamage !== undefined && !event.dodged)
        sounds.push(
          event.hp > 0 || absorbed > 0 ? SoundEffect.PARTIAL_BLOCK : SoundEffect.FULL_BLOCK,
        );
      if (event.energy > 0) sounds.push(SoundEffect.BURNER_DRAIN);
      return sounds;
    }
    default:
      return [];
  }
}
