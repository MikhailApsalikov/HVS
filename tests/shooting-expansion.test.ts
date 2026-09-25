import { describe, expect, it } from 'vitest';
import { GameSession } from '../src/domain/GameSession.js';
import { parseSave, restore, snapshot } from '../src/domain/save.js';
import { ABILITIES, ABILITY_ORDER } from '../src/content/abilities.js';
import { TALENTS } from '../src/content/talents.js';
import {
  abilityDescription,
  attributeDescription,
  talentDescription,
  shootDescription,
} from '../src/ui/presenters.js';
import type { TalentId, SpiderType } from '../src/domain/types.js';
import { addSpider, previousSpiders } from './helpers.js';

function arena(talents: { id: TalentId; rank: number }[] = [], roll = 0) {
  const session = new GameSession('normal', () => roll);
  session.talents.loadFromSave(talents);
  session.state.character.restoreBase({ endurance: 0, agility: 0, intellect: 0 });
  session.state.character.setModifiers('test:arena', [
    { stat: 'spawnProbability', kind: 'percent', value: -100 },
    { stat: 'hpRegen', kind: 'percent', value: -100 },
    { stat: 'energyRegen', kind: 'percent', value: -100 },
    { stat: 'coinsPerSec', kind: 'percent', value: -100 },
    { stat: 'arrowSpeed', kind: 'percent', value: 2900 },
  ]);
  session.refreshStats();
  session.state.initialTalentPick = false;
  session.state.pendingTalentPoints = 0;
  session.state.phase = 'playing';
  session.state.levelTimer = session.state.levelTimerMax = 1000;
  return session;
}
const critical = [{ id: 'criticalShot' as const, rank: 10 }];
const eagle = [...critical, { id: 'eagleEye' as const, rank: 1 }];

describe('projectile strength', () => {
  it('spends both units on a fat spider and never hits the spider behind it', () => {
    const session = arena(critical);
    const fat = addSpider(session, 'fat', 0, 0.8);
    const behind = addSpider(session, 'normal', 0, 0.4);
    session.shootLane(0);
    session.tick(0.09);
    expect(fat).toMatchObject({ dying: true, hits: 0, grantsKillEnergy: true });
    expect(behind).toMatchObject({ dying: false, hits: 1 });
    expect(session.state.arrows.size).toBe(0);
  });
  it('one remaining unit only wounds a fat spider, and the later killing shot grants energy', () => {
    const session = arena([...critical, { id: 'piercingReward', rank: 8 }]);
    addSpider(session, 'normal', 0, 0.9);
    const fat = addSpider(session, 'fat', 0, 0.4);
    const behind = addSpider(session, 'normal', 0, 0.1);
    session.shootLane(0);
    session.tick(0.02);
    expect([...session.state.arrows.values()][0].power).toBe(1);
    session.tick(0.04);
    expect(fat).toMatchObject({ hits: 1, type: 'normal', dying: false, grantsKillEnergy: true });
    expect(behind.dying).toBe(false);
    session.tick(0.3);
    expect(session.state.energy).toBe(73);
    session.state.archers[0].start(0);
    session.shootLane(0);
    session.tick(0.4);
    expect(session.state.energy).toBe(46);
  });
  it.each([
    ['normal', 'normal', 'normal'],
    ['fat', 'normal'],
    ['normal', 'fat'],
    ['fat', 'fat'],
  ] as SpiderType[][])('spends three units in encounter order: %j', (...types) => {
    const session = arena([...critical, { id: 'improvedCriticalShot', rank: 8 }]);
    const spiders = types.map((type, index) => addSpider(session, type, 0, 0.9 - index * 0.2));
    const behind = addSpider(session, 'normal', 0, 0.1);
    session.shootLane(0);
    expect([...session.state.arrows.values()][0].power).toBe(3);
    session.tick(0.09);
    expect(spiders[0].dying).toBe(true);
    expect(spiders.slice(1).map((s) => s.dying)).toEqual(
      types[0] === 'fat' && types[1] === 'fat' ? [false] : types.slice(1).map(() => true),
    );
    if (types[0] === 'fat' && types[1] === 'fat') expect(spiders[1].hits).toBe(1);
    expect(behind.dying).toBe(false);
    expect(session.state.arrows.size).toBe(0);
  });
  it.each([
    [1, 0.119999, 3],
    [1, 0.12, 2],
    [8, 0.959999, 3],
    [8, 0.96, 2],
  ])('improvement rank %s at roll %s gives %s units', (rank, roll, power) => {
    const session = arena([...eagle, { id: 'improvedCriticalShot', rank }], roll);
    session.activateAbility('eagleEye');
    session.shootLane(0);
    expect([...session.state.arrows.values()][0].power).toBe(power);
  });
  it('cannot improve a noncritical shot', () => {
    const session = arena([{ id: 'improvedCriticalShot', rank: 8 }]);
    session.shootLane(0);
    expect([...session.state.arrows.values()][0]).toMatchObject({ critical: false, power: 1 });
  });
});

describe('shooting progression and scaling', () => {
  it.each(['easy', 'normal', 'hard'] as const)(
    'learns the dependencies and ranks on %s',
    (difficulty) => {
      const session = new GameSession(difficulty);
      session.state.pendingTalentPoints = 100;
      for (let rank = 0; rank < 5; rank++) expect(session.upgradeTalent('vampirism')).toBe(true);
      expect(session.upgradeTalent('vampirism')).toBe(false);
      expect(session.state.stats.hpPerKill).toBe(10);
      for (let rank = 0; rank < 5; rank++) session.upgradeTalent('hunterMastery');
      session.state.level = 30;
      for (let rank = 0; rank < 5; rank++) session.upgradeTalent('piercingReward');
      expect(session.upgradeTalent('eagleEye')).toBe(false);
      for (let rank = 0; rank < 9; rank++) expect(session.upgradeTalent('criticalShot')).toBe(true);
      expect(session.upgradeTalent('eagleEye')).toBe(false);
      expect(session.upgradeTalent('improvedCriticalShot')).toBe(false);
      expect(session.upgradeTalent('agileCriticalShot')).toBe(false);
      expect(session.upgradeTalent('criticalShot')).toBe(true);
      expect(session.upgradeTalent('eagleEye')).toBe(true);
      expect(session.upgradeTalent('eagleEye')).toBe(false);
      for (let rank = 1; rank <= 8; rank++) {
        expect(session.upgradeTalent('improvedCriticalShot')).toBe(true);
        expect(session.state.stats.improvedCriticalShotChance).toBeCloseTo(rank * 0.08);
      }
      expect(session.upgradeTalent('improvedCriticalShot')).toBe(false);
      for (let rank = 0; rank < 5; rank++)
        expect(session.upgradeTalent('agileCriticalShot')).toBe(true);
      expect(session.upgradeTalent('agileCriticalShot')).toBe(false);
      expect(session.talents.getTalent('eagleEye').tier).toBe(3);
      for (const id of ['improvedCriticalShot', 'agileCriticalShot'] as const)
        expect(session.talents.getTalent(id).tier).toBe(4);
      expect(session.talents.getTalent('volleyMastery').tier).toBe(3);
      expect(session.upgradeTalent('volleyMastery')).toBe(false);
      expect(session.upgradeTalent('volley')).toBe(true);
      session.state.level = 19;
      expect(session.upgradeTalent('volleyMastery')).toBe(false);
      session.state.level = 20;
      expect(session.upgradeTalent('volleyMastery')).toBe(true);
      expect(session.state.stats['volley.lanes']).toBe(5);
    },
  );
  it.each([
    [2, 5, 0.2, 0],
    [3, 1, 0.2001, 0],
    [9, 5, 0.2015, 0],
    [10, 5, 0.2015, 5],
    [130, 5, 0.2315, 65],
  ])('scales full agility steps at agility %s and rank %s', (agility, rank, chance, hp) => {
    const session = arena([
      ...critical,
      { id: 'agileCriticalShot', rank },
      { id: 'vampirism', rank },
    ]);
    session.state.character.setBase('agility', agility);
    session.refreshStats();
    expect(session.state.stats.criticalShotChance).toBe(chance);
    expect(session.state.stats.hpPerKill).toBe(hp);
  });
  it('uses final agility and recalculates scaling after stat changes', () => {
    const session = arena([
      ...critical,
      { id: 'improvedAgility', rank: 1 },
      { id: 'agileCriticalShot', rank: 5 },
      { id: 'vampirism', rank: 5 },
    ]);
    session.state.level = 10;
    session.state.character.setBase('agility', 100);
    session.state.character.setModifiers('test:item', [
      { stat: 'agility', kind: 'flat', value: 6 },
    ]);
    session.refreshStats();
    expect(session.state.stats).toMatchObject({
      agility: 130,
      criticalShotChance: 0.2315,
      hpPerKill: 65,
    });
    session.state.character.removeModifiers('test:item');
    session.refreshStats();
    expect(session.state.stats).toMatchObject({
      agility: 124,
      criticalShotChance: 0.2205,
      hpPerKill: 60,
    });
    expect(attributeDescription(session.state, 'agility')).toContain(
      'Каждое убийство восстанавливает 60 здоровья',
    );
    expect(talentDescription('agileCriticalShot', 5, session.state.stats)).toContain('0.05%');
    expect(talentDescription('improvedCriticalShot', 8, session.state.stats)).toContain('64%');
    expect(talentDescription('improvedCriticalShot', 8, session.state.stats)).toContain(
      'до 3 пауков вместо 2',
    );
  });
  it('keeps all talent slots unique and every ability key unique', () => {
    const session = arena();
    const shooting = session.talents.talents.filter((t) => t.branch === 'shooting');
    expect(
      new Set(
        shooting.map(
          (t) =>
            `${t.tier}:${TALENTS[t.id].column ?? shooting.filter((other) => other.tier === t.tier).findIndex((other) => other.id === t.id) + 1}`,
        ),
      ).size,
    ).toBe(shooting.length);
    expect(new Set(ABILITY_ORDER.map((id) => ABILITIES[id].key)).size).toBe(ABILITY_ORDER.length);
  });
  it('keeps independent shooting dependency arrows in separate column ranges', () => {
    const session = arena();
    const edges = session.talents.talents
      .filter((talent) => talent.branch === 'shooting' && TALENTS[talent.id].prerequisite)
      .map((talent) => {
        const from = TALENTS[talent.id].prerequisite!.id;
        const columns = [TALENTS[from].column!, TALENTS[talent.id].column!];
        return { from, tier: talent.tier, min: Math.min(...columns), max: Math.max(...columns) };
      });
    for (let i = 0; i < edges.length; i++) {
      for (const other of edges.slice(i + 1)) {
        const edge = edges[i];
        if (edge.tier !== other.tier || edge.from === other.from) continue;
        expect(Math.max(edge.min, other.min)).toBeGreaterThan(Math.min(edge.max, other.max));
      }
    }
  });
});

describe('eagle eye ability', () => {
  it('costs 20 energy, has a 60 second cooldown and guarantees exactly five successful shots', () => {
    const session = arena(eagle, 0.999999);
    expect(session.activateAbility('eagleEye')).toBe('activated');
    expect(session.state.energy).toBe(80);
    expect(session.state.getAbility('eagleEye').remainingCooldown).toBe(60);
    expect(session.activateAbility('eagleEye')).toBe('on_cooldown');
    session.state.archers[0].start(3);
    expect(session.shootLane(0)).toBe('blocked');
    session.state.energy = 0;
    expect(session.shootLane(1)).toBe('not_enough_energy');
    expect(session.state.eagleEyeShots).toBe(5);
    for (let lane = 1; lane <= 5; lane++) {
      session.state.energy = session.state.maxEnergy;
      expect(session.shootLane(lane)).toBe('shot');
      expect([...session.state.arrows.values()].at(-1)).toMatchObject({ critical: true, power: 2 });
      expect(session.state.eagleEyeShots).toBe(5 - lane);
    }
    expect(session.state.eagleEyeTimer).toBe(0);
    session.state.energy = session.state.maxEnergy;
    session.shootLane(6);
    expect([...session.state.arrows.values()].at(-1)?.critical).toBe(false);
  });
  it('stays locked without the talent and rejects insufficient activation energy', () => {
    const session = arena();
    expect(session.activateAbility('eagleEye')).toBe('level_locked');
    session.talents.loadFromSave(eagle);
    session.refreshStats();
    session.state.energy = 19;
    expect(session.activateAbility('eagleEye')).toBe('not_enough_energy');
    expect(session.state.eagleEyeShots).toBe(0);
  });
  it('pauses with freeze and level selection, and expires after twenty playing seconds', () => {
    const session = arena(eagle);
    session.state.level = 50;
    session.activateAbility('eagleEye');
    expect(abilityDescription(session.state, 'eagleEye')).toContain('Критических выстрелов: 5');
    expect(shootDescription(session.state, 1)).toContain('5 критических выстрелов');
    session.activateAbility('freeze');
    session.tick(50);
    expect(session.state.eagleEyeTimer).toBe(20);
    session.activateAbility('freeze');
    session.state.phase = 'levelUp';
    session.tick(50);
    expect(session.state.eagleEyeTimer).toBe(20);
    session.state.phase = 'playing';
    session.tick(19);
    expect(session.state.eagleEyeTimer).toBe(1);
    session.state.energy = 100;
    session.talents.loadFromSave([...eagle, { id: 'recharge', rank: 1 }]);
    session.refreshStats();
    session.activateAbility('recharge');
    expect(session.state.getAbility('eagleEye').isReady).toBe(true);
    expect(session.state.eagleEyeShots).toBe(5);
    session.tick(1);
    expect(session.state.eagleEyeActive).toBe(false);
    expect(session.state.eagleEyeShots).toBe(0);
  });
  it('combines with adrenaline, excludes all volleys and receives common cooldown bonuses', () => {
    const session = arena(
      [
        ...eagle,
        { id: 'adrenaline', rank: 1 },
        { id: 'quickInstinct', rank: 2 },
        { id: 'volley', rank: 1 },
      ],
      0.999999,
    );
    session.state.level = 60;
    session.state.character.setModifiers('test:counter', [
      { stat: 'blockVolleyChance', kind: 'flat', value: 1 },
    ]);
    session.refreshStats();
    session.activateAbility('eagleEye');
    expect(session.state.getAbility('eagleEye').remainingCooldown).toBe(58.2);
    session.state.energy = 100;
    session.activateAbility('volley');
    addSpider(session, 'normal', 0, 1, 0);
    session.tick(0.001);
    expect(session.state.arrows.size).toBe(8);
    expect([...session.state.arrows.values()].every((a) => a.fromVolley && a.power === 1)).toBe(
      true,
    );
    expect(session.state.eagleEyeShots).toBe(5);
    session.activateAbility('adrenaline');
    session.state.energy = 0;
    session.shootLane(0);
    expect(session.state.energy).toBe(0);
    expect(session.state.adrenalineShots).toBe(19);
    expect(session.state.eagleEyeShots).toBe(4);
    expect([...session.state.arrows.values()].at(-1)?.critical).toBe(true);
  });
});

describe('vampirism and gold', () => {
  it.each(['shot', 'critical', 'volley', 'armageddon'] as const)(
    'heals on each kill from %s, capped by maximum health',
    (source) => {
      const session = arena([
        { id: 'vampirism', rank: 5 },
        { id: 'volley', rank: 1 },
        ...(source === 'critical' ? critical : []),
      ]);
      session.state.character.setBase('agility', 20);
      session.refreshStats();
      session.state.hp = 50;
      addSpider(session, 'normal', 0, 0.9);
      if (source === 'critical') addSpider(session, 'normal', 0, 0.7);
      if (source === 'volley' || source === 'armageddon') {
        session.state.level = 30;
        session.activateAbility(source);
      } else session.shootLane(0);
      session.tick(source === 'armageddon' ? 3 : 0.4);
      expect(session.state.hp).toBe(source === 'critical' ? 70 : 60);
      session.state.hp = 99;
      addSpider(session, 'normal', 1, 0.95);
      session.state.energy = 100;
      session.state.archers[1].start(0);
      session.shootLane(1);
      session.tick(0.4);
      expect(session.state.hp).toBe(100);
    },
  );
  it('does not heal for breaches or revive a dead player', () => {
    const session = arena([
      { id: 'vampirism', rank: 5 },
      { id: 'marauder', rank: 1 },
    ]);
    session.state.character.setBase('agility', 20);
    session.refreshStats();
    session.state.hp = 50;
    addSpider(session, 'normal', 1, 1, 0);
    session.tick(0.4);
    expect(session.state.hp).toBe(50);
    session.state.character.setModifiers('test:no-dodge', [
      { stat: 'dodgeChance', kind: 'percent', value: -100 },
    ]);
    session.refreshStats();
    addSpider(session, 'normal', 1, 1, 1000);
    addSpider(session, 'normal', 0, 0.9);
    session.shootLane(0);
    session.tick(0.4);
    expect(session.state.phase).toBe('gameOver');
    expect(session.state.hp).toBe(0);
  });
  it.each([
    [0, 1],
    [0.199999, 1],
    [0.2, 2],
    [0.4, 3],
    [0.6, 4],
    [0.8, 5],
    [0.999999, 5],
  ])('gold roll %s awards %s', (roll, coins) => {
    const session = arena([], roll);
    addSpider(session, 'normal', 0, 0.9);
    session.shootLane(0);
    session.tick(0.4);
    expect(session.state.coins).toBe(250 + coins);
  });
});

describe('version eleven saves', () => {
  it.each([0, 1, 2])('retains three-unit arrows after %s kills and active eagle eye', (kills) => {
    const session = arena([...eagle, { id: 'improvedCriticalShot', rank: 8 }]);
    session.activateAbility('eagleEye');
    session.shootLane(0);
    addSpider(session, 'normal', 0, 0.9);
    addSpider(session, 'normal', 0, 0.6);
    addSpider(session, 'normal', 0, 0.2);
    if (kills) session.tick(kills === 1 ? 0.02 : 0.04);
    const saved = snapshot(session);
    expect(saved.arrows[0].power).toBe(3 - kills);
    const loaded = restore(parseSave(JSON.parse(JSON.stringify(saved)))!, () => 0);
    expect(snapshot(loaded)).toEqual(saved);
    loaded.tick(0.4);
    session.tick(0.4);
    expect(snapshot(loaded)).toEqual(snapshot(session));
    expect(loaded.state.eagleEyeShots).toBe(4);
  });
  it.each([false, true])(
    'migrates version ten with critical=%s and preserves existing progress',
    (isCritical) => {
      const session = arena(isCritical ? critical : []);
      session.state.level = 30;
      session.state.antiAfkStacks = 2;
      session.state.antiAfkRecoveryTimer = 4;
      session.shootLane(0);
      if (isCritical) {
        addSpider(session, 'normal', 0, 0.9);
        session.tick(0.02);
      }
      const current = snapshot(session);
      const { eagleEyeTimer: _timer, eagleEyeShots: _shots, ...state } = current.state;
      const old = {
        ...current,
        version: 10,
        spiders: previousSpiders(current),
        state,
        abilities: current.abilities.slice(0, 10),
        arrows: current.arrows.map(({ power: _power, ...arrow }) => arrow),
        talents: [...current.talents, { id: 'volleyMastery', rank: 3 }],
      };
      const parsed = parseSave(old)!;
      expect(parsed.version).toBe(14);
      const loaded = restore(parsed, () => 0);
      expect(loaded.state.eagleEyeActive).toBe(false);
      expect(loaded.state.getAbility('eagleEye').isReady).toBe(true);
      expect(loaded.state.antiAfkStacks).toBe(2);
      expect(loaded.state.antiAfkRecoveryTimer).toBe(current.state.antiAfkRecoveryTimer);
      expect([...loaded.state.arrows.values()][0].power).toBe(1);
      expect(loaded.talents.getRank('volleyMastery')).toBe(3);
      expect(snapshot(restore(parseSave(snapshot(loaded))!))).toEqual(snapshot(loaded));
    },
  );
  it.each([
    { eagleEyeTimer: 21 },
    { eagleEyeTimer: -1 },
    { eagleEyeShots: 6 },
    { eagleEyeShots: 1.5 },
    { eagleEyeShots: 0 },
    { eagleEyeTimer: 0 },
  ])('rejects corrupt eagle eye state %j', (invalid) => {
    const session = arena(eagle);
    session.activateAbility('eagleEye');
    const saved = snapshot(session);
    expect(parseSave({ ...saved, state: { ...saved.state, ...invalid } })).toBeNull();
  });
  it.each([0, -1, 1.5, 4, null])('rejects invalid arrow power %s', (power) => {
    const session = arena(critical);
    session.shootLane(0);
    const saved = snapshot(session);
    expect(parseSave({ ...saved, arrows: [{ ...saved.arrows[0], power }] })).toBeNull();
  });
});
