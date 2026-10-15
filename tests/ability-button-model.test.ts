import { describe, expect, it } from 'vitest';
import { abilityButtonAvailability } from '../src/ui/abilityButtonModel.js';

describe('ability button availability', () => {
  it('keeps a learned divine shield in place while exhaustion locks it', () => {
    const state = { isAbilityUnlocked: () => true, exhaustionTimer: 300 };
    expect(abilityButtonAvailability(state, 'stand')).toEqual({ hidden: false, locked: true });
    state.exhaustionTimer = 0;
    expect(abilityButtonAvailability(state, 'stand')).toEqual({ hidden: false, locked: false });
  });

  it('continues hiding talent abilities until they are learned', () => {
    expect(
      abilityButtonAvailability({ isAbilityUnlocked: () => false, exhaustionTimer: 300 }, 'stand'),
    ).toEqual({ hidden: true, locked: true });
  });

  it('keeps ordinary level-locked abilities visible', () => {
    expect(
      abilityButtonAvailability({ isAbilityUnlocked: () => false, exhaustionTimer: 0 }, 'heal'),
    ).toEqual({ hidden: false, locked: true });
  });

  it('leaves other learned abilities available during exhaustion', () => {
    const state = { isAbilityUnlocked: () => true, exhaustionTimer: 300 };
    for (const ability of ['lastHope', 'adrenaline', 'eagleEye', 'prep'] as const)
      expect(abilityButtonAvailability(state, ability)).toEqual({ hidden: false, locked: false });
  });
});
