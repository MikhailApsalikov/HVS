import type { GameState } from '../model/GameState.js';
import type { EmitEvent } from '../events.js';
import type { RandomSource } from '../rules/random.js';
import type { SpiderType } from '../types.js';
import { randomInt } from '../rules/random.js';
import { PIERCING_STRIKE, WORLD } from '../rules/world.js';
import { BEST_DEFENSE_COOLDOWN, HUNTER_REWARD, STATS } from '../rules/stats.js';
import { calculate, clamp } from '../rules/numbers.js';
import { SPIDERS, SPECIAL_SPIDER_ORDER } from '../../content/spiders.js';
import { Spider } from '../model/Spider.js';
import { fireVolley } from './AbilitySystem.js';
import { applySpiderDebuff, applyPiercingStun } from './DebuffSystem.js';
import { clearPlayerBuffs } from './BuffSystem.js';
import { protectFromBreach, shieldAfterBreach } from './LearningFromMistakesSystem.js';
import { applyIceArrows, startChainLightning } from './MagicSystem.js';

/** Returns the time within this tick when a live spider first occupies the field. */
export function spawnSpiders(state: GameState, dt: number, random: RandomSource): number {
  let occupiedAt = [...state.spiders.values()].some((spider) => !spider.dying) ? 0 : Infinity;
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
      occupiedAt = Math.min(occupiedAt, Math.max(0, dt - state.spawnAccumulator));
    }
  }
  return occupiedAt;
}

export function moveSpiders(state: GameState, dt: number, random: RandomSource): void {
  for (const spider of state.spiders.values()) {
    if (spider.dying) continue;
    while (
      spider.rootTimer === 0 &&
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
export function tickArrows(
  state: GameState,
  dt: number,
  random: RandomSource,
  emit: EmitEvent,
): Spider[] {
  const arrowKills: Spider[] = [];
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
      const damage = hit.takeHit(arrow.power);
      if (hit.dying) arrowKills.push(hit);
      arrow.power -= damage;
      applyIceArrows(state, arrow.lane, random);
      if (arrow.lightningJumps > 0) {
        const point = { lane: hit.lane, y: hit.y };
        emit({ type: 'lightning', from: point, to: point });
        startChainLightning(state, hit, arrow.lightningJumps, arrow.lightningDelay, random);
        arrow.lightningJumps = 0;
      }
      if (arrow.power === 0) {
        state.arrows.delete(id);
        break;
      }
    }
    if (arrow.y < 0) state.arrows.delete(id);
  }
  return arrowKills;
}

export function resolveBreaches(
  state: GameState,
  random: RandomSource,
  emit: EmitEvent,
  onBreach: () => void,
  onEffectsChanged: () => void,
): void {
  for (const spider of state.spiders.values()) {
    if (spider.dying || spider.y < 1) continue;
    spider.reachedCastle = true;
    onBreach();
    if (state.isInvulnerable) emit({ type: 'absorb' });
    else {
      const definition = SPIDERS[spider.type];
      const piercingChance = clamp(
        (state.level - PIERCING_STRIKE.unlockLevel + 1) * PIERCING_STRIKE.chancePerLevel,
        0,
        1,
      );
      const piercing = spider.damage > 0 && piercingChance > 0 && random() < piercingChance;
      const rawDamage = piercing
        ? calculate(
            spider.damage,
            [
              {
                source: 'spider:piercingStrike',
                kind: 'percent',
                value: (PIERCING_STRIKE.damageMultiplier - 1) * 100,
              },
            ],
            STATS.spiderDamage.policy,
          ).value
        : spider.damage;
      const blocked =
        rawDamage > 0 &&
        state.stats.blockPower > 0 &&
        state.stats.blockChance > 0 &&
        random() < state.stats.blockChance;
      let hp = state.rules.value(
        'incomingDamage',
        rawDamage,
        blocked ? [{ source: 'block', kind: 'flat', value: -state.stats.blockPower }] : [],
      );
      const blockedDamage = blocked
        ? state.rules.value('incomingDamage', rawDamage) - hp
        : undefined;
      const canDodge = hp > 0 || definition.burnsEnergy === true || definition.clearsBuffs === true;
      let dodged = canDodge && state.stats.dodgeChance > 0 && random() < state.stats.dodgeChance;
      if (hp > 0 && !dodged) {
        if (state.killingStreakStacks > 0) {
          dodged = state.stats.enthusiasmChance > 0 && random() < state.stats.enthusiasmChance;
          state.killingStreakStacks -= 1;
        }
        if (!dodged) state.killingStreakProgress = 0;
      }
      if (dodged) hp = 0;
      const energy =
        definition.burnsEnergy && !dodged ? Math.min(state.energy, state.stats.burnerEnergy) : 0;
      const previousHp = state.hp;
      const previousFatalShield = state.fatalShieldTimer;
      hp = protectFromBreach(state, hp);
      state.modifyHp(-hp);
      const lostHealth = state.hp < previousHp;
      if (lostHealth) applySpiderDebuff(state, spider);
      if (lostHealth && piercing) applyPiercingStun(state);
      if (definition.clearsBuffs && !dodged) {
        clearPlayerBuffs(state);
      }
      if (lostHealth) shieldAfterBreach(state, previousHp - state.hp);
      if (
        lostHealth ||
        previousFatalShield !== state.fatalShieldTimer ||
        (definition.clearsBuffs && !dodged)
      )
        onEffectsChanged();
      state.modifyEnergy(-energy);
      emit({
        type: 'damage',
        spiderId: spider.id,
        hp,
        energy,
        ...(blocked ? { blockedDamage } : {}),
        ...(dodged ? { dodged: true } : {}),
        ...(piercing ? { piercing: true } : {}),
        ...(piercing || spider.type === 'tank'
          ? {
              rawDamageMultiplier:
                (1 + definition.damagePercent / 100) *
                (piercing ? PIERCING_STRIKE.damageMultiplier : 1),
            }
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
    const previousEnergy = state.energy;
    state.modifyEnergy(state.stats.energyPerBreach);
    const gainedEnergy = state.energy - previousEnergy;
    if (gainedEnergy > 0)
      emit({
        type: 'resourceGain',
        spiderId: spider.id,
        hp: 0,
        energy: gainedEnergy,
        reason: 'breach',
      });
    spider.startDying();
  }
}

export function collectDeadSpiders(
  state: GameState,
  dt: number,
  random: RandomSource,
  emit: EmitEvent,
  onEffectsChanged: () => void,
): void {
  for (const [id, spider] of state.spiders) {
    if (!spider.dying) continue;
    spider.dyingTimer -= dt;
    if (spider.dyingTimer > 0) continue;
    if (!spider.reachedCastle) {
      state.advanceKillingStreak(state.stats['killingStreak.killAdvance']);
      const previousHp = state.hp;
      const previousEnergy = state.energy;
      state.modifyEnergy(state.stats.energyPerKill);
      if (state.hp > 0) state.modifyHp(state.stats.hpPerKill);
      const gainedHp = state.hp - previousHp;
      const gainedEnergy = state.energy - previousEnergy;
      if (gainedHp > 0 || gainedEnergy > 0)
        emit({
          type: 'resourceGain',
          spiderId: id,
          hp: gainedHp,
          energy: gainedEnergy,
          reason: 'kill',
        });
    }
    if (!spider.reachedCastle || state.stats.breachRewardFraction > 0) {
      const base = randomInt(random, WORLD.coinMin, WORLD.coinMax);
      const goldenKill = !spider.reachedCastle && spider.type === 'golden';
      const jackpot =
        random() < (goldenKill ? state.stats.goldenJackpotChance : state.stats.jackpotChance);
      const coins = state.rules.killReward(
        base,
        jackpot,
        spider.reachedCastle ? state.stats.breachRewardFraction : 1,
        goldenKill,
      );
      state.coins += coins;
      emit({ type: 'coinDrop', spiderId: id, coins, jackpot });
      if (goldenKill && jackpot) {
        state.hunterRewardTimer = HUNTER_REWARD.duration;
        onEffectsChanged();
      }
    }
    state.spiders.delete(id);
  }
}
