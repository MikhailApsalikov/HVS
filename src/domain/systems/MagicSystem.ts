import type { GameState } from '../model/GameState.js';
import type { Spider } from '../model/Spider.js';
import type { EmitEvent } from '../events.js';
import type { RandomSource } from '../rules/random.js';
import { FIRE_EXPLOSION, ICE_ARROWS, MAGIC_HIT_DAMAGE } from '../rules/stats.js';
import { WORLD } from '../rules/world.js';
import { randomInt } from '../rules/random.js';

function lightningTarget(
  state: GameState,
  lane: number,
  sourceId: string | null,
  random: RandomSource,
): Spider | undefined {
  const live = [...state.spiders.values()].filter(
    (spider) => !spider.dying && !spider.reachedCastle && spider.id !== sourceId,
  );
  let targets = live.filter((spider) => Math.abs(spider.lane - lane) === 1);
  if (targets.length === 0 && state.stats['lightningArrows.sameLane'] > 0)
    targets = live.filter((spider) => spider.lane === lane);
  return targets.length > 0 ? targets[randomInt(random, 0, targets.length - 1)] : undefined;
}

/** Absorption runs only on damage left after avoidance, armor and block. */
export function absorbLightningShield(
  state: GameState,
  damage: number,
  lane: number | null,
  random: RandomSource,
  emit: EmitEvent,
): number {
  if (damage <= 0 || state.lightningShieldTimer === 0 || state.lightningShieldAbsorption === 0)
    return 0;
  const absorbed = Math.min(damage, state.lightningShieldAbsorption);
  state.lightningShieldAbsorption -= absorbed;
  if (state.lightningShieldAbsorption === 0) state.lightningShieldTimer = 0;
  if (state.talentAbilities.has('lightningArrows') && state.lightningShieldProcCooldown === 0) {
    const targets =
      lane === null
        ? [...state.spiders.values()].filter((spider) => !spider.dying && !spider.reachedCastle)
        : [];
    const target =
      lane === null
        ? targets.length > 0
          ? targets[randomInt(random, 0, targets.length - 1)]
          : undefined
        : lightningTarget(state, lane, null, random);
    if (target) {
      emit({
        type: 'lightning',
        from: { lane: lane ?? target.lane, y: 1 },
        to: { lane: target.lane, y: target.y },
      });
      target.takeHit(MAGIC_HIT_DAMAGE);
      startChainLightning(
        state,
        target,
        state.stats['lightningArrows.jumps'] - 1,
        state.stats['lightningArrows.delay'],
        random,
      );
      state.lightningShieldProcCooldown = state.stats['lightningShield.procCooldown'];
    }
  }
  return absorbed;
}

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
  const target = lightningTarget(state, source.lane, source.id, random);
  if (!target) return;
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
        (target.lane !== source.lane && state.fireExplosionRank < FIRE_EXPLOSION.adjacentRank) ||
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
