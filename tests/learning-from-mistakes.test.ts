import { describe, expect, it } from 'vitest';
import { GameSession } from '../src/domain/GameSession.js';
import { parseSave, restore, snapshot } from '../src/domain/save.js';
import { TALENTS } from '../src/content/talents.js';
import {
  playerEffectDescription,
  talentDescription,
  abilityDescription,
} from '../src/ui/presenters.js';
import type { SpiderType, TalentId } from '../src/domain/types.js';
import { addSpider } from './helpers.js';

function arena(rank = 5, extra: { id: TalentId; rank: number }[] = []) {
  const session = new GameSession('normal', () => 0.999999, { level: 55 });
  session.talents.loadFromSave([{ id: 'learningFromMistakes', rank }, ...extra]);
  session.state.character.setModifiers('arena', [
    { stat: 'armor', kind: 'percent', value: -100 },
    { stat: 'hpRegen', kind: 'percent', value: -100 },
    { stat: 'energyRegen', kind: 'percent', value: -100 },
    { stat: 'dodgeChance', kind: 'percent', value: -100 },
    { stat: 'blockChance', kind: 'percent', value: -100 },
  ]);
  session.refreshStats();
  session.state.phase = 'playing';
  session.state.initialTalentPick = false;
  session.state.pendingTalentPoints = 0;
  session.state.levelTimer = session.state.levelTimerMax = 10000;
  session.state.energy = 0;
  return session;
}
function breach(session: GameSession, type: SpiderType = 'normal', damage = 10) {
  addSpider(session, type, 0, 1, damage);
  session.tick(0.001);
}
function spiderDebuffs(session: GameSession) {
  return session.state.activeEffects.filter((effect) => effect.source === 'spider');
}

describe('learning from mistakes through session commands', () => {
  it.each(['easy', 'normal', 'hard'] as const)(
    'opens five ranks at shooting tier six on %s',
    (difficulty) => {
      const session = new GameSession(difficulty, () => 0.999999, { level: 49 });
      expect(session.talents.getTalent('learningFromMistakes')).toMatchObject({
        maxRanks: 5,
        tier: 6,
        branch: 'shooting',
        unlocksAtLevel: 50,
        requiredBranchPoints: 35,
      });
      expect(TALENTS.learningFromMistakes.name).toBe('Обучение на ошибках');
      expect(TALENTS.learningFromMistakes.column).toBe(1);
      expect(session.upgradeTalent('learningFromMistakes')).toBe(false);
      session.state.level = 50;
      expect(session.upgradeTalent('learningFromMistakes')).toBe(false);
      session.talents.loadFromSave([
        { id: 'hunterMastery', rank: 5 },
        { id: 'improvedAgility', rank: 10 },
        { id: 'piercingReward', rank: 8 },
        { id: 'criticalShot', rank: 7 },
        { id: 'vampirism', rank: 5 },
        { id: 'volleyMastery', rank: 5 },
      ]);
      for (let rank = 1; rank <= 5; rank++)
        expect(session.upgradeTalent('learningFromMistakes')).toBe(true);
      expect(session.upgradeTalent('learningFromMistakes')).toBe(false);
    },
  );

  it.each([1, 2, 3, 4, 5])(
    'rank %i grants an exact fixed short shield and cleanses the triggering hit',
    (rank) => {
      const session = arena(rank);
      session.state.character.setModifiers('shieldBonuses', [
        { stat: 'stand.duration', kind: 'flat', value: 100 },
      ]);
      session.refreshStats();
      const hp = session.state.hp;
      breach(session, 'poisonous');
      expect(session.state.hp).toBe(hp - 10);
      expect(spiderDebuffs(session)).toEqual([]);
      expect(session.state.learningShieldTimer).toBeCloseTo(0.15 * rank);
      expect(session.state.learningShieldCooldown).toBe(4);
      expect(session.state.isInvulnerable).toBe(true);
      expect(talentDescription('learningFromMistakes', rank, session.state.stats)).toContain(
        `${Number((0.15 * rank).toFixed(2))} с`,
      );
      session.tick(0.15 * rank);
      expect(session.state.learningShieldTimer).toBe(0);
      expect(session.state.isInvulnerable).toBe(false);
    },
  );

  it('absorbs simultaneous breaches and enforces the four-second cooldown without refreshing it', () => {
    const session = arena(1, [{ id: 'recharge', rank: 1 }]);
    addSpider(session, 'normal', 0, 1, 10);
    addSpider(session, 'poisonous', 1, 1, 100000);
    const hp = session.state.hp;
    session.tick(0.001);
    expect(session.state.hp).toBe(hp - 10);
    session.tick(0.15);
    breach(session, 'golden');
    expect(session.state.hp).toBe(hp - 20);
    expect(session.state.learningShieldTimer).toBe(0);
    expect(spiderDebuffs(session).map((effect) => effect.id)).toEqual(['goldLock']);
    session.state.energy = session.state.maxEnergy;
    const cooldown = session.state.learningShieldCooldown;
    expect(session.activateAbility('recharge')).toBe('activated');
    expect(session.state.learningShieldCooldown).toBe(cooldown);
    session.tick(cooldown);
    breach(session, 'fast');
    expect(session.state.learningShieldTimer).toBe(0.15);
    expect(spiderDebuffs(session)).toEqual([]);
  });

  it.each(['normal', 'poisonous', 'cleanser', 'ninja'] as const)(
    'prevents a fatal %s breach independently of the short shield cooldown',
    (type) => {
      const session = arena(1);
      breach(session);
      session.tick(0.15);
      expect(session.state.learningShieldCooldown).toBeGreaterThan(0);
      session.state.hp = 10;
      const agility = session.state.stats.agility;
      breach(session, type, 10000);
      expect(session.state.hp).toBe(1);
      expect(session.state.phase).toBe('playing');
      expect(session.state.fatalShieldTimer).toBe(5);
      expect(session.state.exhaustionTimer).toBe(300);
      expect(session.state.stats.agility).toBe(Math.round(agility * 0.85));
      expect(spiderDebuffs(session)).toEqual([]);
      const exhaustion = session.state.activeEffects.find((effect) => effect.id === 'exhaustion')!;
      expect(playerEffectDescription(exhaustion)).toContain(
        'Нельзя получить эффекты неуязвимости. Ловкость снижена на 15%',
      );
      breach(session, 'tank', 100000);
      expect(session.state.hp).toBe(1);
    },
  );

  it.each([0.5, 1])(
    'saves a player at %s health and blocks every shield during exhaustion after its initial five seconds',
    (health) => {
      const session = arena(5, [
        { id: 'divineShield', rank: 1 },
        { id: 'eagleEye', rank: 1 },
      ]);
      session.state.hp = health;
      breach(session, 'poisonous', 100000);
      expect(session.state.hp).toBe(1);
      expect(session.state.fatalShieldTimer).toBe(5);
      session.tick(5);
      expect(session.state.isInvulnerable).toBe(false);
      const exhaustion = session.state.exhaustionTimer;
      session.state.energy = session.state.maxEnergy;
      const energy = session.state.energy;
      expect(session.activateAbility('stand')).toBe('level_locked');
      expect(session.state.energy).toBe(energy);
      expect(session.state.getAbility('stand').isReady).toBe(true);
      expect(abilityDescription(session.state, 'stand')).toContain('Истощения');
      expect(session.activateAbility('eagleEye')).toBe('activated');
      expect(session.state.exhaustionTimer).toBe(exhaustion);
      session.state.hp = 100;
      breach(session, 'poisonous', 10);
      expect(session.state.learningShieldTimer).toBe(0);
      expect(spiderDebuffs(session).map((effect) => effect.id)).toEqual(['poison']);
      breach(session, 'normal', 100000);
      expect(session.state.phase).toBe('gameOver');
    },
  );

  it('expires exhaustion at exactly five minutes, freezes it during pause, and restores the talent', () => {
    const session = arena();
    const agility = session.state.stats.agility;
    session.state.hp = 10;
    breach(session, 'normal', 100000);
    session.state.phase = 'paused';
    session.tick(1000);
    expect(session.state.exhaustionTimer).toBe(300);
    session.state.phase = 'levelUp';
    session.tick(1000);
    expect(session.state.exhaustionTimer).toBe(300);
    session.state.phase = 'playing';
    session.tick(299.999);
    expect(session.state.exhaustionTimer).toBeCloseTo(0.001);
    session.tick(0.001);
    expect(session.state.exhaustionTimer).toBe(0);
    expect(session.state.stats.agility).toBe(agility);
    breach(session, 'normal', 100000);
    expect(session.state.hp).toBe(1);
    expect(session.state.fatalShieldTimer).toBe(5);
    expect(session.state.exhaustionTimer).toBe(300);
  });

  it('requires actual breach health loss and ignores poison damage and shielded attacks', () => {
    const session = arena();
    breach(session, 'golden', 0);
    expect(session.state.learningShieldTimer).toBe(0);
    session.state.poisonTimer = 10;
    session.state.poisonTickTimer = 2;
    session.state.poisonDamage = [100];
    session.refreshStats();
    const hp = session.state.hp;
    session.tick(2);
    expect(session.state.hp).toBeLessThan(hp);
    expect(session.state.learningShieldTimer).toBe(0);
    session.state.invulnerableTimer = 1;
    breach(session, 'normal', 100000);
    expect(session.state.fatalShieldTimer).toBe(0);
    expect(session.state.learningShieldTimer).toBe(0);
    const unlearned = arena(0);
    breach(unlearned);
    expect(unlearned.state.learningShieldTimer).toBe(0);
    breach(unlearned, 'normal', 100000);
    expect(unlearned.state.phase).toBe('gameOver');
  });
});

describe('learning from mistakes saves', () => {
  it.each([false, true])('round-trips active shields and exhaustion (fatal=%s)', (fatal) => {
    const session = arena();
    if (fatal) session.state.hp = 10;
    breach(session, 'normal', fatal ? 100000 : 10);
    session.tick(0.1);
    const saved = snapshot(session);
    const loaded = restore(parseSave(saved)!, () => 0.999999);
    expect(snapshot(loaded)).toEqual(saved);
    expect(loaded.state.stats.agility).toBe(session.state.stats.agility);
    loaded.tick(fatal ? 4.9 : 0.65);
    expect(loaded.state.isInvulnerable).toBe(false);
  });

  it('migrates version 22 without granting a talent, shield, cooldown or exhaustion', () => {
    const session = arena(0);
    const saved = snapshot(session);
    const {
      learningShieldTimer: _short,
      fatalShieldTimer: _fatal,
      learningShieldCooldown: _cooldown,
      exhaustionTimer: _exhaustion,
      disorientationTimer: _ninja,
      ...state
    } = saved.state;
    const previous = {
      ...saved,
      version: 22,
      state,
      talents: saved.talents.filter(({ id }) => id !== 'learningFromMistakes'),
    };
    const parsed = parseSave(previous)!;
    const loaded = restore(parsed);
    expect(loaded.talents.getRank('learningFromMistakes')).toBe(0);
    expect(loaded.state.learningShieldTimer).toBe(0);
    expect(loaded.state.fatalShieldTimer).toBe(0);
    expect(loaded.state.learningShieldCooldown).toBe(0);
    expect(loaded.state.exhaustionTimer).toBe(0);
    expect(snapshot(restore(parseSave(snapshot(loaded))!))).toEqual(snapshot(loaded));
  });

  it.each([
    { learningShieldTimer: -1 },
    { learningShieldTimer: 0.76 },
    { fatalShieldTimer: 5.1 },
    { learningShieldCooldown: 4.1 },
    { exhaustionTimer: 300.1 },
    { fatalShieldTimer: 5, exhaustionTimer: 0 },
    { learningShieldTimer: 0.1, exhaustionTimer: 10 },
    { invulnerableTimer: 1, exhaustionTimer: 10 },
  ])('rejects invalid saved protection %j', (invalid) => {
    const saved = snapshot(arena());
    expect(parseSave({ ...saved, state: { ...saved.state, ...invalid } })).toBeNull();
  });
});

describe('titan armor conditional damage reduction through session commands', () => {
  it.each([1, 5, 10])('rank %i reduces damage while no spider debuffs are active', (rank) => {
    const session = arena(0, [
      { id: 'titanArmor', rank },
      { id: 'spiderArmor', rank: 2 },
    ]);
    const hp = session.state.hp;
    breach(session, 'normal', 1000);
    expect(hp - session.state.hp).toBe(Math.round(1000 * 0.9 * (1 - 0.02 * rank)));
    expect(talentDescription('titanArmor', rank, session.state.stats)).toContain(`на ${2 * rank}%`);
  });

  it.each(['golden', 'fast', 'poisonous', 'ninja'] as const)(
    'a %s debuff disables protection for the next simultaneous hit',
    (type) => {
      const session = arena(0, [{ id: 'titanArmor', rank: 10 }]);
      const hp = session.state.hp;
      addSpider(session, type, 0, 1, 100);
      addSpider(session, 'normal', 1, 1, 100);
      session.tick(0.001);
      expect(spiderDebuffs(session)).toHaveLength(1);
      expect(session.state.hp).toBe(hp - 80 - 100);
      expect(session.state.rules.value('incomingDamage', 100)).toBe(100);
    },
  );

  it('restores protection after expiry and after cleansing', () => {
    const session = arena(0, [
      { id: 'titanArmor', rank: 10 },
      { id: 'eagleEye', rank: 1 },
    ]);
    breach(session, 'ninja');
    expect(session.state.rules.value('incomingDamage', 100)).toBe(100);
    session.tick(session.state.disorientationTimer);
    expect(session.state.rules.value('incomingDamage', 100)).toBe(80);
    breach(session, 'golden');
    session.state.energy = session.state.maxEnergy;
    expect(session.activateAbility('eagleEye')).toBe('activated');
    expect(session.state.rules.value('incomingDamage', 100)).toBe(80);
  });

  it('keeps protection during exhaustion because exhaustion does not come from a spider', () => {
    const session = arena(5, [{ id: 'titanArmor', rank: 10 }]);
    session.state.hp = 10;
    breach(session, 'poisonous', 100000);
    expect(session.state.exhaustionTimer).toBe(300);
    expect(session.state.rules.value('incomingDamage', 100)).toBe(80);
    expect(spiderDebuffs(session)).toEqual([]);
  });
});
