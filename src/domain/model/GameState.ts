import type { AbilityId, Difficulty, DifficultyConfig, GamePhase } from '../types.js';
import type { GameRules } from '../rules/GameRules.js';
import type { ResolvedStats } from '../rules/stats.js';
import { ABILITIES, ABILITY_ORDER } from '../../content/abilities.js';
import { WORLD } from '../rules/world.js';
import { clamp } from '../rules/numbers.js';
import { Cooldown } from './Cooldown.js';
import { Character } from './Character.js';
import { Spider } from './Spider.js';
import { Arrow } from './Arrow.js';

export type ArmageddonPhase = 'none' | 'charging' | 'firing';

export class GameState {
  phase: GamePhase = 'levelUp';
  level = 1;
  levelTimer: number;
  levelTimerMax: number;
  hp: number;
  energy: number;
  coins: number;
  pendingTalentPoints = 1;
  record = 1;
  initialTalentPick = true;
  freezeActive = false;
  invulnerableTimer = 0;
  lastHopeTimer = 0;
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
  applyRules(rules: GameRules, grantHealthIncrease: boolean): void {
    const oldMaxHp = this.maxHp;
    this.rules = rules;
    this.stats = rules.snapshot();
    if (grantHealthIncrease) this.hp += Math.max(0, this.maxHp - oldMaxHp);
    this.modifyHp(0);
    this.modifyEnergy(0);
  }
}
