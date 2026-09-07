import { describe, expect, it } from 'vitest';
import { GameSession } from '../src/domain/GameSession.js';
import { parseSave, restore, snapshot } from '../src/domain/save.js';
import { addSpider } from './helpers.js';

describe('greed and hunter rewards through session commands', () => {
  it.each(['easy', 'normal', 'hard'] as const)(
    '%s allows five starting ranks and adds one gold per rank to actual kills',
    (difficulty) => {
      const session = new GameSession(difficulty, () => 0.5);
      session.state.pendingTalentPoints = 5;
      expect(session.talents.getTalent('greed')).toMatchObject({
        unlocksAtLevel: 0,
        requiredBranchPoints: 0,
        maxRanks: 5,
        branch: 'defense',
      });
      for (let rank = 1; rank <= 5; rank++) {
        session.state.phase = 'levelUp';
        expect(session.upgradeTalent('greed')).toBe(true);
        expect(session.state.stats.coinsPerKill).toBe(rank);
        expect(session.talents.branchPoints('defense')).toBe(rank);
        session.state.phase = 'playing';
        session.state.energy = session.state.maxEnergy;
        session.state.archers[0].start(0);
        const spider = addSpider(session, 'normal', 0, 0.95);
        expect(session.shootLane(0)).toBe('shot');
        session.tick(0.31);
        expect(session.drainEvents()).toContainEqual({
          type: 'coinDrop',
          spiderId: spider.id,
          coins: 2 + rank,
          jackpot: false,
        });
      }
      session.state.phase = 'levelUp';
      session.state.pendingTalentPoints = 1;
      expect(session.upgradeTalent('greed')).toBe(false);
      expect(session.state.pendingTalentPoints).toBe(1);
      const loaded = restore(parseSave(snapshot(session))!);
      expect(loaded.talents.getRank('greed')).toBe(5);
      expect(loaded.state.stats.coinsPerKill).toBe(5);
    },
  );

  it('requires all five greed ranks and triples the full reward including greed', () => {
    const session = new GameSession('normal', () => 0.01);
    session.state.level = 20;
    session.state.initialTalentPick = false;
    session.state.pendingTalentPoints = 30;
    for (const id of ['endurance', 'improvedEndurance'] as const)
      for (let rank = 0; rank < 7; rank++) expect(session.upgradeTalent(id)).toBe(true);
    for (let rank = 0; rank < 5; rank++) {
      const points = session.state.pendingTalentPoints;
      expect(session.upgradeTalent('hunterReward')).toBe(false);
      expect(session.state.pendingTalentPoints).toBe(points);
      expect(session.upgradeTalent('greed')).toBe(true);
    }
    expect(session.upgradeTalent('hunterReward')).toBe(true);
    session.state.phase = 'playing';
    const spider = addSpider(session, 'normal', 0, 0.95);
    expect(session.shootLane(0)).toBe('shot');
    session.tick(0.31);
    expect(session.drainEvents()).toContainEqual({
      type: 'coinDrop',
      spiderId: spider.id,
      coins: 21,
      jackpot: true,
    });
  });
});
