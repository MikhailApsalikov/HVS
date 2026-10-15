import { describe, expect, it } from 'vitest';
import { GameSession } from '../src/domain/GameSession.js';
import type { GameState } from '../src/domain/model/GameState.js';
import { masochismHealthPerEnergy } from '../src/domain/rules/stats.js';
import { abilityDescription, shootDescription, talentDescription } from '../src/ui/presenters.js';

function arena(rank = 5) {
  const session = new GameSession('normal', () => 0.999999, { level: 60 });
  session.talents.loadFromSave([
    { id: 'masochism', rank },
    { id: 'aimedFire', rank: 1 },
  ]);
  session.refreshStats();
  session.state.pendingTalentPoints = 0;
  expect(session.confirmLevelUp()).toBe(true);
  return session;
}

describe('masochism presentation through session commands', () => {
  it.each([
    [1, 10, 90],
    [2, 9, 80],
    [3, 8, 70],
    [4, 7, 60],
    [5, 6, 50],
  ])(
    'describes rank %s with its current health cost and threshold',
    (rank, healthCost, minHpPercent) => {
      const session = arena(rank);
      const description = talentDescription('masochism', rank, session.state.stats);
      expect(description).toContain(`${healthCost} за единицу энергии`);
      expect(description).toContain(`не опускается ниже ${minHpPercent}% максимума`);
      expect(description).toContain('«Залп»');
      expect(description).toContain('«Прицельный огонь»');
      expect(description).not.toContain('{');
    },
  );

  it.each(
    (['shoot', 'volley', 'aimedFire'] as const).flatMap((action) =>
      [90, 80, 70, 60, 50].map((minHpPercent, index) => ({
        action,
        rank: index + 1,
        minHpPercent,
      })),
    ),
  )(
    'shows $action at rank $rank as affordable down to its health threshold',
    ({ action, rank, minHpPercent }) => {
      const session = arena(rank);
      const state = session.state;
      const cost = action === 'shoot' ? state.currentShootCost : state.stats[`${action}.cost`];
      const description = (state: GameState) =>
        action === 'shoot' ? shootDescription(state, 1) : abilityDescription(state, action);
      state.energy = cost - 2;
      const minHp = (state.maxHp * minHpPercent) / 100;
      const healthCost = 2 * masochismHealthPerEnergy(state.masochismRank);
      state.hp = minHp + healthCost - 0.001;

      expect(description(state)).toContain('Недостаточно энергии');
      expect(action === 'shoot' ? session.shootLane(0) : session.activateAbility(action)).toBe(
        'not_enough_energy',
      );
      state.hp = minHp + healthCost;

      expect(description(state)).not.toContain('Недостаточно энергии');
      expect(action === 'shoot' ? session.shootLane(0) : session.activateAbility(action)).toBe(
        action === 'shoot' ? 'shot' : 'activated',
      );
      expect(state.hp).toBe(minHp);
      expect(description(state)).toContain('Недостаточно энергии');
    },
  );

  it('keeps the insufficient-energy warning for other abilities with full health', () => {
    const session = arena();
    session.state.hp = session.state.maxHp;
    session.state.energy = 0;

    expect(shootDescription(session.state, 1)).not.toContain('Недостаточно энергии');
    expect(abilityDescription(session.state, 'heal')).toContain('Недостаточно энергии');
    expect(session.activateAbility('heal')).toBe('not_enough_energy');
  });
});
