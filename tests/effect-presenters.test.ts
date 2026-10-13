import { describe, expect, it } from 'vitest';
import { GameSession } from '../src/domain/GameSession.js';
import { playerEffectDescription } from '../src/ui/presenters.js';
import { addSpider } from './helpers.js';

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
  it('describes the active part of all five buffs, their counters and remaining duration', () => {
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
      expect(html).toContain(`Осталось ${Math.ceil(effect.remaining!)} с.`);
    }
    const description = (id: string) =>
      playerEffectDescription(effects.find((effect) => effect.id === id)!);
    expect(description('prep')).toContain('энергии в секунду');
    expect(description('prep')).not.toContain('Мгновенно');
    expect(description('stand')).toContain('Защищает от урона');
    expect(description('lastHope')).toContain('Сила блока: +');
    expect(description('adrenaline')).toContain('Бесплатных выстрелов осталось: 20');
    expect(description('eagleEye')).toContain('Критических выстрелов осталось: 5');

    expect(session.shootLane(0)).toBe('shot');
    const updated = session.state.activeEffects.find((effect) => effect.id === 'eagleEye')!;
    expect(playerEffectDescription(updated)).toContain('Критических выстрелов осталось: 4');
  });

  it('describes spider penalties, stacked poison and its next tick', () => {
    const session = arena();
    for (const type of ['golden', 'fast', 'poisonous', 'poisonous'] as const) {
      addSpider(session, type, 0, 1, 100);
      session.tick(0.001);
    }
    for (const effect of session.state.activeEffects) {
      const html = playerEffectDescription(effect);
      expect(html).toContain(effect.name);
      expect(html).toContain('Осталось');
      if (effect.id === 'goldLock') expect(html).toContain('Награды за пауков сохраняются');
      if (effect.id === 'healingReduction') expect(html).toContain('получаемое лечение');
      if (effect.id === 'poison') {
        expect(html).toContain('Стаков яда: 2');
        expect(html).toContain('Следующий тик через 2 с.');
        expect(html).toContain('Урон игнорирует защиту');
      }
    }
  });

  it('explains indefinite inactivity and switches to the actual recovery countdown', () => {
    const session = arena();
    addSpider(session, 'normal', 8, 0.1);
    session.tick(3);
    const idle = session.state.activeEffects.find((effect) => effect.id === 'antiAfk')!;
    const html = playerEffectDescription(idle);
    expect(html).toContain('Входящий урон увеличен на 10%');
    expect(html).toContain('После расходования энергии');
    expect(html).toContain('Действует до восстановления активности.');
    expect(html).not.toContain('Осталось');

    expect(session.shootLane(0)).toBe('shot');
    session.tick(2);
    const recovering = session.state.activeEffects.find((effect) => effect.id === 'antiAfk')!;
    expect(playerEffectDescription(recovering)).toContain('Осталось 8 с.');
  });
});
