import type { AbilityId, AbilityResult, Difficulty, ShootResult, TalentId } from './types.js';
import type { GameEvent } from './events.js';
import type { RandomSource } from './rules/random.js';
import { DIFFICULTIES } from '../content/difficulties.js';
import { ITEM_MAP } from '../content/items.js';
import { ABILITIES, ABILITY_ORDER } from '../content/abilities.js';
import { GameRules } from './rules/GameRules.js';
import { GameState } from './model/GameState.js';
import { TalentSystem } from './model/TalentSystem.js';
import { ItemSystem } from './model/ItemSystem.js';
import { Arrow } from './model/Arrow.js';
import { activateAbility, tickAbilities } from './systems/AbilitySystem.js';
import { tickAntiAfk } from './systems/AntiAfkSystem.js';
import {
  spawnSpiders,
  moveSpiders,
  tickArrows,
  resolveBreaches,
  collectDeadSpiders,
} from './systems/CombatSystem.js';

/** Headless game: explicit commands in, state and semantic events out. */
export class GameSession {
  readonly state: GameState;
  readonly talents: TalentSystem;
  readonly items: ItemSystem;
  private events: GameEvent[] = [];
  constructor(
    difficulty: Difficulty,
    private readonly random: RandomSource = Math.random,
  ) {
    const config = DIFFICULTIES[difficulty];
    this.talents = new TalentSystem(config);
    this.items = new ItemSystem();
    this.state = new GameState(difficulty, config, new GameRules(config));
  }
  refreshStats(grantHealthIncrease = true): void {
    const state = this.state;
    state.talentAbilities.clear();
    for (const id of ABILITY_ORDER) {
      const talent = ABILITIES[id].talent;
      if (talent && this.talents.getRank(talent) > 0) state.talentAbilities.add(id);
    }
    const effects = [
      ...this.talents.getModifiers(state.level),
      ...this.items.getModifiers(),
      ...state.character.getModifiers(),
    ];
    if (state.antiAfkDamagePercent > 0)
      effects.push({
        source: 'effect:antiAfk',
        stat: 'incomingDamage',
        kind: 'percent',
        value: state.antiAfkDamagePercent,
      });
    const rules = new GameRules(state.config, effects, state.character.base, state.level);
    const scaling = this.talents.getScalingModifiers(rules.snapshot());
    effects.push(...scaling);
    if (state.adrenalineActive) {
      effects.push({
        source: 'ability:adrenaline',
        stat: 'shootCooldown',
        kind: 'percent',
        value: -rules.value('adrenaline.shootCooldownReduction'),
      });
    }
    if (state.lastHopeTimer > 0) {
      effects.push(
        {
          source: 'ability:lastHope',
          stat: 'blockChance',
          kind: 'flat',
          value: rules.value('lastHope.blockChance'),
        },
        {
          source: 'ability:lastHope',
          stat: 'blockPower',
          kind: 'flat',
          value: rules.value('lastHope.blockPower'),
        },
      );
    }
    state.applyRules(
      new GameRules(state.config, effects, state.character.base, state.level),
      grantHealthIncrease,
    );
  }
  upgradeTalent(id: TalentId): boolean {
    if (
      this.state.phase !== 'levelUp' ||
      this.state.pendingTalentPoints <= 0 ||
      !this.talents.upgrade(id, this.state.level)
    )
      return false;
    this.state.pendingTalentPoints -= 1;
    this.refreshStats();
    return true;
  }
  buyItem(id: string): boolean {
    if (
      this.state.phase !== 'levelUp' ||
      !this.items.canBuy(id, this.state.coins, this.state.stats.inventorySlots)
    )
      return false;
    this.state.coins -= ITEM_MAP.get(id)!.price;
    this.items.buyItem(id);
    this.refreshStats();
    return true;
  }
  sellItem(index: number): boolean {
    if (this.state.phase !== 'levelUp') return false;
    const result = this.items.sellItem(index);
    if (!result) return false;
    this.state.coins += result.refund;
    this.refreshStats();
    return true;
  }
  confirmLevelUp(): boolean {
    const state = this.state;
    if (
      state.phase !== 'levelUp' ||
      (state.pendingTalentPoints > 0 && this.talents.hasAvailableUpgrades(state.level))
    )
      return false;
    if (state.initialTalentPick) state.initialTalentPick = false;
    else state.level += 1;
    this.refreshStats();
    state.record = Math.max(state.record, state.level);
    state.levelTimer = state.levelTimerMax = state.rules.levelDuration(state.level);
    state.phase = 'playing';
    return true;
  }
  shootLane(lane: number): ShootResult {
    const state = this.state;
    const archer = state.archers[lane];
    if (!Number.isInteger(lane) || state.phase !== 'playing' || !archer?.isReady) return 'blocked';
    if (state.energy < state.currentShootCost) return 'not_enough_energy';
    state.spendEnergy(state.currentShootCost);
    archer.start(state.stats.shootCooldown);
    if (state.adrenalineActive) {
      state.adrenalineShots -= 1;
      if (state.adrenalineShots === 0) {
        state.adrenalineTimer = 0;
        this.refreshStats(false);
      }
    }
    const critical =
      state.stats.criticalShotChance > 0 && this.random() < state.stats.criticalShotChance;
    const arrow = new Arrow(state.newId('arrow'), lane, state.stats.arrowSpeed, false, critical);
    state.arrows.set(arrow.id, arrow);
    return 'shot';
  }
  activateAbility(id: AbilityId): AbilityResult {
    const result = activateAbility(this.state, id, this.random);
    if ((id === 'lastHope' || id === 'adrenaline') && result === 'activated')
      this.refreshStats(false);
    return result;
  }
  drainEvents(): GameEvent[] {
    const events = this.events;
    this.events = [];
    return events;
  }
  tick(dt: number): void {
    if (!Number.isFinite(dt) || dt < 0) throw new RangeError('Invalid timestep');
    const state = this.state;
    if (state.phase !== 'playing' || dt === 0) return;
    const emit = (event: GameEvent) => this.events.push(event);
    if (tickAntiAfk(state, dt)) this.refreshStats(false);
    spawnSpiders(state, dt, this.random);
    const lastHopeWasActive = state.lastHopeTimer > 0;
    const adrenalineWasActive = state.adrenalineActive;
    tickAbilities(state, dt);
    if (
      (lastHopeWasActive && state.lastHopeTimer === 0) ||
      (adrenalineWasActive && !state.adrenalineActive)
    )
      this.refreshStats(false);
    moveSpiders(state, dt, this.random);
    tickArrows(state, dt);
    resolveBreaches(state, this.random, emit, () => {
      if (state.antiAfkStacks > 0 && state.antiAfkRecoveryTimer === 0) {
        state.antiAfkStacks += 1;
        this.refreshStats(false);
      }
    });
    collectDeadSpiders(state, dt, this.random, emit);
    // Death wins over regeneration and simultaneous completion of a level.
    if (state.hp <= 0) {
      state.phase = 'gameOver';
      return;
    }
    state.modifyHp(state.stats.hpRegen * dt);
    state.modifyEnergy(state.stats.energyRegen * dt);
    state.coinAccumulator += state.stats.coinsPerSec * dt;
    const whole = Math.floor(state.coinAccumulator);
    state.coins += whole;
    state.coinAccumulator -= whole;
    state.levelTimer = Math.max(0, state.levelTimer - dt);
    if (state.levelTimer <= 0) {
      state.pendingTalentPoints += 1;
      state.phase = 'levelUp';
    }
  }
}
