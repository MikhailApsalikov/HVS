import type { DifficultyConfig, AbilityId, SpiderType } from '../types.js';
import {
  STATS,
  type StatId,
  type StatModifier,
  type StatBases,
  type ResolvedStats,
} from './stats.js';
import { calculate, type Calculation, type Modifier } from './numbers.js';
import { SPIDERS } from '../../content/spiders.js';
import { WORLD } from './world.js';

/** Single query API shared by simulation and presentation. */
export class GameRules {
  private readonly modifiers = new Map<StatId, readonly StatModifier[]>();
  constructor(
    readonly config: DifficultyConfig,
    effects: readonly StatModifier[] = [],
    private readonly bases: StatBases = {},
  ) {
    for (const stat of Object.keys(STATS) as StatId[])
      this.modifiers.set(
        stat,
        effects.filter((effect) => effect.stat === stat),
      );
  }
  private base(id: StatId): number {
    if (this.bases[id] !== undefined) return this.bases[id];
    const aliases = {
      maxHp: 'baseHp',
      maxEnergy: 'baseEnergy',
      spawnInterval: 'spawnTickInterval',
    } as const;
    if (id in aliases) return this.config[aliases[id as keyof typeof aliases]];
    if (id === 'arrowSpeed') return 1 / this.config.arrowTravelTime;
    if (id.endsWith('.cost') || id.endsWith('.cooldown')) {
      const [ability, field] = id.split('.') as [AbilityId, 'cost' | 'cooldown'];
      return this.config.abilities[ability][field];
    }
    const configValue = this.config[id as keyof DifficultyConfig];
    return typeof configValue === 'number' ? configValue : STATS[id].base;
  }
  explain(id: StatId, base = this.base(id), additional: readonly Modifier[] = []): Calculation {
    const source = id === 'damageFactor' ? 'incomingDamage' : id;
    return calculate(
      base,
      [...(this.modifiers.get(source) ?? []), ...additional],
      STATS[id].policy,
    );
  }
  value(id: StatId, base?: number, additional: readonly Modifier[] = []): number {
    return this.explain(id, base, additional).value;
  }
  snapshot(): ResolvedStats {
    return Object.fromEntries(
      (Object.keys(STATS) as StatId[]).map((id) => [id, this.value(id)]),
    ) as Record<StatId, number>;
  }
  levelDuration(level: number): number {
    return this.value(
      'levelDuration',
      this.config.levelTimerBase + this.config.levelTimerStep * level,
    );
  }
  spawnProbability(level: number): number {
    return this.value('spawnProbability', this.config.spawnP0 + this.config.spawnDP * (level - 1));
  }
  spiderStats(
    type: SpiderType,
    level: number,
    speedRoll: number,
    damageRoll: number,
  ): { speed: number; damage: number } {
    const definition = SPIDERS[type];
    const variance = (roll: number): Modifier => ({
      source: 'spawn:variance',
      kind: 'percent',
      value: (2 * roll - 1) * this.config.spiderVariance * 100,
    });
    return {
      speed: this.value(
        'spiderSpeed',
        this.config.spiderSpeedBase + this.config.spiderSpeedStep * (level - 1),
        [
          variance(speedRoll),
          { source: `species:${type}`, kind: 'percent', value: definition.speedPercent },
        ],
      ),
      damage: this.value(
        'spiderDamage',
        this.config.spiderDamageBase + this.config.spiderDamageStep * (level - 1),
        [
          variance(damageRoll),
          { source: `species:${type}`, kind: 'percent', value: definition.damagePercent },
        ],
      ),
    };
  }
  killReward(base: number, jackpot: boolean): number {
    return this.value(
      'coinsPerKill',
      base,
      jackpot
        ? [{ source: 'jackpot', kind: 'percent', value: (WORLD.jackpotMultiplier - 1) * 100 }]
        : [],
    );
  }
}
