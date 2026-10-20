import { describe, expect, it } from 'vitest';
import { GameSession } from '../src/domain/GameSession.js';
import { parseSave, restore, snapshot } from '../src/domain/save.js';
import {
  abilityDescription,
  attributeDescription,
  talentDescription,
} from '../src/ui/presenters.js';
import { addSpider, game } from './helpers.js';
import { ABILITIES, ABILITY_ORDER } from '../src/content/abilities.js';

describe('magic talent update through session commands', () => {
  it.each([1, 5, 10])(
    'reduces every ability cooldown by 2 percent per Quick Instinct rank: %s',
    (rank) => {
      for (const id of ABILITY_ORDER) {
        const session = game(60);
        session.talents.loadFromSave([
          { id: 'quickInstinct', rank },
          ...(ABILITIES[id].talent ? [{ id: ABILITIES[id].talent!, rank: 1 }] : []),
        ]);
        session.state.character.setModifiers('test:energy', [
          { stat: 'maxEnergy', kind: 'flat', value: 1000 },
          { stat: 'agility', kind: 'percent', value: -100 },
        ]);
        session.refreshStats();
        session.state.energy = session.state.maxEnergy;
        expect(session.activateAbility(id)).toBe('activated');
        expect(session.state.getAbility(id).duration).toBeCloseTo(
          session.state.config.abilities[id].cooldown * (1 - 0.02 * rank),
        );
      }
      const session = game(60);
      expect(talentDescription('quickInstinct', rank, session.state.stats)).toContain(
        `${2 * rank}%`,
      );
    },
  );

  it.each(['easy', 'normal', 'hard'] as const)(
    'requires tier seven and ten quick instinct ranks for recharge on %s',
    (difficulty) => {
      const session = new GameSession(difficulty);
      session.state.level = 100;
      session.state.phase = 'playing';
      session.refreshStats();
      expect(session.activateAbility('recharge')).toBe('level_locked');
      expect(abilityDescription(session.state, 'recharge')).toContain(
        'Требуется талант «Перезарядка»',
      );
      session.state.phase = 'levelUp';
      session.state.pendingTalentPoints = 100;
      session.talents.loadFromSave([
        { id: 'improvedIntellect', rank: 5 },
        { id: 'agility', rank: 5 },
        { id: 'hunterArsenal', rank: 5 },
        { id: 'tireless', rank: 5 },
        { id: 'blizzardMastery', rank: 6 },
        { id: 'magicArmor', rank: 5 },
        { id: 'improvedPrep', rank: 2 },
        { id: 'quickInstinct', rank: 9 },
      ]);
      expect(session.upgradeTalent('recharge')).toBe(false);
      expect(session.upgradeTalent('quickInstinct')).toBe(true);
      session.state.level = 59;
      expect(session.upgradeTalent('recharge')).toBe(false);
      session.state.level = 60;
      expect(session.upgradeTalent('recharge')).toBe(true);
      expect(session.upgradeTalent('recharge')).toBe(false);
      expect(session.talents.getTalent('recharge')).toMatchObject({
        tier: 7,
        branch: 'magic',
        requiredBranchPoints: 42,
        maxRanks: 1,
      });
      session.state.phase = 'playing';
      session.state.energy = session.state.maxEnergy;
      session.state.getAbility('prep').start(10);
      expect(session.activateAbility('recharge')).toBe('activated');
      expect(session.state.getAbility('prep').isReady).toBe(true);
      expect(session.state.getAbility('recharge').remainingCooldown).toBe(240);
    },
  );

  it('keeps preparation available from level twelve without a talent', () => {
    const session = game(11);
    expect(session.activateAbility('prep')).toBe('level_locked');
    session.state.level = 12;
    session.refreshStats();
    session.state.energy = 0;
    expect(session.activateAbility('prep')).toBe('activated');
    expect(session.state.energy).toBe(session.state.maxEnergy);
  });

  it('grants ten percent slow per permafrost rank from one source, independent of intellect', () => {
    const session = new GameSession('normal');
    session.state.level = 20;
    session.state.pendingTalentPoints = 6;
    session.talents.loadFromSave([
      { id: 'improvedIntellect', rank: 5 },
      { id: 'agility', rank: 5 },
      { id: 'hunterArsenal', rank: 4 },
    ]);
    session.refreshStats();
    expect(session.state.stats.intellect).toBe(186);
    for (let rank = 1; rank <= 5; rank++) {
      expect(session.upgradeTalent('permafrost')).toBe(true);
      expect(session.state.stats.permafrostSlow).toBeCloseTo(0.1 * rank);
      expect(session.state.rules.explain('permafrostSlow').modifiers).toHaveLength(1);
    }
    expect(session.upgradeTalent('permafrost')).toBe(false);
    session.state.character.setModifiers('test:intellect', [
      { stat: 'intellect', kind: 'flat', value: 20 },
    ]);
    session.refreshStats();
    expect(session.state.stats.intellect).toBe(211);
    expect(session.state.stats.permafrostSlow).toBe(0.5);
    session.state.character.removeModifiers('test:intellect');
    session.refreshStats();
    expect(session.state.stats.permafrostSlow).toBe(0.5);
  });

  it.each([
    [0, 1, 0.1],
    [19, 1, 0.1],
    [20, 2, 0.2],
    [39, 3, 0.3],
    [40, 4, 0.4],
    [1799, 5, 0.5],
    [100000, 5, 0.5],
  ])(
    'slows movement by rank regardless of intellect: intellect %s, rank %s',
    (intellect, rank, slow) => {
      const session = game();
      session.talents.loadFromSave([{ id: 'permafrost', rank }]);
      session.state.character.setBase('intellect', intellect);
      session.refreshStats();
      expect(session.state.stats.permafrostSlow).toBe(slow);
      const spider = addSpider(session, 'normal', 0, 0, 0, 0.1);
      session.tick(1);
      expect(spider.y).toBeCloseTo(0.1 * (1 - slow));
      expect(attributeDescription(session.state, 'intellect')).not.toContain('Вечная мерзлота');
      expect(talentDescription('permafrost', rank, session.state.stats)).toContain(
        `Снижает скорость передвижения всех пауков на ${slow * 100}%`,
      );
    },
  );

  it.each(['normal', 'fat', 'fast', 'ninja', 'burner', 'tank'] as const)(
    'slows existing and new %s spiders independently of blizzard and recalculates live',
    (type) => {
      const session = game(20);
      const spider = addSpider(session, type, 0, 0, 0, 0.1);
      session.talents.loadFromSave([{ id: 'permafrost', rank: 5 }]);
      session.state.character.setBase('intellect', 162);
      session.refreshStats();
      expect(session.state.stats.intellect).toBe(200);
      session.tick(0.5);
      expect(spider.y).toBeCloseTo(0.025);
      expect(session.activateAbility('blizzard')).toBe('activated');
      const newcomer = addSpider(session, type, 1, 0, 0, 0.1);
      session.tick(0.5);
      expect(spider.y).toBeCloseTo(0.04);
      expect(newcomer.y).toBeCloseTo(0.025);
      session.state.character.setBase('intellect', 362);
      session.refreshStats();
      session.tick(0.5);
      expect(spider.y).toBeCloseTo(0.055);
      expect(newcomer.y).toBeCloseTo(0.05);
      session.tick(4);
      expect(spider.slowFactor).toBe(1);
      expect(spider.y).toBeCloseTo(0.255);
      session.talents.loadFromSave([]);
      session.refreshStats();
      session.tick(0.5);
      expect(spider.y).toBeCloseTo(0.305);
    },
  );

  it('caps only permafrost while allowing blizzard to slow further', () => {
    const session = game(20);
    session.talents.loadFromSave([{ id: 'permafrost', rank: 5 }]);
    session.state.character.setBase('intellect', 10000);
    session.refreshStats();
    const spider = addSpider(session, 'normal', 0, 0, 0, 0.1);
    session.activateAbility('blizzard');
    session.tick(1);
    expect(spider.y).toBe(0.03);
    const description = talentDescription('permafrost', 5, session.state.stats);
    expect(description).not.toContain('интеллекта');
    expect(description).toContain('50%');
    expect(talentDescription('recharge', 1, session.state.stats)).toContain(
      'Открывает способность «Перезарядка»',
    );
  });

  it('restores learned talents and applies permafrost to saved spiders', () => {
    const session = game(60);
    session.talents.loadFromSave([
      { id: 'recharge', rank: 1 },
      { id: 'permafrost', rank: 5 },
    ]);
    session.refreshStats();
    addSpider(session, 'normal', 0, 0, 0, 0.1);
    const loaded = restore(
      parseSave(JSON.parse(JSON.stringify(snapshot(session))))!,
      () => 0.999999,
    );
    expect(loaded.state.isAbilityUnlocked('recharge')).toBe(true);
    loaded.tick(1);
    expect([...loaded.state.spiders.values()][0].y).toBeCloseTo(0.05);
  });

  it('loads saves without the new talents without granting recharge or a passive slow', () => {
    const session = game(60);
    const data = snapshot(session);
    const legacy = {
      ...data,
      talents: data.talents.filter(({ id }) => id !== 'recharge' && id !== 'permafrost'),
    };
    const loaded = restore(parseSave(JSON.parse(JSON.stringify(legacy)))!);
    expect(loaded.state.isAbilityUnlocked('prep')).toBe(true);
    expect(loaded.state.isAbilityUnlocked('recharge')).toBe(false);
    expect(loaded.state.stats.permafrostSlow).toBe(0);
  });
});
