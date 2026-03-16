import type { DifficultyConfig } from '../config/types.js';

export class Arrow {
  private readonly _id: string = crypto.randomUUID();
  private _lane: number;
  private _y: number;
  private readonly _speed: number;
  private readonly _fromVolley: boolean;

  public constructor(
    lane: number,
    speed: number,
    fromVolley: boolean = false
  ) {
    this._lane = lane;
    this._y = 1.0;
    this._speed = speed;
    this._fromVolley = fromVolley;
  }

  public get id(): string {
    return this._id;
  }

  public get lane(): number {
    return this._lane;
  }

  public get y(): number {
    return this._y;
  }

  public get fromVolley(): boolean {
    return this._fromVolley;
  }

  public get hasLeft(): boolean {
    return this._y < 0;
  }

  public move(dt: number): void {
    this._y -= this._speed * dt;
  }

  public static create(
    lane: number,
    config: DifficultyConfig,
    speedMultiplier: number = 1,
    fromVolley: boolean = false
  ): Arrow {
    const speed = (1 / config.arrowTravelTime) * speedMultiplier;
    return new Arrow(lane, speed, fromVolley);
  }
}
