import type { AbilityId, AbilityResult, Difficulty, DifficultyConfig, ShootResult } from '../config/types.js';
import type { GameState } from './GameState.js';
import type { Spider } from '../entities/Spider.js';
import { GameState as GameStateClass } from './GameState.js';
import { ConfigManager } from './ConfigManager.js';
import { FormulaCalculator } from './FormulaCalculator.js';
import { SpiderSpawner } from './SpiderSpawner.js';
import { ArrowSystem } from './ArrowSystem.js';
import { AbilitySystem } from './AbilitySystem.js';
import { TalentSystem } from './TalentSystem.js';
import { SaveSystem } from './SaveSystem.js';
import { ItemSystem } from './ItemSystem.js';
import { NinjaSpider } from '../entities/Spider.js';
import { Arrow } from '../entities/Arrow.js';
import { ITEM_MAP } from '../config/items.js';

const BURNER_ENERGY_BURN = 90;
const BURNER_HP_DAMAGE_MULTIPLIER = 0.1;
const COIN_MIN = 1;
const COIN_MAX = 3;

export type PhaseChangeCallback = (phase: string, state: GameState) => void;
export type CoinDropCallback = (spiderId: string, coins: number, isJackpot: boolean) => void;
export type DamagePopCallback = (spiderId: string, hpDamage: number, energyBurn: number) => void;
export type AbsorbCallback = () => void;

export class GameEngine {
  private _state: GameState | null = null;
  private _config: DifficultyConfig | null = null;
  private _formula: FormulaCalculator | null = null;
  private _spawner: SpiderSpawner | null = null;
  private _arrowSystem: ArrowSystem | null = null;
  private _abilitySystem: AbilitySystem | null = null;
  private _talentSystem: TalentSystem | null = null;
  private _itemSystem: ItemSystem | null = null;
  private readonly _saveSystem: SaveSystem;
  private readonly _renderCallback: (state: GameState) => void;
  private _phaseChangeCallback: PhaseChangeCallback | null = null;
  private _coinDropCallback: CoinDropCallback | null = null;
  private _damagePopCallback: DamagePopCallback | null = null;
  private _absorbCallback: AbsorbCallback | null = null;
  private _lastTimestamp: number = -1;
  private _animFrameId: number = 0;
  private _reachedCastleSpiderIds: Set<string> = new Set();
  private _prevPhase: string = 'menu';
  private _coinAccumulator: number = 0;
  private _isInitialTalentPick: boolean = false;

  public constructor(renderCallback: (state: GameState) => void) {
    this._saveSystem = new SaveSystem();
    this._renderCallback = renderCallback;
  }

  public setPhaseChangeCallback(cb: PhaseChangeCallback): void {
    this._phaseChangeCallback = cb;
  }

  public setCoinDropCallback(cb: CoinDropCallback): void {
    this._coinDropCallback = cb;
  }

  public setDamagePopCallback(cb: DamagePopCallback): void {
    this._damagePopCallback = cb;
  }

  public setAbsorbCallback(cb: AbsorbCallback): void {
    this._absorbCallback = cb;
  }

  public startNewGame(difficulty: Difficulty): void {
    const configManager = new ConfigManager();
    this._config = configManager.getConfig(difficulty);

    this._saveSystem.clear();
    this._formula = new FormulaCalculator(this._config);
    this._spawner = new SpiderSpawner(this._formula, this._config);
    this._arrowSystem = new ArrowSystem();
    this._talentSystem = new TalentSystem(this._config);
    this._itemSystem = new ItemSystem();
    this._abilitySystem = new AbilitySystem(
      this._config,
      this._formula,
      this._talentSystem,
      this._itemSystem
    );

    this._state = GameStateClass.createNew(difficulty, this._config);
    this._applyBonuses();
    this._state.setLevelTimer(
      this._config.levelTimerBase + this._config.levelTimerStep * this._state.level
    );
    this._lastTimestamp = -1;
    this._coinAccumulator = 0;
    this._reachedCastleSpiderIds.clear();

    this._isInitialTalentPick = true;
    this._state.awardTalentPoint();
    this._state.setPhase('levelUp');
    this._prevPhase = 'menu';
    this._startLoop();
  }

  public loadGame(): boolean {
    const saveData = this._saveSystem.load();
    if (saveData === null) return false;

    const configManager = new ConfigManager();
    const difficulty = saveData.difficulty as Difficulty;
    this._config = configManager.getConfig(difficulty);

    this._formula = new FormulaCalculator(this._config);
    this._spawner = new SpiderSpawner(this._formula, this._config);
    this._arrowSystem = new ArrowSystem();
    this._talentSystem = new TalentSystem(this._config);
    this._itemSystem = new ItemSystem();
    this._abilitySystem = new AbilitySystem(
      this._config,
      this._formula,
      this._talentSystem,
      this._itemSystem
    );
    this._talentSystem.loadFromSave([...saveData.talents]);
    if (saveData.inventory) {
      this._itemSystem.loadFromSave([...saveData.inventory]);
    }

    this._state = GameStateClass.createNew(difficulty, this._config);
    for (let i = 0; i < saveData.level - 1; i++) {
      this._state.advanceLevel();
    }
    this._applyBonuses();
    this._state.modifyHp(saveData.hp - this._state.hp);
    this._state.modifyEnergy(saveData.energy - this._state.energy);
    this._state.addCoins(saveData.coins);
    for (let i = 0; i < saveData.pendingTalentPoints; i++) {
      this._state.awardTalentPoint();
    }
    this._state.setRecord(saveData.record);
    this._state.setPhase('playing');
    this._lastTimestamp = -1;
    this._coinAccumulator = 0;
    this._reachedCastleSpiderIds.clear();
    this._prevPhase = 'playing';
    this._startLoop();
    return true;
  }

  public shootLane(lane: number): ShootResult {
    const state = this._state;
    if (state === null || this._config === null || this._talentSystem === null)
      return 'blocked';
    if (state.phase !== 'playing') return 'blocked';

    const archer = state.archers[lane];
    if (archer === undefined || !archer.isReady) return 'blocked';

    const shootCost =
      this._config.shootCost - this._talentSystem.getShootCostReduction();
    if (state.energy < shootCost) return 'not_enough_energy';

    state.modifyEnergy(-shootCost);
    const cooldownDuration =
      this._config.shootCooldown * this._talentSystem.getShootCooldownMultiplier();
    archer.startCooldown(cooldownDuration);

    const speedMultiplier = this._talentSystem.getArrowSpeedMultiplier();
    const arrow = Arrow.create(lane, this._config, speedMultiplier, false);
    state.addArrow(arrow);
    return 'shot';
  }

  public activateAbility(abilityId: AbilityId): AbilityResult {
    const state = this._state;
    if (state === null || this._abilitySystem === null) return 'level_locked';

    if (abilityId === 'freeze') {
      if (state.phase !== 'playing' && state.phase !== 'paused') return 'level_locked';
      return this._abilitySystem.activateFreeze(state);
    }

    if (state.phase !== 'playing') return 'level_locked';

    switch (abilityId) {
      case 'blizzard':
        return this._abilitySystem.activateBlizzard(state);
      case 'prep':
        return this._abilitySystem.activatePrep(state);
      case 'heal':
        return this._abilitySystem.activateHeal(state);
      case 'volley':
        return this._abilitySystem.activateVolley(state);
      case 'stand':
        return this._abilitySystem.activateStand(state);
      case 'armageddon':
        return this._abilitySystem.activateArmageddon(state);
      case 'recharge':
        return this._abilitySystem.activateRecharge(state);
      default:
        return 'level_locked';
    }
  }

  public confirmLevelUp(): void {
    const state = this._state;
    if (
      state === null ||
      this._config === null ||
      this._talentSystem === null ||
      state.phase !== 'levelUp'
    )
      return;

    if (this._isInitialTalentPick) {
      this._isInitialTalentPick = false;
    } else {
      state.advanceLevel();
    }

    state.setLevelTimer(
      this._config.levelTimerBase +
        this._config.levelTimerStep * state.level
    );
    this._applyBonuses();
    this._saveSystem.save(state, this._talentSystem, this._itemSystem ?? undefined);
    state.setPhase('playing');
  }

  public getState(): GameState | null {
    return this._state;
  }

  public get isInitialTalentPick(): boolean {
    return this._isInitialTalentPick;
  }

  public getTalentSystem(): TalentSystem | null {
    return this._talentSystem;
  }

  public getItemSystem(): ItemSystem | null {
    return this._itemSystem;
  }

  public getSaveSystem(): SaveSystem {
    return this._saveSystem;
  }

  public buyItem(itemId: string): boolean {
    const state = this._state;
    const itemSystem = this._itemSystem;
    const talentSystem = this._talentSystem;
    if (!state || !itemSystem || !talentSystem) return false;
    if (!itemSystem.canBuy(itemId, state.coins, talentSystem)) return false;

    const item = ITEM_MAP.get(itemId);
    if (!item) return false;

    state.addCoins(-item.price);
    itemSystem.buyItem(itemId);
    this._applyBonuses();
    return true;
  }

  public sellItem(slotIndex: number): boolean {
    const state = this._state;
    const itemSystem = this._itemSystem;
    if (!state || !itemSystem) return false;

    const result = itemSystem.sellItem(slotIndex);
    if (!result) return false;

    state.addCoins(result.refund);
    this._applyBonuses();
    return true;
  }

  private _gameLoop(timestamp: number): void {
    const state = this._state;
    if (state === null) return;

    let dt: number;
    if (this._lastTimestamp < 0) {
      dt = 0;
      this._lastTimestamp = timestamp;
    } else {
      dt = Math.min((timestamp - this._lastTimestamp) / 1000, 0.1);
      this._lastTimestamp = timestamp;
    }

    if (state.phase === 'playing') {
      this._tick(dt);
    }

    this._renderCallback(state);
    this._detectPhaseChange(state);

    if (state.phase !== 'gameOver') {
      this._animFrameId = requestAnimationFrame((t) => this._gameLoop(t));
    }
  }

  private _detectPhaseChange(state: GameState): void {
    if (state.phase !== this._prevPhase) {
      const newPhase = state.phase;
      this._prevPhase = newPhase;
      this._phaseChangeCallback?.(newPhase, state);
    }
  }

  private _tick(dt: number): void {
    const state = this._state;
    const config = this._config;
    const spawner = this._spawner;
    const arrowSystem = this._arrowSystem;
    const abilitySystem = this._abilitySystem;
    const talentSystem = this._talentSystem;
    const formula = this._formula;

    if (
      state === null ||
      config === null ||
      spawner === null ||
      arrowSystem === null ||
      abilitySystem === null ||
      talentSystem === null ||
      formula === null
    )
      return;

    spawner.tick(dt, state);

    for (const [, spider] of state.spiders) {
      if (spider.dying) continue;
      this._handleNinjaJump(spider, state);
      spider.move(dt);
    }

    arrowSystem.tick(dt, state);

    abilitySystem.tick(dt, state);

    const itemBonuses = this._itemSystem?.getBonuses();
    const hpRegen = config.hpRegen + talentSystem.getHpRegenBonus() + (itemBonuses?.hpRegen ?? 0);
    state.modifyHp(hpRegen * dt);
    const energyRegen =
      config.energyRegen * talentSystem.getEnergyRegenMultiplier() + (itemBonuses?.energyRegen ?? 0);
    state.modifyEnergy(energyRegen * dt);

    this._coinAccumulator += config.coinsPerSec * dt;
    if (this._coinAccumulator >= 1) {
      const whole = Math.floor(this._coinAccumulator);
      state.addCoins(whole);
      this._coinAccumulator -= whole;
    }

    for (const archer of state.archers) {
      archer.tick(dt);
    }

    const damageReductionPct = talentSystem.getDamageReduction() + (itemBonuses?.damageReduction ?? 0) / 100;
    for (const [, spider] of state.spiders) {
      if (spider.dying || spider.y < 1.0) continue;

      this._reachedCastleSpiderIds.add(spider.id);

      if (!state.isInvulnerable) {
        const effectiveDamage =
          spider.damage * Math.max(0, 1 - damageReductionPct);
        if (spider.type === 'burner') {
          const hpDmg = effectiveDamage * BURNER_HP_DAMAGE_MULTIPLIER;
          state.modifyHp(-hpDmg);
          state.modifyEnergy(-BURNER_ENERGY_BURN);
          this._damagePopCallback?.(spider.id, hpDmg, BURNER_ENERGY_BURN);
        } else {
          state.modifyHp(-effectiveDamage);
          this._damagePopCallback?.(spider.id, effectiveDamage, 0);
        }
      } else {
        this._absorbCallback?.();
      }
      const enduranceRestore = talentSystem.getEnduranceEnergyRestore();
      if (enduranceRestore > 0) {
        state.modifyEnergy(enduranceRestore);
      }
      const breachEnergy = itemBonuses?.energyPerBreach ?? 0;
      if (breachEnergy > 0) {
        state.modifyEnergy(breachEnergy);
      }
      spider.startDying();
    }

    this._processDyingSpiders(state, formula, dt);

    state.tickLevelTimer(dt);
    if (state.levelTimer <= 0) {
      state.setPhase('levelUp');
      state.awardTalentPoint();
      state.updateRecord();
      this._saveSystem.save(state, talentSystem, this._itemSystem ?? undefined);
    }

    if (state.hp <= 0) {
      state.setPhase('gameOver');
    }
  }

  private _handleNinjaJump(spider: Spider, _state: GameState): void {
    if (!(spider instanceof NinjaSpider)) return;
    const ninja = spider;
    if (ninja.hasJumped || ninja.y < ninja.jumpThreshold) return;

    let newLane: number;
    if (ninja.lane === 0) {
      newLane = 1;
    } else if (ninja.lane === 8) {
      newLane = 7;
    } else {
      newLane = ninja.lane + (Math.random() < 0.5 ? -1 : 1);
    }
    ninja.changeLane(newLane);
    ninja.markJumped();
  }

  private _processDyingSpiders(
    state: GameState,
    formula: FormulaCalculator,
    dt: number
  ): void {
    const toRemove: string[] = [];
    for (const [id, spider] of state.spiders) {
      if (!spider.dying) continue;
      spider.tickDying(dt);
      if (spider.dyingTimer <= 0) {
        toRemove.push(id);
        if (!this._reachedCastleSpiderIds.has(id)) {
          const itemBon = this._itemSystem?.getBonuses();
          const baseCoins = formula.randomInt(COIN_MIN, COIN_MAX) + (itemBon?.coinsPerKill ?? 0);
          const tripleChance = this._talentSystem?.getHunterRewardTripleChance() ?? 0;
          const isJackpot = tripleChance > 0 && Math.random() < tripleChance;
          const coins = isJackpot ? baseCoins * 3 : baseCoins;
          state.addCoins(coins);
          this._coinDropCallback?.(id, coins, isJackpot);

          const energyPerKill = itemBon?.energyPerKill ?? 0;
          if (energyPerKill > 0) {
            state.modifyEnergy(energyPerKill);
          }
        }
        this._reachedCastleSpiderIds.delete(id);
      }
    }
    for (const id of toRemove) {
      state.removeSpider(id);
    }
  }

  private _applyBonuses(): void {
    const state = this._state;
    const config = this._config;
    const talentSystem = this._talentSystem;
    if (state === null || config === null || talentSystem === null) return;

    const itemBonuses = this._itemSystem?.getBonuses();
    const oldMaxHp = state.maxHp;
    state.setMaxHp(config.baseHp + talentSystem.getMaxHpBonus() + (itemBonuses?.maxHp ?? 0));
    const hpIncrease = state.maxHp - oldMaxHp;
    if (hpIncrease > 0) {
      state.modifyHp(hpIncrease);
    }

    state.setMaxEnergy(config.baseEnergy + talentSystem.getMaxEnergyBonus() + (itemBonuses?.maxEnergy ?? 0));
  }

  public stopLoop(): void {
    cancelAnimationFrame(this._animFrameId);
  }

  private _startLoop(): void {
    this._animFrameId = requestAnimationFrame((t) => this._gameLoop(t));
  }
}
