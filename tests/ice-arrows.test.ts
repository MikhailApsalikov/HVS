import { describe, expect, it } from 'vitest';
import { GameSession } from '../src/domain/GameSession.js';
import { parseSave, restore, snapshot } from '../src/domain/save.js';
import { talentDescription } from '../src/ui/presenters.js';
import type { SpiderType, TalentId } from '../src/domain/types.js';
import { addSpider } from './helpers.js';

function arena(rank = 1, roll = 0.04, additional: { id: TalentId; rank: number }[] = []) {
  const session = new GameSession('normal', () => roll, { level: 60 });
  session.talents.loadFromSave([{ id: 'iceArrows', rank }, ...additional]);
  session.state.character.setModifiers('test:arena', [
    { stat: 'spawnProbability', kind: 'percent', value: -100 },
    { stat: 'shootCost', kind: 'percent', value: -100 },
    { stat: 'shootCooldown', kind: 'percent', value: -100 },
    { stat: 'maxEnergy', kind: 'flat', value: 1000 },
  ]);
  session.refreshStats();
  session.state.phase = 'playing';
  session.state.initialTalentPick = false;
  session.state.energy = session.state.maxEnergy;
  session.state.levelTimer = session.state.levelTimerMax = 1000;
  return session;
}
function impact(session: GameSession, lane = 4, type: SpiderType = 'normal') {
  const hit = addSpider(session, type, lane, 0.95, 0);
  expect(session.shootLane(lane)).toBe('shot');
  session.tick(0.001);
  return hit;
}

describe('ice arrows through session commands', () => {
  it.each(['easy', 'normal', 'hard'] as const)(
    'requires tier five, 28 magic points and all six blizzard ranks on %s',
    (difficulty) => {
      const session = new GameSession(difficulty, () => 0.999999, { level: 40 });
      expect(session.talents.getTalent('iceArrows')).toMatchObject({
        branch: 'magic',
        tier: 5,
        maxRanks: 5,
        requiredBranchPoints: 28,
        unlocksAtLevel: 40,
      });
      const invested = [
        { id: 'improvedIntellect', rank: 5 },
        { id: 'agility', rank: 5 },
        { id: 'hunterArsenal', rank: 5 },
        { id: 'tireless', rank: 5 },
        { id: 'permafrost', rank: 3 },
        { id: 'blizzardMastery', rank: 5 },
      ] as const;
      session.talents.loadFromSave(invested);
      expect(session.upgradeTalent('iceArrows')).toBe(false);
      expect(session.upgradeTalent('blizzardMastery')).toBe(true);
      session.state.level = 39;
      expect(session.upgradeTalent('iceArrows')).toBe(false);
      session.state.level = 40;
      session.talents.loadFromSave([
        ...invested.filter(({ id }) => id !== 'permafrost' && id !== 'blizzardMastery'),
        { id: 'permafrost', rank: 1 },
        { id: 'blizzardMastery', rank: 6 },
      ]);
      expect(session.talents.branchPoints('magic')).toBe(27);
      expect(session.upgradeTalent('iceArrows')).toBe(false);
      expect(session.upgradeTalent('permafrost')).toBe(true);
      for (let rank = 1; rank <= 5; rank++) {
        expect(session.upgradeTalent('iceArrows')).toBe(true);
        expect(session.state.stats['iceArrows.chance']).toBeCloseTo(0.12 * rank);
        expect(session.state.stats['iceArrows.adjacentChance']).toBeCloseTo(0.04 * rank);
        expect(session.state.rules.explain('iceArrows.chance').modifiers).toHaveLength(1);
      }
      expect(session.upgradeTalent('iceArrows')).toBe(false);
    },
  );

  it.each([1, 2, 3, 4, 5])(
    'uses one inclusive total chance and disjoint outcomes at rank %s',
    (rank) => {
      for (const [roll, own, adjacent] of [
        [0, true, true],
        [rank * 0.04 - 0.000001, true, true],
        [rank * 0.04, true, false],
        [rank * 0.12 - 0.000001, true, false],
        [rank * 0.12, false, false],
        [0.999999, false, false],
      ] as const) {
        const session = arena(rank, roll);
        const same = [addSpider(session, 'normal', 4, 0.1), addSpider(session, 'megaFat', 4, 0.7)];
        const sides = [addSpider(session, 'normal', 3, 0.1), addSpider(session, 'fat', 5, 0.8)];
        const far = addSpider(session, 'normal', 2, 0.5);
        const struck = impact(session);
        expect(struck.dying).toBe(true);
        same.forEach((spider) => expect(spider.rootTimer).toBe(own ? 4 : 0));
        sides.forEach((spider) => expect(spider.rootTimer).toBe(adjacent ? 4 : 0));
        expect(far.rootTimer).toBe(0);
      }
    },
  );

  it('makes exactly one random roll for a hit and no extra rolls without the talent', () => {
    let calls = 0;
    const session = new GameSession('normal', () => {
      calls++;
      return 0;
    });
    session.state.phase = 'playing';
    session.talents.loadFromSave([{ id: 'iceArrows', rank: 5 }]);
    session.refreshStats();
    addSpider(session, 'normal', 3, 0.1);
    impact(session);
    expect(calls).toBe(1);
    const noTalent = arena(0, 0);
    const target = addSpider(noTalent, 'normal', 4, 0.1);
    impact(noTalent);
    expect(target.rootTimer).toBe(0);
  });

  it.each([
    'normal',
    'fat',
    'megaFat',
    'fast',
    'golden',
    'poisonous',
    'cleanser',
    'burner',
    'tank',
    'ninja',
  ] as const)('roots live %s spiders without requiring a kill', (type) => {
    const session = arena();
    const target = addSpider(session, type, 4, 0.1, 0, 0.1);
    const struck = impact(session, 4, 'megaFat');
    expect(struck.dying).toBe(false);
    expect(struck.hits).toBe(2);
    expect(struck.rootTimer).toBe(4);
    expect(target.rootTimer).toBe(4);
    const y = target.y;
    session.tick(3.999);
    expect(target.y).toBe(y);
    expect(target.rootTimer).toBeCloseTo(0.001);
    session.tick(0.001);
    expect(target.rootTimer).toBe(0);
    expect(target.y).toBeCloseTo(y, 12);
    session.tick(0.1);
    expect(target.y).toBeCloseTo(y + 0.01);
  });

  it.each([0, 8])('uses actual adjacent lanes without wrapping around edge %s', (lane) => {
    const session = arena(5, 0);
    const neighbor = addSpider(session, 'normal', lane === 0 ? 1 : 7, 0.1);
    const opposite = addSpider(session, 'normal', lane === 0 ? 8 : 0, 0.1);
    const dying = addSpider(session, 'normal', lane, 0.1);
    dying.startDying();
    impact(session, lane);
    expect(neighbor.rootTimer).toBe(4);
    expect(opposite.rootTimer).toBe(0);
    expect(dying.rootTimer).toBe(0);
    const newcomer = addSpider(session, 'normal', lane, 0, 0, 0.1);
    session.tick(0.1);
    expect(newcomer.rootTimer).toBe(0);
    expect(newcomer.y).toBeCloseTo(0.01);
  });

  it.each(['volley', 'aimedFire'] as const)('works with actual %s arrows', (ability) => {
    const session = arena(1, 0, [{ id: 'aimedFire', rank: 1 }]);
    const target = addSpider(session, 'normal', 0, 0.1);
    addSpider(session, 'normal', 0, 0.95);
    expect(session.activateAbility(ability)).toBe('activated');
    if (ability === 'aimedFire') session.tick(1);
    session.tick(0.001);
    expect(target.rootTimer).toBe(4);
  });

  it('works with electric arrows, while chain lightning hits cannot refresh roots', () => {
    const session = arena(1, 0.04, [{ id: 'lightningArrows', rank: 1 }]);
    const same = addSpider(session, 'normal', 4, 0.1);
    const side = addSpider(session, 'megaFat', 5, 0.1);
    session.activateAbility('lightningArrows');
    impact(session);
    expect(same.rootTimer).toBe(4);
    expect(side.rootTimer).toBe(0);
    session.tick(0.65);
    expect(side.hits).toBe(2);
    expect(side.rootTimer).toBe(0);
    expect(same.rootTimer).toBeCloseTo(3.35);
  });

  it('rolls on every hit of the same critical arrow', () => {
    const session = arena(1, 0.04);
    session.state.character.setModifiers('test:critical', [
      { stat: 'criticalShotChance', kind: 'flat', value: 1 },
    ]);
    session.refreshStats();
    const farther = addSpider(session, 'megaFat', 4, 0.8);
    impact(session);
    session.tick(0.2);
    expect(farther.rootTimer).toBeCloseTo(3.8);
    session.tick(0.251);
    expect(farther.hits).toBe(2);
    expect(farther.rootTimer).toBe(4);
  });

  it('refreshes to four seconds without stacking and combines with existing slows', () => {
    const session = arena(1, 0.04, [{ id: 'permafrost', rank: 5 }]);
    const target = addSpider(session, 'normal', 4, 0.1, 0, 0.1);
    session.activateAbility('blizzard');
    impact(session);
    session.tick(2);
    const y = target.y;
    expect(target.rootTimer).toBeCloseTo(2);
    impact(session);
    expect(target.rootTimer).toBe(4);
    session.tick(4.5);
    expect(target.rootTimer).toBe(0);
    expect(target.y).toBeCloseTo(
      y + target.effectiveSpeed(session.state.stats.permafrostSlow) * 0.5,
    );
    expect(target.slowFactor).toBe(1);
  });

  it('prevents ninja lane jumps until the root has expired', () => {
    const session = arena();
    const ninja = addSpider(session, 'ninja', 4, 0.19, 0, 0.05);
    impact(session);
    expect(ninja.jumpsMade).toBe(0);
    const lane = ninja.lane;
    session.tick(4);
    expect(ninja.lane).toBe(lane);
    session.tick(0.3);
    expect(ninja.jumpsMade).toBe(0);
    session.tick(0.01);
    expect(ninja.jumpsMade).toBe(1);
    expect(ninja.lane).not.toBe(lane);
  });

  it('pauses the root during time freeze and talent selection', () => {
    const session = arena();
    const target = addSpider(session, 'normal', 4, 0.1, 0, 0.1);
    impact(session);
    session.tick(1);
    session.activateAbility('freeze');
    session.tick(10);
    expect(target.rootTimer).toBe(3);
    session.activateAbility('freeze');
    session.state.levelTimer = 0.5;
    session.tick(0.5);
    expect(session.state.phase).toBe('levelUp');
    const remaining = target.rootTimer;
    session.tick(10);
    expect(target.rootTimer).toBe(remaining);
  });

  it('describes the nested probabilities at the current rank', () => {
    const session = arena(5);
    const description = talentDescription('iceArrows', 5, session.state.stats);
    expect(description).toContain('вероятностью 60%');
    expect(description).toContain('входит 20%');
    expect(description).toContain('на 4 с');
    expect(description).not.toContain('{');
  });
});

describe('ice arrow save compatibility', () => {
  it('restores a partially elapsed root and its precise movement boundary', () => {
    const session = arena();
    const target = addSpider(session, 'normal', 4, 0.1, 0, 0.1);
    impact(session);
    session.tick(1.75);
    const saved = snapshot(session);
    const parsed = parseSave(JSON.parse(JSON.stringify(saved)));
    expect(parsed).not.toBeNull();
    const loaded = restore(parsed!, () => 0.999999);
    expect(snapshot(loaded)).toEqual(saved);
    const restored = loaded.state.spiders.get(target.id)!;
    loaded.tick(2.25);
    expect(restored.y).toBe(target.y);
    expect(restored.rootTimer).toBe(0);
    loaded.tick(0.1);
    expect(restored.y).toBeCloseTo(target.y + 0.01);
  });

  it('migrates version 26 spiders without granting roots or changing lightning state', () => {
    const session = arena(0, 0.999999, [{ id: 'lightningArrows', rank: 1 }]);
    session.activateAbility('lightningArrows');
    addSpider(session, 'fat', 3, 0.2, 0, 0.1);
    const data = snapshot(session);
    const previous = {
      ...data,
      version: 26,
      abilities: data.abilities.slice(0, 13),
      state: { ...data.state, lightningCharges: data.state.lightningCharges.map(Boolean) },
      talents: data.talents.filter(({ id }) => id !== 'iceArrows'),
      spiders: data.spiders.map(({ rootTimer: _timer, ...spider }) => spider),
    };
    const parsed = parseSave(previous);
    expect(parsed?.version).toBe(28);
    const loaded = restore(parsed!, () => 0.999999);
    expect(loaded.talents.getRank('iceArrows')).toBe(0);
    expect(loaded.state.lightningCharges).toEqual(data.state.lightningCharges);
    const spider = [...loaded.state.spiders.values()][0];
    expect(spider.rootTimer).toBe(0);
    loaded.tick(1);
    expect(spider.y).toBeCloseTo(0.3);
    expect(snapshot(restore(parseSave(snapshot(loaded))!))).toEqual(snapshot(loaded));
  });

  it.each([-1, 4.001, null, '4'])('rejects an invalid saved root timer %s', (rootTimer) => {
    const session = arena();
    addSpider(session);
    const data = snapshot(session);
    expect(
      parseSave({ ...data, spiders: data.spiders.map((spider) => ({ ...spider, rootTimer })) }),
    ).toBeNull();
  });
});
