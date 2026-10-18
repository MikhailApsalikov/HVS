import { describe, expect, it } from 'vitest';
import { GameSession } from '../src/domain/GameSession.js';
import { snapshot } from '../src/domain/save.js';

describe('time freeze energy cost through session commands', () => {
  it.each(['easy', 'normal', 'hard'] as const)(
    'costs exactly 25 energy on %s and resumes for free',
    (difficulty) => {
      const session = new GameSession(difficulty, () => 0.999999, { level: 4 });
      session.state.pendingTalentPoints = 0;
      session.confirmLevelUp();
      session.state.energy = 24;
      const before = snapshot(session);
      expect(session.activateAbility('freeze')).toBe('not_enough_energy');
      expect(snapshot(session)).toEqual(before);
      session.state.energy = 25;
      expect(session.activateAbility('freeze')).toBe('activated');
      expect(session.state.energy).toBe(0);
      expect(session.activateAbility('freeze')).toBe('deactivated');
      expect(session.state.energy).toBe(0);
      expect(session.activateAbility('freeze')).toBe('not_enough_energy');
    },
  );

  it.each(['easy', 'normal', 'hard'] as const)(
    'Ice Crown makes time freeze free on %s and selling it restores the cost',
    (difficulty) => {
      const session = new GameSession(difficulty, () => 0.999999, { level: 4, coins: 1000000 });
      expect(session.buyItem('l015')).toBe(true);
      expect(session.state.stats['freeze.cost']).toBe(0);
      session.state.pendingTalentPoints = 0;
      session.confirmLevelUp();
      session.state.energy = 0;
      expect(session.activateAbility('freeze')).toBe('activated');
      expect(session.activateAbility('freeze')).toBe('deactivated');
      expect(session.state.energy).toBe(0);
      session.state.character.setModifiers('extraCost', [
        { stat: 'freeze.cost', kind: 'flat', value: 50 },
      ]);
      session.refreshStats();
      expect(session.state.stats['freeze.cost']).toBe(0);
      session.state.character.removeModifiers('extraCost');
      session.state.phase = 'levelUp';
      expect(session.sellItem(0)).toBe(true);
      expect(session.state.stats['freeze.cost']).toBe(25);
      session.state.phase = 'playing';
      expect(session.activateAbility('freeze')).toBe('not_enough_energy');
    },
  );
});
