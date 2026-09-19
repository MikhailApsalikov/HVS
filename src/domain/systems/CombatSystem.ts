import type { GameState } from '../model/GameState.js';
import type { EmitEvent } from '../events.js';
import type { RandomSource } from '../rules/random.js';
import type { SpiderType } from '../types.js';
import { randomInt } from '../rules/random.js';
import { WORLD } from '../rules/world.js';
import { BEST_DEFENSE_COOLDOWN } from '../rules/stats.js';
import { SPIDERS, SPECIAL_SPIDER_ORDER } from '../../content/spiders.js';
import { Spider } from '../model/Spider.js';
import { fireVolley } from './AbilitySystem.js';

export function spawnSpiders(state: GameState, dt: number, random: RandomSource): void {
  state.spawnAccumulator += dt;
  const interval = state.stats.spawnInterval;
  while (state.spawnAccumulator + Number.EPSILON >= interval) {
    state.spawnAccumulator = Math.max(0, state.spawnAccumulator - interval);
    for (let lane = 0; lane < WORLD.lanes; lane++) {
      if (random() >= state.rules.spawnProbability(state.level)) continue;
      let type: SpiderType = 'normal';
      for (const candidate of SPECIAL_SPIDER_ORDER) {
        if (state.level < SPIDERS[candidate].unlockLevel) continue;
        if (random() < state.rules.spiderTypeProbability(candidate, state.level)) {
          type = candidate;
          break;
        }
      }
      const stats = state.rules.spiderStats(type, state.level, random(), random());
      const jump = WORLD.ninjaJumpMin + random() * (WORLD.ninjaJumpMax - WORLD.ninjaJumpMin);
      const spider = new Spider(
        state.newId('spider'),
        type,
        lane,
        stats.speed,
        stats.damage,
        SPIDERS[type].hits,
        jump,
        state.rules.spiderJumpLimit(type, state.level),
      );
      state.spiders.set(spider.id, spider);
    }
  }
}

export function moveSpiders(state: GameState, dt: number, random: RandomSource): void {
  for (const spider of state.spiders.values()) {
    if (spider.dying) continue;
    while (
      SPIDERS[spider.type].jumpLevelStep &&
      spider.jumpsMade < spider.jumpLimit &&
      spider.y >= spider.nextJumpThreshold
    ) {
      spider.lane +=
        spider.lane === 0 ? 1 : spider.lane === WORLD.lanes - 1 ? -1 : random() < 0.5 ? -1 : 1;
      spider.jumpsMade += 1;
    }
    spider.move(dt, state.stats.permafrostSlow);
  }
}

/** Swept collision catches fast arrows crossing a spider between two frames. */
export function tickArrows(state: GameState, dt: number): void {
  for (const [id, arrow] of state.arrows) {
    arrow.move(dt);
    const collisions: { spider: Spider; time: number }[] = [];
    for (const spider of state.spiders.values()) {
      if (spider.dying || spider.lane !== arrow.lane) continue;
      const before = arrow.previousY - spider.previousY;
      const after = arrow.y - spider.y;
      if (before < -WORLD.hitRadius || after > WORLD.hitRadius) continue;
      const time = Math.max(
        0,
        (before - WORLD.hitRadius) / Math.max(Number.EPSILON, before - after),
      );
      collisions.push({ spider, time });
    }
    collisions.sort((a, b) => a.time - b.time);
    for (const { spider: hit } of collisions) {
      const damage = Math.min(hit.hits, arrow.power);
      hit.hits -= damage;
      arrow.power -= damage;
      if (arrow.critical && hit.hits === 0) {
        hit.grantsKillEnergy = arrow.kills === 0;
        arrow.kills += 1;
      }
      if (hit.hits <= 0) hit.startDying();
      else if (hit.type === 'fat') hit.type = 'normal';
      if (arrow.power === 0) {
        state.arrows.delete(id);
        break;
      }
    }
    if (arrow.y < 0) state.arrows.delete(id);
  }
}

export function resolveBreaches(
  state: GameState,
  random: RandomSource,
  emit: EmitEvent,
  onBreach: () => void,
): void {
  for (const spider of state.spiders.values()) {
    if (spider.dying || spider.y < 1) continue;
    spider.reachedCastle = true;
    onBreach();
    if (state.isInvulnerable) emit({ type: 'absorb' });
    else {
      const blocked =
        spider.damage > 0 &&
        state.stats.blockPower > 0 &&
        state.stats.blockChance > 0 &&
        random() < state.stats.blockChance;
      const hp = state.rules.value(
        'incomingDamage',
        spider.damage,
        blocked ? [{ source: 'block', kind: 'flat', value: -state.stats.blockPower }] : [],
      );
      const energy = SPIDERS[spider.type].burnsEnergy
        ? Math.min(state.energy, state.stats.burnerEnergy)
        : 0;
      state.modifyHp(-hp);
      state.modifyEnergy(-energy);
      emit({
        type: 'damage',
        spiderId: spider.id,
        hp,
        energy,
        ...(blocked
          ? { blockedDamage: state.rules.value('incomingDamage', spider.damage) - hp }
          : {}),
      });
      if (blocked) emit({ type: 'absorb' });
    }
    if (
      state.bestDefenseCooldown === 0 &&
      state.stats.blockVolleyChance > 0 &&
      random() < state.stats.blockVolleyChance
    ) {
      fireVolley(state, random);
      state.bestDefenseCooldown = BEST_DEFENSE_COOLDOWN;
    }
    state.modifyEnergy(state.stats.energyPerBreach);
    spider.startDying();
  }
}

export function collectDeadSpiders(
  state: GameState,
  dt: number,
  random: RandomSource,
  emit: EmitEvent,
): void {
  for (const [id, spider] of state.spiders) {
    if (!spider.dying) continue;
    spider.dyingTimer -= dt;
    if (spider.dyingTimer > 0) continue;
    if (!spider.reachedCastle || state.stats.breachRewardFraction > 0) {
      const base = randomInt(random, WORLD.coinMin, WORLD.coinMax);
      const jackpot = random() < state.stats.jackpotChance;
      const coins = state.rules.killReward(
        base,
        jackpot,
        spider.reachedCastle ? state.stats.breachRewardFraction : 1,
      );
      state.coins += coins;
      if (!spider.reachedCastle && state.hp > 0) state.modifyHp(state.stats.hpPerKill);
      if (!spider.reachedCastle && spider.grantsKillEnergy)
        state.modifyEnergy(state.stats.energyPerKill);
      emit({ type: 'coinDrop', spiderId: id, coins, jackpot });
    }
    state.spiders.delete(id);
  }
}
