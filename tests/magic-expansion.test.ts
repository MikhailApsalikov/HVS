import { describe, expect, it } from 'vitest';
import { GameSession } from '../src/domain/GameSession.js';
import { parseSave, restore, snapshot } from '../src/domain/save.js';
import { talentDescription, abilityDescription } from '../src/ui/presenters.js';
import type { TalentId } from '../src/domain/types.js';
import { addSpider } from './helpers.js';

function arena(talents: { id: TalentId; rank: number }[] = [], random = () => 0.999999) {
  const session = new GameSession('normal', random, { level: 60 });
  session.talents.loadFromSave(talents);
  session.state.character.setModifiers('test:arena', [
    { stat: 'spawnProbability', kind: 'percent', value: -100 },
    { stat: 'energyRegen', kind: 'percent', value: -100 },
    { stat: 'energyPerKill', kind: 'percent', value: -100 },
    { stat: 'shootCost', kind: 'percent', value: -100 },
    { stat: 'maxEnergy', kind: 'flat', value: 1000 },
  ]);
  session.refreshStats();
  session.state.phase = 'playing';
  session.state.initialTalentPick = false;
  session.state.energy = 1000;
  session.state.levelTimer = session.state.levelTimerMax = 10000;
  return session;
}
const lightning = [{ id: 'lightningArrows', rank: 1 }] as const;
function charged(rank = 0, random = () => 0.999999) {
  const session = arena([...lightning, { id: 'improvedLightning', rank }], random);
  expect(session.activateAbility('lightningArrows')).toBe('activated');
  return session;
}
function hit(session: GameSession, lane = 4) {
  expect(session.shootLane(lane)).toBe('shot');
  session.tick(0.04);
}

describe('new magic talents through session commands', () => {
  it.each(['easy', 'normal', 'hard'] as const)(
    'uses the new tiers, ranks and prerequisite on %s',
    (difficulty) => {
      const session = new GameSession(difficulty, () => 0.999999, { level: 60 });
      expect(session.upgradeTalent('lightningArrows')).toBe(false);
      session.talents.loadFromSave([
        { id: 'improvedIntellect', rank: 5 },
        { id: 'agility', rank: 2 },
      ]);
      session.state.level = 9;
      expect(session.upgradeTalent('lightningArrows')).toBe(false);
      session.state.level = 10;
      expect(session.upgradeTalent('lightningArrows')).toBe(true);
      expect(session.upgradeTalent('lightningArrows')).toBe(false);
      session.talents.loadFromSave([
        { id: 'improvedIntellect', rank: 5 },
        { id: 'agility', rank: 5 },
        { id: 'tireless', rank: 5 },
      ]);
      session.state.level = 20;
      expect(session.upgradeTalent('improvedLightning')).toBe(false);
      expect(session.upgradeTalent('lightningArrows')).toBe(true);
      for (let rank = 1; rank <= 5; rank++)
        expect(session.upgradeTalent('improvedLightning')).toBe(true);
      expect(session.upgradeTalent('improvedLightning')).toBe(false);
      expect(session.talents.getTalent('permafrost')).toMatchObject({ tier: 6, maxRanks: 10 });
      expect(session.talents.getTalent('fireExplosion')).toMatchObject({ tier: 3, maxRanks: 10 });
      expect(session.talents.getTalent('blizzardMastery')).toMatchObject({ tier: 4 });
      expect(session.talents.getTalent('improvedArmageddon')).toMatchObject({
        tier: 4,
        maxRanks: 6,
      });
      for (let rank = 0; rank < 10; rank++)
        expect(session.upgradeTalent('fireExplosion')).toBe(true);
      expect(session.upgradeTalent('fireExplosion')).toBe(false);
      session.state.level = 29;
      expect(session.upgradeTalent('improvedArmageddon')).toBe(false);
      session.state.level = 30;
      for (let rank = 0; rank < 6; rank++)
        expect(session.upgradeTalent('improvedArmageddon')).toBe(true);
      expect(session.upgradeTalent('improvedArmageddon')).toBe(false);
    },
  );

  it('charges nine lanes for 70 energy, respects cooldown and never spends charges on blocked shots', () => {
    const session = arena();
    expect(session.activateAbility('lightningArrows')).toBe('level_locked');
    session.talents.loadFromSave(lightning);
    session.refreshStats();
    session.state.energy = 69;
    expect(session.activateAbility('lightningArrows')).toBe('not_enough_energy');
    expect(session.state.lightningCharges.some(Boolean)).toBe(false);
    session.state.energy = 1000;
    expect(session.activateAbility('lightningArrows')).toBe('activated');
    expect(session.state.energy).toBe(930);
    expect(session.state.getAbility('lightningArrows').remainingCooldown).toBe(90);
    expect(session.activateAbility('lightningArrows')).toBe('on_cooldown');
    expect(session.state.lightningCharges).toEqual(Array(9).fill(1));
    session.state.archers[0].start(1);
    expect(session.shootLane(0)).toBe('blocked');
    expect(session.state.lightningCharges[0]).toBe(1);
    for (let lane = 1; lane < 9; lane++) expect(session.shootLane(lane)).toBe('shot');
    expect([...session.state.arrows.values()].every((arrow) => arrow.lightningJumps === 1)).toBe(
      true,
    );
    expect(session.state.lightningCharges).toEqual([1, ...Array(8).fill(0)]);
    session.tick(30);
    expect(session.activateAbility('lightningArrows')).toBe('on_cooldown');
    expect(session.state.lightningCharges).toEqual([1, ...Array(8).fill(0)]);
    session.tick(59.99);
    expect(session.activateAbility('lightningArrows')).toBe('on_cooldown');
    session.tick(0.01);
    expect(session.activateAbility('lightningArrows')).toBe('activated');
    expect(session.state.lightningCharges).toEqual(Array(9).fill(1));
    expect(abilityDescription(session.state, 'lightningArrows')).toContain('90');
  });

  it('uses charges on volley and aimed fire, including the first emitted arrow on each lane', () => {
    const session = arena([...lightning, { id: 'aimedFire', rank: 1 }]);
    session.activateAbility('lightningArrows');
    session.activateAbility('volley');
    const volley = [...session.state.arrows.values()];
    expect(volley).toHaveLength(4);
    expect(
      volley.every((arrow) => arrow.fromVolley && arrow.lightningJumps === 1 && !arrow.critical),
    ).toBe(true);
    session.activateAbility('aimedFire');
    session.tick(1);
    const wave = [...session.state.arrows.values()].slice(4);
    expect(wave).toHaveLength(9);
    expect(wave.filter((arrow) => arrow.lightningJumps === 1)).toHaveLength(5);
    expect(session.state.lightningCharges.some(Boolean)).toBe(false);
  });

  it.each(['normal', 'megaFat'] as const)(
    'starts a chain even when the initial %s spider survives or dies',
    (type) => {
      const session = charged();
      const source = addSpider(session, type, 4, 0.94);
      const target = addSpider(session, 'megaFat', 5, 0.05);
      addSpider(session, 'normal', 4, 0.2);
      hit(session);
      expect(source.hits).toBe(type === 'normal' ? 0 : 2);
      expect(session.state.chainLightning).toHaveLength(1);
      expect(target.hits).toBe(3);
      session.tick(0.649);
      expect(target.hits).toBe(3);
      session.tick(0.001);
      expect(target.hits).toBe(2);
      expect(session.state.chainLightning).toHaveLength(0);
      const effects = session.drainEvents().filter((event) => event.type === 'lightning');
      expect(effects).toHaveLength(2);
      expect(effects[1]).toMatchObject({ from: { lane: 4, y: 0.94 }, to: { lane: 5, y: 0.05 } });
    },
  );

  it.each([
    [0, 3],
    [0.4, 3],
    [0.7, 5],
    [0.999999, 5],
  ])('randomly selects either adjacent lane with roll %s', (roll, lane) => {
    const session = charged(0, () => roll);
    addSpider(session, 'normal', 4, 0.94);
    const left = addSpider(session, 'normal', 3, 0.9);
    const right = addSpider(session, 'normal', 5, 0.01);
    hit(session);
    session.tick(0.65);
    expect(left.dying).toBe(lane === 3);
    expect(right.dying).toBe(lane === 5);
  });

  it.each([0, 1, 2, 3, 4, 5])(
    'uses %s improvement ranks and can revisit surviving spiders',
    (rank) => {
      const session = charged(rank, () => 0);
      const source = addSpider(session, 'megaFat', 4, 0.94);
      const target = addSpider(session, 'megaFat', 3, 0.1);
      source.hits = target.hits = 10;
      hit(session);
      const delay = 0.65 - rank * 0.05;
      expect(session.state.stats['lightningArrows.jumps']).toBe(1 + rank);
      expect(session.state.stats['lightningArrows.delay']).toBeCloseTo(delay);
      session.tick(delay * (1 + rank));
      expect(source.hits + target.hits).toBe(18 - rank);
      expect(session.state.chainLightning).toHaveLength(0);
      expect(session.drainEvents().filter((event) => event.type === 'lightning')).toHaveLength(
        2 + rank,
      );
    },
  );

  it('ignores same-lane, dying and nonadjacent spiders and does not wrap at field edges', () => {
    const session = charged(5);
    addSpider(session, 'normal', 0, 0.94);
    addSpider(session, 'normal', 0, 0.1);
    addSpider(session, 'normal', 8, 0.1);
    const dying = addSpider(session, 'normal', 1, 0.1);
    dying.startDying();
    hit(session, 0);
    expect(session.state.chainLightning).toHaveLength(0);
  });

  it('stops a pending jump if its chosen target dies before arrival', () => {
    const session = charged(5);
    addSpider(session, 'normal', 4, 0.94);
    const target = addSpider(session, 'normal', 5, 0.94);
    hit(session);
    hit(session, 5);
    expect(target.dying).toBe(true);
    session.tick(0.65);
    expect(session.state.chainLightning).toHaveLength(0);
  });

  it('starts only one chain from a critical arrow despite multiple primary hits', () => {
    const session = charged();
    session.state.character.setModifiers('test:crit', [
      { stat: 'criticalShotChance', kind: 'flat', value: 1 },
    ]);
    session.refreshStats();
    addSpider(session, 'normal', 4, 0.94);
    addSpider(session, 'normal', 4, 0.93);
    addSpider(session, 'normal', 5, 0.2);
    session.shootLane(4);
    session.tick(0.1);
    expect(session.state.chainLightning).toHaveLength(1);
    expect(session.drainEvents().filter((event) => event.type === 'lightning')).toHaveLength(1);
  });

  it.each([
    [1, 170, 3.5],
    [6, 120, 6],
  ])('improves Armageddon at rank %s', (rank, cooldown, duration) => {
    const session = arena([{ id: 'improvedArmageddon', rank }]);
    expect(session.activateAbility('armageddon')).toBe('activated');
    expect(session.state.getAbility('armageddon').duration).toBe(cooldown);
    session.tick(2.5);
    expect(session.state.armageddonPhase).toBe('firing');
    expect(session.state.armageddonTimer).toBe(duration);
    addSpider(session, 'megaFat', 0, 0.1);
    session.tick(duration - 0.001);
    expect(session.state.armageddonPhase).toBe('firing');
    session.tick(0.001);
    expect(session.state.armageddonPhase).toBe('none');
  });
});

describe('fire explosion through session commands', () => {
  it.each([
    [0, 0, true],
    [20, 0.349999, true],
    [100, 0, true],
    [100.01, 0.349999, true],
    [150, 0.35, false],
    [150, 0.999999, false],
    [0, 0.35, false],
  ])('rolls below 35%% independently of energy: %s / %s', (energy, roll, explodes) => {
    const session = arena([{ id: 'fireExplosion', rank: 1 }], () => roll);
    session.state.energy = energy;
    addSpider(session, 'normal', 4, 0.94);
    const target = addSpider(session, 'megaFat', 4, 0.92);
    hit(session);
    expect(target.hits).toBe(explodes ? 2 : 3);
    expect(session.state.energy).toBeCloseTo(energy);
    session.tick(0.1);
    expect(target.hits).toBe(explodes ? 2 : 3);
  });

  it.each([
    [1, false],
    [5, false],
    [6, true],
    [10, true],
  ])('grows the radius and first reaches adjacent lanes at rank %s', (rank, adjacent) => {
    const session = arena([{ id: 'fireExplosion', rank }], () => 0);
    session.state.energy = 101;
    addSpider(session, 'normal', 4, 0.94);
    const sameLane = addSpider(session, 'megaFat', 4, 0.9);
    const near = addSpider(session, 'megaFat', 5, 0.94);
    const far = addSpider(session, 'megaFat', 5, 0.65);
    const twoLanes = addSpider(session, 'normal', 6, 0.94);
    hit(session);
    expect(sameLane.hits).toBe(2);
    expect(near.hits).toBe(adjacent ? 2 : 3);
    expect(far.hits).toBe(3);
    expect(twoLanes.dying).toBe(false);
    expect(session.drainEvents().find((event) => event.type === 'fireExplosion')).toMatchObject({
      lane: 4,
      y: 0.94,
      radius: Number(((0.33 + rank * 0.12) * 1.3).toFixed(2)),
    });
  });

  it('never triggers another explosion from an explosion kill', () => {
    const session = arena([{ id: 'fireExplosion', rank: 10 }], () => 0);
    session.state.energy = 116;
    addSpider(session, 'normal', 4, 0.94);
    const second = addSpider(session, 'normal', 5, 0.94);
    const third = addSpider(session, 'normal', 6, 0.94);
    const fourth = addSpider(session, 'normal', 7, 0.94);
    hit(session);
    expect(second.dying).toBe(true);
    expect(third.dying).toBe(false);
    expect(fourth.dying).toBe(false);
    expect(session.state.energy).toBe(116);
    expect(session.drainEvents().filter((event) => event.type === 'fireExplosion')).toHaveLength(1);
    session.tick(0.31);
    expect(session.drainEvents().filter((event) => event.type === 'coinDrop')).toHaveLength(2);
  });

  it('never triggers for lightning, Armageddon or castle breaches', () => {
    const session = arena([...lightning, { id: 'fireExplosion', rank: 1 }], () => 0);
    session.activateAbility('lightningArrows');
    addSpider(session, 'normal', 4, 0.94);
    addSpider(session, 'normal', 5, 0.2);
    hit(session);
    session.drainEvents();
    session.tick(0.65);
    expect(session.drainEvents().filter((event) => event.type === 'fireExplosion')).toHaveLength(0);
    addSpider(session, 'normal', 0, 1, 0);
    session.tick(0.001);
    expect(session.drainEvents().filter((event) => event.type === 'fireExplosion')).toHaveLength(0);
    addSpider(session, 'normal', 0, 0.1);
    session.activateAbility('armageddon');
    session.tick(2.5);
    expect(session.drainEvents().filter((event) => event.type === 'fireExplosion')).toHaveLength(0);
  });

  it.each(['volley', 'aimedFire'] as const)('triggers from actual %s projectiles', (ability) => {
    const session = arena(
      [
        { id: 'fireExplosion', rank: 1 },
        { id: 'aimedFire', rank: 1 },
      ],
      () => 0,
    );
    addSpider(session, 'normal', 0, 0.94);
    expect(session.activateAbility(ability)).toBe('activated');
    if (ability === 'aimedFire') session.tick(1);
    session.tick(0.04);
    expect(session.drainEvents().filter((event) => event.type === 'fireExplosion')).toHaveLength(1);
  });

  it('extends the blast 30 percent further along its own lane', () => {
    const session = arena([{ id: 'fireExplosion', rank: 1 }], () => 0);
    addSpider(session, 'normal', 4, 0.94);
    const inside = addSpider(session, 'megaFat', 4, 0.88);
    const outside = addSpider(session, 'megaFat', 4, 0.84);
    hit(session);
    expect(inside.hits).toBe(2);
    expect(outside.hits).toBe(3);
    expect(session.drainEvents().find((event) => event.type === 'fireExplosion')).toMatchObject({
      radius: 0.59,
      verticalRadius: 0.767,
    });
  });

  it('checks energy separately for each direct critical-arrow kill', () => {
    const session = arena([{ id: 'fireExplosion', rank: 1 }], () => 0);
    session.state.energy = 116;
    session.state.character.setModifiers('test:crit', [
      { stat: 'criticalShotChance', kind: 'flat', value: 1 },
      { stat: 'improvedCriticalShotChance', kind: 'flat', value: 1 },
    ]);
    session.refreshStats();
    for (const y of [0.94, 0.93, 0.92]) addSpider(session, 'normal', 4, y);
    session.shootLane(4);
    session.tick(0.1);
    expect(session.state.energy).toBe(116);
    expect(session.drainEvents().filter((event) => event.type === 'fireExplosion')).toHaveLength(3);
  });

  it('describes the actual radius and fractional improvement values', () => {
    const session = arena();
    expect(talentDescription('fireExplosion', 1, session.state.stats)).toContain(
      'Каждый ранг увеличивает область взрыва',
    );
    expect(talentDescription('fireExplosion', 10, session.state.stats)).toContain('с 6-го ранга');
    expect(talentDescription('improvedLightning', 5, session.state.stats)).toContain(
      'незначительно ускоряет цепь молний',
    );
    expect(talentDescription('improvedArmageddon', 1, session.state.stats)).toContain('0.5 с');
  });
});

describe('magic persistence', () => {
  it('keeps saved charges independent and pauses pending jumps during time freeze', () => {
    const session = charged(5);
    const saved = snapshot(session);
    addSpider(session, 'normal', 4, 0.94);
    const target = addSpider(session, 'megaFat', 5, 0.1);
    hit(session);
    expect(saved.state.lightningCharges).toEqual(Array(9).fill(1));
    expect(session.state.lightningCharges[4]).toBe(0);
    expect(session.activateAbility('freeze')).toBe('activated');
    const pending = session.state.chainLightning;
    session.tick(10);
    expect(session.state.chainLightning).toEqual(pending);
    expect(target.hits).toBe(3);
    expect(session.activateAbility('freeze')).toBe('deactivated');
    session.tick(0.4);
    expect(target.hits).toBe(2);
  });
  it('restores unspent lane charges, electric arrows and partially completed chains', () => {
    const session = charged(5);
    addSpider(session, 'normal', 4, 0.94);
    const target = addSpider(session, 'megaFat', 5, 0.1);
    hit(session);
    session.shootLane(0);
    session.tick(0.1);
    const saved = snapshot(session);
    const parsed = parseSave(JSON.parse(JSON.stringify(saved)));
    expect(parsed).not.toBeNull();
    const loaded = restore(parsed!, () => 0.999999);
    expect(snapshot(loaded)).toEqual(saved);
    loaded.tick(0.3);
    expect(loaded.state.spiders.get(target.id)?.hits).toBe(2);
    expect(loaded.state.lightningCharges[0]).toBe(0);
    expect(loaded.state.lightningCharges[1]).toBe(1);
  });

  it('migrates version 25 without new magic state or shifting existing ability cooldowns', () => {
    const session = arena([
      { id: 'blizzardMastery', rank: 6 },
      { id: 'permafrost', rank: 5 },
    ]);
    session.state.getAbility('aimedFire').start(17);
    session.shootLane(0);
    const dying = addSpider(session);
    dying.startDying();
    const data = snapshot(session);
    const { lightningCharges: _charges, chainLightning: _chain, ...state } = data.state;
    const previous = {
      ...data,
      version: 25,
      state,
      abilities: data.abilities.slice(0, 12),
      arrows: data.arrows.map(
        ({ lightningJumps: _jumps, lightningDelay: _delay, ...arrow }) => arrow,
      ),
    };
    const parsed = parseSave(previous);
    expect(parsed?.version).toBe(29);
    const loaded = restore(parsed!);
    expect(loaded.state.lightningCharges).toEqual(Array(9).fill(0));
    expect(loaded.state.chainLightning).toEqual([]);
    expect(loaded.state.isAbilityUnlocked('lightningArrows')).toBe(false);
    expect(loaded.state.getAbility('lightningArrows').isReady).toBe(true);
    expect(loaded.state.getAbility('aimedFire').remainingCooldown).toBe(17);
    expect(loaded.talents.getRank('blizzardMastery')).toBe(6);
    expect(loaded.talents.getRank('permafrost')).toBe(5);
    expect(loaded.state.spiders.get(dying.id)?.dying).toBe(true);
    expect(snapshot(restore(parseSave(snapshot(loaded))!))).toEqual(snapshot(loaded));
  });

  it.each([
    { lightningCharges: [true] },
    { lightningCharges: Array(9).fill(true) },
    {
      chainLightning: [
        {
          sourceId: 'spider-1',
          sourceLane: 4,
          sourceY: 0.5,
          targetId: 'spider-2',
          remaining: 0,
          jumps: 1,
          delay: 0.5,
        },
      ],
    },
    {
      chainLightning: [
        {
          sourceId: 'spider-1',
          sourceLane: 4,
          sourceY: 0.5,
          targetId: 'spider-2',
          remaining: 0.5,
          jumps: 12,
          delay: 0.5,
        },
      ],
    },
  ])('rejects malformed magic state %j', (invalid) => {
    const data = snapshot(charged());
    expect(parseSave({ ...data, state: { ...data.state, ...invalid } })).toBeNull();
  });
});
