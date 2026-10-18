import type { GameState } from '../model/GameState.js';
import type { Spider } from '../model/Spider.js';
import type { EmitEvent } from '../events.js';
import type { RandomSource } from '../rules/random.js';
import { FIRE_EXPLOSION, ICE_ARROWS, MAGIC_HIT_DAMAGE } from '../rules/stats.js';
import { WORLD } from '../rules/world.js';
import { randomInt } from '../rules/random.js';

/** A single roll: the adjacent-lane chance is part of the total proc chance. */
export function applyIceArrows(state: GameState, lane: number, random: RandomSource): void {
  const chance = state.stats['iceArrows.chance'];
  if (chance === 0) return;
  const roll = random();
  if (roll >= chance) return;
  const reach = roll < state.stats['iceArrows.adjacentChance'] ? 1 : 0;
  for (const spider of state.spiders.values()) {
    if (!spider.dying && Math.abs(spider.lane - lane) <= reach)
      spider.rootTimer = ICE_ARROWS.duration;
  }
}

export function startChainLightning(
  state: GameState,
  source: Spider,
  jumps: number,
  delay: number,
  random: RandomSource,
): void {
  if (jumps === 0) return;
  const targets = [...state.spiders.values()].filter(
    (spider) => !spider.dying && Math.abs(spider.lane - source.lane) === 1,
  );
  if (targets.length === 0) return;
  const target = targets[randomInt(random, 0, targets.length - 1)];
  state.chainLightning = [
    ...state.chainLightning,
    {
      sourceId: source.id,
      sourceLane: source.lane,
      sourceY: source.y,
      targetId: target.id,
      remaining: delay,
      jumps,
      delay,
    },
  ];
}

export function tickChainLightning(
  state: GameState,
  dt: number,
  random: RandomSource,
  emit: EmitEvent,
): void {
  const pending = state.chainLightning;
  state.chainLightning = [];
  for (const chain of pending) {
    const remaining = chain.remaining - dt;
    if (remaining > 1e-9) {
      state.chainLightning = [...state.chainLightning, { ...chain, remaining }];
      continue;
    }
    const target = state.spiders.get(chain.targetId);
    if (!target || target.dying) continue;
    const source = state.spiders.get(chain.sourceId);
    emit({
      type: 'lightning',
      from: { lane: source?.lane ?? chain.sourceLane, y: source?.y ?? chain.sourceY },
      to: { lane: target.lane, y: target.y },
    });
    target.takeHit(MAGIC_HIT_DAMAGE);
    startChainLightning(state, target, chain.jumps - 1, chain.delay, random);
  }
}

/** Only direct projectile kills may trigger an explosion; its own kills never enter this list. */
export function resolveArrowExplosions(
  state: GameState,
  arrowKills: readonly Spider[],
  random: RandomSource,
  emit: EmitEvent,
): void {
  for (const source of arrowKills) {
    if (
      source.reachedCastle ||
      state.stats['fireExplosion.chance'] === 0 ||
      state.energy <= FIRE_EXPLOSION.energyThreshold ||
      random() >= state.stats['fireExplosion.chance']
    )
      continue;
    state.modifyEnergy(-FIRE_EXPLOSION.cost);
    const radius = state.stats['fireExplosion.radius'];
    emit({
      type: 'fireExplosion',
      lane: source.lane,
      y: source.y,
      radius,
      verticalRadius: radius * FIRE_EXPLOSION.verticalReach,
    });
    for (const target of state.spiders.values()) {
      if (
        target.dying ||
        Math.hypot(
          target.lane - source.lane,
          ((target.y - source.y) * WORLD.lanes) / FIRE_EXPLOSION.verticalReach,
        ) >
          radius + 1e-9
      )
        continue;
      target.takeHit(MAGIC_HIT_DAMAGE);
    }
  }
}
