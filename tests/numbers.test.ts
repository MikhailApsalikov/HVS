import { describe, expect, it } from 'vitest';
import { calculate, roundValue, type Modifier } from '../src/domain/rules/numbers.js';
import { STATS } from '../src/domain/rules/stats.js';

const effects: Modifier[] = [
  { source: 'item1', kind: 'flat', value: 7 },
  { source: 'item2', kind: 'flat', value: 2 },
  { source: 'talent1', kind: 'percent', value: 5 },
  { source: 'talent2', kind: 'percent', value: 15 },
  { source: 'curse1', kind: 'percent', value: -5 },
  { source: 'curse2', kind: 'percent', value: -20 },
  { source: 'curse3', kind: 'flat', value: -3 },
  { source: 'curse4', kind: 'flat', value: -17 },
];

describe('agreed bonus contract', () => {
  it('reproduces every stage of the product example and rounds agility to 37', () => {
    const result = calculate(53, effects, STATS.agility.policy);
    expect(result.afterFlatBonuses).toBe(62);
    expect(result.afterPercentBonuses).toBeCloseTo(74.865, 10);
    expect(result.afterPercentPenalties).toBeCloseTo(56.8974, 10);
    expect(result.afterFlatPenalties).toBeCloseTo(36.8974, 10);
    expect(result.value).toBe(37);
  });
  it('is independent of equip/source order', () => {
    for (let offset = 0; offset < effects.length; offset++) {
      const reordered = [...effects.slice(offset), ...effects.slice(0, offset)].reverse();
      expect(calculate(53, reordered, STATS.agility.policy).value).toBe(37);
    }
  });
  it('subtracts flat penalties after percentage penalties', () => {
    expect(
      calculate(
        60,
        [
          { source: 'talent', kind: 'percent', value: -3 },
          { source: 'item', kind: 'flat', value: -6 },
        ],
        STATS['prep.cooldown'].policy,
      ).value,
    ).toBe(52.2);
  });
  it('never rounds the intermediate steps', () => {
    expect(
      calculate(0.49, [{ source: 'x', kind: 'percent', value: 100 }], { digits: 0 }).value,
    ).toBe(1);
  });
  it('allows flat bonuses to a zero base', () => {
    expect(
      calculate(
        0,
        [
          { source: 'x', kind: 'flat', value: 10 },
          { source: 'y', kind: 'percent', value: 20 },
        ],
        { digits: 0 },
      ).value,
    ).toBe(12);
  });
  it('clamps only the final result to the meaningful bounds', () => {
    expect(
      calculate(10, [{ source: 'x', kind: 'flat', value: -50 }], STATS.shootCost.policy).value,
    ).toBe(0);
    expect(calculate(10, [], STATS['volley.lanes'].policy).value).toBe(9);
    expect(calculate(2, [], STATS.jackpotChance.policy).value).toBe(1);
    expect(
      calculate(1, [{ source: 'x', kind: 'percent', value: -100 }], STATS.maxHp.policy).value,
    ).toBe(0);
  });
  it.each([NaN, Infinity, -Infinity])('rejects nonfinite base/modifiers: %s', (value) => {
    expect(() => calculate(value, [], { digits: 0 })).toThrow();
    expect(() => calculate(0, [{ source: 'bad', kind: 'flat', value }], { digits: 0 })).toThrow();
    expect(() => roundValue(value, { digits: 0 })).toThrow();
  });
  it('rejects a percentage penalty that would reverse the sign', () => {
    expect(() =>
      calculate(100, [{ source: 'bad', kind: 'percent', value: -101 }], { digits: 0 }),
    ).toThrow();
  });
});

describe('rounding by meaning', () => {
  it.each([
    [1.005, 1.01],
    [2.675, 2.68],
    [0.0049, 0],
    [36.8974, 36.9],
  ])('rounds seconds %s to %s', (input, expected) => {
    expect(roundValue(input, STATS.shootCooldown.policy)).toBe(expected);
  });
  it('keeps fine precision for probabilities and normalized movement', () => {
    expect(roundValue(0.00065, STATS.spawnProbability.policy)).toBe(0.00065);
    expect(roundValue(0.1234567, STATS.spiderSpeed.policy)).toBe(0.123457);
  });
  it('floors sale refunds explicitly', () => {
    expect(roundValue(17.5, { digits: 0, rounding: 'floor', min: 0 })).toBe(17);
  });
});
