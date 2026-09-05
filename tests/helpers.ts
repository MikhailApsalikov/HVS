import { GameSession } from '../src/domain/GameSession.js';
import { WORLD } from '../src/domain/rules/world.js';
import { Spider } from '../src/domain/model/Spider.js';
import { SPIDERS } from '../src/content/spiders.js';
import type { SpiderType } from '../src/domain/types.js';
import type { StoragePort } from '../src/infrastructure/storage/SaveSystem.js';

export function game(level = 1): GameSession {
  const session = new GameSession('normal', () => 0.999999);
  session.upgradeTalent('hunterMastery');
  session.confirmLevelUp();
  session.state.level = level;
  session.refreshStats();
  session.state.levelTimer = session.state.levelTimerMax = session.state.rules.levelDuration(level);
  return session;
}
export function advance(session: GameSession, seconds: number): void {
  const frames = Math.round(seconds / WORLD.fixedStep);
  for (let frame = 0; frame < frames; frame++) session.tick(WORLD.fixedStep);
}
export function addSpider(
  session: GameSession,
  type: SpiderType = 'normal',
  lane = 0,
  y = 0.5,
  damage = 20,
  speed = 0,
): Spider {
  const spider = new Spider(
    session.state.newId('spider'),
    type,
    lane,
    speed,
    damage,
    SPIDERS[type].hits,
    0.2,
  );
  spider.y = spider.previousY = y;
  session.state.spiders.set(spider.id, spider);
  return spider;
}
export class MemoryStorage implements StoragePort {
  readonly values = new Map<string, string>();
  getItem(key: string): string | null {
    return this.values.get(key) ?? null;
  }
  setItem(key: string, value: string): void {
    this.values.set(key, value);
  }
  removeItem(key: string): void {
    this.values.delete(key);
  }
}
