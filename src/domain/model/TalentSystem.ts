import type { DifficultyConfig, TalentId } from '../types.js';
import type { StatModifier } from '../rules/stats.js';
import { TALENTS, TALENT_ORDER } from '../../content/talents.js';

export interface TalentState {
  readonly id: TalentId;
  readonly rank: number;
  readonly maxRanks: number;
  readonly unlocksAtLevel: number;
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
    return { id, rank: this.getRank(id), ...this.config.talents[id] };
  }
  canUpgrade(id: TalentId, level: number): boolean {
    return (
      Object.hasOwn(TALENTS, id) &&
      level >= this.config.talents[id].unlocksAtLevel &&
      this.getRank(id) < this.config.talents[id].maxRanks
    );
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
