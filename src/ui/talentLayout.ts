import { TALENTS } from '../content/talents.js';
import type { TalentId } from '../domain/types.js';

/** Reserve dependency columns before placing talents without a fixed column. */
export function talentTierColumns(ids: readonly TalentId[]): ReadonlyMap<TalentId, number> {
  const occupied = new Set<number>(ids.flatMap((id) => TALENTS[id].column ?? []));
  return new Map(
    ids.map((id) => {
      const column = TALENTS[id].column ?? [1, 2, 3].find((value) => !occupied.has(value));
      if (column === undefined) throw new RangeError('A talent tier has no free column');
      occupied.add(column);
      return [id, column];
    }),
  );
}
