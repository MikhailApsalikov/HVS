import type { AbilityId, Difficulty, DifficultyConfig, GamePhase } from '../config/types.js';
import type { Spider } from '../entities/Spider.js';
import type { Arrow } from '../entities/Arrow.js';
import type { Archer } from '../entities/Archer.js';
import { Ability } from './Ability.js';
import { Archer as ArcherEntity } from '../entities/Archer.js';

const ABILITY_UNLOCK_LEVELS: Readonly<Record<AbilityId, number>> = {
  freeze: 4,
  blizzard: 8,
  prep: 12,
  heal: 16,
  volley: 20,
  stand: 25,
  armageddon: 30,
  recharge: 50,
};

export type ArmageddonPhase = 'none' | 'charging' | 'firing';

export class GameState {
  private _phase: GamePhase;
  private _difficulty: Difficulty;
  private _level: number;
  private _levelTimer: number;
  private _levelTimerMax: number;
  private _hp: number;
  private _maxHp: number;
  private _energy: number;
  private _maxEnergy: number;
  private _coins: number;
  private _pendingTalentPoints: number;
  private _archers: Archer[];
  private _spiders: Map<string, Spider>;
  private _arrows: Map<string, Arrow>;
  private _abilities: Map<AbilityId, Ability>;
  private _isInvulnerable: boolean;
  private _invulnerableTimer: number;
  private _freezeActive: boolean;
  private _blizzardActive: boolean;
  private _blizzardTimer: number;
  private _armageddonPhase: ArmageddonPhase;
  private _armageddonTimer: number;
  private _record: number;
  private readonly _config: DifficultyConfig;

  private constructor(
    difficulty: Difficulty,
    config: DifficultyConfig,
    archers: Archer[],
    abilities: Map<AbilityId, Ability>
  ) {
    this._phase = 'menu';
    this._difficulty = difficulty;
    this._level = 1;
    this._levelTimer = config.levelTimerBase + config.levelTimerStep * 1;
    this._levelTimerMax = this._levelTimer;
    this._hp = config.baseHp;
    this._maxHp = config.baseHp;
    this._energy = config.baseEnergy;
    this._maxEnergy = config.baseEnergy;
    this._coins = 0;
    this._pendingTalentPoints = 0;
    this._archers = archers;
    this._spiders = new Map();
    this._arrows = new Map();
    this._abilities = abilities;
    this._isInvulnerable = false;
    this._invulnerableTimer = 0;
    this._freezeActive = false;
    this._blizzardActive = false;
    this._blizzardTimer = 0;
    this._armageddonPhase = 'none';
    this._armageddonTimer = 0;
    this._record = 1;
    this._config = config;
  }

  public static createNew(difficulty: Difficulty, config: DifficultyConfig): GameState {
    const archers: Archer[] = [];
    for (let lane = 0; lane < 9; lane++) {
      archers.push(new ArcherEntity(lane, config.shootCooldown));
    }

    const abilities = new Map<AbilityId, Ability>();
    const abilityIds: AbilityId[] = ['freeze', 'blizzard', 'prep', 'heal', 'volley', 'stand', 'armageddon', 'recharge'];
    for (const id of abilityIds) {
      const abilityConfig = config.abilities[id];
      abilities.set(id, new Ability(id, ABILITY_UNLOCK_LEVELS[id], abilityConfig.cooldown));
    }

    return new GameState(difficulty, config, archers, abilities);
  }

  public get phase(): GamePhase {
    return this._phase;
  }

  public get difficulty(): Difficulty {
    return this._difficulty;
  }

  public get level(): number {
    return this._level;
  }

  public get levelTimer(): number {
    return this._levelTimer;
  }

  public get levelTimerMax(): number {
    return this._levelTimerMax;
  }

  public get hp(): number {
    return this._hp;
  }

  public get maxHp(): number {
    return this._maxHp;
  }

  public get energy(): number {
    return this._energy;
  }

  public get maxEnergy(): number {
    return this._maxEnergy;
  }

  public get coins(): number {
    return this._coins;
  }

  public get pendingTalentPoints(): number {
    return this._pendingTalentPoints;
  }

  public get archers(): readonly Archer[] {
    return this._archers;
  }

  public get spiders(): ReadonlyMap<string, Spider> {
    return this._spiders;
  }

  public get arrows(): ReadonlyMap<string, Arrow> {
    return this._arrows;
  }

  public get abilities(): ReadonlyMap<AbilityId, Ability> {
    return this._abilities;
  }

  public get isInvulnerable(): boolean {
    return this._isInvulnerable;
  }

  public get invulnerableTimer(): number {
    return this._invulnerableTimer;
  }

  public get freezeActive(): boolean {
    return this._freezeActive;
  }

  public get blizzardActive(): boolean {
    return this._blizzardActive;
  }

  public get blizzardTimer(): number {
    return this._blizzardTimer;
  }

  public get armageddonPhase(): ArmageddonPhase {
    return this._armageddonPhase;
  }

  public get armageddonTimer(): number {
    return this._armageddonTimer;
  }

  public get record(): number {
    return this._record;
  }

  public get config(): DifficultyConfig {
    return this._config;
  }

  public addSpider(spider: Spider): void {
    this._spiders.set(spider.id, spider);
  }

  public removeSpider(id: string): void {
    this._spiders.delete(id);
  }

  public addArrow(arrow: Arrow): void {
    this._arrows.set(arrow.id, arrow);
  }

  public removeArrow(id: string): void {
    this._arrows.delete(id);
  }

  public modifyHp(delta: number): void {
    this._hp = Math.max(0, Math.min(this._maxHp, this._hp + delta));
  }

  public modifyEnergy(delta: number): void {
    this._energy = Math.max(0, Math.min(this._maxEnergy, this._energy + delta));
  }

  public setPhase(phase: GamePhase): void {
    this._phase = phase;
  }

  public advanceLevel(): void {
    this._level += 1;
    const t = this._config.levelTimerBase + this._config.levelTimerStep * this._level;
    this._levelTimer = t;
    this._levelTimerMax = t;
  }

  public addCoins(amount: number): void {
    this._coins += amount;
  }

  public awardTalentPoint(): void {
    this._pendingTalentPoints += 1;
  }

  public spendTalentPoint(): void {
    if (this._pendingTalentPoints > 0) {
      this._pendingTalentPoints -= 1;
    }
  }

  public updateRecord(): void {
    this._record = Math.max(this._record, this._level);
  }

  public setInvulnerable(duration: number): void {
    this._isInvulnerable = true;
    this._invulnerableTimer = duration;
  }

  public tickInvulnerable(dt: number): void {
    if (!this._isInvulnerable) return;
    this._invulnerableTimer -= dt;
    if (this._invulnerableTimer <= 0) {
      this._invulnerableTimer = 0;
      this._isInvulnerable = false;
    }
  }

  public setBlizzard(duration: number): void {
    this._blizzardActive = true;
    this._blizzardTimer = duration;
  }

  public tickBlizzard(dt: number): void {
    if (!this._blizzardActive) return;
    this._blizzardTimer -= dt;
    if (this._blizzardTimer <= 0) {
      this._blizzardTimer = 0;
      this._blizzardActive = false;
    }
  }

  public setArmageddon(phase: ArmageddonPhase, timer?: number): void {
    this._armageddonPhase = phase;
    this._armageddonTimer = timer ?? 0;
  }

  public tickArmageddon(dt: number): void {
    if (this._armageddonPhase === 'none') return;
    this._armageddonTimer -= dt;
    if (this._armageddonTimer < 0) {
      this._armageddonTimer = 0;
    }
  }

  public setFreezeActive(active: boolean): void {
    this._freezeActive = active;
  }

  public getAbility(id: AbilityId): Ability {
    const ability = this._abilities.get(id);
    if (!ability) {
      throw new Error(`Ability ${id} not found`);
    }
    return ability;
  }

  public setMaxHp(value: number): void {
    this._maxHp = value;
  }

  public setMaxEnergy(value: number): void {
    this._maxEnergy = value;
  }

  public setLevelTimer(value: number): void {
    this._levelTimer = value;
    this._levelTimerMax = value;
  }

  public setRecord(value: number): void {
    this._record = value;
  }

  public tickLevelTimer(dt: number): void {
    this._levelTimer = Math.max(0, this._levelTimer - dt);
  }
}
