import { describe, expect, it } from 'vitest';
import { GameSession } from '../src/domain/GameSession.js';
import { parseSave, restore, snapshot } from '../src/domain/save.js';
import type { TalentId } from '../src/domain/types.js';
import { addSpider } from './helpers.js';

function buy(session: GameSession, id: TalentId, ranks = 1): void {
  for (let rank = 0; rank < ranks; rank++) expect(session.upgradeTalent(id)).toBe(true);
}

function defense(random = () => 0.999999): GameSession {
  const session = new GameSession('normal', random);
  session.state.level = 40;
  session.state.initialTalentPick = false;
  session.state.pendingTalentPoints = 100;
  buy(session, 'endurance', 7);
  buy(session, 'improvedEndurance', 7);
  buy(session, 'warriorArmor', 5);
  buy(session, 'spiderArmor', 9);
  buy(session, 'greed', 5);
  buy(session, 'hunterReward', 5);
  session.state.character.setModifiers('test:quiet', [
    { stat: 'spawnProbability', kind: 'percent', value: -100 },
    { stat: 'hpRegen', kind: 'percent', value: -100 },
    { stat: 'dodgeChance', kind: 'percent', value: -100 },
    { stat: 'energyRegen', kind: 'percent', value: -100 },
    { stat: 'energyPerBreach', kind: 'percent', value: -100 },
  ]);
  session.refreshStats();
  return session;
}

describe('defense talent abilities through session commands', () => {
  it('starts with zero block and never grants talent abilities from level alone', () => {
    const session = new GameSession('normal');
    expect(session.state.stats).toMatchObject({ blockChance: 0, blockPower: 0 });
    session.state.level = 100;
    session.state.phase = 'playing';
    session.refreshStats();
    for (const id of ['stand', 'lastHope'] as const) {
      expect(session.state.isAbilityUnlocked(id)).toBe(false);
      expect(session.activateAbility(id)).toBe('level_locked');
    }
  });

  it('adds five percentage points per rank but grants fifty plus ten percent endurance block only once', () => {
    const session = new GameSession('normal');
    session.state.level = 10;
    session.state.pendingTalentPoints = 30;
    expect(session.upgradeTalent('shieldBlock')).toBe(false);
    buy(session, 'endurance', 7);
    session.state.level = 9;
    expect(session.upgradeTalent('shieldBlock')).toBe(false);
    session.state.level = 10;
    for (let rank = 1; rank <= 8; rank++) {
      buy(session, 'shieldBlock');
      expect(session.state.stats.blockChance).toBeCloseTo(rank * 0.05);
      expect(session.state.stats.blockPower).toBe(55);
    }
    expect(session.upgradeTalent('shieldBlock')).toBe(false);
    expect(session.state.rules.explain('blockPower').modifiers).toEqual([
      { source: 'talent:shieldBlock', kind: 'flat', stat: 'blockPower', value: 50 },
      { source: 'attribute:endurance', kind: 'flat', stat: 'blockPower', value: 5.4 },
    ]);
  });

  it('requires both prerequisite links and spends no points on a rejected purchase', () => {
    const session = defense();
    const points = session.state.pendingTalentPoints;
    expect(session.talents.upgradeBlockReason('lastHope', 40)).toBe('prerequisite');
    expect(session.upgradeTalent('lastHope')).toBe(false);
    expect(session.upgradeTalent('improvedLastHope')).toBe(false);
    expect(session.state.pendingTalentPoints).toBe(points);
    for (let rank = 1; rank < 8; rank++) {
      buy(session, 'shieldBlock');
      expect(session.upgradeTalent('lastHope')).toBe(false);
      expect(session.state.pendingTalentPoints).toBe(points - rank);
    }
    buy(session, 'shieldBlock');
    buy(session, 'lastHope');
    expect(session.upgradeTalent('lastHope')).toBe(false);
    for (let rank = 1; rank <= 5; rank++) {
      buy(session, 'improvedLastHope');
      expect(session.state.stats['lastHope.cooldown']).toBe(40 - 5 * rank);
      expect(session.state.stats['lastHope.cost']).toBe(45 - 4 * rank);
    }
    expect(session.upgradeTalent('improvedLastHope')).toBe(false);
    expect(session.state.isAbilityUnlocked('lastHope')).toBe(true);
    session.state.phase = 'playing';
    session.state.energy = 24;
    expect(session.activateAbility('lastHope')).toBe('not_enough_energy');
    session.state.energy = 100;
    expect(session.activateAbility('lastHope')).toBe('activated');
    expect(session.state.energy).toBe(75);
    expect(session.state.getAbility('lastHope').remainingCooldown).toBe(15);
    expect(session.activateAbility('lastHope')).toBe('on_cooldown');
  });

  it('moves divine shield to tier four and its existing improvement to tier five', () => {
    const session = defense();
    expect(session.talents.getTalent('divineShield')).toMatchObject({
      tier: 4,
      maxRanks: 1,
      requiredBranchPoints: 21,
    });
    expect(session.talents.getTalent('dutyBound')).toMatchObject({
      tier: 5,
      maxRanks: 5,
      requiredBranchPoints: 28,
    });
    session.state.level = 29;
    expect(session.upgradeTalent('divineShield')).toBe(false);
    session.state.level = 30;
    buy(session, 'divineShield');
    expect(session.upgradeTalent('divineShield')).toBe(false);
    expect(session.upgradeTalent('dutyBound')).toBe(false);
    session.state.level = 40;
    buy(session, 'dutyBound', 5);
    expect(session.state.stats['stand.duration']).toBe(12);
    expect(session.state.stats['stand.cooldown']).toBe(120);
    session.state.phase = 'playing';
    expect(session.activateAbility('stand')).toBe('activated');
    expect(session.state.energy).toBe(85);
    addSpider(session, 'tank', 0, 1, 10000);
    session.tick(0.001);
    expect(session.state.hp).toBe(session.state.maxHp);
    expect(session.drainEvents()).toEqual([{ type: 'absorb' }]);
  });

  it('requires divine shield before its improvement and starts its base cooldown at 180 seconds', () => {
    const session = defense();
    const points = session.state.pendingTalentPoints;
    expect(session.upgradeTalent('dutyBound')).toBe(false);
    expect(session.state.pendingTalentPoints).toBe(points);
    buy(session, 'divineShield');
    expect(session.state.stats['stand.cooldown']).toBe(180);
    session.state.phase = 'playing';
    expect(session.activateAbility('stand')).toBe('activated');
    expect(session.state.getAbility('stand').remainingCooldown).toBe(180);
    session.state.phase = 'levelUp';
    buy(session, 'dutyBound');
    expect(session.state.stats['stand.cooldown']).toBe(168);
  });

  it('uses final endurance for a six-second buff and removes it exactly on expiration', () => {
    const session = defense();
    buy(session, 'shieldBlock', 8);
    buy(session, 'lastHope');
    session.state.character.setBase('endurance', 40);
    session.state.character.setModifiers('test:item', [
      { stat: 'endurance', kind: 'flat', value: 10 },
    ]);
    session.refreshStats();
    expect(session.state.stats.endurance).toBe(594); // (40 + 39 × (3 + 7) + 10) × 1.35
    session.state.phase = 'playing';
    expect(session.activateAbility('lastHope')).toBe('activated');
    expect(session.state.energy).toBe(55);
    expect(session.state.getAbility('lastHope').remainingCooldown).toBe(40);
    expect(session.state.stats).toMatchObject({ blockChance: 0.9, blockPower: 258 });
    session.refreshStats();
    expect(session.state.stats.blockPower).toBe(258);
    session.tick(5.999);
    expect(session.state.stats.blockPower).toBe(258);
    session.tick(0.0011);
    expect(session.state.lastHopeTimer).toBe(0);
    expect(session.state.stats).toMatchObject({
      blockChance: 0.4,
      blockPower: Math.round(50 + session.state.stats.endurance * 0.1),
    });
  });

  it('pauses the buff with the simulation, caps chance and resets its cooldown with recharge', () => {
    const session = defense();
    buy(session, 'shieldBlock', 8);
    buy(session, 'lastHope');
    session.state.level = 50;
    session.state.character.setModifiers('test:block', [
      { stat: 'blockChance', kind: 'flat', value: 0.2 },
    ]);
    session.refreshStats();
    session.state.phase = 'playing';
    session.activateAbility('lastHope');
    expect(session.state.stats.blockChance).toBe(1);
    session.state.energy = session.state.maxEnergy;
    session.activateAbility('freeze');
    session.tick(10);
    expect(session.state.lastHopeTimer).toBe(6);
    session.activateAbility('freeze');
    session.state.energy = session.state.maxEnergy;
    session.talents.loadFromSave([...session.talents.toSaveData(), { id: 'recharge', rank: 1 }]);
    session.refreshStats();
    expect(session.activateAbility('recharge')).toBe('activated');
    expect(session.state.getAbility('lastHope').isReady).toBe(true);
    expect(session.state.lastHopeTimer).toBe(6);
    session.state.phase = 'levelUp';
    session.tick(10);
    expect(session.state.lastHopeTimer).toBe(6);
  });

  it('combines independent cooldown percentages before flat improvements', () => {
    const session = defense();
    buy(session, 'shieldBlock', 8);
    buy(session, 'lastHope');
    buy(session, 'improvedLastHope', 5);
    buy(session, 'agility', 5);
    buy(session, 'improvedIntellect', 7);
    buy(session, 'tireless', 5);
    buy(session, 'improvedPrep', 5);
    buy(session, 'magicArmor', 6);
    buy(session, 'quickInstinct', 2);
    expect(session.state.stats['lastHope.cooldown']).toBe(13.8); // 40 × .97 − 25
  });
});

describe('damage blocking and counter volleys', () => {
  it.each([
    [0.049999, true],
    [0.05, false],
  ] as const)('roll %s blocks: %s', (roll, blocked) => {
    const session = defense(() => roll);
    buy(session, 'shieldBlock');
    session.state.character.setModifiers('test:defense', [
      { stat: 'armor', kind: 'percent', value: -100 },
      { stat: 'incomingDamage', kind: 'percent', value: -10 },
    ]);
    session.refreshStats();
    session.state.phase = 'playing';
    const before = session.state.hp;
    const spider = addSpider(session, 'normal', 0, 1, 201);
    session.tick(0.001);
    const damage = blocked ? 0 : 83; // The endurance-scaled block fully absorbs this hit.
    expect(session.state.hp).toBe(before - damage);
    expect(session.drainEvents()).toContainEqual({
      type: 'damage',
      spiderId: spider.id,
      hp: damage,
      energy: 0,
      ...(blocked ? { blockedDamage: 83 } : {}),
    });
  });

  it('subtracts block after armor, clamps fully blocked hits and still burns energy', () => {
    const session = defense(() => 0);
    buy(session, 'shieldBlock');
    session.state.phase = 'playing';
    const raw = session.state.rules.explain('incomingDamage', 1000).afterPercentPenalties;
    const before = session.state.hp;
    addSpider(session, 'tank', 0, 1, 1000);
    session.tick(0.001);
    expect(session.state.hp).toBe(before - Math.round(raw - session.state.stats.blockPower));
    const burner = addSpider(session, 'burner', 1, 1, 2);
    const hp = session.state.hp;
    session.tick(0.001);
    expect(session.state.hp).toBe(hp);
    expect(session.state.energy).toBe(0);
    const events = session.drainEvents();
    expect(events.filter((event) => event.type === 'absorb')).toHaveLength(2);
    expect(events).toContainEqual({
      type: 'damage',
      spiderId: burner.id,
      hp: 0,
      energy: 100,
      blockedDamage: session.state.rules.value('incomingDamage', 2),
    });
  });

  it.each([
    [1, 0.009999, true],
    [1, 0.01, false],
    [10, 0.099999, true],
    [10, 0.1, false],
  ] as const)(
    'counter volley rank %s, roll %s, triggers %s without touching energy or cooldowns',
    (rank, procRoll, triggered) => {
      const rolls = [0, procRoll];
      const session = defense(() => rolls.shift() ?? 0.5);
      buy(session, 'shieldBlock');
      buy(session, 'bestDefense', rank);
      if (rank === 10) expect(session.upgradeTalent('bestDefense')).toBe(false);
      session.state.character.setModifiers('test:volley', [
        { stat: 'volley.lanes', kind: 'flat', value: 2 },
        { stat: 'arrowSpeed', kind: 'percent', value: 50 },
      ]);
      session.refreshStats();
      session.state.phase = 'playing';
      session.state.energy = 0;
      session.state.getAbility('volley').start(12);
      session.state.archers[0].start(7);
      addSpider(session, 'normal', 0, 1, 20);
      session.tick(0.001);
      expect(session.state.energy).toBe(0);
      expect(session.state.getAbility('volley').remainingCooldown).toBe(11.999);
      expect(session.state.archers[0].remainingCooldown).toBe(6.999);
      const arrows = [...session.state.arrows.values()];
      expect(arrows).toHaveLength(triggered ? 6 : 0);
      expect(new Set(arrows.map((arrow) => arrow.lane)).size).toBe(arrows.length);
      expect(
        arrows.every((arrow) => arrow.fromVolley && arrow.speed === session.state.stats.arrowSpeed),
      ).toBe(true);
    },
  );

  it.each([
    ['no block talent', 0, 100, false, 0],
    ['failed block', 1, 100, false, 0.9],
    ['partial block', 1, 1000, false, 0],
    ['full block', 1, 1, false, 0],
    ['zero damage', 1, 0, false, 0],
    ['invulnerability', 1, 100, true, 0],
  ] as const)(
    'triggers on a breach with %s',
    (_case, blockRanks, damage, invulnerable, blockRoll) => {
      const rolls = blockRanks && damage > 0 && !invulnerable ? [blockRoll, 0] : [0];
      const session = defense(() => rolls.shift() ?? 0);
      if (blockRanks) buy(session, 'shieldBlock', blockRanks);
      buy(session, 'bestDefense');
      buy(session, 'divineShield');
      session.state.phase = 'playing';
      if (invulnerable) expect(session.activateAbility('stand')).toBe('activated');
      addSpider(session, 'burner', 0, 1, damage);
      session.tick(0.001);
      expect(session.state.arrows.size).toBe(4);
      expect(session.state.bestDefenseCooldown).toBe(3);
      expect(session.state.getAbility('volley').isReady).toBe(true);
    },
  );

  it('limits simultaneous and later breaches to one volley per three playing seconds, including after loading', () => {
    const session = defense(() => 0);
    buy(session, 'bestDefense');
    session.state.phase = 'playing';
    addSpider(session, 'normal', 0, 1);
    addSpider(session, 'normal', 1, 1);
    session.tick(0.001);
    expect(session.state.arrows.size).toBe(4);
    session.state.arrows.clear();
    session.tick(1);
    session.state.energy = session.state.maxEnergy;
    expect(session.activateAbility('freeze')).toBe('activated');
    session.tick(10);
    expect(session.state.bestDefenseCooldown).toBe(2);
    session.activateAbility('freeze');
    session.state.phase = 'levelUp';
    session.tick(10);
    expect(session.state.bestDefenseCooldown).toBe(2);
    session.state.phase = 'playing';
    const loaded = restore(parseSave(snapshot(session))!, () => 0);
    expect(loaded.state.bestDefenseCooldown).toBe(2);
    addSpider(loaded, 'normal', 2, 1);
    loaded.tick(1.999);
    expect(loaded.state.arrows.size).toBe(0);
    addSpider(loaded, 'normal', 3, 1);
    loaded.tick(0.0011);
    expect(loaded.state.arrows.size).toBe(4);
    expect(loaded.state.bestDefenseCooldown).toBe(3);
  });

  it('rolls for each eligible breach and starts the cooldown only on success', () => {
    const rolls = [0.5, 0];
    const session = defense(() => rolls.shift() ?? 0);
    buy(session, 'bestDefense');
    session.state.phase = 'playing';
    addSpider(session, 'normal', 0, 1);
    session.tick(0.001);
    expect(session.state.bestDefenseCooldown).toBe(0);
    expect(session.state.arrows.size).toBe(0);
    addSpider(session, 'normal', 1, 1);
    session.tick(0.001);
    expect(session.state.arrows.size).toBe(4);
    expect(session.state.bestDefenseCooldown).toBe(3);
  });
});

describe('defense save compatibility', () => {
  it('migrates version four without granting the shield and preserves the old cooldown order', () => {
    const session = defense();
    buy(session, 'divineShield');
    buy(session, 'dutyBound', 2);
    session.state.getAbility('stand').start(41);
    session.state.getAbility('recharge').start(123);
    const current = snapshot(session);
    const { lastHopeTimer: _timer, ...oldState } = current.state;
    const previous = {
      ...current,
      version: 4,
      state: oldState,
      abilities: current.abilities.slice(0, 8),
      talents: current.talents.filter(
        (talent) =>
          !['divineShield', 'shieldBlock', 'lastHope', 'improvedLastHope', 'bestDefense'].includes(
            talent.id,
          ),
      ),
    };
    const parsed = parseSave(previous)!;
    expect(parsed.version).toBe(13);
    const loaded = restore(parsed);
    expect(loaded.state.getAbility('stand').remainingCooldown).toBe(41);
    expect(loaded.state.getAbility('recharge').remainingCooldown).toBe(123);
    expect(loaded.state.getAbility('lastHope').isReady).toBe(true);
    expect(loaded.state.lastHopeTimer).toBe(0);
    expect(loaded.state.isAbilityUnlocked('stand')).toBe(false);
    expect(loaded.talents.getRank('dutyBound')).toBe(2);
    expect(loaded.upgradeTalent('dutyBound')).toBe(false);
    expect(loaded.state.coins).toBe(session.state.coins);
    expect(snapshot(restore(parseSave(snapshot(loaded))!))).toEqual(snapshot(loaded));
  });

  it('round-trips learned abilities and a partially elapsed buff without doubling bonuses', () => {
    const session = defense();
    buy(session, 'shieldBlock', 8);
    buy(session, 'lastHope');
    buy(session, 'divineShield');
    session.state.phase = 'playing';
    session.activateAbility('lastHope');
    session.tick(2);
    const loaded = restore(parseSave(snapshot(session))!, () => 0.999999);
    expect(snapshot(loaded)).toEqual(snapshot(session));
    expect(loaded.state.stats).toEqual(session.state.stats);
    expect(loaded.state.stats.blockChance).toBe(0.9);
    expect(loaded.state.isAbilityUnlocked('stand')).toBe(true);
    expect(loaded.state.isAbilityUnlocked('lastHope')).toBe(true);
    loaded.tick(4);
    expect(loaded.state.lastHopeTimer).toBe(0);
    expect(loaded.state.stats).toMatchObject({
      blockChance: 0.4,
      blockPower: Math.round(50 + session.state.stats.endurance * 0.1),
    });
    expect(
      parseSave({ ...snapshot(session), state: { ...snapshot(session).state, lastHopeTimer: -1 } }),
    ).toBeNull();
  });
});
