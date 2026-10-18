import type { AbilityId, AbilityResult, Difficulty, ShootResult, TalentId } from './types.js';
import type { GameEvent } from './events.js';
import type { RandomSource } from './rules/random.js';
import { DIFFICULTIES } from '../content/difficulties.js';
import { ITEM_MAP } from '../content/items.js';
import { ABILITIES, ABILITY_ORDER } from '../content/abilities.js';
import { GameRules } from './rules/GameRules.js';
import { purchasePrice } from './rules/economy.js';
import { GameState } from './model/GameState.js';
import { TalentSystem } from './model/TalentSystem.js';
import { ItemSystem } from './model/ItemSystem.js';
import { createArrow } from './systems/ArrowFactory.js';
import { activateAbility, tickAbilities, tickAimedFire } from './systems/AbilitySystem.js';
import { tickAntiAfk } from './systems/AntiAfkSystem.js';
import { resolveArrowExplosions, tickChainLightning } from './systems/MagicSystem.js';
import {
  learningModifiers,
  nextLearningBoundary,
  tickLearningFromMistakes,
} from './systems/LearningFromMistakesSystem.js';
import { TITAN_ARMOR_DAMAGE_REDUCTION_PER_RANK } from './rules/stats.js';
import { buffModifiers, nextBuffBoundary, tickBuffs } from './systems/BuffSystem.js';
import {
  clearResistedSpiderDebuffs,
  debuffAgilityDodgeModifiers,
  debuffModifiers,
  nextDebuffBoundary,
  tickDebuffs,
} from './systems/DebuffSystem.js';
import {
  spawnSpiders,
  moveSpiders,
  tickArrows,
  resolveBreaches,
  collectDeadSpiders,
} from './systems/CombatSystem.js';

export interface NewGameOptions {
  readonly level?: number;
  readonly coins?: number;
}

/** Headless game: explicit commands in, state and semantic events out. */
export class GameSession {
  readonly state: GameState;
  readonly talents: TalentSystem;
  readonly items: ItemSystem;
  private events: GameEvent[] = [];
  constructor(
    difficulty: Difficulty,
    private readonly random: RandomSource = Math.random,
    options: NewGameOptions = {},
  ) {
    const config = DIFFICULTIES[difficulty];
    const { level = 1, coins = config.startingCoins } = options;
    if (!Number.isSafeInteger(level) || level < 1 || !Number.isSafeInteger(coins) || coins < 0)
      throw new RangeError('Invalid new game options');
    this.talents = new TalentSystem(config);
    this.items = new ItemSystem();
    this.state = new GameState(difficulty, config, new GameRules(config, [], {}, level));
    this.state.coins = coins;
  }
  refreshStats(grantHealthIncrease = true): void {
    const state = this.state;
    state.killingStreakLearned = this.talents.getRank('killingStreak') > 0;
    state.masochismRank = this.talents.getRank('masochism');
    state.learningFromMistakesRank = this.talents.getRank('learningFromMistakes');
    state.talentAbilities.clear();
    for (const id of ABILITY_ORDER) {
      const talent = ABILITIES[id].talent;
      if (talent && this.talents.getRank(talent) > 0) state.talentAbilities.add(id);
    }
    const effects = [
      ...this.talents.getModifiers(state.level),
      ...this.items.getModifiers(),
      ...state.character.getModifiers(),
      ...buffModifiers(state),
      ...learningModifiers(state),
    ];
    const rules = new GameRules(state.config, effects, state.character.base, state.level);
    const scaling = this.talents.getScalingModifiers(rules.snapshot());
    const resistance = rules.value(
      'spiderDebuffResistance',
      undefined,
      scaling.filter((effect) => effect.stat === 'spiderDebuffResistance'),
    );
    if (resistance === 1) clearResistedSpiderDebuffs(state);
    effects.push(...scaling, ...debuffModifiers(state, resistance));
    if (
      !state.activeEffects.some((effect) => effect.kind === 'debuff' && effect.source === 'spider')
    )
      effects.push({
        source: 'talent:titanArmor',
        stat: 'incomingDamage',
        kind: 'percent',
        value: -TITAN_ARMOR_DAMAGE_REDUCTION_PER_RANK * this.talents.getRank('titanArmor'),
      });
    if (state.antiAfkDamagePercent > 0)
      effects.push({
        source: 'effect:antiAfk',
        stat: 'incomingDamage',
        kind: 'percent',
        value: state.antiAfkDamagePercent,
      });
    const agilityDodgeModifiers = debuffAgilityDodgeModifiers(state, resistance);
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
      new GameRules(
        state.config,
        effects,
        state.character.base,
        state.level,
        agilityDodgeModifiers,
      ),
      grantHealthIncrease,
    );
    state.killingStreakStacks = state.killingStreakStacks;
    state.advanceKillingStreak(0);
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
      !this.items.canBuy(
        id,
        this.state.coins,
        this.state.stats.inventorySlots,
        this.state.stats.shopDiscount,
      )
    )
      return false;
    this.state.coins -= purchasePrice(ITEM_MAP.get(id)!.price, this.state.stats.shopDiscount);
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
    this.state.killingStreakStacks = Math.min(
      this.state.killingStreakStacks,
      Math.max(this.state.killingStreakMaximum, this.state.stats['prep.stacks']),
    );
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
    if (!Number.isInteger(lane) || state.phase !== 'playing' || state.isStunned || !archer?.isReady)
      return 'blocked';
    if (!state.spendEnergy(state.currentShootCost, 'shoot')) return 'not_enough_energy';
    archer.start(state.stats.shootCooldown);
    if (state.adrenalineActive) {
      state.adrenalineShots -= 1;
      if (state.adrenalineShots === 0) {
        state.adrenalineTimer = 0;
        this.refreshStats(false);
      }
    }
    const eagleEyeActive = state.eagleEyeActive;
    const arrow = createArrow(state, this.random, lane, false, eagleEyeActive, eagleEyeActive);
    if (state.eagleEyeActive) {
      state.eagleEyeShots -= 1;
      if (state.eagleEyeShots === 0) state.eagleEyeTimer = 0;
    }
    state.arrows.set(arrow.id, arrow);
    return 'shot';
  }
  activateAbility(id: AbilityId): AbilityResult {
    const result = activateAbility(this.state, id, this.random);
    if (
      (id === 'lastHope' || id === 'adrenaline' || id === 'stand' || id === 'eagleEye') &&
      result === 'activated'
    )
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
    let remaining = dt;
    while (remaining > 0 && this.state.phase === 'playing') {
      const step = Math.min(
        remaining,
        nextDebuffBoundary(this.state),
        nextBuffBoundary(this.state),
        nextLearningBoundary(this.state),
        ...this.state.aimedFireWaves.map((wave) => wave.remaining),
        ...this.state.chainLightning.map((chain) => chain.remaining),
        ...[...this.state.spiders.values()]
          .filter((spider) => !spider.dying && spider.rootTimer > 0)
          .map((spider) => spider.rootTimer),
      );
      this.tickStep(step);
      remaining = Math.max(0, remaining - step);
    }
  }
  private tickStep(dt: number): void {
    const state = this.state;
    if (state.phase !== 'playing' || dt === 0) return;
    const emit = (event: GameEvent) => this.events.push(event);
    const hpRegeneration = state.stats.hpRegen * dt;
    const passiveCoins = state.stats.coinsPerSec * dt;
    if (tickBuffs(state, dt)) this.refreshStats(false);
    if (tickDebuffs(state, dt)) this.refreshStats(false);
    if (state.hp <= 0) {
      state.phase = 'gameOver';
      return;
    }
    const occupiedAt = spawnSpiders(state, dt, this.random);
    if (tickAntiAfk(state, dt, occupiedAt)) this.refreshStats(false);
    const lastHopeWasActive = state.lastHopeTimer > 0;
    const adrenalineWasActive = state.adrenalineActive;
    const prepRegeneration = state.stats['prep.energyRegen'] * Math.min(dt, state.prepTimer);
    tickAbilities(state, dt);
    if (tickLearningFromMistakes(state, dt)) this.refreshStats(false);
    state.tickKillingStreak(dt);
    if (
      (lastHopeWasActive && state.lastHopeTimer === 0) ||
      (adrenalineWasActive && !state.adrenalineActive)
    )
      this.refreshStats(false);
    moveSpiders(state, dt, this.random);
    tickChainLightning(state, dt, this.random, emit);
    const arrowKills = tickArrows(state, dt, this.random, emit);
    resolveArrowExplosions(state, arrowKills, this.random, emit);
    resolveBreaches(
      state,
      this.random,
      emit,
      () => {
        if (state.antiAfkStacks > 0 && state.antiAfkRecoveryTimer === 0) {
          state.antiAfkStacks += 1;
          this.refreshStats(false);
        }
      },
      () => this.refreshStats(false),
    );
    collectDeadSpiders(state, dt, this.random, emit, () => this.refreshStats(false));
    // Death wins over regeneration and simultaneous completion of a level.
    if (state.hp <= 0) {
      state.phase = 'gameOver';
      return;
    }
    tickAimedFire(state, dt, this.random);
    state.modifyHp(hpRegeneration);
    state.modifyEnergy(state.stats.energyRegen * dt + prepRegeneration);
    state.coinAccumulator += passiveCoins;
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
