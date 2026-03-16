import type { DifficultyConfig } from '../config/types.js';
import type { GameState } from './GameState.js';
import type { Spider } from '../entities/Spider.js';
import type { FormulaCalculator } from './FormulaCalculator.js';
import {
  NormalSpider,
  FatSpider,
  FastSpider,
  BurnerSpider,
  NinjaSpider,
} from '../entities/Spider.js';

export class SpiderSpawner {
  private readonly _formula: FormulaCalculator;
  private readonly _config: DifficultyConfig;
  private _spawnAccumulator: number = 0;

  public constructor(formula: FormulaCalculator, config: DifficultyConfig) {
    this._formula = formula;
    this._config = config;
  }

  public tick(dt: number, state: GameState): void {
    this._spawnAccumulator += dt;
    const interval = this._config.spawnTickInterval;
    const level = state.level;

    while (this._spawnAccumulator >= interval) {
      this._spawnAccumulator -= interval;

      for (let lane = 0; lane < 9; lane++) {
        const p = this._formula.spawnProbability(level);
        if (Math.random() >= p) {
          continue;
        }

        const spider = SpiderSpawner.createSpider(lane, level, this._config);
        state.addSpider(spider);
      }
    }
  }

  public reset(): void {
    this._spawnAccumulator = 0;
  }

  private static createSpider(
    lane: number,
    level: number,
    config: DifficultyConfig
  ): Spider {
    if (level >= 35 && Math.random() < 0.02) {
      return NinjaSpider.create(lane, level, config);
    }
    if (level >= 20 && Math.random() < 0.03) {
      return FastSpider.create(lane, level, config);
    }
    if (level >= 10 && Math.random() < 0.05) {
      return FatSpider.create(lane, level, config);
    }
    if (level >= 5 && Math.random() < 0.01) {
      return BurnerSpider.create(lane, level, config);
    }

    return NormalSpider.create(lane, level, config);
  }
}
