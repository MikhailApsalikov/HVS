import { describe, expect, it, vi } from 'vitest';
import { GameSession } from '../src/domain/GameSession.js';
import { parseSave, restore, snapshot } from '../src/domain/save.js';
import { TALENTS } from '../src/content/talents.js';
import type { TalentId } from '../src/domain/types.js';
import { attributeDescription, talentDescription, shootDescription } from '../src/ui/presenters.js';
import { addSpider } from './helpers.js';

function combat(rank = 1, roll = 0) {
  const random = vi.fn(() => roll);
  const session = new GameSession('normal', random);
  session.talents.loadFromSave([
    { id: 'criticalShot', rank },
    { id: 'piercingReward', rank: 8 },
  ]);
  session.state.character.setBase('agility', 0);
  session.state.character.setModifiers('test:arena', [
    { stat: 'spawnProbability', kind: 'percent', value: -100 },
    { stat: 'energyRegen', kind: 'percent', value: -100 },
    { stat: 'coinsPerSec', kind: 'percent', value: -100 },
    { stat: 'arrowSpeed', kind: 'percent', value: 2900 },
  ]);
  session.refreshStats();
  session.state.initialTalentPick = false;
  session.state.pendingTalentPoints = 0;
  session.state.phase = 'playing';
  return { session, random };
}

function buy(session: GameSession, id: TalentId, ranks: number) {
  for (let i = 0; i < ranks; i++) expect(session.upgradeTalent(id), id).toBe(true);
}

describe('shooting and magic talent progression', () => {
  it.each(['easy', 'normal', 'hard'] as const)(
    'uses the new ranks and tiers on %s',
    (difficulty) => {
      const session = new GameSession(difficulty);
      session.state.pendingTalentPoints = 100;
      buy(session, 'hunterMastery', 5);
      expect(session.state.stats.shootCost).toBe(25);
      expect(session.upgradeTalent('hunterMastery')).toBe(false);
      buy(session, 'improvedAgility', 2);
      expect(session.upgradeTalent('criticalShot')).toBe(false);
      session.state.level = 10;
      buy(session, 'criticalShot', 10);
      expect(session.upgradeTalent('criticalShot')).toBe(false);
      expect(session.state.stats.criticalShotChance).toBe(0.2);
      expect(session.upgradeTalent('piercingReward')).toBe(false);
      session.state.level = 20;
      const energyPerKill = session.state.stats.energyPerKill;
      for (let rank = 1; rank <= 8; rank++) {
        buy(session, 'piercingReward', 1);
        expect(session.state.stats.energyPerKill).toBe(energyPerKill + rank);
      }
      expect(session.upgradeTalent('piercingReward')).toBe(false);
      expect(session.talents.getTalent('criticalShot')).toMatchObject({
        tier: 2,
        branch: 'shooting',
      });
      expect(session.talents.getTalent('piercingReward')).toMatchObject({
        tier: 3,
        branch: 'shooting',
      });
    },
  );

  it('requires points in shooting to learn critical shot and the kill energy talent', () => {
    const session = new GameSession('normal');
    session.state.level = 20;
    session.state.pendingTalentPoints = 30;
    buy(session, 'endurance', 7);
    expect(session.upgradeTalent('criticalShot')).toBe(false);
    buy(session, 'hunterMastery', 5);
    buy(session, 'improvedAgility', 2);
    buy(session, 'criticalShot', 1);
    expect(session.upgradeTalent('piercingReward')).toBe(false);
    buy(session, 'criticalShot', 6);
    buy(session, 'piercingReward', 1);
  });

  it('swaps magic tiers and requires magic investment for blizzard mastery', () => {
    const session = new GameSession('normal');
    session.state.pendingTalentPoints = 100;
    expect(session.upgradeTalent('tireless')).toBe(false);
    buy(session, 'agility', 5);
    expect(session.state.maxEnergy).toBe(400);
    buy(session, 'hunterArsenal', 2);
    expect(session.upgradeTalent('tireless')).toBe(false);
    session.state.level = 10;
    buy(session, 'tireless', 5);
    expect(session.state.stats.energyRegen).toBe(13.34);
    session.state.level = 30;
    buy(session, 'hunterMastery', 5);
    buy(session, 'improvedAgility', 7);
    buy(session, 'criticalShot', 10);
    expect(session.talents.getTalent('blizzardMastery').tier).toBe(2);
    buy(session, 'improvedIntellect', 7);
    buy(session, 'hunterArsenal', 2);
    buy(session, 'blizzardMastery', 1);
    expect(session.state.stats['blizzard.slow']).toBe(0.47);
    expect(session.state.stats['blizzard.duration']).toBe(5);
    expect(TALENTS.blizzardMastery.branch).toBe('magic');
  });
});

describe('critical shots through session commands', () => {
  it.each([
    [0, 10000, 0, false],
    [1, 0, 0.019999, true],
    [1, 0, 0.02, false],
    [10, 0, 0.199999, true],
    [10, 0, 0.2, false],
    [1, 129, 0.02, false],
    [1, 130, 0.029999, true],
    [1, 130, 0.03, false],
    [2, 260, 0.059999, true],
    [2, 260, 0.06, false],
    [10, 100000, 0.999999, true],
  ])('rank %s, agility %s, roll %s yields critical=%s', (rank, agility, roll, critical) => {
    const { session, random } = combat(rank, roll);
    session.state.character.setBase('agility', agility);
    session.refreshStats();
    expect(session.shootLane(0)).toBe('shot');
    expect([...session.state.arrows.values()][0].critical).toBe(critical);
    expect(random).toHaveBeenCalledTimes(rank > 0 ? 1 : 0);
    expect(session.state.stats.criticalShotChance).toBeLessThanOrEqual(1);
    expect(session.shootLane(0)).toBe('blocked');
    session.state.energy = 0;
    expect(session.shootLane(1)).toBe('not_enough_energy');
    expect(random).toHaveBeenCalledTimes(rank > 0 ? 1 : 0);
  });

  it('kills two normal spiders across frames, rewards energy only once, and leaves the third alive', () => {
    const { session } = combat();
    const first = addSpider(session, 'normal', 0, 0.9);
    const second = addSpider(session, 'normal', 0, 0.4);
    const third = addSpider(session, 'normal', 0, 0.1);
    expect(session.shootLane(0)).toBe('shot');
    const energy = session.state.energy;
    session.tick(0.02);
    expect(first.dying).toBe(true);
    expect(first.hits).toBe(0);
    expect(second.dying).toBe(false);
    const arrow = [...session.state.arrows.values()][0];
    expect(arrow).toMatchObject({ critical: true, kills: 1, power: 1, lane: 0 });
    expect(arrow.y).toBeCloseTo(0.8);
    session.tick(0.04);
    expect(second.dying).toBe(true);
    expect(second.grantsKillEnergy).toBe(false);
    expect(session.state.arrows.size).toBe(0);
    expect(third.dying).toBe(false);
    session.tick(0.3);
    expect(session.state.energy).toBe(energy + 8);
    const rewards = session.drainEvents().filter((event) => event.type === 'coinDrop');
    expect(rewards.map((event) => event.spiderId)).toEqual([first.id, second.id]);
    expect(session.state.coins).toBe(102);
  });

  it('takes the nearest two along a swept path regardless of insertion order and skips corpses and other lanes', () => {
    const { session } = combat();
    const far = addSpider(session, 'normal', 0, 0.1);
    const second = addSpider(session, 'normal', 0, 0.5);
    const first = addSpider(session, 'normal', 0, 0.8);
    const neighbor = addSpider(session, 'normal', 1, 0.9);
    const corpse = addSpider(session, 'normal', 0, 0.95);
    corpse.startDying();
    session.shootLane(0);
    session.tick(0.09);
    expect(first.dying).toBe(true);
    expect(first.grantsKillEnergy).toBe(true);
    expect(second.dying).toBe(true);
    expect(second.grantsKillEnergy).toBe(false);
    expect(far.dying).toBe(false);
    expect(neighbor.dying).toBe(false);
    expect(session.state.arrows.size).toBe(0);
  });

  it.each([0, 1])('removes an off-screen critical arrow after %s kills', (kills) => {
    const { session } = combat();
    if (kills) addSpider(session, 'normal', 0, 0.5);
    session.shootLane(0);
    const energy = session.state.energy;
    session.tick(0.11);
    expect(session.state.arrows.size).toBe(0);
    session.tick(0.3);
    expect(session.state.energy).toBe(energy + kills * 8);
  });

  it('keeps noncritical arrows limited to one hit against a fat spider', () => {
    const { session } = combat(10, 0.2);
    const fat = addSpider(session, 'fat', 0, 0.8);
    const behind = addSpider(session, 'normal', 0, 0.5);
    session.shootLane(0);
    session.tick(0.09);
    expect(fat).toMatchObject({ dying: false, hits: 1, type: 'normal' });
    expect(behind.dying).toBe(false);
    expect(session.state.arrows.size).toBe(0);
  });

  it('allows critical adrenaline shots but excludes both manual and counter volleys', () => {
    const { session } = combat(10);
    session.state.level = 60;
    session.talents.loadFromSave([
      { id: 'criticalShot', rank: 10 },
      { id: 'adrenaline', rank: 1 },
    ]);
    session.state.character.setModifiers('test:counter', [
      { stat: 'blockVolleyChance', kind: 'flat', value: 1 },
    ]);
    session.refreshStats();
    expect(session.activateAbility('adrenaline')).toBe('activated');
    session.state.energy = 0;
    expect(session.shootLane(0)).toBe('shot');
    expect([...session.state.arrows.values()][0].critical).toBe(true);
    expect(session.state.adrenalineShots).toBe(19);
    session.state.arrows.clear();
    session.state.energy = session.state.maxEnergy;
    expect(session.activateAbility('volley')).toBe('activated');
    const manual = [...session.state.arrows.values()];
    expect(manual).toHaveLength(4);
    expect(manual.every((arrow) => arrow.fromVolley && !arrow.critical)).toBe(true);
    session.state.arrows.clear();
    addSpider(session, 'normal', 8, 1, 0);
    session.tick(0.01);
    const counter = [...session.state.arrows.values()];
    expect(counter).toHaveLength(4);
    expect(counter.every((arrow) => arrow.fromVolley && !arrow.critical)).toBe(true);
  });

  it('adds kill energy from the talent and agility for ordinary kills too', () => {
    const { session } = combat(0);
    session.state.character.setBase('agility', 480);
    session.refreshStats();
    expect(session.state.stats.energyPerKill).toBe(10);
    addSpider(session, 'normal', 0, 0.9);
    session.shootLane(0);
    const energy = session.state.energy;
    session.tick(0.4);
    expect(session.state.energy).toBe(energy + 10);
  });
});

describe('agility contribution and tooltips', () => {
  it.each([
    [0, 260, ''],
    [1, 129, ''],
    [1, 130, '+1% к шансу Критического выстрела'],
    [10, 260, '+2% к шансу Критического выстрела'],
  ])('shows only the earned agility bonus at rank %s and agility %s', (rank, agility, expected) => {
    const { session } = combat(rank);
    session.state.character.setBase('agility', agility);
    session.refreshStats();
    const tooltip = attributeDescription(session.state, 'agility');
    if (expected) expect(tooltip).toContain(`>${expected}</p>`);
    else expect(tooltip).not.toContain('Критического выстрела');
    expect(talentDescription('criticalShot', 1, session.state.stats)).toContain('2%');
    expect(talentDescription('criticalShot', 10, session.state.stats)).toContain('20%');
    for (const text of [
      talentDescription('criticalShot', 1, session.state.stats),
      shootDescription(session.state, 1),
      attributeDescription(session.state, 'endurance'),
      attributeDescription(session.state, 'intellect'),
    ]) {
      expect(text).not.toContain('к шансу Критического выстрела');
      expect(text).not.toContain('130');
    }
  });

  it('uses final agility after level growth, talent and item modifiers', () => {
    const { session } = combat();
    session.state.level = 10;
    session.state.character.setBase('agility', 100);
    session.state.character.setModifiers('test:item', [
      { stat: 'agility', kind: 'flat', value: 6 },
    ]);
    session.talents.loadFromSave([
      { id: 'criticalShot', rank: 1 },
      { id: 'improvedAgility', rank: 1 },
    ]);
    session.refreshStats();
    expect(session.state.stats.agility).toBe(130); // (100 + 9 + 9 + 6) × 1.05
    expect(session.state.stats.criticalShotChance).toBe(0.03);
    session.state.character.removeModifiers('test:item');
    session.refreshStats();
    expect(session.state.stats.criticalShotChance).toBe(0.02);
    expect(attributeDescription(session.state, 'agility')).not.toContain('Критического выстрела');
  });
});

describe('critical shot saves', () => {
  it.each([0, 1, 2])(
    'round-trips after %s kills without restoring piercing or extra energy',
    (kills) => {
      const { session } = combat();
      addSpider(session, 'normal', 0, 0.9);
      addSpider(session, 'normal', 0, 0.4);
      const third = addSpider(session, 'normal', 0, 0.1);
      session.shootLane(0);
      const energy = session.state.energy;
      if (kills > 0) session.tick(kills === 1 ? 0.02 : 0.06);
      const saved = snapshot(session);
      const parsed = parseSave(JSON.parse(JSON.stringify(saved)));
      expect(parsed).not.toBeNull();
      const loaded = restore(parsed!, () => 0);
      expect(snapshot(loaded)).toEqual(saved);
      loaded.tick(0.4);
      session.tick(0.4);
      expect(snapshot(loaded)).toEqual(snapshot(session));
      expect(loaded.state.energy).toBe(energy + 8);
      expect(loaded.state.spiders.get(third.id)?.dying).toBe(false);
      expect(loaded.state.arrows.size).toBe(0);
    },
  );

  it('migrates version 8 actors, refunds mastery once, and retains moved talents and active effects', () => {
    const { session } = combat(0);
    session.state.level = 40;
    addSpider(session, 'fat');
    session.shootLane(0);
    const saved = snapshot(session);
    const previous = {
      ...saved,
      version: 8,
      abilities: saved.abilities.slice(0, 10),
      state: { ...saved.state, bestDefenseCooldown: 2, adrenalineTimer: 10, adrenalineShots: 9 },
      talents: [
        { id: 'hunterMastery', rank: 10 },
        { id: 'tireless', rank: 3 },
        { id: 'agility', rank: 2 },
        { id: 'blizzardMastery', rank: 4 },
      ],
      arrows: saved.arrows.map(({ critical: _critical, kills: _kills, ...arrow }) => arrow),
      spiders: saved.spiders.map(({ grantsKillEnergy: _energy, ...spider }) => spider),
    };
    const parsed = parseSave(previous)!;
    expect(parsed.version).toBe(11);
    const loaded = restore(parsed);
    expect(loaded.talents.getRank('hunterMastery')).toBe(5);
    expect(loaded.state.stats.shootCost).toBe(25);
    expect(loaded.state.pendingTalentPoints).toBe(5);
    expect(loaded.talents.getRank('tireless')).toBe(3);
    expect(loaded.talents.getRank('agility')).toBe(2);
    expect(loaded.talents.getRank('blizzardMastery')).toBe(4);
    expect(loaded.state).toMatchObject({
      bestDefenseCooldown: 2,
      adrenalineTimer: 10,
      adrenalineShots: 9,
    });
    expect([...loaded.state.arrows.values()][0]).toMatchObject({ critical: false, kills: 0 });
    expect([...loaded.state.spiders.values()][0].grantsKillEnergy).toBe(true);
    expect(snapshot(restore(parseSave(snapshot(loaded))!))).toEqual(snapshot(loaded));
  });

  it('rejects corrupt critical arrow and energy reward fields', () => {
    const { session } = combat();
    session.shootLane(0);
    addSpider(session);
    const saved = snapshot(session);
    for (const invalid of [
      { critical: 'yes' },
      { kills: -1 },
      { kills: 0.5 },
      { kills: 2 },
      { critical: false, kills: 1 },
      { fromVolley: true },
    ])
      expect(parseSave({ ...saved, arrows: [{ ...saved.arrows[0], ...invalid }] })).toBeNull();
    expect(
      parseSave({ ...saved, spiders: [{ ...saved.spiders[0], grantsKillEnergy: 'yes' }] }),
    ).toBeNull();
  });
});
