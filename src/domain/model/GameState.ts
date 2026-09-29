import type { AbilityId, Difficulty, DifficultyConfig, GamePhase } from '../types.js';
import type { GameRules } from '../rules/GameRules.js';
import type { ResolvedStats } from '../rules/stats.js';
import { ANTI_AFK, KILLING_STREAK } from '../rules/stats.js';
import { ABILITIES, ABILITY_ORDER } from '../../content/abilities.js';
import { WORLD } from '../rules/world.js';
import { clamp } from '../rules/numbers.js';
import { Cooldown } from './Cooldown.js';
import { Character } from './Character.js';
import { Spider } from './Spider.js';
import { Arrow } from './Arrow.js';

export type ArmageddonPhase = 'none' | 'charging' | 'firing';
export interface AimedFireWave {
  readonly remaining: number;
  readonly guaranteedCritical: boolean;
}

export class GameState {
  phase: GamePhase = 'levelUp';
  level: number;
  levelTimer: number;
  levelTimerMax: number;
  hp: number;
  energy: number;
  coins: number;
  pendingTalentPoints: number;
  record: number;
  initialTalentPick = true;
  freezeActive = false;
  invulnerableTimer = 0;
  goldLockTimer = 0;
  healingReductionTimer = 0;
  poisonTimer = 0;
  poisonTickTimer = 0;
  poisonDamage: readonly number[] = [];
  lastHopeTimer = 0;
  prepTimer = 0;
  bestDefenseCooldown = 0;
  adrenalineTimer = 0;
  adrenalineShots = 0;
  eagleEyeTimer = 0;
  eagleEyeShots = 0;
  killingStreakLearned = false;
  private streakStacks = 0;
  killingStreakProgress = 0;
  killingStreakDecayProgress = 0;
  aimedFireWaves: readonly AimedFireWave[] = [];
  antiAfkIdleTimer = 0;
  antiAfkStacks = 0;
  antiAfkRecoveryTimer = 0;
  readonly talentAbilities = new Set<AbilityId>();
  blizzardTimer = 0;
  armageddonPhase: ArmageddonPhase = 'none';
  armageddonTimer = 0;
  coinAccumulator = 0;
  spawnAccumulator = 0;
  nextEntityId = 1;
  readonly character = new Character();
  readonly archers = Array.from({ length: WORLD.lanes }, () => new Cooldown());
  readonly abilities = new Map<AbilityId, Cooldown>(
    ABILITY_ORDER.map((id) => [id, new Cooldown()]),
  );
  readonly spiders = new Map<string, Spider>();
  readonly arrows = new Map<string, Arrow>();
  stats: ResolvedStats;

  constructor(
    readonly difficulty: Difficulty,
    readonly config: DifficultyConfig,
    public rules: GameRules,
  ) {
    this.level = this.pendingTalentPoints = this.record = rules.level;
    this.stats = rules.snapshot();
    this.hp = this.maxHp;
    this.energy = this.maxEnergy;
    this.coins = config.startingCoins;
    this.levelTimer = this.levelTimerMax = rules.levelDuration(this.level);
  }
  get maxHp(): number {
    return this.stats.maxHp;
  }
  get maxEnergy(): number {
    return this.stats.maxEnergy;
  }
  get isInvulnerable(): boolean {
    return this.invulnerableTimer > 0;
  }
  get blizzardActive(): boolean {
    return this.blizzardTimer > 0;
  }
  get adrenalineActive(): boolean {
    return this.adrenalineTimer > 0 && this.adrenalineShots > 0;
  }
  get currentEnergyRegen(): number {
    return this.stats.energyRegen + (this.prepTimer > 0 ? this.stats['prep.energyRegen'] : 0);
  }
  get currentShootCost(): number {
    return this.adrenalineActive
      ? 0
      : this.rules.value('shootCost', undefined, [
          { source: 'effect:killingStreak', kind: 'flat', value: -this.killingStreakStacks },
        ]);
  }
  get killingStreakFull(): boolean {
    return this.killingStreakStacks >= this.killingStreakMaximum;
  }
  get killingStreakStacks(): number {
    return this.streakStacks;
  }
  set killingStreakStacks(value: number) {
    this.streakStacks = clamp(Math.floor(value), 0, KILLING_STREAK.maxStacks);
    if (this.killingStreakFull) this.killingStreakProgress = 0;
    if (this.killingStreakExcess === 0) this.killingStreakDecayProgress = 0;
  }
  get killingStreakMaximum(): number {
    return this.killingStreakLearned ? this.stats['killingStreak.maxStacks'] : 0;
  }
  get killingStreakExcess(): number {
    return Math.max(0, this.killingStreakStacks - this.killingStreakMaximum);
  }
  get killingStreakDisplayMaximum(): number {
    return Math.max(this.killingStreakMaximum, this.stats['prep.stacks'], this.killingStreakStacks);
  }
  get killingStreakDecayRemaining(): number {
    return this.killingStreakExcess > 0
      ? KILLING_STREAK.decayInterval - this.killingStreakDecayProgress
      : 0;
  }
  get killingStreakDecayFraction(): number {
    return this.killingStreakDecayRemaining / KILLING_STREAK.decayInterval;
  }
  prepareKillingStreak(): void {
    if (this.stats['prep.stacks'] <= this.killingStreakStacks) return;
    this.killingStreakStacks = this.stats['prep.stacks'];
    this.killingStreakDecayProgress = 0;
  }
  tickKillingStreak(dt: number): void {
    if (this.killingStreakExcess > 0) {
      const progress = this.killingStreakDecayProgress + dt;
      const lost = Math.min(
        this.killingStreakExcess,
        Math.floor((progress + 1e-9) / KILLING_STREAK.decayInterval),
      );
      this.killingStreakStacks -= lost;
      this.killingStreakDecayProgress =
        this.killingStreakExcess > 0
          ? Math.max(0, progress - lost * KILLING_STREAK.decayInterval)
          : 0;
    }
    this.advanceKillingStreak(dt);
  }
  get killingStreakRemaining(): number {
    return this.killingStreakFull
      ? 0
      : Math.max(0, this.stats['killingStreak.interval'] - this.killingStreakProgress);
  }
  get killingStreakFraction(): number {
    return this.killingStreakFull
      ? 1
      : this.killingStreakProgress / this.stats['killingStreak.interval'];
  }
  advanceKillingStreak(seconds: number): void {
    if (!this.killingStreakLearned || this.killingStreakFull) return;
    const progress = this.killingStreakProgress + seconds;
    const interval = this.stats['killingStreak.interval'];
    const gained = Math.floor((progress + 1e-9) / interval);
    this.killingStreakStacks = Math.min(
      this.killingStreakMaximum,
      this.killingStreakStacks + gained,
    );
    this.killingStreakProgress = this.killingStreakFull
      ? 0
      : Math.max(0, progress - gained * interval);
  }
  get eagleEyeActive(): boolean {
    return this.eagleEyeTimer > 0 && this.eagleEyeShots > 0;
  }
  abilityActiveTimer(id: AbilityId): number {
    if (id === 'prep') return this.prepTimer;
    if (id === 'lastHope') return this.lastHopeTimer;
    if (id === 'stand') return this.invulnerableTimer;
    if (id === 'adrenaline') return this.adrenalineTimer;
    if (id === 'eagleEye') return this.eagleEyeTimer;
    return 0;
  }
  getAbility(id: AbilityId): Cooldown {
    return this.abilities.get(id)!;
  }
  isAbilityUnlocked(id: AbilityId): boolean {
    return ABILITIES[id].talent
      ? this.talentAbilities.has(id)
      : this.level >= ABILITIES[id].unlockLevel;
  }
  newId(prefix: string): string {
    return `${prefix}-${this.nextEntityId++}`;
  }
  modifyHp(delta: number): void {
    this.hp = clamp(this.hp + delta, 0, this.maxHp);
  }
  modifyEnergy(delta: number): void {
    this.energy = clamp(this.energy + delta, 0, this.maxEnergy);
  }
  /** Only successful player commands count as activity, never enemy energy burns. */
  spendEnergy(cost: number): void {
    this.modifyEnergy(-cost);
    if (cost <= 0) return;
    this.antiAfkIdleTimer = 0;
    if (this.antiAfkStacks > 0 && this.antiAfkRecoveryTimer === 0)
      this.antiAfkRecoveryTimer = ANTI_AFK.recoveryDuration;
  }
  get antiAfkEnabled(): boolean {
    return this.level >= ANTI_AFK.unlockLevel;
  }
  get antiAfkDamagePercent(): number {
    return this.antiAfkEnabled ? this.antiAfkStacks * ANTI_AFK.damagePerStack : 0;
  }
  get antiAfkRecoveryFraction(): number {
    return this.antiAfkRecoveryTimer / ANTI_AFK.recoveryDuration;
  }
  applyRules(rules: GameRules, grantHealthIncrease: boolean): void {
    const oldMaxHp = this.maxHp;
    this.rules = rules;
    this.stats = rules.snapshot();
    if (grantHealthIncrease) this.hp += Math.max(0, this.maxHp - oldMaxHp);
    this.modifyHp(0);
    this.modifyEnergy(0);
  }
}
