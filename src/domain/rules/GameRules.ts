import type { DifficultyConfig, AbilityId, SpiderType } from '../types.js';
import {
  STATS,
  BURNER_ENERGY_PER_LEVEL,
  GOLDEN_SPIDER_REWARD,
  PRIMARY_STATS,
  PRIMARY_GROWTH,
  type PrimaryStatId,
  type StatId,
  type StatModifier,
  type StatBases,
  type ResolvedStats,
} from './stats.js';
import { calculate, type Calculation, type Modifier } from './numbers.js';
import { SPIDERS } from '../../content/spiders.js';
import { WORLD } from './world.js';
import { armorReduction, attributeModifiers } from './attributes.js';

/** Single query API shared by simulation and presentation. */
export class GameRules {
  private readonly modifiers = new Map<StatId, readonly StatModifier[]>();
  readonly attributeEffects: Readonly<Record<PrimaryStatId, readonly StatModifier[]>>;
  constructor(
    readonly config: DifficultyConfig,
    effects: readonly StatModifier[] = [],
    private readonly bases: StatBases = {},
    readonly level = 1,
  ) {
    const criticalShotLearned = effects.some(
      (effect) => effect.source === 'talent:criticalShot' && effect.value > 0,
    );
    const allEffects: StatModifier[] = [
      ...effects.filter(
        (effect) =>
          criticalShotLearned ||
          effect.stat !== 'criticalShotChance' ||
          !effect.source.startsWith('item:'),
      ),
      ...PRIMARY_STATS.map((stat): StatModifier => ({
        source: 'character:level',
        stat,
        kind: 'flat',
        value: Math.max(0, level - 1) * PRIMARY_GROWTH[stat],
      })),
    ];
    for (const stat of Object.keys(STATS) as StatId[])
      this.modifiers.set(
        stat,
        allEffects.filter((effect) => effect.stat === stat),
      );
    this.attributeEffects = attributeModifiers(
      {
        endurance: this.value('endurance'),
        agility: this.value('agility'),
        intellect: this.value('intellect'),
      },
      criticalShotLearned,
      effects.some((effect) => effect.source === 'talent:shieldBlock' && effect.value > 0),
    );
    for (const modifier of Object.values(this.attributeEffects).flat())
      this.modifiers.set(modifier.stat, [...this.modifiers.get(modifier.stat)!, modifier]);
    this.modifiers.set('incomingDamage', [
      ...this.modifiers.get('incomingDamage')!,
      {
        source: 'armor',
        stat: 'incomingDamage',
        kind: 'percent',
        value: -armorReduction(this.value('armor'), level, config.armorEffectiveness) * 100,
      },
    ]);
  }
  private base(id: StatId): number {
    if (this.bases[id] !== undefined) return this.bases[id];
    if (id === 'prep.overTime') return this.value('prep.energyRegen') * this.value('prep.duration');
    // Keep the previous total, including all bonuses, and defer only the fixed recovery.
    if (id === 'prep.instant') return this.value('prep.restore') - this.value('prep.overTime');
    if (id === 'armorReduction')
      return armorReduction(this.value('armor'), this.level, this.config.armorEffectiveness);
    const aliases = {
      maxHp: 'baseHp',
      maxEnergy: 'baseEnergy',
      spawnInterval: 'spawnTickInterval',
    } as const;
    if (id in aliases) return this.config[aliases[id as keyof typeof aliases]];
    if (id === 'arrowSpeed') return 1 / this.config.arrowTravelTime;
    if (id === 'burnerEnergy')
      return STATS.burnerEnergy.base + BURNER_ENERGY_PER_LEVEL * this.level;
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
  spiderTypeProbability(type: SpiderType, level: number): number {
    const definition = SPIDERS[type];
    if (level < definition.unlockLevel || !definition.chanceKey) return 0;
    const growth = definition.chanceGrowth;
    return this.value('spiderTypeProbability', this.config[definition.chanceKey], [
      {
        source: `species:${type}:level`,
        kind: 'flat',
        value: growth
          ? (Math.floor((level - definition.unlockLevel) / growth.levels) * growth.percent) / 100
          : 0,
      },
    ]);
  }
  spiderJumpLimit(type: SpiderType, level: number): number {
    const step = SPIDERS[type].jumpLevelStep;
    return step ? Math.floor(level / step) : 0;
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
        this.config.spiderDamageBase * (1 + this.config.spiderDamageGrowth * level) ** 2,
        [
          variance(damageRoll),
          { source: `species:${type}`, kind: 'percent', value: definition.damagePercent },
        ],
      ),
    };
  }
  killReward(base: number, jackpot: boolean, share = 1, golden = false): number {
    const jackpotModifiers: readonly Modifier[] = jackpot
      ? [
          {
            source: 'jackpot',
            kind: 'percent',
            value: (WORLD.jackpotMultiplier - 1) * 100,
          },
        ]
      : [];
    const reward = this.value('coinsPerKill', base, [
      ...jackpotModifiers,
      { source: 'reward:share', kind: 'percent', value: (share - 1) * 100 },
    ]);
    // Only the jackpot multiplies the golden bonus; ordinary reward modifiers do not apply.
    const extra = golden
      ? calculate(
          GOLDEN_SPIDER_REWARD.base + GOLDEN_SPIDER_REWARD.perLevel * this.level,
          jackpotModifiers,
          STATS.coinsPerKill.policy,
        ).value
      : 0;
    return reward + extra;
  }
}
