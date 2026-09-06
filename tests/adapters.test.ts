import { describe, expect, it, vi } from 'vitest';
import { FrameLoop, type FrameScheduler } from '../src/infrastructure/browser/FrameLoop.js';
import { GameEngine } from '../src/application/GameEngine.js';
import { SaveSystem } from '../src/infrastructure/storage/SaveSystem.js';
import { MemoryStorage } from './helpers.js';
import {
  abilityDescription,
  attributeDescription,
  talentDescription,
  escapeHtml,
  describeModifier,
  formatSeconds,
} from '../src/ui/presenters.js';
import { game } from './helpers.js';
import { ABILITY_ORDER } from '../src/content/abilities.js';

class Frames implements FrameScheduler {
  nextId = 1;
  readonly callbacks = new Map<number, (timestamp: number) => void>();
  request(callback: (timestamp: number) => void): number {
    const id = this.nextId++;
    this.callbacks.set(id, callback);
    return id;
  }
  cancel(id: number): void {
    this.callbacks.delete(id);
  }
  advance(timestamp: number): void {
    const callbacks = [...this.callbacks.values()];
    this.callbacks.clear();
    callbacks.forEach((callback) => callback(timestamp));
  }
}

describe('browser loop without a browser', () => {
  it('uses identical simulation time at 30, 60 and 144 fps', () => {
    for (const fps of [30, 60, 144]) {
      const frames = new Frames();
      const loop = new FrameLoop(frames);
      let elapsed = 0;
      loop.start(
        (dt) => {
          elapsed += dt;
        },
        () => true,
      );
      for (let frame = 0; frame <= fps; frame++) frames.advance((frame * 1000) / fps);
      expect(elapsed).toBeCloseTo(1, 8);
      loop.stop();
      expect(frames.callbacks.size).toBe(0);
    }
  });
  it('caps background catch-up and cancels old loops on restart', () => {
    const frames = new Frames();
    const loop = new FrameLoop(frames);
    const tick = vi.fn();
    loop.start(tick, () => true);
    const stale = [...frames.callbacks.values()][0];
    loop.start(tick, () => true);
    stale(0);
    expect(frames.callbacks.size).toBe(1);
    frames.advance(0);
    frames.advance(10000);
    expect(tick).toHaveBeenCalledTimes(6);
    loop.stop();
    loop.start(tick, () => false);
    frames.advance(20000);
    expect(frames.callbacks.size).toBe(0);
  });
});

describe('application orchestration', () => {
  it('starts, upgrades, trades, saves, reloads and restarts with one loop', () => {
    const frames = new Frames();
    const saves = new SaveSystem(new MemoryStorage());
    const render = vi.fn();
    const engine = new GameEngine(render, saves, new FrameLoop(frames));
    const phases = vi.fn();
    engine.setPhaseChangeCallback(phases);
    expect(engine.loadGame()).toBe(false);
    expect(engine.shootLane(0)).toBe('blocked');
    expect(engine.activateAbility('freeze')).toBe('level_locked');
    expect(engine.upgradeTalent('endurance')).toBe(false);
    engine.startNewGame('normal');
    expect(engine.isInitialTalentPick).toBe(true);
    frames.advance(0);
    expect(phases).toHaveBeenCalledWith('levelUp', engine.getState());
    expect(engine.upgradeTalent('endurance')).toBe(true);
    expect(engine.buyItem('c001')).toBe(true);
    expect(engine.sellItem(0)).toBe(true);
    expect(engine.confirmLevelUp()).toBe(true);
    frames.advance(16.67);
    expect(engine.shootLane(0)).toBe('shot');
    expect(engine.getTalentSystem()).not.toBeNull();
    expect(engine.getItemSystem()).not.toBeNull();
    expect(engine.getSaveSystem()).toBe(saves);
    engine.persist();
    expect(engine.loadGame()).toBe(true);
    expect(engine.getState()!.arrows.size).toBe(1);
    engine.startNewGame('hard');
    expect(engine.getState()!.difficulty).toBe('hard');
    expect(frames.callbacks.size).toBe(1);
    engine.stopLoop();
    expect(frames.callbacks.size).toBe(0);
  });
});

describe('presentation uses the actual resolved stats', () => {
  it('uses whole seconds for timers and retains negative item cooldown bonuses', () => {
    expect(formatSeconds(5.01)).toBe('6');
    expect(formatSeconds(0)).toBe('0');
    expect(describeModifier({ stat: 'prep.cooldown', kind: 'flat', value: -8 })).toContain('-8');
    expect(describeModifier({ stat: 'stand.duration', kind: 'flat', value: 1.5 })).toContain('+2');
  });
  it('shows armor as a percentage and includes magical armor in intellect contributions', () => {
    const session = game();
    session.state.character.setBase('endurance', 55);
    session.state.character.setBase('intellect', 54);
    session.refreshStats();
    expect(attributeDescription(session.state, 'armor')).toContain('33.7%');
    expect(attributeDescription(session.state, 'armor')).toContain('75%');
    session.talents.loadFromSave([{ id: 'magicArmor', rank: 7 }]);
    session.refreshStats();
    expect(attributeDescription(session.state, 'intellect')).toContain(
      'Благодаря таланту «Магическая броня» даёт ещё 210 брони.',
    );
  });
  it.each(ABILITY_ORDER)('shows live values for %s', (id) => {
    const session = game(50);
    session.talents.loadFromSave([{ id: 'quickInstinct', rank: 3 }]);
    session.refreshStats();
    const html = abilityDescription(session.state, id);
    for (const field of ['cooldown', 'cost'] as const) {
      if (session.state.stats[`${id}.${field}`] > 0)
        expect(html).toContain(
          String(
            field === 'cooldown'
              ? Math.ceil(session.state.stats[`${id}.${field}`])
              : session.state.stats[`${id}.${field}`],
          ),
        );
    }
  });
  it('describes talent ranks from their definitions', () => {
    const { stats } = game().state;
    expect(talentDescription('tireless', 2, stats)).toContain('дополнительно 2 энергии');
    expect(talentDescription('improvedEndurance', 2, stats)).toContain('выносливость на 10%');
    expect(talentDescription('magicArmor', 7, stats)).toContain(
      'Каждые 5 полных единиц интеллекта дают 21 брони',
    );
    expect(talentDescription('blizzardMastery', 1, stats)).toContain('7 процентных пунктов');
    expect(escapeHtml('<script>"&\'')).toBe('&lt;script&gt;&quot;&amp;&#39;');
  });
});
