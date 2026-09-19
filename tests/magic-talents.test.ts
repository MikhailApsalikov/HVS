import { describe, expect, it } from 'vitest';
import { GameSession } from '../src/domain/GameSession.js';
import { parseSave, restore, snapshot } from '../src/domain/save.js';
import {
  abilityDescription,
  attributeDescription,
  talentDescription,
} from '../src/ui/presenters.js';
import { addSpider, game } from './helpers.js';

describe('magic talent update through session commands', () => {
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
        { id: 'improvedIntellect', rank: 7 },
        { id: 'agility', rank: 5 },
        { id: 'hunterArsenal', rank: 5 },
        { id: 'tireless', rank: 5 },
        { id: 'blizzardMastery', rank: 6 },
        { id: 'magicArmor', rank: 7 },
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
      expect(session.state.getAbility('recharge').remainingCooldown).toBe(255);
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

  it('grants exactly five permafrost ranks using final intellect and one bonus source', () => {
    const session = new GameSession('normal');
    session.state.level = 20;
    session.state.pendingTalentPoints = 6;
    session.talents.loadFromSave([
      { id: 'improvedIntellect', rank: 7 },
      { id: 'agility', rank: 5 },
      { id: 'hunterArsenal', rank: 2 },
    ]);
    session.refreshStats();
    expect(session.state.stats.intellect).toBe(252);
    for (let rank = 1; rank <= 5; rank++) {
      expect(session.upgradeTalent('permafrost')).toBe(true);
      expect(session.state.stats.permafrostSlow).toBeCloseTo(0.022 * rank);
      expect(session.state.rules.explain('permafrostSlow').modifiers).toHaveLength(1);
    }
    expect(session.upgradeTalent('permafrost')).toBe(false);
    session.state.character.setModifiers('test:intellect', [
      { stat: 'intellect', kind: 'flat', value: 20 },
    ]);
    session.refreshStats();
    expect(session.state.stats.intellect).toBe(279);
    expect(session.state.stats.permafrostSlow).toBe(0.115);
    session.state.character.removeModifiers('test:intellect');
    session.refreshStats();
    expect(session.state.stats.permafrostSlow).toBe(0.11);
  });

  it.each([
    [0, 1, 0.01],
    [19, 1, 0.01],
    [20, 1, 0.011],
    [39, 5, 0.055],
    [40, 5, 0.06],
    [1799, 5, 0.495],
    [1800, 5, 0.5],
    [100000, 5, 0.5],
  ])(
    'uses full twenty-point steps and caps the slow: intellect %s, rank %s',
    (intellect, rank, slow) => {
      const session = game();
      session.talents.loadFromSave([{ id: 'permafrost', rank }]);
      session.state.character.setBase('intellect', intellect);
      session.refreshStats();
      expect(session.state.stats.permafrostSlow).toBe(slow);
      const spider = addSpider(session, 'normal', 0, 0, 0, 0.1);
      session.tick(1);
      expect(spider.y).toBeCloseTo(0.1 * (1 - slow));
      expect(attributeDescription(session.state, 'intellect')).toContain(
        `Снижает скорость передвижения пауков на ${Number((slow * 100).toFixed(4))}%`,
      );
    },
  );

  it.each(['normal', 'fat', 'fast', 'ninja', 'burner', 'tank'] as const)(
    'slows existing and new %s spiders independently of blizzard and recalculates live',
    (type) => {
      const session = game(8);
      const spider = addSpider(session, type, 0, 0, 0, 0.1);
      session.talents.loadFromSave([{ id: 'permafrost', rank: 5 }]);
      session.state.character.setBase('intellect', 186);
      session.refreshStats();
      expect(session.state.stats.intellect).toBe(200);
      session.tick(0.5);
      expect(spider.y).toBeCloseTo(0.045);
      expect(session.activateAbility('blizzard')).toBe('activated');
      const newcomer = addSpider(session, type, 1, 0, 0, 0.1);
      session.tick(0.5);
      expect(spider.y).toBeCloseTo(0.072);
      expect(newcomer.y).toBeCloseTo(0.045);
      session.state.character.setBase('intellect', 386);
      session.refreshStats();
      session.tick(0.5);
      expect(spider.y).toBeCloseTo(0.0975);
      expect(newcomer.y).toBeCloseTo(0.0875);
      session.tick(4);
      expect(spider.slowFactor).toBe(1);
      expect(spider.y).toBeCloseTo(0.4375);
      session.talents.loadFromSave([]);
      session.refreshStats();
      session.tick(0.5);
      expect(spider.y).toBeCloseTo(0.4875);
    },
  );

  it('caps only permafrost while allowing blizzard to slow further', () => {
    const session = game(8);
    session.talents.loadFromSave([{ id: 'permafrost', rank: 5 }]);
    session.state.character.setBase('intellect', 10000);
    session.refreshStats();
    const spider = addSpider(session, 'normal', 0, 0, 0, 0.1);
    session.activateAbility('blizzard');
    session.tick(1);
    expect(spider.y).toBe(0.03);
    const description = talentDescription('permafrost', 5, session.state.stats);
    expect(description).toContain('5% + 0.5% за каждые 20');
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
    expect([...loaded.state.spiders.values()][0].y).toBeCloseTo(0.092);
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
