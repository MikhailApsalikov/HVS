import { ABILITIES } from './abilities.js';
import { DEBUFFS } from './debuffs.js';
import type { PlayerEffectId, PlayerEffectMetadata } from '../domain/model/PlayerEffect.js';

export const PLAYER_EFFECTS = {
  prep: {
    name: ABILITIES.prep.name,
    sprite: ABILITIES.prep.sprite,
    kind: 'buff',
    source: 'ability',
    removableByCleanser: true,
  },
  lastHope: {
    name: ABILITIES.lastHope.name,
    sprite: ABILITIES.lastHope.sprite,
    kind: 'buff',
    source: 'ability',
    removableByCleanser: true,
  },
  stand: {
    name: ABILITIES.stand.name,
    sprite: ABILITIES.stand.sprite,
    kind: 'buff',
    source: 'ability',
    removableByCleanser: true,
  },
  adrenaline: {
    name: ABILITIES.adrenaline.name,
    sprite: ABILITIES.adrenaline.sprite,
    kind: 'buff',
    source: 'ability',
    removableByCleanser: true,
  },
  eagleEye: {
    name: ABILITIES.eagleEye.name,
    sprite: ABILITIES.eagleEye.sprite,
    kind: 'buff',
    source: 'ability',
    removableByCleanser: true,
  },
  goldLock: {
    name: DEBUFFS.goldLock.name,
    sprite: 'DebuffGoldLock',
    kind: 'debuff',
    source: 'spider',
    removableByCleanser: false,
  },
  healingReduction: {
    name: DEBUFFS.healingReduction.name,
    sprite: 'DebuffHealingReduction',
    kind: 'debuff',
    source: 'spider',
    removableByCleanser: false,
  },
  poison: {
    name: DEBUFFS.poison.name,
    sprite: 'DebuffPoison',
    kind: 'debuff',
    source: 'spider',
    removableByCleanser: false,
  },
  antiAfk: {
    name: 'Бездействие',
    sprite: 'DebuffInactivity',
    kind: 'debuff',
    source: 'inactivity',
    removableByCleanser: false,
  },
} as const satisfies Readonly<Record<PlayerEffectId, PlayerEffectMetadata>>;
