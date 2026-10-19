import { describe, expect, it } from 'vitest';
import { GameSession } from '../src/domain/GameSession.js';
import { parseSave, restore, snapshot } from '../src/domain/save.js';
import { activeDebuffs, coinsDescription, playerEffectDescription } from '../src/ui/presenters.js';
import { addSpider } from './helpers.js';

const DEBUFF_SPIDERS = ['golden', 'fast', 'poisonous', 'ninja'] as const;
type DebuffSpider = (typeof DEBUFF_SPIDERS)[number];

function arena(level = 60, intellect = 1000, rank = 5) {
  const session = new GameSession('normal', () => 0.999999, { level });
  session.talents.loadFromSave([{ id: 'magicArmor', rank }]);
  session.state.character.setBase('intellect', intellect - (level - 1) * 2);
  session.state.character.setBase('agility', 200 - (level - 1));
  session.state.character.setModifiers('test:arena', [
    { stat: 'spawnProbability', kind: 'percent', value: -100 },
    { stat: 'maxHp', kind: 'flat', value: 100000 },
    { stat: 'hpRegen', kind: 'percent', value: -100 },
    { stat: 'blockChance', kind: 'flat', value: 0.6 },
    { stat: 'blockPower', kind: 'flat', value: 1 },
    { stat: 'dodgeChance', kind: 'flat', value: 0.1 },
    { stat: 'dodgeChance', kind: 'percent', value: 50 },
  ]);
  session.refreshStats();
  session.state.phase = 'playing';
  session.state.initialTalentPick = false;
  session.state.pendingTalentPoints = 0;
  session.state.levelTimer = session.state.levelTimerMax = 1000;
  return session;
}

function breach(session: GameSession, type: DebuffSpider, damage = 101) {
  addSpider(session, type, 0, 1, damage);
  session.tick(0.001);
}

describe('magic armor through session commands', () => {
  it.each(['easy', 'normal', 'hard'] as const)(
    'requires magic tier four and grants five ranks based on final intellect on %s',
    (difficulty) => {
      const session = new GameSession(difficulty, () => 0.999999, { level: 29 });
      session.state.pendingTalentPoints = 6;
      session.talents.loadFromSave([
        { id: 'improvedIntellect', rank: 5 },
        { id: 'agility', rank: 5 },
        { id: 'tireless', rank: 5 },
        { id: 'hunterArsenal', rank: 3 },
        { id: 'improvedPrep', rank: 2 },
      ]);
      expect(session.talents.getTalent('magicArmor')).toMatchObject({
        branch: 'magic',
        tier: 4,
        requiredBranchPoints: 21,
        unlocksAtLevel: 30,
        maxRanks: 5,
      });
      expect(session.upgradeTalent('magicArmor')).toBe(false);
      session.state.level = 30;
      expect(session.upgradeTalent('magicArmor')).toBe(false);
      expect(session.upgradeTalent('hunterArsenal')).toBe(true);
      expect(session.state.stats.intellect).toBe(274);
      const armor = session.state.stats.armor;
      for (let rank = 1; rank <= 5; rank++) {
        expect(session.upgradeTalent('magicArmor')).toBe(true);
        expect(session.state.stats.armor).toBe(armor + 5480 * rank);
        expect(session.state.stats.spiderDebuffResistance).toBeCloseTo(0.0274 * rank);
        expect(session.state.rules.explain('spiderDebuffResistance').modifiers).toEqual([
          expect.objectContaining({ source: 'talent:magicArmor' }),
        ]);
      }
      session.state.pendingTalentPoints = 1;
      expect(session.upgradeTalent('magicArmor')).toBe(false);
      session.state.character.setModifiers('test:intellect-item', [
        { stat: 'intellect', kind: 'flat', value: 20 },
      ]);
      session.refreshStats();
      expect(session.state.stats.intellect).toBe(299);
      expect(session.state.stats.armor).toBe(armor + 29900);
      expect(session.state.stats.spiderDebuffResistance).toBe(0.1495);
      session.state.character.removeModifiers('test:intellect-item');
      session.refreshStats();
      expect(session.state.stats.armor).toBe(armor + 27400);
      expect(session.state.stats.spiderDebuffResistance).toBe(0.137);
    },
  );

  it.each([
    [0, 1, 0],
    [10000, 0, 0],
    [19, 1, 0.0019],
    [1234, 2, 0.2468],
    [1999, 5, 0.9995],
    [2000, 5, 1],
    [10000, 1, 1],
    [10001, 1, 1],
  ])(
    'uses every intellect point and caps resistance: intellect %i, rank %i',
    (intellect, rank, resistance) => {
      const session = arena(1, intellect, rank);
      expect(session.state.stats.intellect).toBe(intellect);
      expect(session.state.stats.spiderDebuffResistance).toBe(resistance);
    },
  );

  it.each(DEBUFF_SPIDERS)(
    'halves the strength of %s debuffs without changing duration or poison interval',
    (type) => {
      const session = arena();
      const { armor } = session.state.stats;
      breach(session, type);
      const effect = session.state.activeEffects.find((effect) => effect.source === 'spider')!;
      if (type === 'golden') {
        expect(session.state.goldLockTimer).toBe(40);
        expect(session.state.stats.coinsPerSec).toBe(3.08);
        expect(effect.details).toMatchObject({ incomePercent: -31.5 });
      } else if (type === 'fast') {
        expect(session.state.healingReductionTimer).toBe(40);
        expect(session.state.stats.healingReceived).toBe(0.795);
        expect(effect.details).toMatchObject({ healingReceived: 0.795 });
      } else if (type === 'ninja') {
        expect(session.state.disorientationTimer).toBe(25);
        expect(session.state.stats.blockChance).toBe(0.546);
        expect(session.state.stats.dodgeChance).toBe(0.19365);
        expect(effect.details).toMatchObject({
          blockReductionPercent: 9,
          agilityDodgeReductionPercent: 3,
        });
      } else {
        expect(session.state.poisonTimer).toBe(36.5);
        expect(session.state.poisonTickTimer).toBe(2);
        expect(session.state.stats.armor).toBe(Math.round(armor * 0.8675));
        expect(session.state.stats['poison.tickDamage']).toBe(6.06);
        expect(effect.details).toMatchObject({
          armorPercent: -13.25,
          tickDamage: 6.06,
          tickInterval: 2,
        });
        const hp = session.state.hp;
        session.tick(1.999);
        expect(session.state.hp).toBe(hp);
        session.tick(0.001);
        expect(session.state.hp).toBeCloseTo(hp - 6.06);
      }
    },
  );

  it.each(DEBUFF_SPIDERS)(
    'weakens the capped strength of %s debuffs after their existing maximum',
    (type) => {
      const session = arena(154);
      const { armor, coinsPerSec } = session.state.stats;
      breach(session, type, 100);
      if (type === 'golden') expect(session.state.stats.coinsPerSec).toBeCloseTo(coinsPerSec * 0.5);
      else if (type === 'fast') expect(session.state.stats.healingReceived).toBe(0.5);
      else if (type === 'ninja') {
        expect(session.state.stats.blockChance).toBe(0.3);
        expect(session.state.stats.dodgeChance).toBe(0.1725);
      } else {
        breach(session, type, 100);
        expect(session.state.stats.armor).toBe(Math.round(armor * 0.5));
        expect(session.state.stats['poison.tickDamage']).toBe(12);
      }
    },
  );

  it('combines weaker poison with duration resistance and preserves both across save and load', () => {
    const session = arena();
    session.talents.loadFromSave([
      { id: 'magicArmor', rank: 5 },
      { id: 'poisonResistance', rank: 5 },
    ]);
    session.refreshStats();
    breach(session, 'poisonous', 101);
    session.tick(0.999);
    breach(session, 'poisonous', 202);
    expect(session.state.poisonTimer).toBe(21.9);
    expect(session.state.poisonTickTimer).toBeCloseTo(1);
    expect(session.state.stats['poison.tickDamage']).toBe(18.18);
    const loaded = restore(parseSave(snapshot(session))!, () => 0.999999);
    expect(loaded.state.poisonDamage).toEqual([101, 202]);
    expect(loaded.state.stats).toEqual(session.state.stats);
    const hp = loaded.state.hp;
    loaded.tick(1);
    expect(loaded.state.hp).toBeCloseTo(hp - 18.18);
  });

  it('recalculates active debuffs with intellect and clears them at immunity without removing inactivity penalties', () => {
    const session = arena();
    for (const type of DEBUFF_SPIDERS) breach(session, type);
    session.state.antiAfkStacks = 3;
    session.state.antiAfkRecoveryTimer = 9;
    session.refreshStats(false);
    expect(session.state.activeEffects.filter((effect) => effect.source === 'spider')).toHaveLength(
      4,
    );
    const timers = {
      goldLockTimer: session.state.goldLockTimer,
      healingReductionTimer: session.state.healingReductionTimer,
      disorientationTimer: session.state.disorientationTimer,
      poisonTimer: session.state.poisonTimer,
      poisonTickTimer: session.state.poisonTickTimer,
    };
    session.state.character.setModifiers('test:intellect-item', [
      { stat: 'intellect', kind: 'flat', value: 500 },
    ]);
    session.refreshStats();
    expect(session.state).toMatchObject(timers);
    expect(session.state.stats.spiderDebuffResistance).toBe(0.75);
    expect(session.state.stats.coinsPerSec).toBe(3.79);
    expect(session.state.stats.healingReceived).toBe(0.8975);
    expect(session.state.stats.blockChance).toBe(0.573);
    expect(session.state.stats['poison.tickDamage']).toBe(3.03);
    session.state.character.setModifiers('test:intellect-item', [
      { stat: 'intellect', kind: 'flat', value: 1000 },
    ]);
    session.refreshStats();
    expect(session.state.stats.spiderDebuffResistance).toBe(1);
    expect(session.state.activeEffects.filter((effect) => effect.source === 'spider')).toEqual([]);
    expect(session.state).toMatchObject({
      goldLockTimer: 0,
      healingReductionTimer: 0,
      disorientationTimer: 0,
      poisonTimer: 0,
      poisonTickTimer: 0,
      poisonDamage: [],
      antiAfkStacks: 3,
      antiAfkRecoveryTimer: 9,
    });
    expect(session.state.stats).toMatchObject({
      coinsPerSec: 4.5,
      healingReceived: 1,
      blockChance: 0.6,
      dodgeChance: 0.195,
      'poison.tickDamage': 0,
    });
    session.state.character.removeModifiers('test:intellect-item');
    session.refreshStats();
    expect(session.state.stats.spiderDebuffResistance).toBe(0.5);
    expect(session.state.activeEffects.filter((effect) => effect.source === 'spider')).toEqual([]);
    breach(session, 'fast');
    expect(session.state.healingReductionTimer).toBe(40);
  });

  it.each(DEBUFF_SPIDERS)(
    'prevents new %s debuffs at exactly 100%% resistance while still receiving breach damage',
    (type) => {
      const session = arena(60, 2000);
      const hp = session.state.hp;
      breach(session, type);
      expect(session.state.hp).toBeLessThan(hp);
      expect(session.state.activeEffects.filter((effect) => effect.source === 'spider')).toEqual(
        [],
      );
      expect(session.state).toMatchObject({
        goldLockTimer: 0,
        healingReductionTimer: 0,
        disorientationTimer: 0,
        poisonTimer: 0,
        poisonTickTimer: 0,
        poisonDamage: [],
      });
    },
  );

  it('restores immunity before saved spider debuffs can apply or poison can tick', () => {
    const session = arena();
    for (const type of DEBUFF_SPIDERS) breach(session, type);
    const saved = snapshot(session);
    const parsed = parseSave({
      ...saved,
      character: { ...saved.character, intellect: saved.character.intellect + 1000 },
    })!;
    expect(parsed).not.toBeNull();
    const loaded = restore(parsed, () => 0.999999);
    expect(loaded.state.stats.spiderDebuffResistance).toBe(1);
    expect(loaded.state.activeEffects.filter((effect) => effect.source === 'spider')).toEqual([]);
    expect(loaded.state).toMatchObject({
      goldLockTimer: 0,
      healingReductionTimer: 0,
      disorientationTimer: 0,
      poisonTimer: 0,
      poisonTickTimer: 0,
      poisonDamage: [],
    });
    const hp = loaded.state.hp;
    loaded.tick(2);
    expect(loaded.state.hp).toBe(hp);
  });

  it('retains weakened debuffs immediately below the immunity threshold', () => {
    const session = arena(60, 1999);
    breach(session, 'fast');
    expect(session.state.stats.spiderDebuffResistance).toBe(0.9995);
    expect(session.state.healingReductionTimer).toBe(40);
    expect(session.state.stats.healingReceived).toBe(0.999795);
    expect(session.state.activeEffects.filter((effect) => effect.source === 'spider')).toHaveLength(
      1,
    );
  });

  it('formats fractional debuff percentages without floating point tails in every tooltip', () => {
    const session = arena(60, 299);
    for (const type of DEBUFF_SPIDERS) breach(session, type);
    expect(session.state.stats.spiderDebuffResistance).toBe(0.1495);
    const descriptions = session.state.activeEffects
      .filter((effect) => effect.source === 'spider')
      .map(playerEffectDescription)
      .join('\n');
    const details = activeDebuffs(session.state)
      .map((effect) => effect.detail)
      .join('\n');
    for (const description of [descriptions, details]) {
      expect(description).toContain('Пассивный доход уменьшен на 53.5815%.');
      expect(description).toContain('Шанс блока уменьшен на 15.309%.');
      expect(description).toContain('Шанс уклонения от ловкости уменьшен на 5.103%.');
      expect(description).toContain('Броня уменьшена на 22.5383%.');
      expect(description).not.toMatch(/\d+\.\d{5,}%/);
    }
    expect(coinsDescription(session.state)).toContain('Пассивный доход уменьшен на 53.5815%:');
    expect(coinsDescription(session.state)).not.toMatch(/\d+\.\d{5,}%/);
  });
});
