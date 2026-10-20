import { describe, expect, it } from 'vitest';
import { ITEM_CATALOG, ITEM_MAP } from '../src/content/items.js';
import { GameSession } from '../src/domain/GameSession.js';
import type { TalentId } from '../src/domain/types.js';
import { generateItemSvg } from '../src/ui/ItemSpriteGenerator.js';
import { itemAbilityDescription, itemStatLines } from '../src/ui/itemPresentation.js';
import { formatStat, resourceDescription, shootDescription } from '../src/ui/presenters.js';

function arena(): GameSession {
  const session = new GameSession('normal', () => 0.999999, { level: 60, coins: 1_000_000 });
  session.state.character.setModifiers('test:arena', [
    { stat: 'spawnProbability', kind: 'percent', value: -100 },
    { stat: 'maxEnergy', kind: 'flat', value: 1000 },
  ]);
  session.refreshStats();
  learn(session, 'hunterArsenal', 5);
  return session;
}

function learn(session: GameSession, id: TalentId, ranks = 1): void {
  for (let rank = 0; rank < ranks; rank++) expect(session.upgradeTalent(id)).toBe(true);
}

function start(session: GameSession): void {
  session.state.pendingTalentPoints = 0;
  expect(session.confirmLevelUp()).toBe(true);
}

function shootingBase(session: GameSession): void {
  learn(session, 'hunterMastery', 5);
  learn(session, 'vampirism', 5);
  learn(session, 'piercingReward', 5);
}

describe('item chance tooltips through session commands', () => {
  it('hides block and critical chances until their talents are learned, even with items equipped', () => {
    const session = arena();
    expect(session.buyItem('l021')).toBe(true);
    expect(session.buyItem('l027')).toBe(true);
    expect(resourceDescription(session.state, 'hp')).not.toContain('Общий шанс блока');
    expect(shootDescription(session.state, 1)).not.toContain('Общий шанс критического выстрела');
    expect(shootDescription(session.state, 1)).not.toContain('Шанс тройного крита');

    learn(session, 'endurance', 7);
    learn(session, 'shieldBlock');
    expect(resourceDescription(session.state, 'hp')).toContain('Общий шанс блока — 12%.');
    shootingBase(session);
    learn(session, 'criticalShot');
    expect(shootDescription(session.state, 1)).toContain(
      `Общий шанс критического выстрела — ${formatStat('criticalShotChance', session.state.stats.criticalShotChance)}.`,
    );
    expect(session.state.stats.criticalShotChance).toBeGreaterThan(0.13);
    expect(shootDescription(session.state, 1)).toContain(
      'Шанс тройного крита среди критических выстрелов — 36%.',
    );
  });

  it('shows the complete block chance including items and the temporary ability, capped at 100%', () => {
    const session = arena();
    learn(session, 'endurance', 7);
    learn(session, 'shieldBlock', 7);
    learn(session, 'lastHope');
    expect(session.buyItem('l021')).toBe(true);
    expect(session.buyItem('l010')).toBe(true);
    expect(resourceDescription(session.state, 'hp')).toContain('Общий шанс блока — 52%.');
    start(session);
    expect(session.activateAbility('lastHope')).toBe('activated');
    expect(resourceDescription(session.state, 'hp')).toContain('Общий шанс блока — 92%.');

    session.state.character.setModifiers('test:extra-block', [
      { stat: 'blockChance', kind: 'flat', value: 0.2 },
    ]);
    session.refreshStats();
    expect(resourceDescription(session.state, 'hp')).toContain('Общий шанс блока — 100%.');
    session.tick(session.state.stats['lastHope.duration']);
    expect(resourceDescription(session.state, 'hp')).toContain('Общий шанс блока — 72%.');
  });

  it('shows guaranteed critical shots and the increased triple chance while Eagle Eye has charges', () => {
    const session = arena();
    shootingBase(session);
    learn(session, 'criticalShot', 5);
    learn(session, 'eagleEye');
    learn(session, 'improvedCriticalShot');
    expect(session.buyItem('l027')).toBe(true);
    expect(shootDescription(session.state, 1)).toContain(
      'Шанс тройного крита среди критических выстрелов — 40.6%.',
    );
    start(session);
    session.state.energy = session.state.maxEnergy;
    expect(session.activateAbility('eagleEye')).toBe('activated');
    expect(shootDescription(session.state, 1)).toContain(
      'Общий шанс критического выстрела — 100%.',
    );
    expect(shootDescription(session.state, 1)).toContain(
      'Шанс тройного крита среди критических выстрелов — 44.05%.',
    );

    for (let lane = 0; lane < 5; lane++) expect(session.shootLane(lane)).toBe('shot');
    expect(session.state.eagleEyeActive).toBe(false);
    const tooltip = shootDescription(session.state, 1);
    expect(tooltip).toContain(
      `Общий шанс критического выстрела — ${formatStat('criticalShotChance', session.state.stats.criticalShotChance)}.`,
    );
    expect(tooltip).toContain('Шанс тройного крита среди критических выстрелов — 40.6%.');
  });

  it('clamps the complete triple chance from a maximum talent and item to 100%', () => {
    const session = arena();
    shootingBase(session);
    learn(session, 'criticalShot', 5);
    learn(session, 'eagleEye');
    learn(session, 'improvedCriticalShot', 8);
    session.state.character.setBase('agility', 1941);
    session.refreshStats();
    expect(shootDescription(session.state, 1)).toContain(
      'Шанс тройного крита среди критических выстрелов — 64%.',
    );
    expect(session.buyItem('l027')).toBe(true);
    expect(shootDescription(session.state, 1)).toContain(
      'Шанс тройного крита среди критических выстрелов — 100%.',
    );
    start(session);
    expect(session.activateAbility('eagleEye')).toBe('activated');
    expect(shootDescription(session.state, 1)).toContain(
      'Шанс тройного крита среди критических выстрелов — 100%.',
    );
  });

  it('omits triple chance when there is no source and omits suppressed regular critical chance', () => {
    const session = arena();
    shootingBase(session);
    learn(session, 'criticalShot');
    expect(shootDescription(session.state, 1)).not.toContain('Шанс тройного крита');
    session.state.character.setModifiers('test:no-critical', [
      { stat: 'criticalShotChance', kind: 'percent', value: -100 },
    ]);
    session.refreshStats();
    expect(shootDescription(session.state, 1)).not.toContain('Общий шанс критического выстрела');
  });

  it('describes block percentages and the legendary triple-chance property from their actual values', () => {
    const aegis = ITEM_MAP.get('l021')!;
    expect(itemStatLines(aegis)).toContain('+6% шанса блока');
    const legendary = ITEM_MAP.get('l027')!;
    expect(itemStatLines(legendary)).toEqual(['+240 ловкости', '+10% шанса критического выстрела']);
    expect(itemAbilityDescription(legendary)).toBe(
      'Увеличивает шанс тройного крита среди критических выстрелов на 36%.',
    );
    expect(
      itemAbilityDescription({
        ...legendary,
        abilityMod: { ...legendary.abilityMod!, value: 0.18 },
      }),
    ).toBe('Увеличивает шанс тройного крита среди критических выстрелов на 18%.');
  });

  it('provides equipment illustrations for all block items and the new critical legendary', () => {
    const additions = ITEM_CATALOG.filter(
      (item) => item.id === 'l027' || item.stats.some(({ type }) => type === 'blockChance'),
    );
    expect(additions.length).toBeGreaterThan(2);
    for (const item of additions) {
      const illustration = generateItemSvg(item);
      expect(illustration, item.name).toContain('<svg');
      expect(illustration, item.name).not.toContain('>?</text>');
    }
  });
});
