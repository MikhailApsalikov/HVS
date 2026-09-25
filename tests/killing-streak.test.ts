import { describe, expect, it } from 'vitest';
import { GameSession } from '../src/domain/GameSession.js';
import { parseSave, restore, snapshot } from '../src/domain/save.js';
import type { TalentId } from '../src/domain/types.js';
import {
  abilityDescription,
  attributeDescription,
  killingStreakDescription,
  talentDescription,
} from '../src/ui/presenters.js';
import { addSpider } from './helpers.js';

function arena(talents: { id: TalentId; rank: number }[] = [], roll = 0.999999) {
  const session = new GameSession('normal', () => roll);
  session.talents.loadFromSave(talents);
  session.state.character.restoreBase({ endurance: 0, agility: 0, intellect: 0 });
  session.state.character.setModifiers('test:quiet', [
    { stat: 'spawnProbability', kind: 'percent', value: -100 },
    { stat: 'hpRegen', kind: 'percent', value: -100 },
    { stat: 'energyRegen', kind: 'percent', value: -100 },
    { stat: 'coinsPerSec', kind: 'percent', value: -100 },
    { stat: 'arrowSpeed', kind: 'percent', value: 2900 },
  ]);
  session.refreshStats();
  session.state.phase = 'playing';
  session.state.initialTalentPick = false;
  session.state.pendingTalentPoints = 0;
  session.state.levelTimer = session.state.levelTimerMax = 10000;
  return session;
}
const streak = [{ id: 'killingStreak' as const, rank: 10 }];
function hit(session: GameSession, damage = 10) {
  addSpider(session, 'normal', 8, 1, damage);
  session.tick(0.001);
  return session.drainEvents().find((event) => event.type === 'damage');
}

describe('agility dodge and breach effects', () => {
  it.each([
    [1, 0.0003],
    [100, 0.03],
    [2499, 0.7497],
    [2500, 0.75],
    [10000, 0.75],
  ])('%s agility grants %s dodge chance', (agility, chance) => {
    const session = arena();
    session.state.character.setBase('agility', agility);
    session.refreshStats();
    expect(session.state.stats.dodgeChance).toBe(chance);
    expect(attributeDescription(session.state, 'agility')).toContain(
      `Дает ${chance * 100}% вероятности уклониться от урона.`,
    );
  });
  it.each([
    [0.029999, true],
    [0.03, false],
    [0.999999, false],
  ])('checks dodge boundary %s', (roll, dodged) => {
    const session = arena([], roll);
    session.state.character.setBase('agility', 100);
    session.refreshStats();
    expect(hit(session)).toMatchObject({
      hp: dodged ? 0 : 10,
      ...(dodged ? { dodged: true } : {}),
    });
    expect(session.state.hp).toBe(dodged ? 100 : 90);
  });
  it('uses final agility with growth, talent and equipment modifiers and caps it', () => {
    const session = arena([{ id: 'improvedAgility', rank: 1 }]);
    session.state.level = 10;
    session.state.character.setBase('agility', 100);
    session.state.character.setModifiers('test:item', [
      { stat: 'agility', kind: 'flat', value: 6 },
    ]);
    session.refreshStats();
    expect(session.state.stats).toMatchObject({ agility: 130, dodgeChance: 0.039 });
  });
  it('burns energy, grants breach energy and gold, and fires an unlearned counter volley on dodge', () => {
    const session = arena(
      [
        { id: 'endurance', rank: 1 },
        { id: 'bestDefense', rank: 10 },
        { id: 'marauder', rank: 1 },
      ],
      0,
    );
    session.state.character.setBase('agility', 100);
    session.refreshStats();
    expect(session.state.isAbilityUnlocked('volley')).toBe(false);
    session.state.getAbility('volley').start(20);
    const hp = session.state.hp;
    addSpider(session, 'burner', 0, 1, 20);
    session.tick(0.001);
    expect(session.state.hp).toBe(hp);
    expect(session.state.energy).toBe(10); // 100 − 92 + 2
    expect(session.drainEvents()).toContainEqual(
      expect.objectContaining({ type: 'damage', hp: 0, energy: 92, dodged: true }),
    );
    expect(session.state.arrows.size).toBe(4);
    expect(session.state.bestDefenseCooldown).toBe(3);
    expect(session.state.getAbility('volley').remainingCooldown).toBeCloseTo(19.999);
    session.tick(0.4);
    expect(session.drainEvents()).toContainEqual(expect.objectContaining({ type: 'coinDrop' }));
  });
});

describe('killing streak through gameplay time', () => {
  it.each(Array.from({ length: 10 }, (_, i) => i + 1))(
    'rank %s sets the stack interval',
    (rank) => {
      const session = arena([{ id: 'killingStreak', rank }]);
      const interval = 15 - rank;
      session.tick(interval - 0.01);
      expect(session.state.killingStreakStacks).toBe(0);
      expect(session.state.killingStreakRemaining).toBeCloseTo(0.01);
      session.tick(0.01);
      expect(session.state.killingStreakStacks).toBe(1);
      expect(session.state.killingStreakRemaining).toBe(interval);
    },
  );
  it('does not accumulate without the talent and starts when learned', () => {
    const session = arena();
    session.tick(100);
    expect(session.state.killingStreakProgress).toBe(0);
    session.state.phase = 'levelUp';
    session.state.level = 20;
    session.state.pendingTalentPoints = 1;
    session.talents.loadFromSave([
      { id: 'hunterMastery', rank: 5 },
      { id: 'criticalShot', rank: 9 },
    ]);
    expect(session.upgradeTalent('killingStreak')).toBe(true);
    session.state.phase = 'playing';
    session.tick(14);
    expect(session.state.killingStreakStacks).toBe(1);
  });
  it('caps at five, discards time at cap and reduces the actual energy spent', () => {
    const session = arena(streak);
    session.tick(205);
    expect(session.state.killingStreakStacks).toBe(5);
    expect(session.state.killingStreakProgress).toBe(0);
    expect(session.state.killingStreakFraction).toBe(1);
    expect(session.state.killingStreakRemaining).toBe(0);
    expect(session.shootLane(0)).toBe('shot');
    expect(session.state.energy).toBe(70);
    expect(killingStreakDescription(session.state)).toContain('максимальное количество');
    hit(session);
    expect(session.state.killingStreakStacks).toBe(4);
    expect(session.state.killingStreakRemaining).toBe(5);
    session.tick(4);
    expect(session.state.killingStreakStacks).toBe(4);
    session.tick(1);
    expect(session.state.killingStreakStacks).toBe(5);
  });
  it('removes exactly one stack per damaging spider and restarts progress, including at zero stacks', () => {
    const session = arena(streak);
    session.tick(16);
    addSpider(session, 'normal', 0, 1, 10);
    addSpider(session, 'normal', 1, 1, 10);
    session.tick(0.001);
    expect(session.state.killingStreakStacks).toBe(1);
    expect(session.state.killingStreakProgress).toBe(0);
    hit(session);
    session.tick(4);
    hit(session);
    expect(session.state.killingStreakStacks).toBe(0);
    expect(session.state.killingStreakRemaining).toBe(5);
  });
  it.each(['dodge', 'block', 'shield', 'reduction', 'zero'] as const)(
    'preserves stacks and progress on %s',
    (protection) => {
      const session = arena(
        [...streak, { id: 'enthusiasm', rank: 5 }, { id: 'divineShield', rank: 1 }],
        0,
      );
      const modifiers =
        protection === 'block'
          ? [
              { stat: 'blockChance' as const, kind: 'flat' as const, value: 1 },
              { stat: 'blockPower' as const, kind: 'flat' as const, value: 100 },
            ]
          : protection === 'reduction'
            ? [{ stat: 'incomingDamage' as const, kind: 'percent' as const, value: -100 }]
            : [];
      session.state.character.setModifiers('test:protection', modifiers);
      if (protection === 'dodge') session.state.character.setBase('agility', 2500);
      session.refreshStats();
      session.tick(11);
      if (protection === 'shield') session.activateAbility('stand');
      hit(session, protection === 'zero' ? 0 : 10);
      expect(session.state.killingStreakStacks).toBe(2);
      expect(session.state.killingStreakProgress).toBeCloseTo(1.001);
    },
  );
  it('partial blocks still remove a stack and reset the timer', () => {
    const session = arena(streak, 0);
    session.state.character.setModifiers('test:block', [
      { stat: 'blockChance', kind: 'flat', value: 1 },
      { stat: 'blockPower', kind: 'flat', value: 4 },
    ]);
    session.refreshStats();
    session.tick(11);
    expect(hit(session)).toMatchObject({ hp: 6, blockedDamage: 4 });
    expect(session.state.killingStreakStacks).toBe(1);
    expect(session.state.killingStreakProgress).toBe(0);
  });
  it('pauses the countdown during time freeze and talent selection', () => {
    const session = arena(streak);
    session.tick(2);
    session.state.level = 4;
    expect(session.activateAbility('freeze')).toBe('activated');
    session.tick(100);
    expect(session.state.killingStreakRemaining).toBe(3);
    session.activateAbility('freeze');
    session.state.phase = 'levelUp';
    session.tick(100);
    expect(session.state.killingStreakProgress).toBe(2);
    session.state.phase = 'playing';
    session.tick(3);
    expect(session.state.killingStreakStacks).toBe(1);
  });
  it('applies the discount after other modifiers, clamps at zero and combines with adrenaline', () => {
    const session = arena([...streak, { id: 'adrenaline', rank: 1 }]);
    session.state.character.setModifiers('test:cost', [
      { stat: 'shootCost', kind: 'percent', value: -90 },
    ]);
    session.refreshStats();
    session.tick(100);
    expect(session.state.currentShootCost).toBe(0);
    session.state.energy = 0;
    expect(session.shootLane(0)).toBe('shot');
    session.activateAbility('adrenaline');
    expect(session.shootLane(0)).toBe('shot');
    expect(session.state.killingStreakStacks).toBe(5);
    expect(session.state.adrenalineShots).toBe(19);
  });
});

describe('enthusiasm and improved streak', () => {
  it.each([1, 2, 3, 4, 5])(
    'enthusiasm rank %s consumes a stack only when damage remains',
    (rank) => {
      const session = arena([...streak, { id: 'enthusiasm', rank }], rank * 0.2 - 0.000001);
      session.tick(11);
      expect(hit(session)).toMatchObject({ hp: 0, dodged: true });
      expect(session.state.killingStreakStacks).toBe(1);
      expect(session.state.killingStreakProgress).toBeCloseTo(1.001);
      expect(session.state.hp).toBe(100);
      if (rank < 5) {
        const failed = arena([...streak, { id: 'enthusiasm', rank }], rank * 0.2 + 0.000001);
        failed.tick(11);
        expect(hit(failed)).toMatchObject({ hp: 10 });
        expect(failed.state.killingStreakStacks).toBe(1);
        expect(failed.state.killingStreakProgress).toBe(0);
      }
    },
  );
  it('avoids five consecutive hits, then takes damage without stacks', () => {
    const session = arena([...streak, { id: 'enthusiasm', rank: 5 }]);
    session.tick(100);
    for (let i = 0; i < 5; i++) expect(hit(session)).toMatchObject({ hp: 0, dodged: true });
    expect(session.state.killingStreakStacks).toBe(0);
    expect(hit(session)).toMatchObject({ hp: 10 });
  });
  it.each([1, 2, 3, 4, 5])(
    'improvement rank %s raises the cap and advances the timer on kills',
    (rank) => {
      const session = arena([...streak, { id: 'improvedKillingStreak', rank }]);
      session.state.character.setBase('agility', 149);
      session.refreshStats();
      session.tick(5 * (5 + rank) + 7);
      expect(session.state.killingStreakStacks).toBe(5 + rank);
      expect(session.state.killingStreakProgress).toBe(0);
      hit(session);
      addSpider(session, 'normal', 0, 0.9);
      session.shootLane(0);
      session.tick(0.4);
      expect(session.state.killingStreakProgress).toBeCloseTo(0.4 + 0.02 * rank);
    },
  );
  it.each(['critical', 'volley', 'armageddon'] as const)(
    'advances for every kill from %s, never from a breach',
    (source) => {
      const session = arena(
        [
          ...streak,
          { id: 'improvedKillingStreak', rank: 5 },
          { id: 'criticalShot', rank: 10 },
          { id: 'volley', rank: 1 },
        ],
        0,
      );
      session.state.character.setBase('agility', 100);
      session.refreshStats();
      addSpider(session, 'normal', 0, 0.9);
      addSpider(session, 'normal', source === 'critical' ? 0 : 1, 0.7);
      if (source === 'critical') session.shootLane(0);
      else {
        if (source === 'armageddon') session.state.level = 30;
        session.activateAbility(source);
      }
      const dt = source === 'armageddon' ? 3 : 0.4;
      session.tick(dt);
      expect(session.state.killingStreakProgress).toBeCloseTo(dt + 0.2);
      session.state.armageddonPhase = 'none';
      addSpider(session, 'normal', 8, 1, 0);
      session.tick(0.4);
      expect(session.state.killingStreakProgress).toBeCloseTo(dt + 0.6);
    },
  );
  it('kill acceleration can complete a stack and retains the remainder', () => {
    const session = arena([...streak, { id: 'improvedKillingStreak', rank: 5 }]);
    session.state.character.setBase('agility', 100);
    session.refreshStats();
    session.tick(4.55);
    addSpider(session, 'normal', 0, 0.9);
    session.shootLane(0);
    session.tick(0.4);
    expect(session.state.killingStreakStacks).toBe(1);
    expect(session.state.killingStreakProgress).toBeCloseTo(0.05);
  });
});

describe('shooting rebalance, tooltips and save compatibility', () => {
  it('requires enthusiasm before learning or upgrading improved killing streak', () => {
    const session = new GameSession('normal');
    session.state.level = 40;
    session.state.pendingTalentPoints = 3;
    session.talents.loadFromSave([
      { id: 'hunterMastery', rank: 5 },
      { id: 'criticalShot', rank: 10 },
      { id: 'piercingReward', rank: 8 },
      { id: 'killingStreak', rank: 10 },
    ]);
    expect(session.upgradeTalent('improvedKillingStreak')).toBe(false);
    expect(session.state.pendingTalentPoints).toBe(3);
    expect(session.upgradeTalent('enthusiasm')).toBe(true);
    expect(session.upgradeTalent('improvedKillingStreak')).toBe(true);
    expect(session.upgradeTalent('improvedKillingStreak')).toBe(true);
    expect(session.state.stats['killingStreak.maxStacks']).toBe(7);
  });
  it.each([1, 2, 3, 4, 5])(
    'agile critical shot rank %s adds two eagle-eye charges per rank',
    (rank) => {
      const session = arena([
        { id: 'eagleEye', rank: 1 },
        { id: 'agileCriticalShot', rank },
      ]);
      session.activateAbility('eagleEye');
      expect(session.state.eagleEyeShots).toBe(5 + rank * 2);
    },
  );
  it('keeps the extra improvement chance for the last eagle-eye arrow and removes it afterwards', () => {
    const session = arena(
      [
        { id: 'eagleEye', rank: 1 },
        { id: 'agileCriticalShot', rank: 5 },
        { id: 'improvedCriticalShot', rank: 8 },
        { id: 'adrenaline', rank: 1 },
      ],
      0.7,
    );
    session.state.character.setModifiers('test:critical', [
      { stat: 'criticalShotChance', kind: 'flat', value: 1 },
    ]);
    session.refreshStats();
    session.activateAbility('adrenaline');
    session.shootLane(0);
    expect([...session.state.arrows.values()].at(-1)?.power).toBe(2);
    session.activateAbility('eagleEye');
    for (let i = 0; i < 15; i++) {
      session.shootLane(0);
      expect([...session.state.arrows.values()].at(-1)?.power).toBe(3);
    }
    expect(session.state.eagleEyeActive).toBe(false);
    session.shootLane(0);
    expect([...session.state.arrows.values()].at(-1)?.power).toBe(2);
  });
  it.each(['easy', 'normal', 'hard'] as const)(
    'new tiers, prerequisites, ranks and gold on %s',
    (difficulty) => {
      const session = new GameSession(difficulty);
      expect(session.state.coins).toBe({ easy: 0, normal: 250, hard: 1000 }[difficulty]);
      for (const [id, tier, maxRanks] of [
        ['piercingReward', 2, 8],
        ['volley', 2, 1],
        ['volleyMastery', 3, 5],
        ['killingStreak', 3, 10],
        ['enthusiasm', 4, 5],
        ['rapidFire', 5, 7],
        ['improvedKillingStreak', 5, 5],
      ] as const)
        expect(session.talents.getTalent(id)).toMatchObject({ tier, maxRanks });
      session.state.level = 40;
      session.state.pendingTalentPoints = 100;
      session.talents.loadFromSave([
        { id: 'hunterMastery', rank: 5 },
        { id: 'criticalShot', rank: 10 },
        { id: 'improvedAgility', rank: 7 },
        { id: 'vampirism', rank: 5 },
        { id: 'piercingReward', rank: 8 },
      ]);
      expect(session.upgradeTalent('volleyMastery')).toBe(false);
      expect(session.upgradeTalent('enthusiasm')).toBe(false);
      expect(session.upgradeTalent('volley')).toBe(true);
      expect(session.upgradeTalent('volleyMastery')).toBe(true);
      for (let i = 0; i < 10; i++) expect(session.upgradeTalent('killingStreak')).toBe(true);
      expect(session.upgradeTalent('killingStreak')).toBe(false);
      for (const id of ['enthusiasm', 'improvedKillingStreak'] as const) {
        for (let i = 0; i < 5; i++) expect(session.upgradeTalent(id)).toBe(true);
        expect(session.upgradeTalent(id)).toBe(false);
      }
    },
  );
  it('volley requires its talent even at high level, and works without an ability level gate', () => {
    const session = arena();
    session.state.level = 100;
    expect(session.activateAbility('volley')).toBe('level_locked');
    expect(abilityDescription(session.state, 'volley')).toContain('Требуется талант «Залп»');
    session.state.level = 10;
    session.talents.loadFromSave([{ id: 'volley', rank: 1 }]);
    session.refreshStats();
    expect(session.activateAbility('volley')).toBe('activated');
  });
  it('mastery and rapid fire are independent sources for all their bonuses', () => {
    const session = arena([
      { id: 'volley', rank: 1 },
      { id: 'volleyMastery', rank: 5 },
      { id: 'rapidFire', rank: 7 },
    ]);
    session.state.character.removeModifiers('test:quiet');
    session.refreshStats();
    expect(session.state.stats).toMatchObject({
      'volley.cost': 90,
      'volley.cooldown': 14.69,
      'volley.lanes': 9,
      shootCooldown: 1.53,
      arrowSpeed: 0.496667,
    });
    expect(session.activateAbility('volley')).toBe('activated');
    expect(session.state.energy).toBe(10);
    expect(session.state.arrows.size).toBe(9);
  });
  it('describes the bonuses without leaking placeholders or rules internals', () => {
    const session = arena(streak);
    expect(talentDescription('killingStreak', 1, session.state.stats)).toContain('14 с');
    expect(talentDescription('killingStreak', 10, session.state.stats)).toContain('5 с');
    expect(talentDescription('enthusiasm', 5, session.state.stats)).toContain('100%');
    expect(talentDescription('improvedKillingStreak', 5, session.state.stats)).toContain('0.05 с');
    expect(talentDescription('volleyMastery', 5, session.state.stats)).toContain('20%');
    expect(talentDescription('improvedCriticalShot', 8, session.state.stats)).toContain('96%');
    expect(talentDescription('agileCriticalShot', 5, session.state.stats)).toContain(
      '10 критических стрел',
    );
    expect(killingStreakDescription(session.state)).toContain('через 5 с');
  });
  it('retains stacks, timer and fifteen eagle-eye charges across save and load', () => {
    const session = arena([
      ...streak,
      { id: 'improvedKillingStreak', rank: 5 },
      { id: 'eagleEye', rank: 1 },
      { id: 'agileCriticalShot', rank: 5 },
    ]);
    session.tick(38.5);
    session.activateAbility('eagleEye');
    expect(session.state.eagleEyeShots).toBe(15);
    const saved = snapshot(session);
    const loaded = restore(parseSave(JSON.parse(JSON.stringify(saved)))!, () => 0.999999);
    expect(snapshot(loaded)).toEqual(saved);
    expect(loaded.state.currentShootCost).toBe(28);
    loaded.tick(1.5);
    session.tick(1.5);
    expect(snapshot(loaded)).toEqual(snapshot(session));
  });
  it.each([1, 5, 10])(
    'migrates the version thirteen countdown at rank %s without losing stacks',
    (rank) => {
      const saved = snapshot(arena([{ id: 'killingStreak', rank }]));
      const previous = {
        ...saved,
        version: 13,
        state: {
          ...saved.state,
          killingStreakStacks: 2,
          killingStreakProgress: (40 - 2 * rank) / 2,
        },
      };
      const parsed = parseSave(previous)!;
      expect(parsed.version).toBe(14);
      const session = restore(parsed, () => 0.999999);
      expect(session.state.killingStreakStacks).toBe(2);
      expect(session.state.killingStreakProgress).toBe((15 - rank) / 2);
      expect(session.state.killingStreakFraction).toBe(0.5);
      expect(session.state.currentShootCost).toBe(33);
      expect(session.state.coins).toBe(previous.state.coins);
      expect(snapshot(restore(parseSave(snapshot(session))!))).toEqual(snapshot(session));
      session.tick((15 - rank) / 2);
      expect(session.state.killingStreakStacks).toBe(3);
      expect(session.state.killingStreakProgress).toBe(0);
    },
  );
  it('keeps full stacks and an unlearned streak unchanged when migrating version thirteen', () => {
    for (const talents of [[], streak]) {
      const session = arena(talents);
      session.tick(25);
      const saved = snapshot(session);
      expect(parseSave({ ...saved, version: 13 })).toEqual(saved);
    }
  });
  it('rejects progress beyond the old interval in a version thirteen save', () => {
    const saved = snapshot(arena(streak));
    expect(
      parseSave({ ...saved, version: 13, state: { ...saved.state, killingStreakProgress: 20 } }),
    ).toBeNull();
  });
  it('migrates version twelve with unchanged gold, cooldowns, moved ranks and ninja progress', () => {
    const session = arena([
      { id: 'volleyMastery', rank: 5 },
      { id: 'rapidFire', rank: 7 },
    ]);
    session.state.level = 105;
    const spider = addSpider(session, 'ninja');
    spider.jumpsMade = 2;
    session.state.getAbility('volley').start(9);
    const saved = snapshot(session);
    const {
      killingStreakStacks: _stacks,
      killingStreakProgress: _progress,
      ...state
    } = saved.state;
    const previous = {
      ...saved,
      version: 12,
      state,
      talents: saved.talents.filter(
        (t) => !['killingStreak', 'enthusiasm', 'improvedKillingStreak', 'volley'].includes(t.id),
      ),
    };
    const loaded = restore(parseSave(previous)!, () => 0.999999);
    expect(loaded.state.coins).toBe(250);
    expect(loaded.state.killingStreakProgress).toBe(0);
    expect(loaded.state.killingStreakStacks).toBe(0);
    expect(loaded.state.getAbility('volley').remainingCooldown).toBe(9);
    expect(loaded.talents.getRank('volleyMastery')).toBe(5);
    expect(loaded.talents.getRank('rapidFire')).toBe(7);
    expect([...loaded.state.spiders.values()][0]).toMatchObject({ jumpsMade: 2, jumpLimit: 3 });
    expect(snapshot(restore(parseSave(snapshot(loaded))!))).toEqual(snapshot(loaded));
  });
  it.each([
    { killingStreakStacks: -1 },
    { killingStreakStacks: 1.5 },
    { killingStreakStacks: 6 },
    { killingStreakProgress: -1 },
    { killingStreakProgress: 5 },
    { killingStreakProgress: null },
    { killingStreakStacks: 5, killingStreakProgress: 1 },
  ])('rejects invalid streak data %j', (invalid) => {
    const saved = snapshot(arena(streak));
    expect(parseSave({ ...saved, state: { ...saved.state, ...invalid } })).toBeNull();
  });
  it('rejects an active streak without its talent', () => {
    const saved = snapshot(arena());
    expect(parseSave({ ...saved, state: { ...saved.state, killingStreakStacks: 1 } })).toBeNull();
  });
});
