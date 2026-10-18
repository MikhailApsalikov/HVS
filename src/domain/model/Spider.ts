import type { SpiderType } from '../types.js';
import { WORLD } from '../rules/world.js';
import { calculate } from '../rules/numbers.js';
import { STATS } from '../rules/stats.js';
import { SPIDERS } from '../../content/spiders.js';

export class Spider {
  y = 0;
  previousY = 0;
  slowFactor = 1;
  slowTimer = 0;
  rootTimer = 0;
  dying = false;
  dyingTimer = 0;
  reachedCastle = false;
  jumpsMade = 0;
  constructor(
    readonly id: string,
    public type: SpiderType,
    public lane: number,
    readonly speed: number,
    readonly damage: number,
    public hits: number,
    readonly jumpThreshold: number,
    readonly jumpLimit = 0,
  ) {}
  get nextJumpThreshold(): number {
    return this.jumpThreshold + ((1 - this.jumpThreshold) * this.jumpsMade) / this.jumpLimit;
  }
  effectiveSpeed(passiveSlow = 0): number {
    return calculate(
      this.speed,
      [
        { source: 'blizzard', kind: 'percent', value: (this.slowFactor - 1) * 100 },
        { source: 'talent:permafrost', kind: 'percent', value: -passiveSlow * 100 },
      ],
      STATS.spiderSpeed.policy,
    ).value;
  }
  move(dt: number, passiveSlow: number): void {
    this.previousY = this.y;
    const movingTime = Math.max(0, dt - this.rootTimer);
    const rootRemaining = this.rootTimer - dt;
    this.rootTimer = rootRemaining > 1e-9 ? rootRemaining : 0;
    this.y += this.effectiveSpeed(passiveSlow) * movingTime;
  }
  applySlow(factor: number, duration: number): void {
    this.slowFactor = factor;
    this.slowTimer = duration;
  }
  tickSlow(dt: number): void {
    this.slowTimer = Math.max(0, this.slowTimer - dt);
    if (this.slowTimer === 0) this.slowFactor = 1;
  }
  takeHit(power: number): number {
    const damage = Math.min(this.hits, power);
    this.hits -= damage;
    if (this.hits <= 0) this.startDying();
    else if (this.type === 'megaFat' || this.type === 'fat')
      this.type = this.hits === SPIDERS.fat.hits ? 'fat' : 'normal';
    return damage;
  }
  startDying(): void {
    if (!this.dying) {
      this.dying = true;
      this.dyingTimer = WORLD.deathDuration;
    }
  }
}
