/** A signed percentage is expressed in percent: 5 means +5%, -20 means -20%. */
export interface Modifier {
  readonly source: string;
  readonly kind: 'flat' | 'percent';
  readonly value: number;
}

export interface NumberPolicy {
  readonly digits: number;
  readonly min?: number;
  readonly max?: number;
  readonly rounding?: 'nearest' | 'floor';
}

export interface Calculation {
  readonly base: number;
  readonly afterFlatBonuses: number;
  readonly afterPercentBonuses: number;
  readonly afterPercentPenalties: number;
  readonly afterFlatPenalties: number;
  readonly value: number;
  readonly modifiers: readonly Modifier[];
}

export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

export function roundValue(value: number, policy: NumberPolicy): number {
  if (!Number.isFinite(value)) throw new RangeError('A game value must be finite');
  const factor = 10 ** policy.digits;
  // Correct only floating point representation error at the rounding boundary.
  const scaled = value * factor;
  const corrected = scaled + Number.EPSILON * Math.max(1, Math.abs(scaled));
  const rounded =
    (policy.rounding === 'floor' ? Math.floor(corrected) : Math.round(corrected)) / factor;
  return clamp(rounded, policy.min ?? -Infinity, policy.max ?? Infinity);
}

/** The only bonus formula. No intermediate rounding or clamping. */
export function calculate(
  base: number,
  modifiers: readonly Modifier[],
  policy: NumberPolicy,
): Calculation {
  if (!Number.isFinite(base)) throw new RangeError('The base must be finite');
  let flatBonus = 0,
    positiveFactor = 1,
    negativeFactor = 1,
    flatPenalty = 0;
  for (const modifier of modifiers) {
    const { value, kind } = modifier;
    if (!Number.isFinite(value) || (kind === 'percent' && value < -100)) {
      throw new RangeError(`Invalid modifier from ${modifier.source}`);
    }
    if (kind === 'flat') {
      if (value >= 0) flatBonus += value;
      else flatPenalty += value;
    } else if (value >= 0) positiveFactor *= 1 + value / 100;
    else negativeFactor *= 1 + value / 100;
  }
  const afterFlatBonuses = base + flatBonus;
  const afterPercentBonuses = afterFlatBonuses * positiveFactor;
  const afterPercentPenalties = afterPercentBonuses * negativeFactor;
  const afterFlatPenalties = afterPercentPenalties + flatPenalty;
  return {
    base,
    afterFlatBonuses,
    afterPercentBonuses,
    afterPercentPenalties,
    afterFlatPenalties,
    value: roundValue(afterFlatPenalties, policy),
    modifiers,
  };
}
