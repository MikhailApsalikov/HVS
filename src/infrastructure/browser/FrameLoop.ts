import { WORLD } from '../../domain/rules/world.js';

export interface FrameScheduler {
  request(callback: (timestamp: number) => void): number;
  cancel(id: number): void;
}
export const browserFrames: FrameScheduler = {
  request: (callback) => requestAnimationFrame(callback),
  cancel: (id) => cancelAnimationFrame(id),
};

/** Fixed simulation step; real elapsed time is never rounded to stat precision. */
export class FrameLoop {
  private frame: number | null = null;
  private previous: number | null = null;
  private accumulator = 0;
  private generation = 0;
  constructor(private readonly scheduler: FrameScheduler = browserFrames) {}
  start(tick: (dt: number) => void, render: () => boolean): void {
    this.stop();
    const generation = this.generation;
    const update = (timestamp: number) => {
      if (generation !== this.generation) return;
      if (this.previous !== null)
        this.accumulator += Math.min(
          Math.max(0, (timestamp - this.previous) / 1000),
          WORLD.maxFrameTime,
        );
      this.previous = timestamp;
      while (this.accumulator + Number.EPSILON >= WORLD.fixedStep) {
        tick(WORLD.fixedStep);
        this.accumulator = Math.max(0, this.accumulator - WORLD.fixedStep);
      }
      if (render() && generation === this.generation) this.frame = this.scheduler.request(update);
    };
    this.frame = this.scheduler.request(update);
  }
  stop(): void {
    this.generation += 1;
    if (this.frame !== null) this.scheduler.cancel(this.frame);
    this.frame = null;
    this.previous = null;
    this.accumulator = 0;
  }
}
