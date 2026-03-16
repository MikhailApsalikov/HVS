import type { DifficultyConfig, SpiderType } from '../config/types.js';

export abstract class Spider {
  private readonly _id: string = crypto.randomUUID();

  public get id(): string {
    return this._id;
  }
  public abstract readonly type: SpiderType;

  private _lane: number;
  private _y: number;
  private readonly _speed: number;
  private readonly _damage: number;
  private _slowFactor: number;
  private _slowTimer: number;
  private _dying: boolean;
  private _dyingTimer: number;
  private _armageddonDelay: number | null;

  public constructor(
    lane: number,
    y: number = 0,
    speed: number,
    damage: number
  ) {
    this._lane = lane;
    this._y = y;
    this._speed = speed;
    this._damage = damage;
    this._slowFactor = 1.0;
    this._slowTimer = 0;
    this._dying = false;
    this._dyingTimer = 0;
    this._armageddonDelay = null;
  }

  public get lane(): number {
    return this._lane;
  }

  public get y(): number {
    return this._y;
  }

  public get speed(): number {
    return this._speed;
  }

  public get damage(): number {
    return this._damage;
  }

  public get slowFactor(): number {
    return this._slowFactor;
  }

  public get slowTimer(): number {
    return this._slowTimer;
  }

  public get dying(): boolean {
    return this._dying;
  }

  public get dyingTimer(): number {
    return this._dyingTimer;
  }

  public get armageddonDelay(): number | null {
    return this._armageddonDelay;
  }

  public get isAlive(): boolean {
    return !this._dying;
  }

  public get effectiveSpeed(): number {
    return this._speed * this._slowFactor;
  }

  public move(dt: number): void {
    this._y += this.effectiveSpeed * dt;
  }

  public applySlow(factor: number, duration: number): void {
    this._slowFactor = factor;
    this._slowTimer = duration;
  }

  public tickSlow(dt: number): void {
    this._slowTimer -= dt;
    if (this._slowTimer <= 0) {
      this._slowTimer = 0;
      this._slowFactor = 1.0;
    }
  }

  public startDying(dyingDuration: number = 0.3): void {
    this._dying = true;
    this._dyingTimer = dyingDuration;
  }

  public tickDying(dt: number): void {
    this._dyingTimer -= dt;
  }

  public changeLane(newLane: number): void {
    this._lane = newLane;
  }

  public scheduleArmageddon(delay: number): void {
    this._armageddonDelay = delay;
  }

  public tickArmageddon(dt: number): boolean {
    if (this._armageddonDelay === null) {
      return false;
    }
    this._armageddonDelay -= dt;
    if (this._armageddonDelay <= 0) {
      this._armageddonDelay = null;
      return true;
    }
    return false;
  }

  protected static computeBaseSpeed(config: DifficultyConfig, level: number): number {
    return (config.spiderSpeedBase + config.spiderSpeedStep * (level - 1)) * (0.7 + Math.random() * 0.6);
  }

  protected static computeBaseDamage(config: DifficultyConfig, level: number): number {
    return (config.spiderDamageBase + config.spiderDamageStep * (level - 1)) * (0.7 + Math.random() * 0.6);
  }
}

export class NormalSpider extends Spider {
  public readonly type = 'normal' as const;

  public static create(lane: number, level: number, config: DifficultyConfig): Spider {
    const speed = Spider.computeBaseSpeed(config, level);
    const damage = Spider.computeBaseDamage(config, level);
    return new NormalSpider(lane, 0, speed, damage);
  }
}

export class FatSpider extends Spider {
  public readonly type = 'fat' as const;

  public static create(lane: number, level: number, config: DifficultyConfig): Spider {
    const speed = Spider.computeBaseSpeed(config, level);
    const damage = Spider.computeBaseDamage(config, level);
    return new FatSpider(lane, 0, speed, damage);
  }
}

export class FastSpider extends Spider {
  public readonly type = 'fast' as const;

  public static create(lane: number, level: number, config: DifficultyConfig): Spider {
    const baseSpeed = Spider.computeBaseSpeed(config, level);
    const baseDamage = Spider.computeBaseDamage(config, level);
    const speed = baseSpeed * 2;
    const damage = baseDamage * 0.5;
    return new FastSpider(lane, 0, speed, damage);
  }
}

export class BurnerSpider extends Spider {
  public readonly type = 'burner' as const;

  public static create(lane: number, level: number, config: DifficultyConfig): Spider {
    const speed = Spider.computeBaseSpeed(config, level);
    const baseDamage = Spider.computeBaseDamage(config, level);
    const damage = baseDamage * 0.1;
    return new BurnerSpider(lane, 0, speed, damage);
  }
}

export class NinjaSpider extends Spider {
  public readonly type = 'ninja' as const;

  private _hasJumped: boolean = false;
  private readonly _jumpThreshold: number;

  public constructor(
    lane: number,
    y: number,
    speed: number,
    damage: number,
    jumpThreshold: number
  ) {
    super(lane, y, speed, damage);
    this._jumpThreshold = jumpThreshold;
  }

  public get hasJumped(): boolean {
    return this._hasJumped;
  }

  public get jumpThreshold(): number {
    return this._jumpThreshold;
  }

  public markJumped(): void {
    this._hasJumped = true;
  }

  public static create(lane: number, level: number, config: DifficultyConfig): Spider {
    const speed = Spider.computeBaseSpeed(config, level);
    const damage = Spider.computeBaseDamage(config, level);
    const jumpThreshold = 0.1 + Math.random() * 0.4;
    return new NinjaSpider(lane, 0, speed, damage, jumpThreshold);
  }
}

export class TankSpider extends Spider {
  public readonly type = 'tank' as const;

  public static create(lane: number, level: number, config: DifficultyConfig): Spider {
    const baseSpeed = Spider.computeBaseSpeed(config, level);
    const baseDamage = Spider.computeBaseDamage(config, level);
    const speed = baseSpeed * 0.6;
    const damage = baseDamage * 4;
    return new TankSpider(lane, 0, speed, damage);
  }
}
