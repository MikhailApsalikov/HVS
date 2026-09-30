import { describe, expect, it, vi } from 'vitest';
import { GameSession } from '../src/domain/GameSession.js';
import { snapshot } from '../src/domain/save.js';
import { MobileGameController } from '../src/application/MobileGameController.js';
import {
  MOBILE_SAVE_KEYS,
  MobileSaveStore,
  type AsyncStoragePort,
} from '../src/infrastructure/storage/MobileSaveStore.js';
import { game, addSpider } from './helpers.js';

class Storage implements AsyncStoragePort {
  values = new Map<string, string>();
  fail = false;
  async getItem(key: string) {
    if (this.fail) throw new Error('read');
    return this.values.get(key) ?? null;
  }
  async setItem(key: string, value: string) {
    if (this.fail) throw new Error('write');
    this.values.set(key, value);
  }
}
async function mobile() {
  const storage = new Storage();
  const saves = new MobileSaveStore(storage);
  const feedback = vi.fn();
  const controller = new MobileGameController(saves, feedback, () => 0.999999);
  await controller.initialize();
  controller.start('normal');
  controller.upgrade('hunterMastery');
  controller.confirm();
  return { controller, saves, storage, feedback };
}
function frames(controller: MobileGameController, seconds: number, fps = 60, start = 0) {
  for (let frame = 0; frame <= seconds * fps; frame++)
    controller.frame(start + (frame * 1000) / fps);
}

describe('mobile storage checkpoints', () => {
  it('keeps the record when a new run starts before previous writes finish', async () => {
    const storage = new Storage();
    const saves = new MobileSaveStore(storage);
    const first = game();
    first.state.record = 50;
    const second = game();
    const a = saves.save(first);
    const b = saves.save(second);
    await Promise.all([a, b]);
    const loaded = new MobileSaveStore(storage);
    await loaded.load();
    expect(loaded.record).toBe(50);
  });
  it('serializes at request time and loads the newest complete snapshot', async () => {
    const storage = new Storage();
    const saves = new MobileSaveStore(storage);
    expect(await saves.load()).toBeNull();
    const session = game();
    const expected = snapshot(session);
    const writing = saves.save(session);
    session.shootLane(1);
    await writing;
    expect(await new MobileSaveStore(storage).load()).toEqual(expected);
    await saves.save(session);
    expect(await new MobileSaveStore(storage).load()).toEqual(snapshot(session));
    expect(storage.values.size).toBe(2);
  });
  it('falls back after a damaged write and preserves the damaged slot', async () => {
    const storage = new Storage();
    const saves = new MobileSaveStore(storage);
    const session = game();
    await saves.save(session);
    storage.values.set(MOBILE_SAVE_KEYS[0], '{partial');
    const restored = new MobileSaveStore(storage);
    expect(await restored.load()).toEqual(snapshot(session));
    expect(restored.lastError).not.toBeNull();
    expect(storage.values.get(MOBILE_SAVE_KEYS[0])).toBe('{partial');
  });
  it('does not resurrect a completed run from the backup', async () => {
    const storage = new Storage();
    const saves = new MobileSaveStore(storage);
    const session = game(15);
    session.state.record = 15;
    await saves.save(session);
    addSpider(session, 'normal', 0, 1, 100000);
    session.tick(1 / 60);
    expect(session.state.phase).toBe('gameOver');
    await saves.save(session);
    const restored = new MobileSaveStore(storage);
    expect(await restored.load()).toBeNull();
    expect(restored.record).toBe(15);
  });
  it('retains the previous checkpoint when storage becomes unavailable and recovers', async () => {
    const storage = new Storage();
    const saves = new MobileSaveStore(storage);
    const session = game();
    await saves.save(session);
    const original = new Map(storage.values);
    storage.fail = true;
    expect(await saves.save(session)).toBe(false);
    expect(storage.values).toEqual(original);
    expect(await new MobileSaveStore(storage).load()).toBeNull();
    storage.fail = false;
    expect(await saves.save(session)).toBe(true);
    expect(saves.lastError).toBeNull();
  });
  it.each([
    { format: 2, sequence: 1 },
    { format: 1, save: { version: 999 }, sequence: 1 },
  ])('never overwrites a future format: %j', async (future) => {
    const storage = new Storage();
    storage.values.set(MOBILE_SAVE_KEYS[0], JSON.stringify(future));
    const saves = new MobileSaveStore(storage);
    expect(await saves.load()).toBeNull();
    expect(saves.readOnly).toBe(true);
    expect(await saves.save(game())).toBe(false);
    expect(JSON.parse(storage.values.get(MOBILE_SAVE_KEYS[0])!)).toEqual(future);
  });
  it.each([
    null,
    {},
    { format: 1, sequence: -1, record: 0 },
    { format: 1, sequence: 1, record: 0, save: {} },
  ])('rejects malformed records without deleting them: %j', async (value) => {
    const storage = new Storage();
    storage.values.set(MOBILE_SAVE_KEYS[0], JSON.stringify(value));
    const saves = new MobileSaveStore(storage);
    expect(await saves.load()).toBeNull();
    expect(saves.lastError).not.toBeNull();
    expect(storage.values.size).toBe(1);
  });
  it('migrates a previous game schema inside the Android envelope', async () => {
    const storage = new Storage();
    const previous = { ...snapshot(game()), version: 17 };
    storage.values.set(
      MOBILE_SAVE_KEYS[0],
      JSON.stringify({ format: 1, sequence: 2, record: 7, save: previous }),
    );
    const saves = new MobileSaveStore(storage);
    const restored = await saves.load();
    expect(restored?.version).toBe(18);
    expect(saves.record).toBe(7);
  });
});

describe('mobile input through the public game session', () => {
  it('shares every rule with the Web session for the same commands and time', async () => {
    const { controller } = await mobile();
    const reference = new GameSession('normal', () => 0.999999);
    reference.upgradeTalent('hunterMastery');
    reference.confirmLevelUp();
    expect(controller.pressLane(0)).toBe(reference.shootLane(0));
    controller.releaseLane(0);
    frames(controller, 1);
    for (let i = 0; i < 60; i++) reference.tick(1 / 60);
    expect(snapshot(controller.game!)).toEqual(snapshot(reference));
  });
  it('repeats through normal energy/cooldown validation and stops on release', async () => {
    const { controller, feedback } = await mobile();
    expect(controller.pressLane(0)).toBe('shot');
    expect(controller.pressLane(0)).toBe('blocked');
    frames(controller, 4);
    const shots = feedback.mock.calls.filter(
      ([event]) => event.type === 'shoot' && event.result === 'shot',
    ).length;
    expect(shots).toBe(2);
    controller.releaseLane(0);
    frames(controller, 4, 60, 4000);
    expect(
      feedback.mock.calls.filter(([event]) => event.type === 'shoot' && event.result === 'shot'),
    ).toHaveLength(shots);
  });
  it('handles multiple fingers and rejects invalid lanes', async () => {
    const { controller } = await mobile();
    for (const lane of [-1, 9, 0.5, NaN]) expect(controller.pressLane(lane)).toBe('blocked');
    expect(controller.pressLane(0)).toBe('shot');
    expect(controller.pressLane(8)).toBe('shot');
    expect([...controller.heldLanes]).toEqual([0, 8]);
    controller.releaseLane(0);
    expect([...controller.heldLanes]).toEqual([8]);
  });
  it('freezes all resources in the background, rejects commands, and never catches up', async () => {
    const { controller, saves, storage } = await mobile();
    controller.pressLane(0);
    frames(controller, 1);
    controller.suspend();
    const before = snapshot(controller.game!);
    frames(controller, 60, 60, 100000);
    expect(snapshot(controller.game!)).toEqual(before);
    expect(controller.heldLanes.size).toBe(0);
    expect(controller.pressLane(1)).toBe('blocked');
    expect(controller.ability('heal')).toBe('level_locked');
    expect(controller.buy('unknown')).toBe(false);
    await saves.flush();
    const restored = new MobileGameController(new MobileSaveStore(storage));
    await restored.initialize();
    expect(restored.suspended).toBe(true);
    expect(snapshot(restored.game!)).toEqual(before);
    controller.resume();
    controller.frame(9999999);
    expect(snapshot(controller.game!)).toEqual(before);
    controller.frame(9999999 + 1000 / 60);
    expect(controller.state!.levelTimer).toBeLessThan(before.state.levelTimer);
  });
  it('keeps the game freeze ability separate from system suspension', async () => {
    const { controller } = await mobile();
    controller.state!.level = 4;
    expect(controller.ability('freeze')).toBe('activated');
    controller.suspend();
    controller.resume();
    expect(controller.state!.freezeActive).toBe(true);
    expect(controller.state!.phase).toBe('paused');
    frames(controller, 1);
    expect(controller.pressLane(1)).toBe('blocked');
    expect(controller.ability('freeze')).toBe('deactivated');
    expect(controller.state!.phase).toBe('playing');
  });
  it('has the same bounded repeat rate with zero cooldown on 60 and 120 Hz displays', async () => {
    const run = async (fps: number) => {
      const { controller, feedback } = await mobile();
      controller.game!.state.character.setModifiers('test', [
        { stat: 'shootCooldown', kind: 'percent', value: -100 },
        { stat: 'shootCost', kind: 'percent', value: -100 },
      ]);
      controller.game!.refreshStats();
      controller.pressLane(0);
      frames(controller, 1, fps);
      return feedback.mock.calls.filter(
        ([event]) => event.type === 'shoot' && event.result === 'shot',
      ).length;
    };
    expect(await run(60)).toBe(60);
    expect(await run(120)).toBe(60);
  });
  it('saves periodically, handles phase changes and releases listeners', async () => {
    const { controller, saves, feedback } = await mobile();
    const notify = vi.fn();
    const draw = vi.fn();
    const off = controller.subscribe(notify);
    const offFrame = controller.subscribeFrame(draw);
    frames(controller, 6);
    await saves.flush();
    expect(draw).toHaveBeenCalled();
    expect(notify).toHaveBeenCalled();
    controller.state!.levelTimer = 0.001;
    controller.pressLane(0);
    frames(controller, 1, 60, 6000);
    expect(controller.state!.phase).toBe('levelUp');
    expect(controller.heldLanes.size).toBe(0);
    expect(controller.confirm()).toBe(false);
    expect(controller.upgrade('hunterMastery')).toBe(true);
    expect(controller.buy('unknown')).toBe(false);
    expect(controller.sell(-1)).toBe(false);
    expect(controller.confirm()).toBe(true);
    expect(feedback).toHaveBeenCalledWith({ type: 'phase', phase: 'playing' });
    await saves.flush();
    off();
    offFrame();
    notify.mockClear();
    draw.mockClear();
    frames(controller, 0.1);
    expect(notify).not.toHaveBeenCalled();
    expect(draw).not.toHaveBeenCalled();
  });
  it('does not run an uninitialized, missing, read-only or completed game', async () => {
    const controller = new MobileGameController(new MobileSaveStore(new Storage()));
    controller.start('normal');
    controller.resume();
    controller.frame(0);
    controller.frame(NaN);
    expect(controller.state).toBeNull();
    expect(controller.ability('heal')).toBe('level_locked');
    await controller.initialize();
    controller.saves.readOnly = true;
    controller.start('normal');
    expect(controller.state).toBeNull();
    controller.saves.readOnly = false;
    controller.start('normal');
    expect(controller.confirm()).toBe(false);
    controller.upgrade('hunterMastery');
    controller.confirm();
    addSpider(controller.game!, 'normal', 0, 1, 100000);
    frames(controller, 0.1);
    expect(controller.state!.phase).toBe('gameOver');
    controller.suspend();
    controller.resume();
    controller.frame(1000);
    expect(controller.suspended).toBe(true);
  });
});
