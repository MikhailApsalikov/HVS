import { describe, expect, it } from 'vitest';
import type { PlayerEffect } from '../src/domain/model/PlayerEffect.js';
import { effectPanelGroups, PLAYER_EFFECT_ROW_CAPACITY } from '../src/ui/effectPanelModel.js';

function effects(count: number, kind: PlayerEffect['kind']): PlayerEffect[] {
  return Array.from({ length: count }, (_, index) => ({
    id: kind === 'buff' ? 'prep' : 'poison',
    name: `${kind} ${index}`,
    sprite: kind === 'buff' ? 'Preparation' : 'DebuffPoison',
    kind,
    remaining: 10 + index,
    stacks: null,
    source: kind === 'buff' ? 'ability' : 'spider',
    removableByCleanser: kind === 'buff',
  }));
}

describe('universal player effect rows', () => {
  it('keeps both groups empty when no effects are active', () => {
    expect(effectPanelGroups([])).toEqual({
      buff: { visible: [], overflow: [] },
      debuff: { visible: [], overflow: [] },
    });
  });

  it.each(['buff', 'debuff'] as const)('shows all five %s icons before overflowing', (kind) => {
    const active = effects(PLAYER_EFFECT_ROW_CAPACITY, kind);
    const group = effectPanelGroups(active)[kind];
    expect(group.visible).toEqual(active);
    expect(group.overflow).toEqual([]);
  });

  it.each([6, 9])('keeps five icons visible with %s active effects', (count) => {
    const active = effects(count, 'buff');
    const group = effectPanelGroups(active).buff;
    expect(group.visible).toEqual(active.slice(0, 5));
    expect(group.overflow).toEqual(active.slice(5));
    expect(group.visible).toHaveLength(5);
  });

  it('packs the remaining effects left after a middle effect disappears', () => {
    const active = effects(3, 'debuff');
    const before = effectPanelGroups(active).debuff;
    const after = effectPanelGroups([active[0], active[2]]).debuff;
    expect(before.visible).toEqual(active);
    expect(after.visible).toEqual([active[0], active[2]]);
    expect(after.overflow).toEqual([]);
  });

  it('gives buffs and debuffs their own five-icon capacity and ordered overflow', () => {
    const buffs = effects(7, 'buff');
    const debuffs = effects(6, 'debuff');
    const mixed = buffs.flatMap((buff, index) =>
      debuffs[index] ? [buff, debuffs[index]] : [buff],
    );
    const groups = effectPanelGroups(mixed);
    expect(groups.buff).toEqual({ visible: buffs.slice(0, 5), overflow: buffs.slice(5) });
    expect(groups.debuff).toEqual({ visible: debuffs.slice(0, 5), overflow: debuffs.slice(5) });
  });

  it('preserves input order, entity references and the caller’s immutable array', () => {
    const active = Object.freeze(
      effects(7, 'buff')
        .reverse()
        .map((effect) => Object.freeze(effect)),
    );
    const before = [...active];
    const group = effectPanelGroups(active).buff;
    expect(active).toEqual(before);
    expect([...group.visible, ...group.overflow]).toEqual(before);
    group.visible.forEach((effect, index) => expect(effect).toBe(active[index]));
    group.overflow.forEach((effect, index) => expect(effect).toBe(active[index + 5]));
  });
});
