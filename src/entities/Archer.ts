export class Archer {
  private readonly _lane: number;
  private _cooldown: number;
  private _maxCooldown: number;

  public constructor(lane: number, maxCooldown: number) {
    this._lane = lane;
    this._cooldown = 0;
    this._maxCooldown = maxCooldown;
  }

  public get lane(): number {
    return this._lane;
  }

  public get cooldown(): number {
    return this._cooldown;
  }

  public get maxCooldown(): number {
    return this._maxCooldown;
  }

  public get isReady(): boolean {
    return this._cooldown <= 0;
  }

  public get cooldownFraction(): number {
    return Math.min(Math.max(this._cooldown / this._maxCooldown, 0), 1);
  }

  public get remainingCooldown(): number {
    return this._cooldown;
  }

  public startCooldown(duration: number): void {
    this._cooldown = duration;
  }

  public tick(dt: number): void {
    this._cooldown -= dt;
    if (this._cooldown < 0) {
      this._cooldown = 0;
    }
  }

  public updateMaxCooldown(duration: number): void {
    this._maxCooldown = duration;
  }
}
