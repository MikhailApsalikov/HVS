import { describe, expect, it } from 'vitest';
import { GameSession } from '../src/domain/GameSession.js';
import type { TalentId } from '../src/domain/types.js';
import { snapshot, parseSave, restore } from '../src/domain/save.js';
import {
  abilityDescription,
  coinsDescription,
  shootDescription,
  talentDescription,
} from '../src/ui/presenters.js';
import { addSpider } from './helpers.js';

function buy(session: GameSession, id: TalentId, ranks = 1): void {
  for (let rank = 0; rank < ranks; rank++) expect(session.upgradeTalent(id)).toBe(true);
}

function defense(level = 60, random = () => 0.999999): GameSession {
  const session = new GameSession('normal', random);
  session.state.level = level;
  session.state.initialTalentPick = false;
  session.state.pendingTalentPoints = 100;
  session.state.character.setModifiers('test', [
    { stat: 'spawnProbability', kind: 'percent', value: -100 },
    { stat: 'energyRegen', kind: 'percent', value: -100 },
    { stat: 'coinsPerSec', kind: 'percent', value: -100 },
  ]);
  buy(session, 'endurance', 7);
  buy(session, 'improvedEndurance', 7);
  buy(session, 'greed', 5);
  buy(session, 'spiderArmor', 10);
  buy(session, 'shieldBlock', 8);
  session.state.levelTimer = session.state.levelTimerMax = session.state.rules.levelDuration(level);
  return session;
}

function adrenaline(): GameSession {
  const session = defense();
  buy(session, 'bestDefense', 10);
  buy(session, 'adrenaline');
  session.state.phase = 'playing';
  session.state.energy = 0;
  return session;
}

describe('new defense talents through session commands', () => {
  it('adds 350 healing and 2 regeneration at each of exactly five ranks', () => {
    const session = defense(40);
    const baseHeal = session.state.stats['heal.amount'];
    const baseRegen = session.state.stats.hpRegen;
    for (let rank = 1; rank <= 5; rank++) {
      buy(session, 'healBoost');
      expect(session.state.stats['heal.amount']).toBe(baseHeal + rank * 350);
      expect(session.state.stats.hpRegen).toBeCloseTo(baseRegen + rank * 2);
      session.state.phase = 'playing';
      session.state.hp = 1;
      session.state.energy = 100;
      session.state.getAbility('heal').start(0);
      expect(session.activateAbility('heal')).toBe('activated');
      expect(session.state.hp).toBe(1 + baseHeal + rank * 350);
      session.state.phase = 'levelUp';
    }
    expect(session.upgradeTalent('healBoost')).toBe(false);
    expect(talentDescription('healBoost', 5, session.state.stats)).toContain('1750');
  });

  it('requires tier six and subtracts ten seconds per will-to-win rank from actual levels', () => {
    const session = defense(49);
    expect(session.upgradeTalent('willToWin')).toBe(false);
    session.state.level = 50;
    session.refreshStats();
    expect(session.talents.getTalent('willToWin')).toMatchObject({
      tier: 6,
      requiredBranchPoints: 35,
      maxRanks: 5,
    });
    for (let rank = 1; rank <= 5; rank++) {
      buy(session, 'willToWin');
      session.state.pendingTalentPoints = 0;
      expect(session.confirmLevelUp()).toBe(true);
      const level = session.state.level;
      expect(session.state.levelTimerMax).toBe(
        15 + 2 * level - Math.floor(session.state.stats.endurance / 25) - 10 * rank,
      );
      session.tick(session.state.levelTimerMax - 0.01);
      expect(session.state.phase).toBe('playing');
      session.tick(0.02);
      expect(session.state.phase).toBe('levelUp');
      session.state.pendingTalentPoints = 10;
    }
    expect(session.upgradeTalent('willToWin')).toBe(false);
    session.state.character.setModifiers('percent-duration', [
      { stat: 'levelDuration', kind: 'percent', value: -20 },
    ]);
    session.refreshStats();
    expect(session.state.rules.levelDuration(55)).toBe(
      100 - Math.floor(session.state.stats.endurance / 25) - 50,
    );
    session.state.character.setBase('endurance', 10000);
    session.state.pendingTalentPoints = 0;
    session.confirmLevelUp();
    expect(session.state.levelTimerMax).toBe(10);
  });

  it('gates adrenaline by tier seven, branch points and all ten best-defense ranks', () => {
    const session = new GameSession('normal');
    session.state.level = 60;
    expect(session.upgradeTalent('adrenaline')).toBe(false);
    const prepared = defense(59);
    buy(prepared, 'bestDefense', 9);
    expect(prepared.upgradeTalent('adrenaline')).toBe(false);
    prepared.state.level = 60;
    expect(prepared.upgradeTalent('adrenaline')).toBe(false);
    buy(prepared, 'bestDefense');
    buy(prepared, 'adrenaline');
    expect(prepared.upgradeTalent('adrenaline')).toBe(false);
    expect(prepared.talents.getTalent('adrenaline')).toMatchObject({
      tier: 7,
      requiredBranchPoints: 42,
      maxRanks: 1,
    });
    expect(prepared.state.isAbilityUnlocked('adrenaline')).toBe(true);
    session.state.phase = 'playing';
    expect(session.activateAbility('adrenaline')).toBe('level_locked');
  });

  it('allows exactly twenty successful zero-energy shots while keeping normal archer cooldowns', () => {
    const session = adrenaline();
    expect(session.shootLane(0)).toBe('not_enough_energy');
    expect(session.activateAbility('adrenaline')).toBe('activated');
    expect(session.state.getAbility('adrenaline').remainingCooldown).toBe(120);
    expect(session.activateAbility('adrenaline')).toBe('on_cooldown');
    expect(session.shootLane(-1)).toBe('blocked');
    expect(session.activateAbility('volley')).toBe('not_enough_energy');
    expect(session.state.adrenalineShots).toBe(20);
    for (let shot = 0; shot < 20; shot++) {
      if (shot > 0 && shot % 9 === 0) session.tick(session.state.stats.shootCooldown);
      expect(session.shootLane(shot % 9)).toBe('shot');
      expect(session.state.energy).toBe(0);
      expect(session.state.archers[shot % 9].duration).toBe(session.state.stats.shootCooldown);
      expect(session.shootLane(shot % 9)).toBe('blocked');
      expect(session.state.adrenalineShots).toBe(19 - shot);
    }
    expect(session.state.adrenalineTimer).toBe(0);
    expect(session.shootLane(2)).toBe('not_enough_energy');
    session.state.energy = session.state.stats.shootCost;
    expect(session.shootLane(2)).toBe('shot');
    expect(session.state.energy).toBe(0);
  });

  it('expires at twenty seconds, freezes with the game and recharges without replenishing shots', () => {
    const session = adrenaline();
    session.activateAbility('adrenaline');
    session.shootLane(0);
    session.tick(1);
    expect(session.state.abilityActiveTimer('adrenaline')).toBe(19);
    session.state.energy = session.state.maxEnergy;
    expect(session.activateAbility('freeze')).toBe('activated');
    session.tick(100);
    expect(session.shootLane(1)).toBe('blocked');
    expect(session.state.adrenalineTimer).toBe(19);
    expect(session.state.adrenalineShots).toBe(19);
    session.activateAbility('freeze');
    session.state.phase = 'levelUp';
    session.tick(100);
    expect(session.state.adrenalineTimer).toBe(19);
    session.state.phase = 'playing';
    session.state.energy = session.state.maxEnergy;
    expect(session.activateAbility('recharge')).toBe('activated');
    expect(session.state.getAbility('adrenaline').isReady).toBe(true);
    expect(session.state.adrenalineShots).toBe(19);
    session.tick(18.99);
    expect(session.state.adrenalineActive).toBe(true);
    session.tick(0.02);
    expect(session.state.adrenalineTimer).toBe(0);
    expect(session.state.adrenalineShots).toBe(0);
    session.state.energy = 0;
    expect(session.shootLane(1)).toBe('not_enough_energy');
    expect(session.activateAbility('adrenaline')).toBe('activated');
    expect(session.state.adrenalineShots).toBe(20);
  });

  it('keeps volleys separate from free shots and applies global cooldown reductions', () => {
    const session = defense(60, () => 0);
    buy(session, 'bestDefense', 10);
    buy(session, 'adrenaline');
    buy(session, 'tireless', 5);
    buy(session, 'improvedIntellect', 7);
    buy(session, 'hunterArsenal', 5);
    buy(session, 'agility', 5);
    buy(session, 'magicArmor', 6);
    buy(session, 'quickInstinct', 2);
    session.state.phase = 'playing';
    session.state.energy = session.state.maxEnergy;
    expect(session.activateAbility('adrenaline')).toBe('activated');
    expect(session.state.getAbility('adrenaline').duration).toBe(116.4);
    expect(session.activateAbility('volley')).toBe('activated');
    const arrows = session.state.arrows.size;
    addSpider(session, 'normal', 8, 1, 1);
    session.tick(0.01);
    expect(session.state.arrows.size).toBe(arrows + session.state.stats['volley.lanes']);
    expect(session.state.adrenalineShots).toBe(20);
  });

  it.each([
    [1, false, 2],
    [2, false, 3],
    [3, false, 5],
    [1, true, 5],
    [2, true, 9],
    [3, true, 14],
  ] as const)(
    'marauder rank %s awards %s jackpot share as %s coins exactly once per breach',
    (rank, jackpot, expected) => {
      let roll = jackpot ? 0 : 0.999999;
      const session = defense(30, () => roll);
      // Base roll is 1 (jackpot) or 3 (normal); flat reward becomes 10 in either case.
      session.state.character.setModifiers('reward', [
        { stat: 'coinsPerKill', kind: 'flat', value: jackpot ? 4 : 2 },
        { stat: 'energyPerKill', kind: 'flat', value: 50 },
      ]);
      buy(session, 'hunterReward', 5);
      buy(session, 'marauder', rank);
      session.state.phase = 'playing';
      session.state.energy = 0;
      const before = session.state.coins;
      const spider = addSpider(session, 'normal', 0, 1, 0);
      session.tick(0.31);
      expect(session.state.coins).toBe(before + expected);
      expect(session.state.energy).toBe(session.state.stats.energyPerBreach);
      expect(session.drainEvents()).toContainEqual({
        type: 'coinDrop',
        spiderId: spider.id,
        coins: expected,
        jackpot,
      });
      session.tick(0.31);
      expect(session.state.coins).toBe(before + expected);
      roll = 0.999999;
      const killed = addSpider(session, 'normal', 1, 0.95);
      session.state.energy = session.state.maxEnergy;
      session.shootLane(1);
      session.tick(0.31);
      expect(session.drainEvents()).toContainEqual({
        type: 'coinDrop',
        spiderId: killed.id,
        coins: jackpot ? 12 : 10,
        jackpot: false,
      });
    },
  );

  it('requires all hunter-reward ranks, caps marauder at three and rewards invulnerable breaches', () => {
    const session = defense(30);
    expect(session.talents.getTalent('marauder')).toMatchObject({
      tier: 4,
      maxRanks: 3,
      requiredBranchPoints: 21,
    });
    for (let rank = 0; rank < 5; rank++) {
      expect(session.upgradeTalent('marauder')).toBe(false);
      buy(session, 'hunterReward');
    }
    session.state.level = 29;
    expect(session.upgradeTalent('marauder')).toBe(false);
    session.state.level = 30;
    buy(session, 'marauder', 3);
    expect(session.upgradeTalent('marauder')).toBe(false);
    expect(session.state.stats.breachRewardFraction).toBe(0.45);
    buy(session, 'divineShield');
    session.state.phase = 'playing';
    session.activateAbility('stand');
    const before = session.state.coins;
    addSpider(session, 'tank', 0, 1, 100000);
    session.tick(0.31);
    expect(session.state.coins).toBe(before + 4); // round((3 + 5) × .45)
    expect(session.drainEvents()).toContainEqual({ type: 'absorb' });
    expect(talentDescription('marauder', 3, session.state.stats)).toContain('45%');
    expect(coinsDescription(session.state)).toContain('45%');
  });

  it('round-trips an active adrenaline counter and shows live time and remaining arrows', () => {
    const session = adrenaline();
    session.activateAbility('adrenaline');
    session.shootLane(0);
    session.tick(2);
    const saved = snapshot(session);
    const loaded = restore(parseSave(saved)!, () => 0.999999);
    expect(snapshot(loaded)).toEqual(saved);
    expect(loaded.state.adrenalineShots).toBe(19);
    expect(loaded.state.abilityActiveTimer('adrenaline')).toBe(18);
    expect(abilityDescription(loaded.state, 'adrenaline')).toContain('Бесплатных выстрелов: 19');
    expect(shootDescription(loaded.state, 2)).toContain('19 бесплатных выстрелов');
    expect(shootDescription(loaded.state, 2)).not.toContain('Недостаточно энергии');
    expect(loaded.shootLane(1)).toBe('shot');
    expect(loaded.state.adrenalineShots).toBe(18);
    loaded.tick(18);
    expect(loaded.state.adrenalineActive).toBe(false);
    expect(loaded.state.abilityActiveTimer('heal')).toBe(0);
    expect(loaded.state.abilityActiveTimer('stand')).toBe(0);
    expect(loaded.state.abilityActiveTimer('lastHope')).toBe(0);
  });

  it('migrates version six, refunds healing ranks once and preserves cooldown order', () => {
    const session = defense();
    session.state.getAbility('lastHope').start(42);
    const saved = snapshot(session);
    const { adrenalineTimer: _timer, adrenalineShots: _shots, ...oldState } = saved.state;
    const previous = {
      ...saved,
      version: 6,
      state: oldState,
      abilities: saved.abilities.slice(0, 9),
      talents: [
        ...saved.talents.filter(
          ({ id }) => !['healBoost', 'adrenaline', 'willToWin', 'marauder'].includes(id),
        ),
        { id: 'healBoost', rank: 15 },
      ],
    };
    const loaded = restore(parseSave(previous)!);
    expect(loaded.talents.getRank('healBoost')).toBe(5);
    expect(loaded.state.pendingTalentPoints).toBe(saved.state.pendingTalentPoints + 10);
    expect(loaded.state.levelTimer).toBe(saved.state.levelTimer);
    expect(loaded.state.coins).toBe(saved.state.coins);
    expect(loaded.state.getAbility('lastHope').remainingCooldown).toBe(42);
    expect(loaded.state.getAbility('adrenaline').isReady).toBe(true);
    expect(loaded.state.isAbilityUnlocked('adrenaline')).toBe(false);
    expect(loaded.state.adrenalineShots).toBe(0);
    expect(loaded.state.adrenalineTimer).toBe(0);
    const current = snapshot(loaded);
    expect(current.version).toBe(7);
    expect(snapshot(restore(parseSave(current)!))).toEqual(current);
  });

  it.each([
    { adrenalineTimer: 21, adrenalineShots: 20 },
    { adrenalineTimer: -1, adrenalineShots: 20 },
    { adrenalineTimer: 20, adrenalineShots: 21 },
    { adrenalineTimer: 20, adrenalineShots: 1.5 },
    { adrenalineTimer: 20, adrenalineShots: 0 },
    { adrenalineTimer: 0, adrenalineShots: 20 },
  ])('rejects invalid adrenaline state %j', (invalid) => {
    const saved = snapshot(adrenaline());
    expect(parseSave({ ...saved, state: { ...saved.state, ...invalid } })).toBeNull();
  });
});

describe('tenfold base passive income', () => {
  it.each([
    ['easy', 1],
    ['normal', 4],
    ['hard', 7],
  ] as const)('%s has a base of %s and retains separate bonuses', (difficulty, base) => {
    const session = new GameSession(difficulty, () => 0.999999);
    expect(session.state.config.coinsPerSec).toBe(base);
    expect(session.state.stats.coinsPerSec).toBe(base + 0.2);
    session.upgradeTalent('hunterMastery');
    session.confirmLevelUp();
    const coins = session.state.coins;
    session.tick(2.5);
    expect(session.state.coins + session.state.coinAccumulator).toBeCloseTo(
      coins + (base + 0.2) * 2.5,
    );
    session.state.character.setModifiers('income', [
      { stat: 'coinsPerSec', kind: 'flat', value: 2 },
      { stat: 'coinsPerSec', kind: 'percent', value: 50 },
    ]);
    session.refreshStats();
    expect(session.state.stats.coinsPerSec).toBeCloseTo((base + 0.2 + 2) * 1.5);
  });
});
