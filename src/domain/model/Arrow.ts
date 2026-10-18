import { CRITICAL_SHOT_POWER, STATS } from '../rules/stats.js';

export class Arrow {
  y = 1;
  previousY = 1;
  constructor(
    readonly id: string,
    readonly lane: number,
    readonly speed: number,
    readonly fromVolley = false,
    readonly critical = false,
    public power = critical ? CRITICAL_SHOT_POWER : 1,
    public lightningJumps = 0,
    public lightningDelay: number = STATS['lightningArrows.delay'].base,
  ) {}
  move(dt: number): void {
    this.previousY = this.y;
    this.y -= this.speed * dt;
  }
}
