import { describe, expect, it } from 'vitest';
import { GameSession } from '../src/domain/GameSession.js';
import {
  formatStat,
  coinsDescription,
  killingStreakDescription,
  playerEffectDescription,
  talentDescription,
} from '../src/ui/presenters.js';
import { addNearbySpider as addSpider } from './helpers.js';

function arena() {
  const session = new GameSession('normal', () => 0.999999, { level: 60 });
  session.state.character.setModifiers('test:arena', [
    { stat: 'spawnProbability', kind: 'percent', value: -100 },
    { stat: 'dodgeChance', kind: 'percent', value: -100 },
    { stat: 'maxHp', kind: 'flat', value: 100000 },
    { stat: 'maxEnergy', kind: 'flat', value: 1000 },
    { stat: 'energyRegen', kind: 'percent', value: -100 },
  ]);
  session.refreshStats();
  session.state.phase = 'playing';
  session.state.levelTimer = session.state.levelTimerMax = 1000;
  session.state.energy = session.state.maxEnergy;
  return session;
}

describe('player effect tooltips through session commands', () => {
  it('describes all five buffs without repeating timers and keeps explicit shot charges current', () => {
    const session = arena();
    session.talents.loadFromSave([
      { id: 'divineShield', rank: 1 },
      { id: 'lastHope', rank: 1 },
      { id: 'adrenaline', rank: 1 },
      { id: 'eagleEye', rank: 1 },
    ]);
    session.refreshStats();
    for (const id of ['stand', 'prep', 'lastHope', 'adrenaline', 'eagleEye'] as const)
      expect(session.activateAbility(id)).toBe('activated');

    const effects = session.state.activeEffects;
    expect(effects).toHaveLength(5);
    for (const effect of effects) {
      const html = playerEffectDescription(effect);
      expect(html).toContain(effect.name);
      expect(html).not.toContain(`Осталось ${Math.ceil(effect.remaining!)} с.`);
    }
    const description = (id: string) =>
      playerEffectDescription(effects.find((effect) => effect.id === id)!);
    expect(description('prep')).toContain('Восстановление энергии увеличено на 30 в секунду.');
    expect(description('prep')).not.toContain('Мгновенно');
    expect(description('stand')).toContain('Неуязвимость');
    expect(description('lastHope')).toContain('Увеличивает шанс блока на 40% и его силу на');
    expect(description('adrenaline')).toContain(
      'Выстрелы лучников бесплатны и без времени восстановления. Осталось — 20.',
    );
    expect(description('eagleEye')).toContain(
      'Выстрелы лучников гарантированно критические. Осталось — 5.',
    );

    expect(session.shootLane(0)).toBe('shot');
    const updated = session.state.activeEffects.find((effect) => effect.id === 'eagleEye')!;
    expect(playerEffectDescription(updated)).toContain('Осталось — 4.');
  });

  it('shows the healing reduction and integer poison damage without timers or stacks', () => {
    const session = arena();
    for (const type of ['golden', 'fast', 'poisonous', 'poisonous'] as const) {
      addSpider(session, type, 0, 1, 101);
      session.tick(0.001);
    }
    for (const effect of session.state.activeEffects) {
      const html = playerEffectDescription(effect);
      expect(html).toContain(effect.name);
      expect(html).not.toMatch(/Осталось|Стаков|Следующий тик|за тик/);
      if (effect.id === 'goldLock') {
        expect(html).toContain('Пассивный доход уменьшен на 63%.');
        expect(html).toContain('Награды за пауков сохраняются');
        expect(coinsDescription(session.state)).toContain('Пассивный доход уменьшен на 63%');
      }
      if (effect.id === 'healingReduction') {
        expect(html).toContain('Регенерация здоровья и получаемое лечение уменьшены на 41%.');
        expect(html).not.toContain('59%');
      }
      if (effect.id === 'poison') {
        expect(effect.details!.tickDamage).toBe(24.24);
        expect(html).toContain(
          'Броня уменьшена на 53%. Вы отравлены и получаете 24 урона раз в 2 секунды. Яд не может убить.',
        );
      }
    }
  });

  it('describes the hunter reward buff and golden jackpot chance using session effects', () => {
    const session = arena();
    session.talents.loadFromSave([{ id: 'hunterReward', rank: 5 }]);
    session.state.character.setModifiers('test:shooting', [
      { stat: 'shootCooldown', kind: 'percent', value: -100 },
    ]);
    session.refreshStats();
    const spider = addSpider(session, 'golden', 0, 0.9);
    expect(session.shootLane(0)).toBe('shot');
    session.tick(0.31);
    expect(session.drainEvents()).toContainEqual(
      expect.objectContaining({ type: 'coinDrop', spiderId: spider.id, jackpot: true }),
    );
    const buff = session.state.activeEffects.find((effect) => effect.id === 'hunterReward')!;
    expect(buff).toMatchObject({
      name: 'Награда охотника',
      sprite: 'TalentHunterReward',
      kind: 'buff',
      source: 'talent',
      removableByCleanser: true,
      stacks: null,
      details: { incomePercent: 50, armorPercent: 50 },
    });
    expect(playerEffectDescription(buff)).toContain(
      'Пассивный доход увеличен на 50% и броня увеличена на 50%.',
    );
    expect(coinsDescription(session.state)).toContain(
      'Вероятность тройной награды за золотого паука — 100%.',
    );
    const talent = talentDescription('hunterReward', 5, session.state.stats);
    expect(talent).toContain('100%');
    expect(talent).toContain('35%');
    expect(talent).toContain('15');
    expect(talent).toContain('50%');
    expect(talentDescription('hunterReward', 1, session.state.stats)).toContain('20%');
  });

  it('explains inactivity recovery without repeating its counter or countdown', () => {
    const session = arena();
    addSpider(session, 'normal', 8, 0.1);
    session.tick(3);
    const idle = session.state.activeEffects.find((effect) => effect.id === 'antiAfk')!;
    const html = playerEffectDescription(idle);
    expect(html).toContain('Входящий урон увеличен на 10%');
    expect(html).toContain('После расходования энергии');
    expect(html).not.toContain('Стаков');
    expect(html).not.toContain('Осталось');

    expect(session.shootLane(0)).toBe('shot');
    session.tick(2);
    const recovering = session.state.activeEffects.find((effect) => effect.id === 'antiAfk')!;
    expect(recovering.remaining).toBe(8);
    expect(playerEffectDescription(recovering)).toBe(html);
  });

  it('explains current streak bonuses without repeating its stack counter or progress timer', () => {
    const session = arena();
    session.talents.loadFromSave([
      { id: 'killingStreak', rank: 8 },
      { id: 'enthusiasm', rank: 3 },
      { id: 'improvedKillingStreak', rank: 2 },
    ]);
    session.refreshStats();
    session.tick(session.state.stats['killingStreak.interval'] * 2);
    const html = killingStreakDescription(session.state);
    expect(session.state.killingStreakStacks).toBe(2);
    expect(html).toContain('Стоимость выстрела снижена на 2 энергии.');
    expect(html).toContain('«Увлечённость»: 60% шанс избежать урона, расходуя один эффект.');
    expect(html).toContain(
      `Каждое убийство приближает следующий эффект на ${formatStat('killingStreak.killAdvance', session.state.stats['killingStreak.killAdvance'])} с.`,
    );
    expect(html).not.toMatch(/Эффектов:|Следующий эффект через|максимальное количество/);
    expect(html).not.toContain('Подготовки титана');

    session.talents.loadFromSave([
      { id: 'killingStreak', rank: 8 },
      { id: 'titanPreparation', rank: 5 },
    ]);
    session.refreshStats();
    expect(session.activateAbility('prep')).toBe('activated');
    const titanHtml = killingStreakDescription(session.state);
    expect(titanHtml).toContain(
      'Избыток временных эффектов «Подготовки титана» постепенно исчезает.',
    );
    expect(titanHtml).toContain('Стоимость выстрела снижена на 10 энергии.');
    expect(titanHtml).not.toMatch(/Увлечённость|Каждое убийство|Эффектов:|Следующий эффект через/);
  });
});
