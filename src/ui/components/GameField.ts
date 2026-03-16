import type { GameState } from '../../core/GameState.js';
import type { SpriteRegistry } from '../SpriteRegistry.js';
import type { Spider } from '../../entities/Spider.js';

const SPIDER_SPRITE_MAP: Record<string, string> = {
  normal: 'SpiderNormal',
  fat: 'SpiderFat',
  fast: 'SpiderFast',
  ninja: 'SpiderNinja',
  burner: 'SpiderBurner',
};

export class GameField {
  private _container: HTMLElement;
  private _lanes: HTMLElement[] = [];
  private _spiderElements: Map<string, HTMLElement> = new Map();
  private _arrowElements: Map<string, HTMLElement> = new Map();
  private readonly _spriteRegistry: SpriteRegistry;

  public constructor(container: HTMLElement, spriteRegistry: SpriteRegistry) {
    this._container = container;
    this._spriteRegistry = spriteRegistry;
    this._buildLanes();
  }

  private _buildLanes(): void {
    this._container.className = 'game-field';
    this._container.dataset.component = 'game-field';
    for (let i = 0; i < 9; i++) {
      const lane = document.createElement('div');
      lane.className = 'lane';
      lane.dataset.lane = String(i);
      this._container.appendChild(lane);
      this._lanes.push(lane);
    }
  }

  public render(state: GameState): void {
    this._renderSpiders(state);
    this._renderArrows(state);
  }

  private _renderSpiders(state: GameState): void {
    const currentIds = new Set<string>();
    for (const spider of state.spiders.values()) {
      currentIds.add(spider.id);
      let el = this._spiderElements.get(spider.id);
      if (!el) {
        el = this._createSpiderElement(spider);
        this._spiderElements.set(spider.id, el);
        const laneEl = this._lanes[spider.lane];
        if (laneEl) laneEl.appendChild(el);
      }
      const currentLane = parseInt(el.dataset.lane ?? '-1', 10);
      if (currentLane !== spider.lane) {
        el.dataset.lane = String(spider.lane);
        const newLaneEl = this._lanes[spider.lane];
        if (newLaneEl) newLaneEl.appendChild(el);
      }
      el.style.setProperty('--y', String(spider.y));
      el.classList.toggle('spider--slowed', spider.slowFactor < 1);
      el.classList.toggle('spider--dying', spider.dying);
    }
    for (const [id, el] of this._spiderElements) {
      if (!currentIds.has(id)) {
        el.remove();
        this._spiderElements.delete(id);
      }
    }
  }

  private _createSpiderElement(spider: Spider): HTMLElement {
    const div = document.createElement('div');
    div.className = 'spider spider--walk';
    div.dataset.spiderId = spider.id;
    div.dataset.lane = String(spider.lane);
    const spriteName = SPIDER_SPRITE_MAP[spider.type] ?? 'SpiderNormal';
    div.innerHTML = this._spriteRegistry.get(spriteName);
    return div;
  }

  private _renderArrows(state: GameState): void {
    const currentIds = new Set<string>();
    for (const arrow of state.arrows.values()) {
      currentIds.add(arrow.id);
      let el = this._arrowElements.get(arrow.id);
      if (!el) {
        el = this._createArrowElement();
        this._arrowElements.set(arrow.id, el);
        const laneEl = this._lanes[arrow.lane];
        if (laneEl) laneEl.appendChild(el);
      }
      el.style.setProperty('--y', String(arrow.y));
    }
    for (const [id, el] of this._arrowElements) {
      if (!currentIds.has(id)) {
        el.remove();
        this._arrowElements.delete(id);
      }
    }
  }

  private _createArrowElement(): HTMLElement {
    const div = document.createElement('div');
    div.className = 'arrow';
    div.innerHTML = this._spriteRegistry.get('Arrow');
    return div;
  }

  public getContainer(): HTMLElement {
    return this._container;
  }
}
