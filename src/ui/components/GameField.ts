import type { GameState } from '../../core/GameState.js';
import type { SpriteRegistry } from '../SpriteRegistry.js';
import type { Spider } from '../../entities/Spider.js';
import type { HUD } from './HUD.js';
import { TooltipManager } from './TooltipManager.js';

const SPIDER_SPRITE_MAP: Record<string, string> = {
  normal: 'SpiderNormal',
  fat: 'SpiderFat',
  fast: 'SpiderFast',
  ninja: 'SpiderNinja',
  burner: 'SpiderBurner',
  tank: 'SpiderTank',
};

export class GameField {
  private _container: HTMLElement;
  private _lanesArea: HTMLElement;
  private _archersRow: HTMLElement;
  private _lanes: HTMLElement[] = [];
  private _spiderElements: Map<string, HTMLElement> = new Map();
  private _arrowElements: Map<string, HTMLElement> = new Map();
  private _archerButtons: HTMLElement[] = [];
  private readonly _spriteRegistry: SpriteRegistry;
  private _hud: HUD | null = null;
  private readonly _tooltip = TooltipManager.getInstance();
  private _lastSpiderPositions: Map<string, { lane: number; y: number }> = new Map();

  public constructor(container: HTMLElement, spriteRegistry: SpriteRegistry) {
    this._container = container;
    this._spriteRegistry = spriteRegistry;
    this._lanesArea = document.createElement('div');
    this._archersRow = document.createElement('div');
    this._build();
  }

  public setHud(hud: HUD): void {
    this._hud = hud;
  }

  private _build(): void {
    this._container.className = 'game-field';
    this._container.dataset.component = 'game-field';

    this._lanesArea.className = 'game-field__lanes';

    const grassSvg = this._spriteRegistry.get('Grass');
    if (grassSvg) {
      const encoded = 'data:image/svg+xml,' + encodeURIComponent(grassSvg);
      this._lanesArea.style.backgroundImage = `url("${encoded}")`;
      this._lanesArea.style.backgroundRepeat = 'repeat';
      this._lanesArea.style.backgroundSize = '64px 64px';
    }

    for (let i = 0; i < 9; i++) {
      const lane = document.createElement('div');
      lane.className = 'lane';
      lane.dataset.lane = String(i);
      this._lanesArea.appendChild(lane);
      this._lanes.push(lane);
    }
    this._container.appendChild(this._lanesArea);

    this._archersRow.className = 'game-field__archers';
    for (let i = 0; i < 9; i++) {
      const laneWrapper = document.createElement('div');
      laneWrapper.className = 'archer-btn-lane';

      const btn = document.createElement('button');
      btn.className = 'archer-btn';
      btn.dataset.lane = String(i);
      btn.type = 'button';
      const numLabel = document.createElement('span');
      numLabel.className = 'archer-btn__number';
      numLabel.textContent = String(i + 1);
      btn.appendChild(numLabel);
      const iconWrap = document.createElement('span');
      iconWrap.className = 'archer-btn__icon';
      iconWrap.innerHTML = this._spriteRegistry.get('Archer');
      btn.appendChild(iconWrap);
      const laneNum = i + 1;
      btn.addEventListener('mouseenter', () => {
        const html = this._hud?.getShootTooltipHtml(laneNum);
        if (html) this._tooltip.show(btn, html);
      });
      btn.addEventListener('mouseleave', () => this._tooltip.hide());
      this._archerButtons.push(btn);
      laneWrapper.appendChild(btn);
      this._archersRow.appendChild(laneWrapper);
    }
    this._container.appendChild(this._archersRow);
  }

  public render(state: GameState): void {
    this._renderSpiders(state);
    this._renderArrows(state);
    this._renderArchers(state);
  }

  private _renderArchers(state: GameState): void {
    const archers = state.archers;
    for (let i = 0; i < this._archerButtons.length; i++) {
      const archer = archers[i];
      const btn = this._archerButtons[i];
      if (archer && btn) {
        const cdPct = archer.cooldownFraction * 100;
        btn.style.setProperty('--cd-pct', `${cdPct}%`);
        btn.classList.toggle('archer-btn--cooldown', !archer.isReady);
      }
    }
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
      this._lastSpiderPositions.set(spider.id, { lane: spider.lane, y: spider.y });
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

  public getArchersRow(): HTMLElement {
    return this._archersRow;
  }

  public showCoinDrop(spiderId: string, coins: number, isJackpot: boolean = false): void {
    const pos = this._lastSpiderPositions.get(spiderId);
    if (!pos) return;

    const laneEl = this._lanes[pos.lane];
    if (!laneEl) return;

    const coinEl = document.createElement('div');
    coinEl.className = isJackpot ? 'coin-drop coin-drop--jackpot' : 'coin-drop';
    const coinSvg = this._spriteRegistry.get('Coin');
    coinEl.innerHTML = `+${coins} ${coinSvg}`;
    coinEl.style.top = `calc(${pos.y} * 100%)`;
    laneEl.appendChild(coinEl);

    coinEl.addEventListener('animationend', () => coinEl.remove());
    this._lastSpiderPositions.delete(spiderId);
  }

  public showDamagePop(spiderId: string, hpDamage: number, energyBurn: number): void {
    const pos = this._lastSpiderPositions.get(spiderId);
    if (!pos) return;

    const laneEl = this._lanes[pos.lane];
    if (!laneEl) return;

    if (hpDamage > 0) {
      const el = document.createElement('div');
      el.className = 'damage-pop damage-pop--hp';
      el.textContent = `-${Math.floor(hpDamage)}`;
      el.style.top = `calc(${pos.y} * 100%)`;
      laneEl.appendChild(el);
      el.addEventListener('animationend', () => el.remove());
    }

    if (energyBurn > 0) {
      const el = document.createElement('div');
      el.className = 'damage-pop damage-pop--energy';
      el.textContent = `-${Math.floor(energyBurn)}`;
      el.style.top = `calc(${pos.y} * 100%)`;
      el.style.left = 'calc(50% + 15px)';
      laneEl.appendChild(el);
      el.addEventListener('animationend', () => el.remove());
    }
  }
}
