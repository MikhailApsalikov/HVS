import type { DifficultyConfig, TalentId } from '../config/types.js';

export interface TalentState {
  readonly id: TalentId;
  readonly rank: number;
  readonly maxRanks: number;
  readonly unlocksAtLevel: number;
}

export class TalentSystem {
  private _talents: Map<TalentId, TalentState>;

  public constructor(config: DifficultyConfig) {
    this._talents = new Map();
    const talentIds: TalentId[] = [
      'endurance',
      'spiderArmor',
      'tireless',
      'agility',
      'healBoost',
      'hunterMastery',
      'improvedPrep',
      'volleyMastery',
      'rapidFire',
      'dutyBound',
      'blizzardMastery',
      'hunterReward',
      'quickInstinct',
      'hunterArsenal',
    ];
    for (const id of talentIds) {
      const levelConfig = config.talents[id];
      this._talents.set(id, {
        id,
        rank: 0,
        maxRanks: levelConfig.maxRanks,
        unlocksAtLevel: levelConfig.unlocksAtLevel,
      });
    }
  }

  public get talents(): readonly TalentState[] {
    return [...this._talents.values()];
  }

  public getTalent(id: TalentId): TalentState {
    const state = this._talents.get(id);
    if (!state) {
      throw new Error(`Talent ${id} not found`);
    }
    return state;
  }

  public canUpgrade(id: TalentId, playerLevel: number): boolean {
    const state = this.getTalent(id);
    return state.rank < state.maxRanks && playerLevel >= state.unlocksAtLevel;
  }

  public upgrade(id: TalentId): void {
    const state = this.getTalent(id);
    this._talents.set(id, {
      ...state,
      rank: state.rank + 1,
    });
  }

  public hasAvailableUpgrades(playerLevel: number): boolean {
    return this.talents.some((t) => this.canUpgrade(t.id, playerLevel));
  }

  public getRank(id: TalentId): number {
    return this.getTalent(id).rank;
  }

  public getMaxHpBonus(): number {
    return this.getRank('endurance') * 425;
  }

  public getEnduranceEnergyRestore(): number {
    return this.getRank('endurance') * 3;
  }

  public getDamageReduction(): number {
    return this.getRank('spiderArmor') * 0.07;
  }

  public getEnergyRegenMultiplier(): number {
    return 1 + this.getRank('tireless') * 0.1;
  }

  public getMaxEnergyBonus(): number {
    return this.getRank('agility') * 120;
  }

  public getHealBonus(): number {
    return this.getRank('healBoost') * 150;
  }

  public getHpRegenBonus(): number {
    return this.getRank('healBoost') * 2;
  }

  public getShootCostReduction(): number {
    return this.getRank('hunterMastery') * 2;
  }

  public getPrepCooldownReduction(): number {
    return this.getRank('improvedPrep') * 6;
  }

  public getVolleyExtraLanes(): number {
    return this.getRank('volleyMastery') * 1;
  }

  public getShootCooldownMultiplier(): number {
    return Math.max(0.3, 1 - this.getRank('rapidFire') * 0.1);
  }

  public getArrowSpeedMultiplier(): number {
    return 1 + this.getRank('rapidFire') * 0.1;
  }

  public getStandDurationBonus(): number {
    return this.getRank('dutyBound') * 1;
  }

  public getStandCooldownReduction(): number {
    return this.getRank('dutyBound') * 12;
  }

  public getBlizzardSlowBonus(): number {
    return this.getRank('blizzardMastery') * 0.07;
  }

  public getBlizzardDurationBonus(): number {
    return this.getRank('blizzardMastery') * 1;
  }

  public getHunterRewardTripleChance(): number {
    return this.getRank('hunterReward') * 0.07;
  }

  public getAbilityCooldownMultiplier(): number {
    return 1 - this.getRank('quickInstinct') * 0.015;
  }

  public getInventorySlots(): number {
    return 1 + this.getRank('hunterArsenal');
  }

  public loadFromSave(data: { id: string; rank: number }[]): void {
    for (const item of data) {
      const id = item.id as TalentId;
      const existing = this._talents.get(id);
      if (existing) {
        const clampedRank = Math.min(Math.max(0, item.rank), existing.maxRanks);
        this._talents.set(id, {
          ...existing,
          rank: clampedRank,
        });
      }
    }
  }

  public toSaveData(): { id: string; rank: number }[] {
    return this.talents.map((t) => ({ id: t.id, rank: t.rank }));
  }
}
