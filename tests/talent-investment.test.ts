import { describe, expect, it } from 'vitest';
import { GameSession } from '../src/domain/GameSession.js';
import { TALENTS, TALENT_ORDER } from '../src/content/talents.js';
import type { TalentId } from '../src/domain/types.js';
import { parseSave, restore, snapshot } from '../src/domain/save.js';

function investment(session: GameSession, id: TalentId, total: number, branchPoints: number) {
  const talent = session.talents.getTalent(id);
  const prerequisite = TALENTS[id].prerequisite;
  const ranks = prerequisite ? [{ id: prerequisite.id, rank: prerequisite.rank }] : [];
  let remaining = branchPoints - (prerequisite?.rank ?? 0);
  for (const candidate of TALENT_ORDER.filter(
    (candidate) =>
      candidate !== prerequisite?.id &&
      TALENTS[candidate].branch === talent.branch &&
      session.talents.getTalent(candidate).tier < talent.tier,
  )) {
    const rank = Math.min(remaining, session.talents.getTalent(candidate).maxRanks);
    ranks.push({ id: candidate, rank });
    remaining -= rank;
  }
  remaining = total - branchPoints;
  for (const candidate of TALENT_ORDER.filter(
    (candidate) => TALENTS[candidate].branch !== talent.branch,
  )) {
    const rank = Math.min(remaining, session.talents.getTalent(candidate).maxRanks);
    ranks.push({ id: candidate, rank });
    remaining -= rank;
  }
  session.talents.loadFromSave(ranks);
}

describe.each(['easy', 'normal', 'hard'] as const)('invested talent points on %s', (difficulty) => {
  it.each([
    ['tireless', 2, 10, 7],
    ['improvedPrep', 3, 20, 14],
    ['blizzardMastery', 4, 30, 21],
    ['quickInstinct', 5, 40, 28],
    ['permafrost', 6, 50, 35],
    ['recharge', 7, 60, 42],
  ] as const)(
    'opens %s at tier %s with %s total and %s branch points',
    (id, tier, total, branch) => {
      const session = new GameSession(difficulty, () => 0.999999, { level: 119 });
      session.state.pendingTalentPoints = 1000;
      expect(session.talents.getTalent(id)).toMatchObject({
        tier,
        requiredTotalPoints: total,
        requiredBranchPoints: branch,
      });
      investment(session, id, total - 1, branch);
      expect(session.talents.totalPoints()).toBe(total - 1);
      expect(session.talents.upgradeBlockReason(id)).toBe('total');
      expect(session.upgradeTalent(id)).toBe(false);
      expect(session.state.pendingTalentPoints).toBe(1000);

      investment(session, id, total, branch - 1);
      expect(session.talents.upgradeBlockReason(id)).toBe('branch');
      expect(session.upgradeTalent(id)).toBe(false);

      investment(session, id, total - 1, branch);
      session.state.level = 1;
      // The final point may go into a third branch, and the level has no effect.
      expect(session.upgradeTalent('hunterMastery')).toBe(true);
      expect(session.talents.totalPoints()).toBe(total);
      expect(session.upgradeTalent(id)).toBe(true);
      expect(session.state.pendingTalentPoints).toBe(998);
      expect(session.talents.totalPoints()).toBe(total + 1);
    },
  );

  it('keeps previously learned talents while enforcing current requirements for another rank', () => {
    const session = new GameSession(difficulty, () => 0.999999, { level: 60 });
    session.talents.loadFromSave([{ id: 'permafrost', rank: 2 }]);
    session.refreshStats();
    const loaded = restore(parseSave(snapshot(session))!);
    expect(loaded.talents.getRank('permafrost')).toBe(2);
    expect(loaded.state.stats.permafrostSlow).toBe(0.08);
    expect(loaded.talents.totalPoints()).toBe(2);
    expect(loaded.upgradeTalent('permafrost')).toBe(false);
  });
});
