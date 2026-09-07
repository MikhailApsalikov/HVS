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

export function talentRankEffects(id: TalentId, rank: number, level = 1): StatModifier[] {
  return rank === 0
    ? []
    : [
        ...TALENTS[id].effects.map((effect) => ({
          ...effect,
          source: `talent:${id}`,
          value: effect.value * rank,
        })),
        ...(TALENTS[id].fixedEffects ?? []).map((effect) => ({
          ...effect,
          source: `talent:${id}`,
        })),
        ...(TALENTS[id].growth && level > 1
          ? [
              {
                source: `talent:${id}`,
                stat: TALENTS[id].growth.stat,
                kind: 'flat' as const,
                value: TALENTS[id].growth.value * rank * Math.max(0, level - 1),
              },
            ]
          : []),
      ];
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
  hasPrerequisite(id: TalentId): boolean {
    const prerequisite = TALENTS[id].prerequisite;
    return !prerequisite || this.getRank(prerequisite.id) >= prerequisite.rank;
  }
  upgradeBlockReason(
    id: TalentId,
    level: number,
  ): 'level' | 'branch' | 'prerequisite' | 'maxed' | null {
    const talent = this.getTalent(id);
    if (level < talent.unlocksAtLevel) return 'level';
    if (this.branchPoints(talent.branch) < talent.requiredBranchPoints) return 'branch';
    if (!this.hasPrerequisite(id)) return 'prerequisite';
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
  getModifiers(level = 1): StatModifier[] {
    return this.talents.flatMap(({ id, rank }) => talentRankEffects(id, rank, level));
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
  loadFromSave(data: readonly { id: string; rank: number }[]): number {
    this.ranks.clear();
    for (const entry of data) {
      if (!Object.hasOwn(TALENTS, entry.id) || !Number.isInteger(entry.rank)) continue;
      const id = entry.id as TalentId;
      this.ranks.set(id, Math.max(0, entry.rank));
    }
    let refundedPoints = 0;
    for (const [id, rank] of this.ranks) {
      const capped = Math.min(rank, this.config.talents[id].maxRanks);
      refundedPoints += rank - capped;
      this.ranks.set(id, capped);
    }
    return refundedPoints;
  }
}
