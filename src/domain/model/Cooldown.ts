import { clamp } from '../rules/numbers.js';

export class Cooldown {
  remainingCooldown = 0;
  duration = 0;
  get isReady(): boolean {
    return this.remainingCooldown <= 0;
  }
  get isOnCooldown(): boolean {
    return !this.isReady;
  }
  get cooldownFraction(): number {
    return this.duration > 0 ? clamp(this.remainingCooldown / this.duration, 0, 1) : 0;
  }
  start(duration: number): void {
    this.duration = duration;
    this.remainingCooldown = duration;
  }
  tick(dt: number): void {
    this.remainingCooldown = Math.max(0, this.remainingCooldown - dt);
  }
}
