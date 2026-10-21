import { describe, expect, it } from 'vitest';
import { GameSession } from '../src/domain/GameSession.js';
import { ABILITY_ORDER } from '../src/content/abilities.js';
import { TALENTS } from '../src/content/talents.js';
import { parseSave, restore, snapshot } from '../src/domain/save.js';
import type { TalentId } from '../src/domain/types.js';
import {
  abilityDescription,
  attributeDescription,
  talentDescription,
} from '../src/ui/presenters.js';
import { addSpider, MemoryStorage } from './helpers.js';
import { SAVE_KEY, SaveSystem } from '../src/infrastructure/storage/SaveSystem.js';

function arena(talents: readonly { id: TalentId; rank: number }[] = [], level = 60) {
  const session = new GameSession('normal', () => 0.999999, { level, coins: 1000000 });
  session.talents.loadFromSave(talents);
  session.state.character.setModifiers('test:arena', [
    { stat: 'spawnProbability', kind: 'percent', value: -100 },
    { stat: 'hpRegen', kind: 'percent', value: -100 },
    { stat: 'energyRegen', kind: 'percent', value: -100 },
    { stat: 'armor', kind: 'percent', value: -100 },
    { stat: 'maxEnergy', kind: 'flat', value: 10000 },
  ]);
  session.refreshStats();
  session.state.initialTalentPick = false;
  session.state.phase = 'playing';
  session.state.levelTimer = session.state.levelTimerMax = 10000;
  session.state.energy = session.state.maxEnergy;
  return session;
}

describe('magic costs and item effectiveness through the session API', () => {
  it('discounts the shield response only when it actually attacks a spider', () => {
    const session = arena([
      { id: 'economy', rank: 5 },
      { id: 'lightningShield', rank: 1 },
      { id: 'lightningArrows', rank: 1 },
    ]);
    session.state.character.setModifiers('test:reward', [
      { stat: 'energyPerBreach', kind: 'percent', value: -100 },
    ]);
    session.refreshStats();
    session.activateAbility('lightningShield');
    session.state.energy = 200;
    addSpider(session, 'normal', 4, 1, 10);
    session.tick(0.001);
    expect(session.state.energy).toBe(200);
    const target = addSpider(session, 'normal', 5, 0.1);
    addSpider(session, 'normal', 4, 1, 10);
    session.tick(0.001);
    expect(target.dying).toBe(true);
    expect(session.state.energy).toBe(183);
    expect(abilityDescription(session.state, 'lightningShield')).toContain('17 энергии');
  });
  it.each([1, 2, 3, 4, 5])('applies one Economy discount to every cost at rank %s', (rank) => {
    const plain = arena();
    const session = arena([
      { id: 'economy', rank },
      { id: 'lightningArrows', rank: 1 },
    ]);
    for (const id of ABILITY_ORDER)
      expect(session.state.stats[`${id}.cost`]).toBe(
        Math.round(plain.state.stats[`${id}.cost`] * (1 - 0.03 * rank)),
      );
    expect(session.state.stats.shootCost).toBe(Math.round(35 * (1 - 0.03 * rank)));
    expect(session.state.stats['lightningShield.procCost']).toBe(
      Math.round(20 * (1 - 0.03 * rank)),
    );
    const energy = session.state.energy;
    expect(session.activateAbility('lightningArrows')).toBe('activated');
    expect(session.shootLane(0)).toBe('shot');
    expect(session.state.energy).toBe(
      energy - session.state.stats['lightningArrows.cost'] - session.state.stats.shootCost,
    );
    expect(talentDescription('economy', rank, session.state.stats)).toContain(`${3 * rank}%`);
  });

  it.each([0, 1, 2, 3, 4, 5])(
    'adds lightning and blizzard surcharges before Economy at rank %s',
    (rank) => {
      const session = arena([
        { id: 'lightningArrows', rank: 1 },
        { id: 'improvedLightning', rank },
        { id: 'blizzardMastery', rank },
        { id: 'economy', rank: 5 },
      ]);
      expect(session.state.stats['lightningArrows.cost']).toBe(
        Math.round(70 * (1 + 0.4 * rank) * 0.85),
      );
      expect(session.state.stats['blizzard.cost']).toBe(Math.round((40 + 6 * rank) * 0.85));
      const energy = session.state.energy;
      expect(session.activateAbility('blizzard')).toBe('activated');
      expect(session.state.energy).toBe(energy - session.state.stats['blizzard.cost']);
      if (rank > 0) {
        expect(talentDescription('improvedLightning', rank, session.state.stats)).toContain(
          `${40 * rank}%`,
        );
        expect(talentDescription('blizzardMastery', rank, session.state.stats)).toContain(
          `${6 * rank} энергии`,
        );
      }
    },
  );

  it('requires one Arsenal rank and tier two for Rationality, then caps it at five ranks', () => {
    const session = new GameSession('normal', () => 0.999999, { level: 9 });
    session.talents.loadFromSave([{ id: 'agility', rank: 7 }]);
    session.refreshStats();
    expect(session.upgradeTalent('rationality')).toBe(false);
    session.state.level = 10;
    expect(session.upgradeTalent('rationality')).toBe(false);
    expect(session.upgradeTalent('hunterArsenal')).toBe(true);
    expect(session.talents.getTalent('rationality')).toMatchObject({
      branch: 'magic',
      tier: 2,
      maxRanks: 5,
    });
    for (let rank = 1; rank <= 5; rank++) {
      expect(session.upgradeTalent('rationality')).toBe(true);
      expect(session.state.stats.itemEffectiveness).toBe(1 + rank * 0.05);
    }
    expect(session.upgradeTalent('rationality')).toBe(false);
    expect(TALENTS.rationality.prerequisite).toEqual({ id: 'hunterArsenal', rank: 1 });
    expect(talentDescription('rationality', 5, session.state.stats)).toContain('25%');
  });

  it('gates Economy and Permafrost behind tier six and 35 magic points', () => {
    const session = new GameSession('normal', () => 0.999999, { level: 49 });
    const invested = [
      { id: 'agility', rank: 10 },
      { id: 'hunterArsenal', rank: 5 },
      { id: 'improvedIntellect', rank: 5 },
      { id: 'tireless', rank: 7 },
      { id: 'improvedPrep', rank: 5 },
      { id: 'fireExplosion', rank: 2 },
    ] as const;
    session.talents.loadFromSave(invested);
    session.refreshStats();
    for (const id of ['economy', 'permafrost'] as const) {
      expect(session.talents.getTalent(id)).toMatchObject({ tier: 6, requiredBranchPoints: 35 });
      expect(session.upgradeTalent(id)).toBe(false);
    }
    session.state.level = 50;
    expect(session.upgradeTalent('economy')).toBe(false);
    expect(session.upgradeTalent('permafrost')).toBe(false);
    expect(session.upgradeTalent('fireExplosion')).toBe(true);
    expect(session.upgradeTalent('economy')).toBe(true);
    expect(session.upgradeTalent('permafrost')).toBe(true);
  });

  it.each([1, 2, 3, 4, 5])(
    'scales all items, their ability bonuses and primary contributions at Rationality rank %s',
    (rank) => {
      const session = arena([
        { id: 'hunterArsenal', rank: 5 },
        { id: 'rationality', rank },
        { id: 'fireExplosion', rank: 1 },
        { id: 'lightningShield', rank: 1 },
      ]);
      const baseIntellect = session.state.stats.intellect;
      session.state.phase = 'levelUp';
      for (const id of ['l001', 'l002', 'l028', 'l032']) expect(session.buyItem(id)).toBe(true);
      const factor = 1 + 0.05 * rank;
      expect(session.state.stats.intellect).toBe(
        baseIntellect + Math.round((830 * (100 + 5 * rank)) / 100),
      );
      expect(session.state.stats['armageddon.cooldown']).toBe(180 - 30 * factor);
      expect(session.state.stats['armageddon.duration']).toBe(3 + factor);
      expect(session.state.stats['fireExplosion.chance']).toBeCloseTo(0.35 + 0.35 * factor);
      expect(session.state.stats['lightningShield.cooldown']).toBe(300 - 30 * factor);
      expect(session.state.stats['lightningShield.absorption']).toBe(
        3500 + (session.state.stats.intellect - 300) * 10,
      );
      expect(snapshot(restore(parseSave(snapshot(session))!))).toEqual(snapshot(session));
      expect(session.sellItem(3)).toBe(true);
      expect(session.state.stats['lightningShield.cooldown']).toBe(300);
    },
  );
});

describe('intellect thresholds and Lightning Shield', () => {
  it.each([0, 1, 2, 3, 299, 300, 301, 500])(
    'resolves intellect %s before the ability is activated',
    (intellect) => {
      const session = arena([{ id: 'lightningShield', rank: 1 }]);
      session.state.character.setModifiers('test:intellect', [
        { stat: 'intellect', kind: 'flat', value: intellect - session.state.stats.intellect },
      ]);
      session.refreshStats();
      expect(session.state.stats['prep.restore']).toBe(250 + Math.floor(intellect / 3));
      session.state.energy = 0;
      expect(session.activateAbility('prep')).toBe('activated');
      expect(session.state.energy).toBe(100 + Math.floor(intellect / 3));
      expect(session.activateAbility('lightningShield')).toBe('activated');
      expect(session.state.lightningShieldAbsorption).toBe(
        3500 + Math.max(0, intellect - 300) * 10,
      );
      expect(session.state.lightningShieldTimer).toBe(300);
      expect(session.state.getAbility('lightningShield').duration).toBe(300);
      expect(abilityDescription(session.state, 'lightningShield')).not.toContain('интеллект');
      expect(attributeDescription(session.state, 'intellect')).toContain('сверх 300');
      session.tick(300);
      expect(session.state.lightningShieldTimer).toBe(0);
      expect(session.state.lightningShieldAbsorption).toBe(0);
      expect(session.state.getAbility('lightningShield').isReady).toBe(true);
    },
  );
});

describe('permanent Recharge growth and save migration', () => {
  it('starts 120, 180 and 240 second cooldowns before increasing the next use, retaining both across loading', () => {
    let session = arena([{ id: 'recharge', rank: 1 }]);
    expect(session.state.stats['recharge.cooldown']).toBe(120);
    session.state.energy = 0;
    expect(session.activateAbility('recharge')).toBe('not_enough_energy');
    expect(session.state.rechargeUses).toBe(0);
    session.state.energy = session.state.maxEnergy;
    for (let uses = 1; uses <= 3; uses++) {
      expect(session.activateAbility('recharge')).toBe('activated');
      expect(session.state.rechargeUses).toBe(uses);
      const currentCooldown = 120 + (uses - 1) * 60;
      expect(session.state.getAbility('recharge').duration).toBe(currentCooldown);
      expect(session.state.getAbility('recharge').remainingCooldown).toBe(currentCooldown);
      expect(session.state.stats['recharge.cooldown']).toBe(120 + uses * 60);
      expect(session.activateAbility('recharge')).toBe('on_cooldown');
      expect(session.state.rechargeUses).toBe(uses);
      const saved = snapshot(session);
      session = restore(parseSave(JSON.parse(JSON.stringify(saved)))!, () => 0.999999);
      expect(snapshot(session)).toEqual(saved);
      addSpider(session, 'cleanser', 0, 1, 0);
      session.tick(currentCooldown - 0.01);
      expect(session.activateAbility('recharge')).toBe('on_cooldown');
      session.tick(0.01);
      expect(session.state.getAbility('recharge').isReady).toBe(true);
      expect(session.state.rechargeUses).toBe(uses);
    }
    expect(arena().state.rechargeUses).toBe(0);
  });

  it('applies cooldown discounts to the growing base', () => {
    const session = arena([
      { id: 'recharge', rank: 1 },
      { id: 'quickInstinct', rank: 10 },
    ]);
    expect(session.activateAbility('recharge')).toBe('activated');
    expect(session.state.getAbility('recharge').duration).toBe(96);
    expect(session.state.stats['recharge.cooldown']).toBe(144);
    session.tick(96);
    expect(session.activateAbility('recharge')).toBe('activated');
    expect(session.state.getAbility('recharge').duration).toBe(144);
    expect(session.state.stats['recharge.cooldown']).toBe(192);
  });

  it('migrates version 28 with zero uses, retaining cooldowns, items and learned Permafrost', () => {
    const session = arena(
      [
        { id: 'permafrost', rank: 3 },
        { id: 'recharge', rank: 1 },
      ],
      20,
    );
    session.state.getAbility('recharge').start(240);
    const saved = snapshot(session);
    const { rechargeUses: _uses, ...oldState } = saved.state;
    const migrated = parseSave({ ...saved, version: 28, state: oldState })!;
    expect(migrated.version).toBe(29);
    const loaded = restore(migrated);
    expect(loaded.state.rechargeUses).toBe(0);
    expect(loaded.state.getAbility('recharge').remainingCooldown).toBe(240);
    expect(loaded.talents.getRank('permafrost')).toBe(3);
    expect(snapshot(restore(parseSave(snapshot(loaded))!))).toEqual(snapshot(loaded));
  });

  it.each([-1, 0.5, null, '1'])('rejects malformed Recharge counts: %s', (rechargeUses) => {
    const saved = snapshot(arena());
    expect(parseSave({ ...saved, state: { ...saved.state, rechargeUses } })).toBeNull();
  });
});

describe('victory and fatal hit attribution', () => {
  it('ends the game at level 120, blocks further commands and retains the winning record', () => {
    const session = arena([], 119);
    session.state.pendingTalentPoints = 0;
    session.state.levelTimer = 0.01;
    session.tick(0.01);
    expect(session.state.phase).toBe('levelUp');
    expect(session.upgradeTalent('hunterMastery')).toBe(true);
    expect(session.confirmLevelUp()).toBe(true);
    expect(session.state.level).toBe(120);
    expect(session.state.phase).toBe('gameOver');
    expect(session.state.isVictory).toBe(true);
    expect(session.state.record).toBe(120);
    const before = snapshot(session);
    session.tick(1000);
    expect(session.shootLane(0)).toBe('blocked');
    expect(session.activateAbility('heal')).toBe('level_locked');
    expect(session.confirmLevelUp()).toBe(false);
    expect(snapshot(session)).toEqual(before);
    const storage = new MemoryStorage();
    storage.setItem(SAVE_KEY, 'old save');
    const saves = new SaveSystem(storage);
    expect(saves.save(session)).toBe(true);
    expect(saves.getRecord()).toBe(120);
    expect(storage.getItem(SAVE_KEY)).toBeNull();
  });

  it('starts level 120 as a victory and refuses a higher starting level', () => {
    const session = new GameSession('normal', () => 0.999999, { level: 120 });
    expect(session.state.phase).toBe('gameOver');
    expect(session.state.isVictory).toBe(true);
    expect(() => new GameSession('normal', undefined, { level: 121 })).toThrow(RangeError);
  });

  it('finishes old saves at or above level 120 as a victory', () => {
    const saved = snapshot(arena());
    const previous = { ...saved, version: 28, state: { ...saved.state, level: 125 } };
    const session = restore(parseSave(previous)!);
    expect(session.state.level).toBe(120);
    expect(session.state.isVictory).toBe(true);
    expect(session.state.phase).toBe('gameOver');
  });

  it('records the first lethal spider and the full hit remaining after protection', () => {
    const session = arena([{ id: 'lightningShield', rank: 1 }]);
    session.state.character.setModifiers('test:protection', [
      { stat: 'incomingDamage', kind: 'percent', value: -50 },
    ]);
    session.refreshStats();
    session.activateAbility('lightningShield');
    session.state.hp = 40;
    addSpider(session, 'tank', 0, 1, 7100);
    addSpider(session, 'normal', 1, 1, 100000);
    session.tick(0.001);
    expect(session.state.phase).toBe('gameOver');
    expect(session.state.isVictory).toBe(false);
    expect(session.state.fatalHit).toEqual({ spider: 'tank', damage: 50 });
    expect(session.drainEvents().filter((event) => event.type === 'damage')).toHaveLength(1);
  });
});
