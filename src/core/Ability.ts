import type { AbilityId } from '../config/types.js';

export class Ability {
  public readonly id: AbilityId;
  public readonly unlockedAtLevel: number;
  private _cooldown: number;
  private _maxCooldown: number;

  public constructor(
    id: AbilityId,
    unlockedAtLevel: number,
    maxCooldown: number
  ) {
    this.id = id;
    this.unlockedAtLevel = unlockedAtLevel;
    this._cooldown = 0;
    this._maxCooldown = maxCooldown;
  }

  public get isOnCooldown(): boolean {
    return this._cooldown > 0;
  }

  public get cooldownFraction(): number {
    return Math.min(Math.max(this._cooldown / this._maxCooldown, 0), 1);
  }

  public get remainingCooldown(): number {
    return this._cooldown;
  }

  public get maxCooldown(): number {
    return this._maxCooldown;
  }

  public activate(cooldownDuration: number): void {
    this._cooldown = cooldownDuration;
  }

  public tick(dt: number): void {
    this._cooldown -= dt;
    if (this._cooldown < 0) {
      this._cooldown = 0;
    }
  }

  public isAvailableAt(level: number): boolean {
    return level >= this.unlockedAtLevel;
  }

  public updateMaxCooldown(cd: number): void {
    this._maxCooldown = cd;
  }
}
