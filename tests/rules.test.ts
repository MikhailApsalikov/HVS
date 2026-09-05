import { describe, expect, it } from 'vitest';
import { GameSession } from '../src/domain/GameSession.js';
import { GameRules } from '../src/domain/rules/GameRules.js';
import { normalConfig } from '../src/content/normal.js';
import { DIFFICULTIES } from '../src/content/difficulties.js';
import { ITEM_CATALOG } from '../src/content/items.js';
import { TALENTS, TALENT_ORDER } from '../src/content/talents.js';
import { ABILITY_ORDER } from '../src/content/abilities.js';
import { STATS } from '../src/domain/rules/stats.js';
import { salePrice } from '../src/domain/rules/economy.js';
import { itemModifiers } from '../src/domain/rules/itemModifiers.js';
import { Character } from '../src/domain/model/Character.js';

describe('talent strength and independent sources', () => {
  it('treats two ranks of a +10% talent as one +20% bonus', () => {
    const session = new GameSession('normal');
    session.talents.loadFromSave([{ id: 'tireless', rank: 2 }]);
    session.refreshStats();
    expect(session.state.stats.energyRegen).toBe(12);
    expect(session.talents.getModifiers()).toEqual([
      { source: 'talent:tireless', stat: 'energyRegen', kind: 'percent', value: 20 },
    ]);
  });
  it('multiplies different talents, then subtracts flat reductions', () => {
    const session = new GameSession('normal');
    session.talents.loadFromSave([
      { id: 'rapidFire', rank: 2 },
      { id: 'quickInstinct', rank: 2 },
      { id: 'improvedPrep', rank: 1 },
    ]);
    session.refreshStats();
    expect(session.state.stats['volley.cooldown']).toBe(9.31); // 12 × .8 × .97
    expect(session.state.stats['prep.cooldown']).toBe(52.2); // 60 × .97 − 6
    expect(session.state.stats.shootCooldown).toBe(1.2);
  });
  it('applies flat item regeneration before the talent percentage', () => {
    const session = new GameSession('normal');
    session.talents.loadFromSave([{ id: 'tireless', rank: 2 }]);
    session.items.buyItem('c068');
    session.refreshStats();
    expect(session.state.stats.energyRegen).toBe(13.2);
  });
  it('all modifiers of all equipped items work, including duplicate ability enhancements', () => {
    const session = new GameSession('normal');
    const item = ITEM_CATALOG.find(
      (item) => item.abilityMod?.modType === 'effectBoost' && item.abilityMod.abilityId === 'prep',
    )!;
    session.items.buyItem(item.id);
    session.items.buyItem(item.id);
    session.refreshStats();
    const percent = item.abilityMod!.value;
    expect(session.state.stats['prep.restore']).toBe(Math.round(300 * (1 + percent) ** 2));
    expect(
      session.items.getModifiers().filter((modifier) => modifier.stat === 'prep.restore'),
    ).toHaveLength(2);
  });
  it('stacks defenses from a talent and two items independently', () => {
    const session = new GameSession('normal');
    session.talents.loadFromSave([{ id: 'spiderArmor', rank: 2 }]);
    session.items.buyItem('c050');
    session.items.buyItem('c050');
    session.refreshStats();
    expect(session.state.rules.value('incomingDamage', 1000)).toBe(697);
  });
  it.each(TALENT_ORDER)('validates rank and unlock constraints: %s', (id) => {
    const session = new GameSession('normal');
    const talent = session.talents.getTalent(id);
    expect(session.talents.canUpgrade(id, talent.unlocksAtLevel - 1)).toBe(false);
    expect(session.talents.upgrade(id, talent.unlocksAtLevel)).toBe(true);
    session.talents.loadFromSave([{ id, rank: 99999 }]);
    expect(session.talents.getRank(id)).toBe(talent.maxRanks);
    expect(session.talents.upgrade(id, 100)).toBe(false);
    session.talents.loadFromSave([{ id, rank: -1 }]);
    expect(session.talents.getRank(id)).toBe(0);
    expect(TALENTS[id].effects.length).toBeGreaterThan(0);
  });
});

describe('character scaffold', () => {
  it('stores three primary attributes independently of old same-name talents', () => {
    const session = new GameSession('normal');
    session.state.character.setBase('agility', 53);
    session.state.character.setModifiers('equipment', [
      { stat: 'agility', kind: 'flat', value: 9 },
    ]);
    session.state.character.setModifiers('buff', [{ stat: 'agility', kind: 'percent', value: 20 }]);
    session.refreshStats();
    expect(session.state.stats.agility).toBe(74);
    expect(session.state.stats.maxEnergy).toBe(100);
    session.state.character.removeModifiers('buff');
    session.refreshStats();
    expect(session.state.stats.agility).toBe(62);
  });
  it('replaces a source and rejects invalid bases', () => {
    const character = new Character();
    character.setModifiers('x', [{ stat: 'intellect', kind: 'flat', value: 3 }]);
    character.setModifiers('x', [{ stat: 'intellect', kind: 'flat', value: 7 }]);
    expect(character.getModifiers()).toHaveLength(1);
    expect(() => character.setBase('agility', -1)).toThrow();
    character.restoreBase({});
    expect(character.base).toEqual({ endurance: 0, agility: 0, intellect: 0 });
  });
});

describe('content contracts', () => {
  it('retains all difficulties, talents, abilities and unique items', () => {
    expect(Object.keys(DIFFICULTIES)).toHaveLength(3);
    expect(TALENT_ORDER).toHaveLength(14);
    expect(ABILITY_ORDER).toHaveLength(8);
    expect(new Set(ITEM_CATALOG.map((item) => item.id)).size).toBe(ITEM_CATALOG.length);
    expect(ITEM_CATALOG.length).toBeGreaterThan(150);
  });
  it.each(ITEM_CATALOG)('every item is valid, priced and resolves: $id $name', (item) => {
    expect(Number.isInteger(item.price)).toBe(true);
    expect(item.price).toBeGreaterThan(0);
    const rules = new GameRules(normalConfig, itemModifiers(item, 'item'));
    for (const value of Object.values(rules.snapshot())) expect(Number.isFinite(value)).toBe(true);
    expect(salePrice(item.price)).toBe(Math.floor(item.price / 2));
  });
  it.each(Object.entries(DIFFICULTIES))('uses difficulty config for %s', (_name, config) => {
    const rules = new GameRules(config);
    expect(rules.levelDuration(1)).toBe(17);
    expect(rules.levelDuration(20)).toBe(55);
    expect(rules.spawnProbability(1)).toBe(config.spawnP0);
    expect(rules.value('coinsPerSec')).toBe(config.coinsPerSec);
    expect(rules.spawnProbability(1_000_000)).toBe(1);
  });
  it('assigns a rounding policy to every tunable value', () => {
    for (const definition of Object.values(STATS))
      expect(definition.policy.digits).toBeGreaterThanOrEqual(0);
  });
});
