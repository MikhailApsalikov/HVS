import { describe, expect, it } from 'vitest';
import { GameSession } from '../src/domain/GameSession.js';
import { TALENTS } from '../src/content/talents.js';
import { talentTierColumns } from '../src/ui/talentLayout.js';

describe('talent tree placement', () => {
  it('keeps Arsenal and Rationality aligned without covering their neighbours', () => {
    expect(
      Object.fromEntries(talentTierColumns(['agility', 'hunterArsenal', 'improvedIntellect'])),
    ).toEqual({
      agility: 2,
      hunterArsenal: 1,
      improvedIntellect: 3,
    });
    expect(
      Object.fromEntries(talentTierColumns(['tireless', 'lightningArrows', 'rationality'])),
    ).toEqual({
      tireless: 2,
      lightningArrows: 3,
      rationality: 1,
    });
  });

  it.each(['easy', 'normal', 'hard'] as const)(
    'gives every talent a unique cell in each tier on %s',
    (difficulty) => {
      const session = new GameSession(difficulty);
      for (const branch of ['defense', 'shooting', 'magic'] as const) {
        const branchTalents = session.talents.talents.filter((talent) => talent.branch === branch);
        for (const tier of new Set(branchTalents.map((talent) => talent.tier))) {
          const ids = branchTalents.filter((talent) => talent.tier === tier).map(({ id }) => id);
          for (const order of [ids, [...ids].reverse()]) {
            const columns = talentTierColumns(order);
            expect(new Set(columns.values()).size, `${branch}, tier ${tier}`).toBe(ids.length);
            for (const [id, column] of columns) {
              expect(column).toBeGreaterThanOrEqual(1);
              expect(column).toBeLessThanOrEqual(3);
              if (TALENTS[id].column !== undefined) expect(column).toBe(TALENTS[id].column);
            }
          }
        }
      }
    },
  );
});
