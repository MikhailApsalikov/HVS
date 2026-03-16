export enum SoundEffect {
  GAME_OVER = 'gameOver',
  FREEZE_ACTIVATE = 'freezeActivate',
  FREEZE_DEACTIVATE = 'freezeDeactivate',
  STAND_ACTIVATE = 'standActivate',
  NOT_ENOUGH_ENERGY = 'notEnoughEnergy',
  PREP_ACTIVATE = 'prepActivate',
  ARMAGEDDON_ACTIVATE = 'armageddonActivate',
  KILL_SPIDER = 'killSpider',
  BLIZZARD_ACTIVATE = 'blizzardActivate',
  ABILITY_COOLDOWN = 'abilityCooldown',
  HEAL = 'heal',
  PLAYER_TAKE_DAMAGE = 'playerTakeDamage',
  LOW_HP_WARNING = 'lowHpWarning',
  LEVEL_COMPLETE = 'levelComplete',
  ABSORB_DAMAGE = 'absorbDamage',
  MENU_SELECT = 'menuSelect',
  SHOOT = 'shoot',
  VOLLEY_ACTIVATE = 'volleyActivate',
  BURNER_DRAIN = 'burnerDrain',
}

export enum MusicTrack {
  MAIN_MENU = 'mainMenu',
  GAMEPLAY = 'gameplay',
  TALENT_SCREEN = 'talentScreen',
}

export const SOUND_FILES: Record<SoundEffect, string> = {
  [SoundEffect.GAME_OVER]: '4.mp3',
  [SoundEffect.FREEZE_ACTIVATE]: 'Pause.wav',
  [SoundEffect.FREEZE_DEACTIVATE]: 'Unpause.wav',
  [SoundEffect.STAND_ACTIVATE]: 'Bubble.wav',
  [SoundEffect.NOT_ENOUGH_ENERGY]: 'Notenouthenergy.wav',
  [SoundEffect.PREP_ACTIVATE]: 'Enrest.wav',
  [SoundEffect.ARMAGEDDON_ACTIVATE]: '5_thisissparta.mp3',
  [SoundEffect.KILL_SPIDER]: 'KillSpider.wav',
  [SoundEffect.BLIZZARD_ACTIVATE]: 'Ice_Lance_Impact1.wav',
  [SoundEffect.ABILITY_COOLDOWN]: 'BloodElfMale_Err_AbilityCooldown01.wav',
  [SoundEffect.HEAL]: 'Renew.wav',
  [SoundEffect.PLAYER_TAKE_DAMAGE]: 'Takedmg.wav',
  [SoundEffect.LOW_HP_WARNING]: 'ShaoKahnLaugh.wav',
  [SoundEffect.LEVEL_COMPLETE]: 'LevelUp.wav',
  [SoundEffect.ABSORB_DAMAGE]: 'AbsorbGetHitA.wav',
  [SoundEffect.MENU_SELECT]: 'Select1.wav',
  [SoundEffect.SHOOT]: 'Shoot.wav',
  [SoundEffect.VOLLEY_ACTIVATE]: 'Shoot.wav',
  [SoundEffect.BURNER_DRAIN]: 'Deepfreeze.wav',
};

export const MUSIC_FILES: Record<MusicTrack, string> = {
  [MusicTrack.MAIN_MENU]: '1.mp3',
  [MusicTrack.GAMEPLAY]: '24 Jungle1.wav',
  [MusicTrack.TALENT_SCREEN]: 'WoW on Relax.mp3',
};
