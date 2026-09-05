import { PRIMARY_STATS, STATS, type PrimaryStatId, type StatModifier } from '../rules/stats.js';

/** Primary attributes are deliberately not mapped to combat stats yet. */
export class Character {
  readonly base: Record<PrimaryStatId, number> = {
    endurance: STATS.endurance.base,
    agility: STATS.agility.base,
    intellect: STATS.intellect.base,
  };
  private readonly effects = new Map<string, readonly StatModifier[]>();

  setBase(stat: PrimaryStatId, value: number): void {
    if (!Number.isFinite(value) || value < 0) throw new RangeError('Invalid primary attribute');
    this.base[stat] = value;
  }
  /** Replace/remove a whole source, so unequipping cannot leave behind a bonus. */
  setModifiers(source: string, modifiers: readonly Omit<StatModifier, 'source'>[]): void {
    this.effects.set(
      source,
      modifiers.map((modifier) => ({ ...modifier, source })),
    );
  }
  removeModifiers(source: string): void {
    this.effects.delete(source);
  }
  getModifiers(): StatModifier[] {
    return [...this.effects.values()].flat();
  }
  restoreBase(values: Partial<Record<PrimaryStatId, number>>): void {
    for (const stat of PRIMARY_STATS) this.setBase(stat, values[stat] ?? STATS[stat].base);
  }
}
