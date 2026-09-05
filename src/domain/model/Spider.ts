import type { SpiderType } from '../types.js';
import { WORLD } from '../rules/world.js';
import { calculate } from '../rules/numbers.js';
import { STATS } from '../rules/stats.js';

export class Spider {
  y = 0;
  previousY = 0;
  slowFactor = 1;
  slowTimer = 0;
  dying = false;
  dyingTimer = 0;
  reachedCastle = false;
  hasJumped = false;
  constructor(
    readonly id: string,
    public type: SpiderType,
    public lane: number,
    readonly speed: number,
    readonly damage: number,
    public hits: number,
    readonly jumpThreshold: number,
  ) {}
  get effectiveSpeed(): number {
    return calculate(
      this.speed,
      [{ source: 'blizzard', kind: 'percent', value: (this.slowFactor - 1) * 100 }],
      STATS.spiderSpeed.policy,
    ).value;
  }
  move(dt: number): void {
    this.previousY = this.y;
    this.y += this.effectiveSpeed * dt;
  }
  applySlow(factor: number, duration: number): void {
    this.slowFactor = factor;
    this.slowTimer = duration;
  }
  tickSlow(dt: number): void {
    this.slowTimer = Math.max(0, this.slowTimer - dt);
    if (this.slowTimer === 0) this.slowFactor = 1;
  }
  startDying(): void {
    if (!this.dying) {
      this.dying = true;
      this.dyingTimer = WORLD.deathDuration;
    }
  }
}
