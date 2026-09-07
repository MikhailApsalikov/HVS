import { describe, expect, it } from 'vitest';
import { GameSession } from '../src/domain/GameSession.js';
import { ITEM_CATALOG } from '../src/content/items.js';
import { TALENTS, TALENT_ORDER } from '../src/content/talents.js';
import type { TalentId } from '../src/domain/types.js';
import { addSpider, game } from './helpers.js';

describe('primary attributes through the session API', () => {
  it('starts with first-level bases and applies growth once on each completed level', () => {
    const session = new GameSession('normal', () => 0.999999);
    expect(session.state.stats).toMatchObject({
      endurance: 27,
      agility: 23,
      intellect: 16,
      armor: 54,
      maxHp: 100,
      maxEnergy: 100,
      hpRegen: 1.08,
      energyRegen: 8.16,
      shootCooldown: 2.97,
      arrowSpeed: 0.336667,
      'volley.cooldown': 35.64,
      'heal.amount': 182,
      'prep.restore': 266,
      coinsPerSec: 4.2,
    });
    session.upgradeTalent('hunterMastery');
    session.confirmLevelUp();
    for (let level = 2; level <= 6; level++) {
      session.tick(session.state.levelTimerMax);
      expect(session.state.phase).toBe('levelUp');
      expect(session.upgradeTalent('hunterMastery')).toBe(true);
      expect(session.confirmLevelUp()).toBe(true);
      expect(session.state.stats.endurance).toBe(27 + (level - 1) * 3);
      expect(session.state.stats.agility).toBe(23 + level - 1);
      expect(session.state.stats.intellect).toBe(16 + (level - 1) * 2);
    }
    expect(session.state.maxHp).toBe(120);
    expect(session.state.hp).toBe(120);
    session.refreshStats();
    expect(session.state.stats.endurance).toBe(42);
  });

  it.each([
    [39, 'maxHp', 100],
    [40, 'maxHp', 100],
    [41, 'maxHp', 110],
    [55, 'maxHp', 250],
    [24, 'levelDuration', 17],
    [25, 'levelDuration', 16],
    [49, 'levelDuration', 16],
    [50, 'levelDuration', 15],
    [74, 'levelDuration', 15],
    [75, 'levelDuration', 14],
    [79, 'levelDuration', 14],
    [80, 'levelDuration', 14],
    [159, 'levelDuration', 11],
    [160, 'levelDuration', 11],
    [240, 'levelDuration', 10],
    [100000, 'levelDuration', 10],
    [99, 'energyPerBreach', 0],
    [100, 'energyPerBreach', 1],
    [200, 'energyPerBreach', 2],
    [239, 'coinsPerKill', 0],
    [240, 'coinsPerKill', 1],
    [480, 'coinsPerKill', 2],
    [9, 'coinsPerSec', 4],
    [10, 'coinsPerSec', 4.1],
    [19, 'coinsPerSec', 4.1],
    [20, 'coinsPerSec', 4.2],
    [1, 'hpRegen', 0.04],
    [55, 'hpRegen', 2.2],
    [55, 'armor', 110],
  ] as const)('endurance %s resolves %s to %s at its threshold', (value, stat, expected) => {
    const session = new GameSession('normal');
    session.state.character.setBase('endurance', value);
    session.refreshStats();
    expect(
      stat === 'levelDuration' ? session.state.rules.levelDuration(1) : session.state.stats[stat],
    ).toBe(expected);
  });

  it.each([
    [11, 'shootCooldown', 3],
    [12, 'shootCooldown', 2.97],
    [23, 'shootCooldown', 2.97],
    [24, 'shootCooldown', 2.94],
    [839, 'shootCooldown', 0.93],
    [840, 'shootCooldown', 0.9],
    [11, 'arrowSpeed', 0.333333],
    [12, 'arrowSpeed', 0.336667],
    [840, 'arrowSpeed', 0.566667],
    [17, 'volley.cooldown', 36],
    [18, 'volley.cooldown', 35.64],
    [1259, 'volley.cooldown', 11.16],
    [1260, 'volley.cooldown', 10.8],
    [239, 'energyPerKill', 0],
    [240, 'energyPerKill', 1],
    [480, 'energyPerKill', 2],
  ] as const)('agility %s resolves %s to %s at its threshold', (value, stat, expected) => {
    const session = new GameSession('normal');
    session.state.character.setBase('agility', value);
    session.refreshStats();
    expect(session.state.stats[stat]).toBe(expected);
  });

  it('caps agility alone and applies rapid fire independently to real shots and volleys', () => {
    const session = game(20);
    session.state.character.setBase('agility', 10000);
    session.talents.loadFromSave([
      { id: 'rapidFire', rank: 7 },
      { id: 'quickInstinct', rank: 2 },
    ]);
    session.refreshStats();
    expect(session.shootLane(0)).toBe('shot');
    expect(session.state.archers[0].duration).toBe(0.59);
    expect([...session.state.arrows.values()][0].speed).toBe(0.765);
    session.state.energy = session.state.maxEnergy;
    expect(session.activateAbility('volley')).toBe('activated');
    expect(session.state.getAbility('volley').duration).toBe(6.81);
    expect([...session.state.arrows.values()].every((arrow) => arrow.speed === 0.765)).toBe(true);
  });

  it.each([
    [99, 100, 8.99, 348, 349],
    [100, 100, 9, 350, 350],
    [101, 102, 9.01, 352, 351],
    [250, 400, 10.5, 650, 500],
  ])(
    'intellect %s respects the energy threshold and strengthens both abilities',
    (intellect, maxEnergy, energyRegen, heal, prep) => {
      const session = new GameSession('normal');
      session.state.character.setBase('intellect', intellect);
      session.refreshStats();
      expect(session.state.stats).toMatchObject({
        maxEnergy,
        energyRegen,
        'heal.amount': heal,
        'prep.restore': prep,
      });
    },
  );

  it('uses intellect healing and preparation amounts and clamps resources', () => {
    const session = game(20);
    session.state.character.setModifiers('test-resources', [
      { stat: 'maxEnergy', kind: 'flat', value: 1000 },
      { stat: 'maxHp', kind: 'flat', value: 1000 },
    ]);
    session.refreshStats(); // Intellect 54: +108 healing and +54 preparation.
    session.state.hp = 10;
    session.state.energy = 100;
    expect(session.activateAbility('heal')).toBe('activated');
    expect(session.state.hp).toBe(268);
    expect(session.state.energy).toBe(0);
    expect(session.activateAbility('prep')).toBe('activated');
    expect(session.state.energy).toBe(304);
  });

  it('grants discrete income, breach energy and kill rewards in the simulation', () => {
    const session = game();
    session.state.character.setBase('endurance', 240);
    session.state.character.setBase('agility', 240);
    session.state.character.setModifiers('no-regen', [
      { stat: 'energyRegen', kind: 'percent', value: -100 },
    ]);
    session.refreshStats();
    session.state.energy = 0;
    addSpider(session, 'normal', 0, 1, 10);
    session.tick(0.01);
    expect(session.state.energy).toBe(2);
    addSpider(session, 'normal', 1).startDying();
    session.tick(0.3);
    expect(session.state.energy).toBe(3);
    expect(session.drainEvents()).toContainEqual({
      type: 'coinDrop',
      spiderId: 'spider-2',
      coins: 4,
      jackpot: false,
    });
    expect(session.state.coins + session.state.coinAccumulator).toBeCloseTo(104 + 6.4 * 0.31);
    session.state.levelTimer = 0;
    session.tick(0.01);
    session.upgradeTalent('hunterMastery');
    session.confirmLevelUp();
    expect(session.state.levelTimerMax).toBe(10); // Level 2: 19 − floor(243 / 25).
  });

  it('converts all HP items to endurance, retains prices, and removes all derived effects on sale', () => {
    expect(
      ITEM_CATALOG.some((item) => item.stats.some((stat) => (stat.type as string) === 'maxHp')),
    ).toBe(false);
    const session = new GameSession('normal');
    session.state.coins = 10000;
    expect(session.buyItem('c009')).toBe(true); // Previously +500 HP, now +50 endurance.
    expect(session.state.stats).toMatchObject({
      endurance: 77,
      maxHp: 470,
      hpRegen: 3.08,
      armor: 154,
      coinsPerSec: 4.7,
    });
    expect(session.sellItem(0)).toBe(true);
    expect(session.state.stats).toMatchObject({
      endurance: 27,
      maxHp: 100,
      hpRegen: 1.08,
      armor: 54,
      coinsPerSec: 4.2,
    });
    expect(session.state.hp).toBe(100);
  });

  it.each([
    ['improvedEndurance', 'endurance', 36],
    ['improvedAgility', 'agility', 31],
    ['improvedIntellect', 'intellect', 22],
  ] as const)(
    'allows seven ranks of %s and resolves the full 35%% as one source',
    (talent, stat, expected) => {
      const session = new GameSession('normal');
      session.state.pendingTalentPoints = 8;
      for (let rank = 0; rank < 7; rank++) expect(session.upgradeTalent(talent)).toBe(true);
      expect(session.state.stats[stat]).toBe(expected);
      expect(session.upgradeTalent(talent)).toBe(false);
      expect(session.state.pendingTalentPoints).toBe(1);
    },
  );

  it('combines primary item bonuses before a talent percentage', () => {
    const session = new GameSession('normal');
    session.state.pendingTalentPoints = 2;
    session.upgradeTalent('improvedEndurance');
    session.upgradeTalent('improvedEndurance');
    session.buyItem('c001');
    expect(session.state.stats).toMatchObject({
      endurance: 41,
      maxHp: 110,
      armor: 82,
      hpRegen: 1.64,
    });
  });
});

describe('armor and talent branches', () => {
  it('spends healing ranks in defense and retains their healing and regeneration bonuses', () => {
    const session = new GameSession('normal');
    session.state.level = 30;
    session.state.pendingTalentPoints = 40;
    session.talents.loadFromSave([
      { id: 'tireless', rank: 5 },
      { id: 'improvedIntellect', rank: 7 },
      { id: 'agility', rank: 5 },
      { id: 'improvedPrep', rank: 4 },
    ]);
    expect(session.upgradeTalent('healBoost')).toBe(false);
    for (const [id, ranks] of [
      ['endurance', 7],
      ['improvedEndurance', 7],
      ['spiderArmor', 10],
      ['shieldBlock', 4],
    ] as const)
      for (let rank = 0; rank < ranks; rank++) expect(session.upgradeTalent(id)).toBe(true);
    expect(session.upgradeTalent('healBoost')).toBe(false); // Tier 5 requires level 40.
    session.state.level = 40;
    session.refreshStats();
    const before = session.state.stats;
    expect(session.upgradeTalent('healBoost')).toBe(true);
    expect(session.talents.branchPoints('defense')).toBe(29);
    expect(session.talents.branchPoints('magic')).toBe(21);
    expect(session.state.stats['heal.amount']).toBe(before['heal.amount'] + 350);
    expect(session.state.stats.hpRegen).toBeCloseTo(before.hpRegen + 2);
  });

  it('reduces spider damage by six percent per rank as one talent source', () => {
    const session = new GameSession('normal', () => 0.999999);
    session.state.level = 10;
    session.state.pendingTalentPoints = 20;
    for (let rank = 0; rank < 7; rank++) session.upgradeTalent('endurance');
    session.state.character.setModifiers('test:no-armor', [
      { stat: 'armor', kind: 'percent', value: -100 },
    ]);
    session.refreshStats();
    for (let rank = 1; rank <= 10; rank++) {
      session.state.phase = 'levelUp';
      expect(session.upgradeTalent('spiderArmor')).toBe(true);
      session.state.phase = 'playing';
      const spider = addSpider(session, 'normal', 0, 1, 100);
      session.tick(0.001);
      expect(session.drainEvents()).toContainEqual({
        type: 'damage',
        spiderId: spider.id,
        hp: 100 - 6 * rank,
        energy: 0,
      });
    }
  });
  it.each([
    [1, 0, 100],
    [1, 50, 74],
    [1, 100, 59],
    [10, 50, 85],
    [10, 100, 74],
    [1, 300, 32],
    [1, 100000, 25],
    [10, 100000, 25],
  ])('level %s with %s armor takes %s from a 100 damage breach', (level, armor, expected) => {
    const session = game(level);
    session.state.character.setModifiers('test', [
      { stat: 'endurance', kind: 'percent', value: -100 },
      { stat: 'armor', kind: 'flat', value: armor },
    ]);
    session.refreshStats();
    session.state.hp = 100;
    addSpider(session, 'normal', 0, 1, 100);
    session.tick(0.01);
    expect(session.state.hp).toBe(100 - expected);
    expect(session.drainEvents()).toContainEqual({
      type: 'damage',
      spiderId: 'spider-1',
      hp: expected,
      energy: 0,
    });
    expect(session.state.stats.armorReduction).toBeLessThanOrEqual(0.75);
  });

  it.each([
    [1, 54, 0.333333, 0.272727, 0.2],
    [5, 78, 0.333247, 0.27265, 0.199938],
    [10, 108, 0.331135, 0.270766, 0.198419],
    [20, 168, 0.294498, 0.238427, 0.172675],
    [30, 228, 0.194285, 0.153153, 0.107595],
    [40, 288, 0.099772, 0.076743, 0.052505],
    [50, 348, 0.04878, 0.037037, 0.025],
  ])(
    'level %s scales native armor %s inside the formula for each difficulty',
    (level, armor, easy, normal, hard) => {
      for (const [difficulty, reduction] of [
        ['easy', easy],
        ['normal', normal],
        ['hard', hard],
      ] as const) {
        const session = new GameSession(difficulty, () => 0.999999);
        session.state.level = level;
        session.state.phase = 'playing';
        session.refreshStats();
        expect(session.state.stats.armor).toBe(armor);
        expect(session.state.stats.armorReduction).toBeCloseTo(reduction, 6);
        const spider = addSpider(session, 'normal', 0, 1, 1000);
        session.tick(0.001);
        expect(session.drainEvents()).toContainEqual({
          type: 'damage',
          spiderId: spider.id,
          hp: Math.round(1000 * (1 - reduction)),
          energy: 0,
        });
      }
    },
  );

  it.each(['easy', 'normal', 'hard'] as const)(
    '%s retains zero armor and the reduction cap',
    (difficulty) => {
      for (const [armor, reduction, damage] of [
        [0, 0, 100],
        [100000, 0.75, 25],
      ]) {
        const session = new GameSession(difficulty, () => 0.999999);
        session.state.character.setBase('endurance', 0);
        session.state.character.setModifiers('test:armor', [
          { stat: 'armor', kind: 'flat', value: armor },
        ]);
        session.refreshStats();
        session.state.phase = 'playing';
        const spider = addSpider(session, 'normal', 0, 1, 100);
        session.tick(0.001);
        expect(session.state.stats.armorReduction).toBe(reduction);
        expect(session.drainEvents()).toContainEqual({
          type: 'damage',
          spiderId: spider.id,
          hp: damage,
          energy: 0,
        });
      }
    },
  );

  it('caps armor independently of spider protection and item defenses', () => {
    const session = game();
    session.talents.loadFromSave([{ id: 'spiderArmor', rank: 10 }]);
    session.items.buyItem('c050');
    session.state.character.setModifiers('armor', [{ stat: 'armor', kind: 'flat', value: 10000 }]);
    session.refreshStats();
    addSpider(session, 'normal', 0, 1, 1000);
    session.tick(0.01);
    expect(session.drainEvents()).toContainEqual({
      type: 'damage',
      spiderId: 'spider-1',
      hp: 90,
      energy: 0,
    });
    expect(session.state.stats.damageFactor).toBe(0.09);
  });

  it('requires level and spending in the specific branch for every new rank', () => {
    const session = new GameSession('normal');
    session.state.level = 10;
    session.state.pendingTalentPoints = 20;
    for (let rank = 0; rank < 7; rank++) expect(session.upgradeTalent('endurance')).toBe(true);
    expect(session.upgradeTalent('rapidFire')).toBe(false);
    expect(session.talents.upgradeBlockReason('rapidFire', 10)).toBe('branch');
    for (let rank = 0; rank < 5; rank++) expect(session.upgradeTalent('hunterMastery')).toBe(true);
    for (const points of [5, 6]) {
      const pending = session.state.pendingTalentPoints;
      expect(session.talents.branchPoints('shooting')).toBe(points);
      expect(session.upgradeTalent('rapidFire')).toBe(false);
      expect(session.talents.getRank('rapidFire')).toBe(0);
      expect(session.state.pendingTalentPoints).toBe(pending);
      expect(session.upgradeTalent('improvedAgility')).toBe(true);
    }
    session.state.level = 9;
    expect(session.upgradeTalent('rapidFire')).toBe(false);
    session.state.level = 10;
    expect(session.upgradeTalent('rapidFire')).toBe(true);
    expect(session.upgradeTalent('rapidFire')).toBe(true);
    expect(session.talents.branchPoints('shooting')).toBe(9);
    expect(session.talents.branchPoints('defense')).toBe(7);
    expect(session.talents.branchPoints('magic')).toBe(0);
  });

  it.each([
    ['spiderArmor', 2, 7, 10],
    ['volleyMastery', 3, 14, 20],
    ['blizzardMastery', 4, 21, 30],
    ['dutyBound', 5, 28, 40],
    ['healBoost', 5, 28, 40],
    ['warriorArmor', 3, 14, 20],
    ['titanArmor', 6, 35, 50],
    ['quickInstinct', 5, 28, 40],
  ] as const)(
    '%s requires tier %s with %s branch points and level %s',
    (id, tier, points, level) => {
      const session = new GameSession('normal');
      const talent = session.talents.getTalent(id);
      expect(talent).toMatchObject({ tier, requiredBranchPoints: points, unlocksAtLevel: level });
      session.state.level = level;
      session.state.pendingTalentPoints = 2;
      const prerequisite = TALENTS[id].prerequisite;
      let remaining = points - 1 - (prerequisite?.rank ?? 0);
      const ranks: { id: TalentId; rank: number }[] = prerequisite
        ? [{ id: prerequisite.id, rank: prerequisite.rank }]
        : [];
      for (const candidate of TALENT_ORDER.filter(
        (candidate) =>
          candidate !== prerequisite?.id &&
          TALENTS[candidate].branch === talent.branch &&
          session.talents.getTalent(candidate).tier < tier,
      )) {
        const rank = Math.min(remaining, session.talents.getTalent(candidate).maxRanks);
        ranks.push({ id: candidate, rank });
        remaining -= rank;
      }
      session.talents.loadFromSave(ranks);
      expect(session.upgradeTalent(id)).toBe(false);
      const available = ranks.find((entry) => session.talents.canUpgrade(entry.id, level))!;
      expect(session.upgradeTalent(available.id)).toBe(true);
      expect(session.upgradeTalent(id)).toBe(true);
    },
  );

  it('offers the hunter arsenal in the first tier', () => {
    const session = new GameSession('normal');
    expect(session.talents.getTalent('hunterArsenal')).toMatchObject({
      tier: 1,
      requiredBranchPoints: 0,
      unlocksAtLevel: 0,
    });
    expect(session.state.stats.inventorySlots).toBe(1);
    expect(session.upgradeTalent('hunterArsenal')).toBe(true);
    expect(session.state.stats.inventorySlots).toBe(2);
  });

  it('magic armor scales with complete groups of five final intellect at every rank', () => {
    const session = new GameSession('normal');
    session.state.level = 20;
    session.state.pendingTalentPoints = 8;
    session.talents.loadFromSave([
      { id: 'tireless', rank: 5 },
      { id: 'agility', rank: 5 },
      { id: 'improvedPrep', rank: 4 },
    ]);
    session.refreshStats(); // 54 intellect, 168 armor from endurance.
    for (let rank = 1; rank <= 7; rank++) {
      expect(session.upgradeTalent('magicArmor')).toBe(true);
      expect(session.state.stats.armor).toBe(168 + 30 * rank);
    }
    expect(session.upgradeTalent('magicArmor')).toBe(false);
    session.state.character.setModifiers('intellect-item', [
      { stat: 'intellect', kind: 'flat', value: 1 },
    ]);
    session.refreshStats();
    expect(session.state.stats.armor).toBe(399); // floor(55/5) × 3 × 7 + 168.
    session.state.pendingTalentPoints = 1;
    session.upgradeTalent('improvedIntellect');
    expect(session.state.stats.intellect).toBe(78);
    expect(session.state.stats.armor).toBe(483); // floor(78/5) × 3 × 7 + 168.
    session.state.character.removeModifiers('intellect-item');
    session.refreshStats();
    expect(session.state.stats.armor).toBe(483); // 77 intellect still contains fifteen groups.
  });
});
