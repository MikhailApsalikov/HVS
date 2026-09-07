import { describe, expect, it } from 'vitest';
import { GameSession } from '../src/domain/GameSession.js';
import { Arrow } from '../src/domain/model/Arrow.js';
import { GameRules } from '../src/domain/rules/GameRules.js';
import { normalConfig } from '../src/content/normal.js';
import { ABILITIES, ABILITY_ORDER } from '../src/content/abilities.js';
import { SPIDERS } from '../src/content/spiders.js';
import { ITEM_CATALOG } from '../src/content/items.js';
import { spawnSpiders } from '../src/domain/systems/CombatSystem.js';
import type { SpiderType } from '../src/domain/types.js';
import { game, advance, addSpider } from './helpers.js';

describe('progression and player commands', () => {
  it.each(ITEM_CATALOG)(
    'allows only one $id, spends nothing on a duplicate and permits rebuy after sale',
    (item) => {
      const session = new GameSession('normal');
      session.upgradeTalent('hunterArsenal');
      session.state.coins = 1000000;
      expect(session.buyItem(item.id)).toBe(true);
      const coins = session.state.coins;
      const stats = session.state.stats;
      expect(session.buyItem(item.id)).toBe(false);
      expect(session.state.coins).toBe(coins);
      expect(session.state.stats).toEqual(stats);
      expect(session.items.inventory).toEqual([item.id]);
      expect(session.sellItem(0)).toBe(true);
      expect(session.buyItem(item.id)).toBe(true);
      expect(session.items.inventory).toEqual([item.id]);
    },
  );
  it('requires initial talent choice, starts at level 1 and advances exactly once', () => {
    const session = new GameSession('normal', () => 0.9999);
    expect(session.confirmLevelUp()).toBe(false);
    expect(session.upgradeTalent('agility')).toBe(false);
    expect(session.upgradeTalent('endurance')).toBe(true);
    expect(session.upgradeTalent('endurance')).toBe(false);
    expect(session.state.hp).toBe(525);
    expect(session.confirmLevelUp()).toBe(true);
    expect(session.state.level).toBe(1);
    expect(session.confirmLevelUp()).toBe(false);
    advance(session, 17.02);
    expect(session.state.phase).toBe('levelUp');
    expect(session.state.pendingTalentPoints).toBe(1);
    expect(session.upgradeTalent('tireless')).toBe(true);
    const health = session.state.hp;
    session.confirmLevelUp();
    expect(session.state.level).toBe(2);
    expect(session.state.levelTimer).toBe(19);
    expect(session.state.hp).toBe(health);
    expect(session.state.record).toBe(2);
  });
  it('accumulates fractional regeneration and passive coins without per-frame rounding', () => {
    const session = game();
    session.state.hp = 50;
    session.state.energy = 0;
    advance(session, 2.5);
    expect(session.state.hp).toBeCloseTo(52.7, 8);
    expect(session.state.energy).toBeCloseTo(20.4, 8);
    expect(session.state.coins + session.state.coinAccumulator).toBeCloseTo(101.5, 8);
  });
  it('rejects invalid timestep and blocks commands outside their phase', () => {
    const session = new GameSession('normal');
    expect(() => session.tick(NaN)).toThrow();
    expect(() => session.tick(-1)).toThrow();
    session.tick(0);
    expect(session.shootLane(0)).toBe('blocked');
    expect(session.activateAbility('heal')).toBe('level_locked');
    session.state.phase = 'playing';
    expect(session.upgradeTalent('endurance')).toBe(false);
    expect(session.buyItem('c001')).toBe(false);
    expect(session.sellItem(0)).toBe(false);
  });
  it('enforces money/slots and clamps resources after sale', () => {
    const session = new GameSession('normal');
    session.state.character.setBase('endurance', 40);
    session.refreshStats();
    expect(session.buyItem('missing')).toBe(false);
    expect(session.buyItem('c020')).toBe(false);
    expect(session.buyItem('c001')).toBe(true);
    expect(session.state.maxHp).toBe(200);
    expect(session.state.hp).toBe(200);
    expect(session.buyItem('c001')).toBe(false);
    expect(session.sellItem(-1)).toBe(false);
    expect(session.sellItem(0.5)).toBe(false);
    expect(session.sellItem(0)).toBe(true);
    expect(session.state.hp).toBe(100);
    expect(session.state.maxHp).toBe(100);
    expect(session.state.coins).toBe(84);
    expect(session.sellItem(0)).toBe(false);
    session.state.coins = 1000;
    session.buyItem('c056');
    session.state.energy = 110;
    session.sellItem(0);
    expect(session.state.energy).toBe(100);
  });
});

describe('shooting and collision', () => {
  it('charges energy and locks only the selected lane', () => {
    const session = game();
    expect(session.shootLane(0)).toBe('shot');
    expect(session.state.energy).toBe(67);
    expect(session.shootLane(0)).toBe('blocked');
    expect(session.shootLane(1)).toBe('shot');
    expect(session.shootLane(-1)).toBe('blocked');
    expect(session.shootLane(9)).toBe('blocked');
    expect(session.shootLane(0.5)).toBe('blocked');
    session.state.energy = 0;
    expect(session.shootLane(2)).toBe('not_enough_energy');
    advance(session, 3);
    expect(session.state.archers[0].isReady).toBe(true);
  });
  it('hits the nearest live spider along a swept path even with fast arrows', () => {
    const session = game();
    const farther = addSpider(session, 'normal', 0, 0.3);
    const closer = addSpider(session, 'normal', 0, 0.7);
    const otherLane = addSpider(session, 'normal', 1, 0.8);
    const arrow = new Arrow(session.state.newId('arrow'), 0, 100);
    session.state.arrows.set(arrow.id, arrow);
    advance(session, 1 / 60);
    expect(closer.dying).toBe(true);
    expect(farther.dying).toBe(false);
    expect(otherLane.dying).toBe(false);
    expect(session.state.arrows.size).toBe(0);
  });
  it('fat spiders take two hits; the first changes their appearance', () => {
    const session = game();
    const spider = addSpider(session, 'fat');
    session.shootLane(0);
    advance(session, 1.8);
    expect(spider.type).toBe('normal');
    expect(spider.dying).toBe(false);
    session.state.archers[0].start(0);
    session.shootLane(0);
    advance(session, 1.8);
    expect(session.state.spiders.size).toBe(0);
    expect(session.drainEvents().filter((event) => event.type === 'coinDrop')).toHaveLength(1);
  });
  it('arrows pass corpses, miss other lanes and disappear off-screen', () => {
    const session = game();
    addSpider(session).startDying();
    addSpider(session, 'normal', 1);
    session.shootLane(0);
    advance(session, 3.1);
    expect(session.state.arrows.size).toBe(0);
    expect([...session.state.spiders.values()][0].lane).toBe(1);
  });
});

describe('all abilities', () => {
  it.each(ABILITY_ORDER)('enforces unlock, cost and cooldown for %s', (id) => {
    const session = game(ABILITIES[id].unlockLevel - 1);
    expect(session.activateAbility(id)).toBe('level_locked');
    session.state.level += 1;
    const talent = ABILITIES[id].talent;
    if (talent) session.talents.loadFromSave([{ id: talent, rank: 1 }]);
    session.refreshStats();
    session.state.energy = 0;
    if (session.state.stats[`${id}.cost`] > 0)
      expect(session.activateAbility(id)).toBe('not_enough_energy');
    session.state.energy = session.state.maxEnergy;
    expect(session.activateAbility(id)).toBe('activated');
    if (id !== 'freeze') expect(session.activateAbility(id)).toBe('on_cooldown');
  });
  it('freezes the entire simulation and resumes without paying twice', () => {
    const session = game(4);
    const spider = addSpider(session, 'normal', 0, 0.4, 20, 1);
    session.activateAbility('freeze');
    const timer = session.state.levelTimer;
    advance(session, 2);
    expect(session.state.levelTimer).toBe(timer);
    expect(spider.y).toBe(0.4);
    expect(session.state.energy).toBe(50);
    expect(session.activateAbility('heal')).toBe('level_locked');
    expect(session.activateAbility('freeze')).toBe('deactivated');
    expect(session.state.phase).toBe('playing');
    expect(session.state.energy).toBe(50);
  });
  it('slows existing spiders, then removes the slow', () => {
    const session = game(8);
    const spider = addSpider(session, 'normal', 0, 0.1, 20, 0.01);
    session.activateAbility('blizzard');
    expect(spider.effectiveSpeed).toBe(0.006);
    const newcomer = addSpider(session, 'normal', 1, 0, 20, 0.01);
    expect(newcomer.slowFactor).toBe(1);
    advance(session, 4.02);
    expect(spider.slowFactor).toBe(1);
    expect(session.state.blizzardActive).toBe(false);
  });
  it('restores energy and health up to their caps', () => {
    const session = game(20);
    session.state.energy = 0;
    session.activateAbility('prep');
    expect(session.state.energy).toBe(100);
    session.state.hp = 100;
    session.activateAbility('heal');
    expect(session.state.hp).toBe(358);
    session.state.getAbility('heal').start(0);
    session.state.energy = 100;
    session.state.hp = 539;
    session.activateAbility('heal');
    expect(session.state.hp).toBe(540);
  });
  it('fires a volley on four distinct lanes, capped at nine with bonuses', () => {
    const session = game(20);
    session.activateAbility('volley');
    expect(new Set([...session.state.arrows.values()].map((arrow) => arrow.lane)).size).toBe(4);
    expect([...session.state.arrows.values()].every((arrow) => arrow.fromVolley)).toBe(true);
  });
  it('stand absorbs breaches and expires', () => {
    const session = game(30);
    session.talents.loadFromSave([{ id: 'divineShield', rank: 1 }]);
    session.refreshStats();
    session.activateAbility('stand');
    addSpider(session, 'burner', 0, 1);
    advance(session, 1 / 60);
    expect(session.state.hp).toBe(840);
    expect(session.drainEvents()).toContainEqual({ type: 'absorb' });
    advance(session, 7);
    expect(session.state.isInvulnerable).toBe(false);
  });
  it('armageddon charges, burns current and new enemies and ends', () => {
    const session = game(30);
    const spider = addSpider(session);
    session.activateAbility('armageddon');
    expect(session.state.getAbility('armageddon').remainingCooldown).toBe(180);
    advance(session, 2);
    expect(spider.dying).toBe(false);
    advance(session, 0.52);
    expect(spider.dying).toBe(true);
    const newcomer = addSpider(session);
    advance(session, 1 / 60);
    expect(newcomer.dying).toBe(true);
    advance(session, 3.02);
    expect(session.state.armageddonPhase).toBe('none');
  });
  it('recharge resets every other ability and archer while keeping its own cooldown', () => {
    const session = game(50);
    for (const id of ABILITY_ORDER) if (id !== 'recharge') session.state.getAbility(id).start(20);
    session.state.archers[0].start(10);
    session.activateAbility('recharge');
    for (const id of ABILITY_ORDER)
      expect(session.state.getAbility(id).remainingCooldown).toBe(id === 'recharge' ? 300 : 0);
    expect(session.state.archers[0].remainingCooldown).toBe(0);
  });
});

describe('enemy types and rewards', () => {
  it.each(Object.keys(SPIDERS) as SpiderType[])(
    'spawns %s using species and difficulty rules',
    (type) => {
      const rules = new GameRules(normalConfig);
      const stats = rules.spiderStats(type, 1, 0.5, 0.5);
      const expected = {
        normal: [0.08, 20],
        fat: [0.08, 20],
        fast: [0.24, 10],
        ninja: [0.08, 20],
        burner: [0.08, 0],
        tank: [0.048, 200],
      }[type];
      expect([stats.speed, stats.damage]).toEqual(expected);
    },
  );
  it.each([
    ['burner', 5],
    ['fat', 10],
    ['tank', 15],
    ['fast', 20],
    ['ninja', 35],
  ] as const)('unlocks %s at %s', (type, level) => {
    const session = game(level);
    spawnSpiders(session.state, 0.02, () => 0);
    expect([...session.state.spiders.values()].every((spider) => spider.type === type)).toBe(true);
  });
  it.each([0, 4, 8])('ninja jumps once without leaving the field from lane %s', (lane) => {
    const session = game(35);
    const spider = addSpider(session, 'ninja', lane, 0.3);
    advance(session, 1 / 60);
    expect(spider.lane).toBe(lane === 0 ? 1 : lane === 8 ? 7 : 5);
    expect(spider.hasJumped).toBe(true);
    const newLane = spider.lane;
    advance(session, 1);
    expect(spider.lane).toBe(newLane);
  });
  it('burner drains energy, breaches never award kill rewards', () => {
    const session = game();
    addSpider(session, 'burner', 0, 1, 2);
    advance(session, 0.5);
    expect(session.state.energy).toBeCloseTo(14.08, 8);
    expect(session.drainEvents()).toEqual([
      { type: 'damage', spiderId: 'spider-1', hp: 1, energy: 90 },
    ]);
    expect(session.state.coins).toBe(100);
  });
  it('lethal damage takes priority over regeneration and wave completion', () => {
    const session = game();
    session.state.hp = 1;
    session.state.levelTimer = 0;
    addSpider(session, 'normal', 0, 1, 100);
    advance(session, 1 / 60);
    expect(session.state.phase).toBe('gameOver');
    expect(session.state.hp).toBe(0);
    expect(session.state.pendingTalentPoints).toBe(0);
  });
});
