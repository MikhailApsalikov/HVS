import type { GameState } from './GameState.js';
import type { Spider } from '../entities/Spider.js';
import type { Arrow } from '../entities/Arrow.js';
import { NormalSpider } from '../entities/Spider.js';

const HIT_RADIUS = 0.05;

export class ArrowSystem {
  public constructor() {}


  public tick(dt: number, state: GameState): void {
    const arrowsToRemove: string[] = [];

    for (const [id, arrow] of state.arrows) {
      arrow.move(dt);

      if (arrow.hasLeft) {
        arrowsToRemove.push(id);
        continue;
      }

      const hitSpider = this.findHitSpider(arrow, state);
      if (hitSpider !== null) {
        this._applyArrowHit(hitSpider, state);
        arrowsToRemove.push(id);
      }
    }

    for (const id of arrowsToRemove) {
      state.removeArrow(id);
    }
  }

  public checkCollisions(state: GameState): void {
    const arrowsToRemove: string[] = [];

    for (const [id, arrow] of state.arrows) {
      if (arrow.hasLeft) {
        continue;
      }

      const hitSpider = this.findHitSpider(arrow, state);
      if (hitSpider !== null) {
        this._applyArrowHit(hitSpider, state);
        arrowsToRemove.push(id);
      }
    }

    for (const id of arrowsToRemove) {
      state.removeArrow(id);
    }
  }

  private _applyArrowHit(spider: Spider, state: GameState): void {
    if (spider.type === 'fat') {
      const normal = new NormalSpider(spider.lane, spider.y, spider.speed, spider.damage);
      if (spider.slowTimer > 0) {
        normal.applySlow(spider.slowFactor, spider.slowTimer);
      }
      if (spider.armageddonDelay !== null) {
        normal.scheduleArmageddon(spider.armageddonDelay);
      }
      state.removeSpider(spider.id);
      state.addSpider(normal);
    } else {
      spider.startDying();
    }
  }

  private findHitSpider(arrow: Arrow, state: GameState): Spider | null {
    let best: Spider | null = null;

    for (const [, spider] of state.spiders) {
      if (spider.dying || spider.lane !== arrow.lane) {
        continue;
      }
      if (Math.abs(arrow.y - spider.y) >= HIT_RADIUS) {
        continue;
      }
      if (best === null || spider.y > best.y) {
        best = spider;
      }
    }

    return best;
  }
}
