import type { DifficultyConfig } from '../config/types.js';

export class FormulaCalculator {
  private readonly _config: DifficultyConfig;

  public constructor(config: DifficultyConfig) {
    this._config = config;
  }

  public levelDuration(level: number): number {
    return this._config.levelTimerBase + this._config.levelTimerStep * level;
  }

  public spiderBaseSpeed(level: number): number {
    return this._config.spiderSpeedBase + this._config.spiderSpeedStep * (level - 1);
  }

  public spiderBaseDamage(level: number): number {
    return this._config.spiderDamageBase + this._config.spiderDamageStep * (level - 1);
  }

  public spawnProbability(level: number): number {
    return this._config.spawnP0 + this._config.spawnDP * (level - 1);
  }

  public randomVariance(): number {
    const v = this._config.spiderVariance;
    return 1 - v + Math.random() * 2 * v;
  }

  public randomInt(min: number, max: number): number {
    const lo = Math.ceil(min);
    const hi = Math.floor(max);
    return Math.floor(Math.random() * (hi - lo + 1)) + lo;
  }
}
