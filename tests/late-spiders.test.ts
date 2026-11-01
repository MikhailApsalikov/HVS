import { describe, expect, it } from 'vitest';
import { GameSession } from '../src/domain/GameSession.js';
import { parseSave, restore, snapshot } from '../src/domain/save.js';
import type { TalentId } from '../src/domain/types.js';
import { activeDebuffs, playerEffectDescription } from '../src/ui/presenters.js';
import { addSpider } from './helpers.js';

function arena(level = 55, talents: { id: TalentId; rank: number }[] = []) {
  let roll = 0.999999;
  const session = new GameSession('normal', () => roll, { level });
  session.talents.loadFromSave(talents);
  session.state.character.setModifiers('arena', [
    { stat: 'spawnProbability', kind: 'percent', value: -100 },
    { stat: 'armor', kind: 'percent', value: -100 },
    { stat: 'dodgeChance', kind: 'percent', value: -100 },
    { stat: 'hpRegen', kind: 'percent', value: -100 },
    { stat: 'coinsPerSec', kind: 'percent', value: -100 },
    { stat: 'maxHp', kind: 'flat', value: 100000 },
    { stat: 'maxEnergy', kind: 'flat', value: 10000 },
    { stat: 'energyPerKill', kind: 'flat', value: 10 },
    { stat: 'energyPerBreach', kind: 'flat', value: 8 },
  ]);
  session.refreshStats();
  session.state.phase = 'playing';
  session.state.initialTalentPick = false;
  session.state.pendingTalentPoints = 0;
  session.state.levelTimer = session.state.levelTimerMax = 10000;
  session.state.energy = 200;
  return {
    session,
    setRoll: (value: number) => {
      roll = value;
    },
  };
}
function breach(session: GameSession, type: 'diseased' | 'cursing', damage = 100) {
  addSpider(session, type, 0, 1, damage);
  session.tick(0.001);
}

describe('late spider debuffs through session commands', () => {
  it.each(['diseased', 'cursing'] as const)(
    '%s survives one normal arrow without changing species and rewards only the killing arrow',
    (type) => {
      const { session } = arena();
      session.state.character.setModifiers('instantShots', [
        { stat: 'shootCooldown', kind: 'percent', value: -100 },
      ]);
      session.refreshStats();
      const spider = addSpider(session, type, 0, 0.95, 100);
      const coins = session.state.coins;
      expect(spider.hits).toBe(2);
      expect(session.shootLane(0)).toBe('shot');
      session.tick(0.001);
      expect(spider).toMatchObject({ type, hits: 1, dying: false, damage: 100 });
      expect(session.state.coins).toBe(coins);
      expect(session.drainEvents().filter(({ type }) => type === 'coinDrop')).toEqual([]);
      const loaded = restore(parseSave(snapshot(session))!, () => 0.999999);
      expect(loaded.state.spiders.get(spider.id)).toMatchObject({ type, hits: 1 });
      expect(loaded.shootLane(0)).toBe('shot');
      loaded.tick(0.001);
      expect(loaded.state.spiders.get(spider.id)).toMatchObject({ type, hits: 0, dying: true });
      loaded.tick(0.3);
      expect(loaded.state.spiders.has(spider.id)).toBe(false);
      expect(loaded.drainEvents().filter(({ type }) => type === 'coinDrop')).toHaveLength(1);
    },
  );

  it.each(['diseased', 'cursing'] as const)(
    '%s dies to one critical arrow of power two',
    (type) => {
      const { session } = arena(55, [{ id: 'criticalShot', rank: 1 }]);
      session.state.character.setModifiers('guaranteedCritical', [
        { stat: 'criticalShotChance', kind: 'flat', value: 1 },
      ]);
      session.refreshStats();
      const spider = addSpider(session, type, 0, 0.95);
      expect(session.shootLane(0)).toBe('shot');
      expect([...session.state.arrows.values()][0].power).toBe(2);
      session.tick(0.001);
      expect(spider).toMatchObject({ type, hits: 0, dying: true });
    },
  );

  it.each([55, 56, 75, 119])(
    'applies both timers at current level %i and refreshes without stacking',
    (level) => {
      const { session } = arena(level);
      breach(session, 'diseased');
      breach(session, 'cursing');
      expect(session.state.diseaseTimer).toBeCloseTo(20 * (level - 54) - 0.001);
      expect(session.state.curseTimer).toBe(20 * (level - 54));
      const stats = session.state.stats;
      session.tick(3);
      breach(session, 'diseased');
      expect(session.state.diseaseTimer).toBe(20 * (level - 54));
      expect(session.state.stats).toEqual(stats);
      expect(activeDebuffs(session.state).map(({ name }) => name)).toEqual([
        'Болезнь',
        'Проклятие',
      ]);
    },
  );

  it('reduces regeneration and both energy rewards, then restores them at expiry', () => {
    const { session } = arena();
    const base = session.state.stats;
    breach(session, 'diseased');
    expect(session.state.stats.energyRegen).toBeCloseTo(base.energyRegen - 2);
    expect(session.state.stats.energyPerKill).toBe(base.energyPerKill - 2);
    expect(session.state.stats.energyPerBreach).toBe(base.energyPerBreach - 2);
    session.state.energy = 0;
    session.tick(1);
    expect(session.state.energy).toBeCloseTo(base.energyRegen - 2);
    session.state.energy = 0;
    addSpider(session).startDying();
    session.tick(0.3);
    expect(session.state.energy).toBeCloseTo(base.energyPerKill - 2 + (base.energyRegen - 2) * 0.3);
    const remaining = session.state.diseaseTimer;
    const before = session.state.energy;
    session.tick(remaining);
    expect(session.state.energy - before).toBeCloseTo((base.energyRegen - 2) * remaining);
    expect(session.state.diseaseTimer).toBe(0);
    expect(session.state.stats).toEqual(base);
  });

  it('keeps energy rewards and regeneration at zero rather than making them negative', () => {
    const { session } = arena();
    session.state.character.setModifiers('zeroEnergy', [
      ...(['energyPerKill', 'energyPerBreach', 'energyRegen'] as const).map((stat) => ({
        stat,
        kind: 'percent' as const,
        value: -100,
      })),
    ]);
    session.refreshStats();
    breach(session, 'diseased');
    session.state.energy = 10;
    addSpider(session).startDying();
    session.tick(1);
    expect(session.state.energy).toBe(10);
    expect(session.state.stats.energyPerKill).toBe(0);
    expect(session.state.stats.energyPerBreach).toBe(0);
  });

  it.each(['diseased', 'cursing'] as const)(
    'applies %s through absorption but not avoidance or a full block',
    (type) => {
      for (const protection of ['shield', 'block', 'dodge', 'invulnerable', 'zero'] as const) {
        const { session, setRoll } = arena(55, [{ id: 'lightningShield', rank: 1 }]);
        if (protection === 'shield') {
          session.state.energy = 1000;
          expect(session.activateAbility('lightningShield')).toBe('activated');
        }
        if (protection === 'invulnerable') session.state.invulnerableTimer = 1;
        if (protection === 'block')
          session.state.character.setModifiers('block', [
            { stat: 'blockChance', kind: 'flat', value: 1 },
            { stat: 'blockPower', kind: 'flat', value: 1000 },
          ]);
        if (protection === 'dodge') {
          session.state.character.setModifiers('dodge', [
            { stat: 'dodgeChance', kind: 'flat', value: 1 },
          ]);
          session.state.character.removeModifiers('arena');
          session.state.character.setModifiers('quiet', [
            { stat: 'spawnProbability', kind: 'percent', value: -100 },
          ]);
          setRoll(0);
        }
        session.refreshStats();
        const hp = session.state.hp;
        breach(session, type, protection === 'zero' ? 0 : 100);
        expect(session.state.hp).toBeCloseTo(hp);
        expect(activeDebuffs(session.state)).toHaveLength(protection === 'shield' ? 1 : 0);
      }
    },
  );

  it.each(['stand', 'eagleEye'] as const)(
    '%s cleanses both new debuffs and their modifiers',
    (ability) => {
      const { session } = arena(55, [
        { id: ability === 'stand' ? 'divineShield' : 'eagleEye', rank: 1 },
      ]);
      const stats = session.state.stats;
      breach(session, 'diseased');
      breach(session, 'cursing');
      expect(session.activateAbility(ability)).toBe('activated');
      expect(activeDebuffs(session.state)).toEqual([]);
      expect(session.state.stats).toEqual(stats);
    },
  );

  it('pauses both timers during time freeze and talent selection', () => {
    const { session } = arena();
    breach(session, 'diseased');
    breach(session, 'cursing');
    const timers = [session.state.diseaseTimer, session.state.curseTimer];
    expect(session.activateAbility('freeze')).toBe('activated');
    session.tick(100);
    expect([session.state.diseaseTimer, session.state.curseTimer]).toEqual(timers);
    session.activateAbility('freeze');
    session.state.phase = 'levelUp';
    session.tick(100);
    expect([session.state.diseaseTimer, session.state.curseTimer]).toEqual(timers);
  });

  it('applies resistance to potency and poison resistance to duration, including complete immunity', () => {
    const { session } = arena(55, [
      { id: 'magicArmor', rank: 1 },
      { id: 'poisonResistance', rank: 5 },
    ]);
    const base = session.state.stats;
    const resistance = base.spiderDebuffResistance;
    breach(session, 'diseased');
    breach(session, 'cursing');
    expect(session.state.diseaseTimer).toBeCloseTo(11.999);
    expect(session.state.curseTimer).toBe(12);
    expect(session.state.stats.curseFailureChance).toBeCloseTo(0.16 * (1 - resistance), 6);
    expect(session.state.stats.energyRegen).toBeCloseTo(
      Math.round((base.energyRegen - 2 * (1 - resistance)) * 100) / 100,
    );
    session.state.character.setBase('intellect', 10000);
    session.refreshStats();
    expect(activeDebuffs(session.state)).toEqual([]);
    breach(session, 'diseased');
    breach(session, 'cursing');
    expect(activeDebuffs(session.state)).toEqual([]);
  });

  it('disables Titan Armor on the next hit and restores it when the debuffs expire', () => {
    const { session } = arena(55, [{ id: 'titanArmor', rank: 10 }]);
    expect(session.state.rules.value('incomingDamage', 100)).toBe(70);
    breach(session, 'diseased');
    expect(session.state.rules.value('incomingDamage', 100)).toBe(100);
    session.tick(20);
    expect(session.state.rules.value('incomingDamage', 100)).toBe(70);
  });
});

describe('curse arrow attempts', () => {
  it.each([
    [0.159999, 0],
    [0.16, 1],
  ] as const)(
    'roll %s emits %i arrows while always spending energy and starting cooldown',
    (roll, arrows) => {
      const { session, setRoll } = arena();
      breach(session, 'cursing');
      setRoll(roll);
      const energy = session.state.energy;
      expect(session.shootLane(1)).toBe('shot');
      expect(session.state.arrows.size).toBe(arrows);
      expect(session.state.energy).toBe(energy - session.state.currentShootCost);
      expect(session.state.archers[1].remainingCooldown).toBe(session.state.stats.shootCooldown);
      expect(session.shootLane(1)).toBe('blocked');
    },
  );

  it('rolls separately for every volley arrow, preserving ability energy and cooldown', () => {
    let rolls: number[] = [];
    const session = new GameSession('normal', () => rolls.shift() ?? 0.999999, { level: 55 });
    session.state.phase = 'playing';
    session.state.curseTimer = 20;
    session.refreshStats();
    const count = session.state.stats['volley.lanes'];
    rolls = [...Array<number>(count).fill(0.5), 0.159999, 0.16, ...Array<number>(count).fill(0)];
    const energy = session.state.energy;
    expect(session.activateAbility('volley')).toBe('activated');
    expect(session.state.arrows.size).toBe(1);
    expect(session.state.energy).toBe(energy - session.state.stats['volley.cost']);
    expect(session.state.getAbility('volley').remainingCooldown).toBe(
      session.state.stats['volley.cooldown'],
    );
  });

  it('can suppress all arrows of aimed fire, including the guaranteed critical first wave', () => {
    const { session, setRoll } = arena(60, [{ id: 'aimedFire', rank: 1 }]);
    breach(session, 'cursing');
    setRoll(0);
    const energy = session.state.energy;
    expect(session.activateAbility('aimedFire')).toBe('activated');
    session.tick(1);
    expect(session.state.arrows.size).toBe(0);
    expect(session.state.aimedFireWaves.length).toBe(session.state.stats['aimedFire.waves'] - 1);
    expect(session.state.energy).toBeCloseTo(
      energy - session.state.stats['aimedFire.cost'] + session.state.stats.energyRegen,
    );
  });

  it('suppresses the free retaliatory volley and keeps electric charges on a failed arrow', () => {
    const { session, setRoll } = arena(55, [
      { id: 'bestDefense', rank: 10 },
      { id: 'lightningArrows', rank: 1 },
    ]);
    breach(session, 'cursing');
    session.state.energy = 1000;
    expect(session.activateAbility('lightningArrows')).toBe('activated');
    const charges = [...session.state.lightningCharges];
    setRoll(0);
    expect(session.shootLane(0)).toBe('shot');
    expect(session.state.lightningCharges).toEqual(charges);
    breach(session, 'diseased');
    expect(session.state.bestDefenseCooldown).toBe(3);
    expect(session.state.arrows.size).toBe(0);
    expect(session.state.lightningCharges).toEqual(charges);
  });
});

describe('late spider saves and descriptions', () => {
  it('round-trips both spiders and active timers without changing their effects', () => {
    const { session } = arena();
    breach(session, 'diseased');
    breach(session, 'cursing');
    addSpider(session, 'diseased');
    addSpider(session, 'cursing', 1);
    session.tick(2);
    const saved = snapshot(session);
    const loaded = restore(parseSave(JSON.parse(JSON.stringify(saved)))!, () => 0.999999);
    expect(snapshot(loaded)).toEqual(saved);
    expect(loaded.state.stats).toEqual(session.state.stats);
    loaded.tick(loaded.state.curseTimer);
    expect(activeDebuffs(loaded.state)).toEqual([]);
    expect(loaded.state.stats.curseFailureChance).toBe(0);
  });

  it('migrates version 29 with inactive new effects and preserves existing progress', () => {
    const { session } = arena(55, [{ id: 'rationality', rank: 2 }]);
    session.shootLane(0);
    const saved = snapshot(session);
    const { diseaseTimer, curseTimer, ...state } = saved.state;
    void [diseaseTimer, curseTimer];
    const previous = { ...saved, version: 29, state };
    const parsed = parseSave(previous)!;
    expect(parsed.version).toBe(30);
    expect(snapshot(restore(parsed))).toEqual(saved);
    expect(snapshot(restore(parseSave(parsed)!))).toEqual(saved);
  });

  it.each([
    { diseaseTimer: undefined },
    { diseaseTimer: -1 },
    { diseaseTimer: 20.01 },
    { curseTimer: NaN },
    { curseTimer: -1 },
    { curseTimer: 20.01 },
    { level: 54, curseTimer: 1 },
    { level: 54, diseaseTimer: 1 },
  ])('rejects invalid save fields %j', (invalid) => {
    const saved = snapshot(arena().session);
    expect(parseSave({ ...saved, state: { ...saved.state, ...invalid } })).toBeNull();
  });

  it('describes actual penalties and the per-arrow failure chance', () => {
    const { session } = arena();
    breach(session, 'diseased');
    breach(session, 'cursing');
    const [disease, curse] = session.state.activeEffects.filter(
      ({ source }) => source === 'spider',
    );
    expect(playerEffectDescription(disease)).toContain('уменьшены на 2');
    expect(playerEffectDescription(curse)).toContain('16%');
    expect(playerEffectDescription(curse)).toContain('включая стрелы способностей');
  });
});
