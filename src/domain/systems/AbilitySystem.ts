import type { AbilityId, AbilityResult } from '../types.js';
import type { GameState } from '../model/GameState.js';
import type { RandomSource } from '../rules/random.js';
import { pickLanes } from '../rules/random.js';
import { WORLD } from '../rules/world.js';
import { ABILITIES, ABILITY_ORDER } from '../../content/abilities.js';
import { Arrow } from '../model/Arrow.js';

type Effect = (state: GameState, random: RandomSource) => void;
export function fireVolley(state: GameState, random: RandomSource): void {
  for (const lane of pickLanes(random, state.stats['volley.lanes'], WORLD.lanes)) {
    const arrow = new Arrow(state.newId('arrow'), lane, state.stats.arrowSpeed, true);
    state.arrows.set(arrow.id, arrow);
  }
}
const EFFECTS: Record<AbilityId, Effect> = {
  freeze: (state) => {
    state.freezeActive = true;
    state.phase = 'paused';
  },
  blizzard: (state) => {
    state.blizzardTimer = state.stats['blizzard.duration'];
    for (const spider of state.spiders.values())
      spider.applySlow(1 - state.stats['blizzard.slow'], state.blizzardTimer);
  },
  prep: (state) => state.modifyEnergy(state.stats['prep.restore']),
  heal: (state) => state.modifyHp(state.stats['heal.amount']),
  volley: fireVolley,
  stand: (state) => {
    state.invulnerableTimer = state.stats['stand.duration'];
  },
  lastHope: (state) => {
    state.lastHopeTimer = state.stats['lastHope.duration'];
  },
  armageddon: (state) => {
    state.armageddonPhase = 'charging';
    state.armageddonTimer = state.stats['armageddon.charge'];
  },
  recharge: (state) => {
    for (const id of ABILITY_ORDER) if (id !== 'recharge') state.getAbility(id).start(0);
    for (const archer of state.archers) archer.start(0);
  },
};

export function activateAbility(
  state: GameState,
  id: AbilityId,
  random: RandomSource,
): AbilityResult {
  if (!Object.hasOwn(ABILITIES, id)) return 'level_locked';
  if (id === 'freeze' && state.phase === 'paused' && state.freezeActive) {
    state.freezeActive = false;
    state.phase = 'playing';
    return 'deactivated';
  }
  if (state.phase !== 'playing' || !state.isAbilityUnlocked(id)) return 'level_locked';
  const ability = state.getAbility(id);
  if (ability.isOnCooldown) return 'on_cooldown';
  const cost = state.stats[`${id}.cost`];
  if (state.energy < cost) return 'not_enough_energy';
  state.modifyEnergy(-cost);
  ability.start(state.stats[`${id}.cooldown`]);
  EFFECTS[id](state, random);
  return 'activated';
}

export function tickAbilities(state: GameState, dt: number): void {
  for (const cooldown of [...state.abilities.values(), ...state.archers]) cooldown.tick(dt);
  state.invulnerableTimer = Math.max(0, state.invulnerableTimer - dt);
  state.lastHopeTimer = Math.max(0, state.lastHopeTimer - dt);
  state.blizzardTimer = Math.max(0, state.blizzardTimer - dt);
  for (const spider of state.spiders.values()) spider.tickSlow(dt);
  if (state.armageddonPhase === 'none') return;
  state.armageddonTimer -= dt;
  if (state.armageddonPhase === 'charging' && state.armageddonTimer <= 0) {
    state.armageddonPhase = 'firing';
    state.armageddonTimer += state.stats['armageddon.duration'];
  }
  if (state.armageddonPhase === 'firing') {
    for (const spider of state.spiders.values()) spider.startDying();
    if (state.armageddonTimer <= 0) {
      state.armageddonPhase = 'none';
      state.armageddonTimer = 0;
    }
  }
}
