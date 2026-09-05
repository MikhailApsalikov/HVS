import type { DifficultyConfig, TalentId, TalentBranch } from '../types.js';
import type { StatModifier, ResolvedStats } from '../rules/stats.js';
import { TALENTS, TALENT_ORDER, TALENT_TIER_RULES } from '../../content/talents.js';

export interface TalentState {
  readonly id: TalentId;
  readonly rank: number;
  readonly maxRanks: number;
  readonly unlocksAtLevel: number;
  readonly branch: TalentBranch;
  readonly tier: number;
  readonly requiredBranchPoints: number;
}

export class TalentSystem {
  private readonly ranks = new Map<TalentId, number>();
  constructor(private readonly config: DifficultyConfig) {}

  get talents(): readonly TalentState[] {
    return TALENT_ORDER.map((id) => this.getTalent(id));
  }
  getRank(id: TalentId): number {
    return this.ranks.get(id) ?? 0;
  }
  getTalent(id: TalentId): TalentState {
    const config = this.config.talents[id];
    const tier = Math.floor(config.unlocksAtLevel / TALENT_TIER_RULES.levelsPerTier) + 1;
    return {
      id,
      rank: this.getRank(id),
      ...config,
      branch: TALENTS[id].branch,
      tier,
      requiredBranchPoints: (tier - 1) * TALENT_TIER_RULES.pointsPerTier,
    };
  }
  branchPoints(branch: TalentBranch): number {
    return TALENT_ORDER.reduce(
      (sum, id) => sum + (TALENTS[id].branch === branch ? this.getRank(id) : 0),
      0,
    );
  }
  upgradeBlockReason(id: TalentId, level: number): 'level' | 'branch' | 'maxed' | null {
    const talent = this.getTalent(id);
    if (level < talent.unlocksAtLevel) return 'level';
    if (this.branchPoints(talent.branch) < talent.requiredBranchPoints) return 'branch';
    if (talent.rank >= talent.maxRanks) return 'maxed';
    return null;
  }
  canUpgrade(id: TalentId, level: number): boolean {
    return Object.hasOwn(TALENTS, id) && this.upgradeBlockReason(id, level) === null;
  }
  hasAvailableUpgrades(level: number): boolean {
    return TALENT_ORDER.some((id) => this.canUpgrade(id, level));
  }
  upgrade(id: TalentId, level: number): boolean {
    if (!this.canUpgrade(id, level)) return false;
    this.ranks.set(id, this.getRank(id) + 1);
    return true;
  }
  getModifiers(): StatModifier[] {
    return this.talents.flatMap(({ id, rank }) =>
      rank === 0
        ? []
        : TALENTS[id].effects.map((effect) => ({
            ...effect,
            source: `talent:${id}`,
            value: effect.value * rank,
          })),
    );
  }
  getScalingModifiers(stats: ResolvedStats): StatModifier[] {
    return this.talents.flatMap(({ id, rank }) => {
      const scaling = TALENTS[id].scaling;
      return scaling && rank > 0
        ? [
            {
              ...scaling.effect,
              source: `talent:${id}`,
              value:
                Math.floor(stats[scaling.attribute] / scaling.step) * scaling.effect.value * rank,
            },
          ]
        : [];
    });
  }
  toSaveData(): { id: TalentId; rank: number }[] {
    return this.talents.map(({ id, rank }) => ({ id, rank }));
  }
  loadFromSave(data: readonly { id: string; rank: number }[]): void {
    this.ranks.clear();
    for (const entry of data) {
      if (!Object.hasOwn(TALENTS, entry.id) || !Number.isInteger(entry.rank)) continue;
      const id = entry.id as TalentId;
      this.ranks.set(id, Math.max(0, Math.min(entry.rank, this.config.talents[id].maxRanks)));
    }
  }
}
