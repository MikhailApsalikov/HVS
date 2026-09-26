import { describe, expect, it } from 'vitest';
import { GameSession } from '../src/domain/GameSession.js';
import { parseSave, restore, snapshot } from '../src/domain/save.js';
import type { SpiderType, TalentId } from '../src/domain/types.js';
import { SPIDERS } from '../src/content/spiders.js';
import { WORLD } from '../src/domain/rules/world.js';
import { addSpider, previousSpiders } from './helpers.js';

function arena(talents: { id: TalentId; rank: number }[] = []) {
  const session = new GameSession('normal', () => 0);
  session.talents.loadFromSave([{ id: 'piercingReward', rank: 8 }, ...talents]);
  session.state.character.restoreBase({ endurance: 0, agility: 0, intellect: 0 });
  session.state.character.setModifiers('test:arena', [
    { stat: 'spawnProbability', kind: 'percent', value: -100 },
    { stat: 'energyRegen', kind: 'percent', value: -100 },
    { stat: 'maxEnergy', kind: 'flat', value: 1000 },
    { stat: 'arrowSpeed', kind: 'percent', value: 2900 },
    { stat: 'shootCooldown', kind: 'percent', value: -100 },
  ]);
  session.refreshStats();
  session.state.initialTalentPick = false;
  session.state.pendingTalentPoints = 0;
  session.state.phase = 'playing';
  session.state.energy = 200;
  return session;
}

describe('energy for every spider kill', () => {
  it.each(Object.keys(SPIDERS) as SpiderType[])(
    'rewards an ordinary arrow kill of %s exactly once, never a wound',
    (type) => {
      const session = arena();
      const spider = addSpider(session, type, 0, 0.05);
      for (let hit = 1; hit <= SPIDERS[type].hits; hit++) {
        expect(session.shootLane(0)).toBe('shot');
        const energy = session.state.energy;
        session.tick(0.4);
        const killed = hit === SPIDERS[type].hits;
        expect(session.state.energy).toBe(energy + (killed ? 8 : 0));
        expect(spider.dying).toBe(killed);
      }
      expect(session.state.spiders.size).toBe(0);
      const energy = session.state.energy;
      session.tick(1);
      expect(session.state.energy).toBe(energy);
    },
  );

  it.each(['volley', 'counterVolley'] as const)('rewards every kill from %s', (attack) => {
    const session = arena([{ id: attack === 'volley' ? 'volley' : 'bestDefense', rank: 1 }]);
    session.state.character.setModifiers('test:volley', [
      { stat: 'volley.lanes', kind: 'flat', value: 5 },
    ]);
    session.refreshStats();
    for (let lane = 0; lane < WORLD.lanes; lane++) addSpider(session, 'normal', lane, 0.05);
    if (attack === 'volley') expect(session.activateAbility('volley')).toBe('activated');
    else {
      session.state.energy = 0;
      addSpider(session, 'normal', 0, 1, 0);
      session.tick(0.01);
      expect(session.state.energy).toBe(0);
    }
    expect(session.state.arrows.size).toBe(WORLD.lanes);
    const energy = session.state.energy;
    session.tick(0.4);
    expect(session.state.spiders.size).toBe(0);
    expect(session.state.energy).toBe(energy + WORLD.lanes * 8);
    session.tick(1);
    expect(session.state.energy).toBe(energy + WORLD.lanes * 8);
  });

  it.each([false, true])('rewards each free adrenaline kill with eagle eye=%s', (eagleEye) => {
    const session = arena([
      { id: 'adrenaline', rank: 1 },
      ...(eagleEye ? [{ id: 'eagleEye' as const, rank: 1 }] : []),
    ]);
    expect(session.activateAbility('adrenaline')).toBe('activated');
    if (eagleEye) expect(session.activateAbility('eagleEye')).toBe('activated');
    session.state.energy = 0;
    addSpider(session, 'normal', 0, 0.8);
    if (eagleEye) addSpider(session, 'normal', 0, 0.4);
    expect(session.shootLane(0)).toBe('shot');
    expect(session.state.energy).toBe(0);
    session.tick(0.4);
    expect(session.state.spiders.size).toBe(0);
    expect(session.state.energy).toBe(eagleEye ? 16 : 8);
  });

  it('rewards every Armageddon victim, including new spiders and an arrow victim, once', () => {
    const session = arena();
    session.state.level = 30;
    session.refreshStats();
    expect(session.activateAbility('armageddon')).toBe('activated');
    session.tick(session.state.stats['armageddon.charge'] - 0.1);
    addSpider(session, 'normal', 0, 0.9);
    expect(session.shootLane(0)).toBe('shot');
    session.tick(0.02);
    expect([...session.state.spiders.values()][0].dying).toBe(true);
    const species = Object.keys(SPIDERS) as SpiderType[];
    for (const type of species) addSpider(session, type, 0, 0.05);
    const energy = session.state.energy;
    const reward = session.state.stats.energyPerKill;
    session.tick(0.4);
    expect(session.state.spiders.size).toBe(0);
    expect(session.state.energy).toBe(energy + (species.length + 1) * reward);
    addSpider(session, 'fat');
    session.tick(0.4);
    expect(session.state.spiders.size).toBe(0);
    expect(session.state.energy).toBe(energy + (species.length + 2) * reward);
    session.tick(1);
    expect(session.state.energy).toBe(energy + (species.length + 2) * reward);
  });

  it('caps energy from several kills at the maximum without banking the excess', () => {
    const session = arena([{ id: 'criticalShot', rank: 10 }]);
    addSpider(session, 'normal', 0, 0.8);
    addSpider(session, 'normal', 0, 0.4);
    session.shootLane(0);
    session.state.energy = session.state.maxEnergy - 3;
    session.tick(0.4);
    expect(session.state.spiders.size).toBe(0);
    expect(session.state.energy).toBe(session.state.maxEnergy);
    session.shootLane(1);
    const energy = session.state.energy;
    session.tick(0.4);
    expect(session.state.energy).toBe(energy);
  });

  it('keeps breach rewards separate even with Marauder', () => {
    const session = arena([{ id: 'marauder', rank: 1 }]);
    session.state.character.setModifiers('test:breach', [
      { stat: 'energyPerBreach', kind: 'flat', value: 3 },
    ]);
    session.refreshStats();
    const energy = session.state.energy;
    addSpider(session, 'normal', 0, 1, 0);
    session.tick(0.4);
    expect(session.state.spiders.size).toBe(0);
    expect(session.state.energy).toBe(energy + 3);
    expect(session.drainEvents().filter((event) => event.type === 'coinDrop')).toHaveLength(1);
  });
});

describe('kill energy save migration', () => {
  it.each([0, 0.02, 0.04, 0.4])(
    'migrates version 15 after %s seconds without retaining exclusions or repeating rewards',
    (elapsed) => {
      const session = arena([
        { id: 'criticalShot', rank: 10 },
        { id: 'improvedCriticalShot', rank: 8 },
        { id: 'killingStreak', rank: 1 },
      ]);
      for (const y of [0.9, 0.6, 0.2]) addSpider(session, 'normal', 0, y);
      session.shootLane(0);
      const energy = session.state.energy;
      session.tick(elapsed);
      session.state.prepTimer = 3;
      const current = snapshot(session);
      const old = {
        ...current,
        version: 15,
        arrows: current.arrows.map((arrow) => ({ ...arrow, kills: 3 - arrow.power })),
        spiders: current.spiders.map((spider, index) => ({
          ...spider,
          grantsKillEnergy: index === 0,
        })),
      };
      const parsed = parseSave(JSON.parse(JSON.stringify(old)))!;
      expect(parsed).toEqual(current);
      const loaded = restore(parsed, () => 0);
      expect(snapshot(loaded)).toEqual(current);
      for (const active of [session, loaded]) active.tick(0.4);
      expect(snapshot(loaded)).toEqual(snapshot(session));
      expect(loaded.state.spiders.size).toBe(0);
      expect(loaded.state.energy).toBe(energy + 24 + 0.4 * loaded.state.stats['prep.energyRegen']);
      const saved = snapshot(loaded);
      expect(snapshot(restore(parseSave(saved)!, () => 0))).toEqual(saved);
      expect(JSON.stringify(saved)).not.toMatch(/grantsKillEnergy|"kills"/);
    },
  );

  it.each([9, 10])('still rejects invalid power history in version %s', (version) => {
    const session = arena([{ id: 'criticalShot', rank: 10 }]);
    session.shootLane(0);
    const saved = snapshot(session);
    for (const invalid of [
      { kills: -1 },
      { kills: 0.5 },
      { kills: 2 },
      { critical: false, kills: 1 },
    ]) {
      expect(
        parseSave({
          ...saved,
          version,
          abilities: saved.abilities.slice(0, 10),
          spiders: previousSpiders(saved),
          arrows: [{ ...saved.arrows[0], ...invalid }],
        }),
      ).toBeNull();
    }
  });
});
