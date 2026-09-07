import { describe, expect, it } from 'vitest';
import { GameSession } from '../src/domain/GameSession.js';
import { parseSave, restore, snapshot } from '../src/domain/save.js';
import { addSpider, game } from './helpers.js';

describe('combat balance through session commands', () => {
  it.each([
    ['tank', 15, 0.0816, 1180],
    ['fast', 20, 0.468, 77],
  ] as const)('spawns %s with its new multiplier', (type, level, speed, damage) => {
    const rolls = [0, 0, 0.5, 0.5, 0.5];
    let roll = 0;
    const session = new GameSession('normal', () => rolls[roll++ % rolls.length]);
    session.upgradeTalent('hunterMastery');
    session.confirmLevelUp();
    session.state.level = level;
    session.refreshStats();
    session.tick(0.02);
    expect(session.state.spiders.size).toBe(9);
    for (const spider of session.state.spiders.values()) {
      expect(spider).toMatchObject({ type, speed, damage });
      expect(spider.y).toBeCloseTo(speed * 0.02);
    }
  });

  it.each([0, 0.5, 50, 90, 100])('burns only available energy from %s', (energy) => {
    const session = game();
    session.state.character.setModifiers('test', [
      { stat: 'energyRegen', kind: 'percent', value: -100 },
      { stat: 'energyPerBreach', kind: 'flat', value: 3 },
    ]);
    session.refreshStats();
    session.state.energy = energy;
    const first = addSpider(session, 'burner', 0, 1, 0);
    const second = addSpider(session, 'burner', 1, 1, 0);
    session.tick(0.01);
    const burned = Math.min(energy, 90);
    const nextEnergy = energy - burned + 3;
    expect(session.drainEvents()).toEqual([
      { type: 'damage', spiderId: first.id, hp: 0, energy: burned },
      { type: 'damage', spiderId: second.id, hp: 0, energy: nextEnergy },
    ]);
    expect(session.state.energy).toBe(3);
  });

  it.each(['easy', 'normal', 'hard'] as const)(
    'keeps levels at least ten seconds after all reductions on %s',
    (difficulty) => {
      const session = new GameSession(difficulty, () => 0.999999);
      session.state.character.setBase('endurance', 100000);
      session.state.character.setModifiers('test:duration', [
        { stat: 'levelDuration', kind: 'percent', value: -100 },
        { stat: 'levelDuration', kind: 'flat', value: -100000 },
        { stat: 'spawnProbability', kind: 'percent', value: -100 },
      ]);
      session.upgradeTalent('hunterMastery');
      session.confirmLevelUp();
      expect(session.state.levelTimerMax).toBe(10);
      session.tick(9.99);
      expect(session.state.phase).toBe('playing');
      session.tick(0.01);
      expect(session.state.phase).toBe('levelUp');
      session.upgradeTalent('hunterMastery');
      session.confirmLevelUp();
      expect(session.state.level).toBe(2);
      expect(session.state.levelTimerMax).toBe(10);
    },
  );

  it.each(['easy', 'normal', 'hard'] as const)(
    'applies all five armor ranks as independent sources on %s',
    (difficulty) => {
      const session = new GameSession(difficulty);
      session.state.level = 50;
      session.state.initialTalentPick = false;
      session.state.pendingTalentPoints = 11;
      session.talents.loadFromSave([
        { id: 'endurance', rank: 7 },
        { id: 'improvedEndurance', rank: 7 },
        { id: 'spiderArmor', rank: 10 },
        { id: 'shieldBlock', rank: 8 },
        { id: 'greed', rank: 3 },
        { id: 'magicArmor', rank: 2 },
      ]);
      session.refreshStats();
      const baseArmor = session.state.stats.armor;
      for (let rank = 1; rank <= 5; rank++) {
        expect(session.upgradeTalent('warriorArmor')).toBe(true);
        expect(session.state.stats.armor).toBe(baseArmor + 80 * rank);
      }
      expect(session.upgradeTalent('warriorArmor')).toBe(false);
      const flatArmor = baseArmor + 400;
      for (let rank = 1; rank <= 5; rank++) {
        expect(session.upgradeTalent('titanArmor')).toBe(true);
        expect(session.state.stats.armor).toBe(Math.round(flatArmor * (1 + 0.25 * rank)));
      }
      expect(session.upgradeTalent('titanArmor')).toBe(false);
      session.state.character.setModifiers('item:one', [
        { stat: 'armor', kind: 'flat', value: 40 },
        { stat: 'armor', kind: 'percent', value: 20 },
      ]);
      session.state.character.setModifiers('item:two', [
        { stat: 'armor', kind: 'percent', value: 50 },
      ]);
      session.refreshStats();
      expect(session.state.stats.armor).toBe(Math.round((flatArmor + 40) * 2.25 * 1.2 * 1.5));
      const data = snapshot(session);
      expect(snapshot(restore(parseSave(data)!))).toEqual(data);
    },
  );

  it.each([5, 6])(
    'normalizes short levels in version %s without repeating the extension',
    (version) => {
      const data = snapshot(game());
      const loaded = restore(
        parseSave({
          ...data,
          version,
          talents: [{ id: 'healBoost', rank: 2 }],
          state: { ...data.state, levelTimerMax: 4, levelTimer: 1 },
        })!,
        () => 0.999999,
      );
      expect(loaded.state.levelTimerMax).toBe(10);
      expect(loaded.state.levelTimer).toBe(7); // Preserve the three seconds already played.
      expect(loaded.talents.getRank('healBoost')).toBe(2);
      expect(loaded.talents.getRank('warriorArmor')).toBe(0);
      expect(loaded.talents.getRank('titanArmor')).toBe(0);
      loaded.tick(6.99);
      expect(loaded.state.phase).toBe('playing');
      loaded.tick(0.02);
      expect(loaded.state.phase).toBe('levelUp');
      const saved = snapshot(loaded);
      expect(snapshot(restore(parseSave(saved)!))).toEqual(saved);
    },
  );
});
