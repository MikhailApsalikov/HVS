import type { AbilityId, Difficulty, DifficultyConfig } from '../config/types.js';
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
import { NinjaSpider } from '../entities/Spider.js';
import { Arrow } from '../entities/Arrow.js';

const BURNER_ENERGY_BURN = 90;
const BURNER_HP_DAMAGE_MULTIPLIER = 0.1;
const COIN_MIN = 1;
const COIN_MAX = 3;

export type PhaseChangeCallback = (phase: string, state: GameState) => void;

export class GameEngine {
  private _state: GameState | null = null;
  private _config: DifficultyConfig | null = null;
  private _formula: FormulaCalculator | null = null;
  private _spawner: SpiderSpawner | null = null;
  private _arrowSystem: ArrowSystem | null = null;
  private _abilitySystem: AbilitySystem | null = null;
  private _talentSystem: TalentSystem | null = null;
  private readonly _saveSystem: SaveSystem;
  private readonly _renderCallback: (state: GameState) => void;
  private _phaseChangeCallback: PhaseChangeCallback | null = null;
  private _lastTimestamp: number = -1;
  private _animFrameId: number = 0;
  private _reachedCastleSpiderIds: Set<string> = new Set();
  private _prevPhase: string = 'menu';
  private _coinAccumulator: number = 0;

  public constructor(renderCallback: (state: GameState) => void) {
    this._saveSystem = new SaveSystem();
    this._renderCallback = renderCallback;
  }

  public setPhaseChangeCallback(cb: PhaseChangeCallback): void {
    this._phaseChangeCallback = cb;
  }

  public startNewGame(difficulty: Difficulty): void {
    const configManager = new ConfigManager();
    this._config = configManager.getConfig(difficulty);

    this._saveSystem.clear();
    this._formula = new FormulaCalculator(this._config);
    this._spawner = new SpiderSpawner(this._formula, this._config);
    this._arrowSystem = new ArrowSystem();
    this._talentSystem = new TalentSystem(this._config);
    this._abilitySystem = new AbilitySystem(
      this._config,
      this._formula,
      this._talentSystem
    );

    this._state = GameStateClass.createNew(difficulty, this._config);
    this._applyTalentBonuses();
    this._state.setPhase('playing');
    this._state.setLevelTimer(
      this._config.levelTimerBase + this._config.levelTimerStep * this._state.level
    );
    this._lastTimestamp = -1;
    this._coinAccumulator = 0;
    this._reachedCastleSpiderIds.clear();
    this._prevPhase = 'playing';
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
    this._abilitySystem = new AbilitySystem(
      this._config,
      this._formula,
      this._talentSystem
    );
    this._talentSystem.loadFromSave([...saveData.talents]);

    this._state = GameStateClass.createNew(difficulty, this._config);
    for (let i = 0; i < saveData.level - 1; i++) {
      this._state.advanceLevel();
    }
    this._applyTalentBonuses();
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

  public shootLane(lane: number): void {
    const state = this._state;
    if (state === null || this._config === null || this._talentSystem === null)
      return;
    if (state.phase !== 'playing') return;

    const archer = state.archers[lane];
    if (archer === undefined || !archer.isReady) return;

    const shootCost =
      this._config.shootCost - this._talentSystem.getShootCostReduction();
    if (state.energy < shootCost) return;

    state.modifyEnergy(-shootCost);
    const cooldownDuration =
      this._config.shootCooldown * this._talentSystem.getShootCooldownMultiplier();
    archer.startCooldown(cooldownDuration);

    const speedMultiplier = this._talentSystem.getArrowSpeedMultiplier();
    const arrow = Arrow.create(lane, this._config, speedMultiplier, false);
    state.addArrow(arrow);
  }

  public activateAbility(abilityId: AbilityId): boolean {
    const state = this._state;
    if (state === null || this._abilitySystem === null) return false;

    if (abilityId === 'freeze') {
      if (state.phase !== 'playing' && state.phase !== 'paused') return false;
      return this._abilitySystem.activateFreeze(state);
    }

    if (state.phase !== 'playing') return false;

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
      default:
        return false;
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

    state.advanceLevel();
    state.setLevelTimer(
      this._config.levelTimerBase +
        this._config.levelTimerStep * state.level
    );
    this._applyTalentBonuses();
    this._saveSystem.save(state, this._talentSystem);
    state.setPhase('playing');
  }

  public getState(): GameState | null {
    return this._state;
  }

  public getTalentSystem(): TalentSystem | null {
    return this._talentSystem;
  }

  public getSaveSystem(): SaveSystem {
    return this._saveSystem;
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

    const hpRegen = config.hpRegen + talentSystem.getHpRegenBonus();
    state.modifyHp(hpRegen * dt);
    const energyRegen =
      config.energyRegen * talentSystem.getEnergyRegenMultiplier();
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

    const damageReduction = talentSystem.getDamageReduction();
    for (const [, spider] of state.spiders) {
      if (spider.dying || spider.y < 1.0) continue;

      this._reachedCastleSpiderIds.add(spider.id);

      if (!state.isInvulnerable) {
        const effectiveDamage =
          spider.damage * (1 - damageReduction);
        if (spider.type === 'burner') {
          state.modifyHp(-effectiveDamage * BURNER_HP_DAMAGE_MULTIPLIER);
          state.modifyEnergy(-BURNER_ENERGY_BURN);
        } else {
          state.modifyHp(-effectiveDamage);
        }
      }
      spider.startDying();
    }

    this._processDyingSpiders(state, formula, dt);

    state.tickLevelTimer(dt);
    if (state.levelTimer <= 0) {
      state.setPhase('levelUp');
      state.awardTalentPoint();
      state.updateRecord();
      this._saveSystem.save(state, talentSystem);
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
          const coins = formula.randomInt(COIN_MIN, COIN_MAX);
          state.addCoins(coins);
        }
        this._reachedCastleSpiderIds.delete(id);
      }
    }
    for (const id of toRemove) {
      state.removeSpider(id);
    }
  }

  private _applyTalentBonuses(): void {
    const state = this._state;
    const config = this._config;
    const talentSystem = this._talentSystem;
    if (state === null || config === null || talentSystem === null) return;

    state.setMaxHp(config.baseHp + talentSystem.getMaxHpBonus());
    state.setMaxEnergy(config.baseEnergy + talentSystem.getMaxEnergyBonus());
  }

  public stopLoop(): void {
    cancelAnimationFrame(this._animFrameId);
  }

  private _startLoop(): void {
    this._animFrameId = requestAnimationFrame((t) => this._gameLoop(t));
  }
}
