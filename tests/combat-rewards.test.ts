import { describe, expect, it } from 'vitest';
import { GameSession } from '../src/domain/GameSession.js';
import { addNearbySpider as addSpider } from './helpers.js';

function arena() {
  const session = new GameSession('normal', () => 0.999999, { level: 50 });
  session.state.character.setModifiers('test:arena', [
    { stat: 'spawnProbability', kind: 'percent', value: -100 },
    { stat: 'endurance', kind: 'percent', value: -100 },
    { stat: 'agility', kind: 'percent', value: -100 },
    { stat: 'maxHp', kind: 'flat', value: 10000 },
    { stat: 'hpRegen', kind: 'percent', value: -100 },
    { stat: 'energyRegen', kind: 'percent', value: -100 },
    { stat: 'shootCost', kind: 'percent', value: -100 },
    { stat: 'shootCooldown', kind: 'percent', value: -100 },
    { stat: 'hpPerKill', kind: 'flat', value: 25 },
    { stat: 'energyPerKill', kind: 'flat', value: 11 },
    { stat: 'energyPerBreach', kind: 'flat', value: 7 },
  ]);
  session.refreshStats();
  session.state.phase = 'playing';
  session.state.levelTimer = session.state.levelTimerMax = 1000;
  return session;
}

function kill(session: GameSession, lane = 0) {
  const spider = addSpider(session, 'normal', lane, 0.9);
  expect(session.shootLane(lane)).toBe('shot');
  session.tick(0.31);
  return spider;
}

describe('actual combat resource gain events through session commands', () => {
  it('emits health and energy together beside a kill reward, once per killed spider', () => {
    const session = arena();
    session.state.hp -= 100;
    session.state.energy -= 100;
    const { hp, energy } = session.state;
    const spider = kill(session);
    expect(session.state).toMatchObject({ hp: hp + 25, energy: energy + 11 });
    const events = session.drainEvents();
    expect(events).toEqual([
      { type: 'resourceGain', spiderId: spider.id, hp: 25, energy: 11, reason: 'kill' },
      { type: 'coinDrop', spiderId: spider.id, coins: 5, jackpot: false },
    ]);
    session.tick(1);
    expect(session.drainEvents()).toEqual([]);
  });

  it('reports only restored resources near the health and energy caps', () => {
    const session = arena();
    session.state.hp -= 3;
    session.state.energy -= 2;
    const spider = kill(session);
    expect(session.state.hp).toBe(session.state.maxHp);
    expect(session.state.energy).toBe(session.state.maxEnergy);
    expect(session.drainEvents()).toContainEqual({
      type: 'resourceGain',
      spiderId: spider.id,
      hp: 3,
      energy: 2,
      reason: 'kill',
    });
  });

  it('shows the health actually recovered under weakened healing', () => {
    const session = arena();
    session.state.hp -= 100;
    addSpider(session, 'fast', 1, 1, 1);
    session.tick(0.001);
    session.drainEvents();
    const hp = session.state.hp;
    const spider = kill(session);
    expect(session.state.stats.hpPerKill).toBe(17);
    expect(session.state.hp).toBe(hp + 17);
    expect(session.drainEvents()).toContainEqual({
      type: 'resourceGain',
      spiderId: spider.id,
      hp: 17,
      energy: 0,
      reason: 'kill',
    });
  });

  it('does not emit an empty gain when both resources are full', () => {
    const session = arena();
    const spider = kill(session);
    expect(session.drainEvents()).toEqual([
      { type: 'coinDrop', spiderId: spider.id, coins: 5, jackpot: false },
    ]);
  });

  it('keeps breach energy separate from kill rewards and reports the actual capped gain', () => {
    const session = arena();
    session.state.energy -= 3;
    const spider = addSpider(session, 'normal', 0, 1, 0);
    session.tick(0.001);
    expect(session.drainEvents()).toEqual([
      { type: 'damage', spiderId: spider.id, hp: 0, energy: 0 },
      { type: 'resourceGain', spiderId: spider.id, hp: 0, energy: 3, reason: 'breach' },
    ]);
    expect(session.state.energy).toBe(session.state.maxEnergy);
    session.tick(0.4);
    expect(session.drainEvents()).toEqual([]);
  });

  it('reports energy restored after a burner removes energy', () => {
    const session = arena();
    session.state.energy = 100;
    const spider = addSpider(session, 'burner', 0, 1, 0);
    session.tick(0.001);
    expect(session.drainEvents()).toEqual([
      {
        type: 'damage',
        spiderId: spider.id,
        hp: 0,
        energy: 100,
      },
      { type: 'resourceGain', spiderId: spider.id, hp: 0, energy: 7, reason: 'breach' },
    ]);
    expect(session.state.energy).toBe(7);
  });

  it('does not emit capped breach gains, including during invulnerability', () => {
    const session = arena();
    session.state.invulnerableTimer = 1;
    addSpider(session, 'normal', 0, 1, 100);
    session.tick(0.001);
    expect(session.drainEvents()).toEqual([{ type: 'absorb' }]);
  });

  it('does not heal a player killed by a simultaneous breach', () => {
    const session = arena();
    const killed = addSpider(session, 'normal', 0, 0.9);
    expect(session.shootLane(0)).toBe('shot');
    session.tick(0.01);
    expect(killed.dying).toBe(true);
    addSpider(session, 'normal', 1, 1, session.state.maxHp);
    session.tick(0.3);
    expect(session.state.hp).toBe(0);
    expect(session.state.phase).toBe('gameOver');
    expect(session.drainEvents().filter((event) => event.type === 'resourceGain')).toEqual([]);
  });
});
