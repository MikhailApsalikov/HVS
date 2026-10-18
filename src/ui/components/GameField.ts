import type { GameState } from '../../domain/model/GameState.js';
import type { SpriteRegistry } from '../SpriteRegistry.js';
import type { Spider } from '../../domain/model/Spider.js';
import type { HUD } from './GameHud.js';
import { WORLD } from '../../domain/rules/world.js';
import { IMPROVED_CRITICAL_SHOT_POWER } from '../../domain/rules/stats.js';
import { TooltipManager } from './TooltipManager.js';
import type { GameEvent } from '../../domain/events.js';
import { chainLightningMarkup, electricWrap, fireExplosionMarkup } from '../magicEffects.js';

const SPIDER_SPRITE_MAP: Record<Spider['type'], string> = {
  normal: 'SpiderNormal',
  golden: 'SpiderGolden',
  megaFat: 'SpiderMegaFat',
  fat: 'SpiderFat',
  fast: 'SpiderFast',
  poisonous: 'SpiderPoisonous',
  cleanser: 'SpiderCleanser',
  ninja: 'SpiderNinja',
  burner: 'SpiderBurner',
  tank: 'SpiderTank',
};

export class GameField {
  private _container: HTMLElement;
  private _lanesArea: HTMLElement;
  private _archersRow: HTMLElement;
  private readonly _effects = document.createElement('div');
  private _lanes: HTMLElement[] = [];
  private _spiderElements: Map<string, HTMLElement> = new Map();
  private _arrowElements: Map<string, HTMLElement> = new Map();
  private readonly _magicElements = new Set<HTMLElement>();
  private _archerButtons: HTMLElement[] = [];
  private readonly _spriteRegistry: SpriteRegistry;
  private _hud: HUD | null = null;
  private readonly _tooltip = TooltipManager.getInstance();
  private _lastSpiderPositions: Map<string, { lane: number; y: number; type: Spider['type'] }> =
    new Map();

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

    for (let i = 0; i < WORLD.lanes; i++) {
      const lane = document.createElement('div');
      lane.className = 'lane';
      lane.dataset.lane = String(i);
      this._lanesArea.appendChild(lane);
      this._lanes.push(lane);
    }
    this._effects.className = 'game-field__effects';
    this._lanesArea.appendChild(this._effects);
    this._container.appendChild(this._lanesArea);

    this._archersRow.className = 'game-field__archers';
    for (let i = 0; i < WORLD.lanes; i++) {
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
      const electricity = document.createElement('span');
      electricity.className = 'electric-wrap electric-wrap--archer';
      electricity.innerHTML = electricWrap('archer');
      btn.appendChild(electricity);
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
    this._container.classList.toggle('game-field--paused', state.phase !== 'playing');
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
        (btn as HTMLButtonElement).disabled = state.isStunned;
        const cdPct = archer.cooldownFraction * 100;
        btn.style.setProperty('--cd-pct', `${cdPct}%`);
        btn.classList.toggle('archer-btn--cooldown', !archer.isReady);
        btn.classList.toggle('archer-btn--lightning', state.lightningCharges[i]);
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
      if (el.dataset.spiderType !== spider.type) {
        el.innerHTML = this._spriteRegistry.get(SPIDER_SPRITE_MAP[spider.type]);
        el.dataset.spiderType = spider.type;
      }
      el.classList.toggle('spider--slowed', spider.slowFactor < 1);
      el.classList.toggle('spider--dying', spider.dying);
      this._lastSpiderPositions.set(spider.id, {
        lane: spider.lane,
        y: spider.y,
        type: spider.type,
      });
    }
    for (const [id, el] of this._spiderElements) {
      if (!currentIds.has(id)) {
        el.remove();
        this._spiderElements.delete(id);
        this._lastSpiderPositions.delete(id);
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
      el.classList.toggle('arrow--critical', arrow.power > 1);
      el.classList.toggle('arrow--triple', arrow.power === IMPROVED_CRITICAL_SHOT_POWER);
      el.classList.toggle('arrow--lightning', arrow.lightningJumps > 0);
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
    div.innerHTML = `${this._spriteRegistry.get('Arrow')}<span class="electric-wrap electric-wrap--arrow">${electricWrap('arrow')}</span>`;
    return div;
  }

  public getContainer(): HTMLElement {
    return this._container;
  }

  public getEffectsContainer(): HTMLElement {
    return this._effects;
  }

  public reset(): void {
    for (const lane of this._lanes) lane.replaceChildren();
    this._spiderElements.clear();
    this._arrowElements.clear();
    this._lastSpiderPositions.clear();
    for (const element of this._magicElements) element.remove();
    this._magicElements.clear();
    this._tooltip.hide();
  }

  public getArchersRow(): HTMLElement {
    return this._archersRow;
  }

  public showMagicEffect(event: Extract<GameEvent, { type: 'lightning' | 'fireExplosion' }>): void {
    const element = document.createElement('div');
    element.className = `magic-effect magic-effect--${event.type}`;
    if (event.type === 'lightning') {
      const from = { x: (event.from.lane + 0.5) * 100, y: event.from.y * 900 };
      const to = { x: (event.to.lane + 0.5) * 100, y: event.to.y * 900 };
      element.innerHTML = chainLightningMarkup(from, to);
      element.style.setProperty('--target-x', `${((event.to.lane + 0.5) / WORLD.lanes) * 100}%`);
      element.style.setProperty('--target-y', `${event.to.y * 100}%`);
    } else {
      element.style.setProperty('--target-x', `${((event.lane + 0.5) / WORLD.lanes) * 100}%`);
      element.style.setProperty('--target-y', `${event.y * 100}%`);
      element.style.setProperty('--blast-diameter', `${((event.radius * 2) / WORLD.lanes) * 100}%`);
      element.style.setProperty(
        '--blast-height',
        `${((event.verticalRadius * 2) / WORLD.lanes) * 100}%`,
      );
      element.innerHTML = fireExplosionMarkup();
    }
    this._magicElements.add(element);
    this._effects.appendChild(element);
    element.addEventListener('animationend', (animation) => {
      if (animation.target !== element) return;
      element.remove();
      this._magicElements.delete(element);
    });
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
  }

  public showResourceGain(
    spiderId: string,
    hp: number,
    energy: number,
    reason: 'kill' | 'breach',
  ): void {
    const pos = this._lastSpiderPositions.get(spiderId);
    if (!pos || (hp <= 0 && energy <= 0)) return;

    const laneEl = this._lanes[pos.lane];
    if (!laneEl) return;

    const el = document.createElement('div');
    el.className = 'resource-pop';
    el.style.top = `calc(${pos.y} * 100% ${reason === 'kill' ? '+ 36px' : '- 56px'})`;
    for (const [kind, amount] of [
      ['hp', hp],
      ['energy', energy],
    ] as const) {
      if (amount <= 0) continue;
      const gain = document.createElement('span');
      gain.className = `resource-pop__${kind}`;
      gain.textContent = `+${Number(amount.toFixed(1)) || '<0.1'}`;
      el.appendChild(gain);
    }
    laneEl.appendChild(el);
    el.addEventListener('animationend', () => el.remove());
  }

  public showDamagePop(
    spiderId: string,
    hpDamage: number,
    energyBurn: number,
    blockedDamage?: number,
    dodged = false,
    piercing = false,
  ): void {
    const pos = this._lastSpiderPositions.get(spiderId);
    if (!pos) return;

    const laneEl = this._lanes[pos.lane];
    if (!laneEl) return;

    if (hpDamage > 0 || blockedDamage !== undefined || dodged) {
      const el = document.createElement('div');
      el.className = 'damage-pop damage-pop--hp';
      el.classList.toggle('damage-pop--dodge', dodged);
      el.classList.toggle('damage-pop--heavy', pos.type === 'tank' && hpDamage > 0);
      el.classList.toggle('damage-pop--piercing', piercing && hpDamage > 0);
      el.textContent = dodged ? 'Уклонение' : hpDamage === 0 ? 'Блок' : `-${hpDamage}`;
      if (blockedDamage !== undefined && hpDamage > 0) {
        const block = document.createElement('span');
        block.className = 'damage-pop__blocked';
        block.textContent = ` (блок ${blockedDamage})`;
        el.append(block);
      }
      el.style.top = `calc(${pos.y} * 100%)`;
      laneEl.appendChild(el);
      el.addEventListener('animationend', () => el.remove());
    }

    if (energyBurn > 0) {
      const el = document.createElement('div');
      el.className = 'damage-pop damage-pop--energy';
      el.textContent = `-${Math.floor(energyBurn)}`;
      el.style.top = `calc(${pos.y} * 100% - 28px)`;
      laneEl.appendChild(el);
      el.addEventListener('animationend', () => el.remove());
    }
  }
}
