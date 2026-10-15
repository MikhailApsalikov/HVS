import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { GameField } from '../src/ui/components/GameField.js';
import type { SpriteRegistry } from '../src/ui/SpriteRegistry.js';
import { StandShieldOverlay } from '../src/ui/overlays/StandShieldOverlay.js';
import { addSpider, game } from './helpers.js';

class ElementDouble {
  className = '';
  innerHTML = '';
  textContent = '';
  dataset: Record<string, string> = {};
  style = { top: '', setProperty: vi.fn() };
  children: ElementDouble[] = [];
  private parent: ElementDouble | null = null;
  private listeners = new Map<string, (() => void)[]>();
  classList = {
    contains: (name: string) => this.className.split(' ').includes(name),
    toggle: (name: string, active: boolean) => {
      const names = new Set(this.className.split(' ').filter(Boolean));
      if (active) names.add(name);
      else names.delete(name);
      this.className = [...names].join(' ');
    },
    remove: (name: string) => this.classList.toggle(name, false),
    add: (name: string) => this.classList.toggle(name, true),
  };
  setAttribute(): void {}
  appendChild(child: ElementDouble): void {
    child.remove();
    child.parent = this;
    this.children.push(child);
  }
  append(...children: ElementDouble[]): void {
    children.forEach((child) => this.appendChild(child));
  }
  replaceChildren(): void {
    [...this.children].forEach((child) => child.remove());
  }
  remove(): void {
    if (this.parent) this.parent.children = this.parent.children.filter((child) => child !== this);
    this.parent = null;
  }
  addEventListener(name: string, listener: () => void): void {
    this.listeners.set(name, [...(this.listeners.get(name) ?? []), listener]);
  }
  finishAnimation(): void {
    this.listeners.get('animationend')?.forEach((listener) => listener());
  }
}

let field: GameField;
let container: ElementDouble;
beforeEach(async () => {
  vi.resetModules();
  vi.stubGlobal('document', {
    createElement: () => new ElementDouble(),
    body: new ElementDouble(),
  });
  const { GameField } = await import('../src/ui/components/GameField.js');
  container = new ElementDouble();
  field = new GameField(
    container as unknown as HTMLElement,
    {
      get: () => '<svg></svg>',
    } as unknown as SpriteRegistry,
  );
});
afterEach(() => vi.unstubAllGlobals());

function lane(index = 0): ElementDouble {
  return container.children[0].children[index];
}

describe('combat feedback without a browser', () => {
  it('keeps simultaneous defensive effects inside a separate layer above the lanes', () => {
    const effects = field.getEffectsContainer() as unknown as ElementDouble;
    const lanesArea = container.children[0];
    const archersRow = field.getArchersRow() as unknown as ElementDouble;
    const fieldChildren = [...container.children];
    const laneElements = lanesArea.children.filter((element) => element.className === 'lane');
    const sprites = { get: () => '<svg></svg>' } as unknown as SpriteRegistry;
    const shield = new StandShieldOverlay(effects as unknown as HTMLElement, sprites);
    const block = new StandShieldOverlay(effects as unknown as HTMLElement, sprites, 'lastHope');

    shield.show();
    block.show();
    shield.updateTimer(5);
    block.updateTimer(12);
    expect(shield.isVisible()).toBe(true);
    expect(block.isVisible()).toBe(true);
    expect(effects.children.map((effect) => effect.className)).toEqual([
      'shield-overlay stand-shield-overlay active',
      'shield-overlay last-hope-overlay active',
    ]);
    expect(effects.children.map((effect) => effect.children[0].className)).toEqual([
      'shield-overlay__readout',
      'shield-overlay__readout',
    ]);
    expect(effects.children.map((effect) => effect.children[0].children[1].textContent)).toEqual([
      '5 с',
      '12 с',
    ]);

    block.hide();
    shield.hide();
    block.show();
    expect(lanesArea.children).toEqual([...laneElements, effects]);
    expect(container.children).toEqual(fieldChildren);
    expect(container.children).toEqual([lanesArea, archersRow]);
    field.reset();
    expect(effects.children).toHaveLength(2);
    expect(laneElements.every((element) => element.children.length === 0)).toBe(true);
  });

  it.each([
    ['normal', false, false],
    ['normal', true, false],
    ['tank', false, true],
    ['tank', true, true],
  ] as const)('combines %s damage and piercing=%s in one number', (type, piercing, heavy) => {
    const session = game(61);
    const spider = addSpider(session, type);
    field.render(session.state);
    field.showDamagePop(spider.id, 80, 0, undefined, false, piercing);
    const pop = lane().children.find((element) => element.classList.contains('damage-pop'))!;
    expect(pop.textContent).toBe('-80');
    expect(pop.classList.contains('damage-pop--piercing')).toBe(piercing);
    expect(pop.classList.contains('damage-pop--heavy')).toBe(heavy);
    expect(
      lane().children.filter((element) => element.classList.contains('damage-pop')),
    ).toHaveLength(1);
    pop.finishAnimation();
    expect(lane().children).not.toContain(pop);
  });

  it('keeps evasion and fully blocked hits at their ordinary size', () => {
    const session = game(61);
    const spider = addSpider(session, 'tank');
    field.render(session.state);
    field.showDamagePop(spider.id, 0, 0, undefined, true, true);
    field.showDamagePop(spider.id, 0, 0, 80, false, true);
    const pops = lane().children.filter((element) => element.classList.contains('damage-pop'));
    expect(pops.map((pop) => pop.textContent)).toEqual(['Уклонение', 'Блок']);
    pops.forEach((pop) => {
      expect(pop.classList.contains('damage-pop--piercing')).toBe(false);
      expect(pop.classList.contains('damage-pop--heavy')).toBe(false);
    });
  });

  it('places both actual kill gains below coins even when the coin event arrives first', () => {
    const session = game();
    const spider = addSpider(session);
    field.render(session.state);
    field.showCoinDrop(spider.id, 5);
    field.showResourceGain(spider.id, 25, 4.3, 'kill');
    const coin = lane().children.find((element) => element.classList.contains('coin-drop'))!;
    const gain = lane().children.find((element) => element.classList.contains('resource-pop'))!;
    expect(gain.style.top).toBe('calc(0.5 * 100% + 36px)');
    expect(gain.children.map((element) => [element.className, element.textContent])).toEqual([
      ['resource-pop__hp', '+25'],
      ['resource-pop__energy', '+4.3'],
    ]);
    gain.finishAnimation();
    expect(lane().children).not.toContain(gain);
    expect(lane().children).toContain(coin);
    session.state.spiders.delete(spider.id);
    field.render(session.state);
    field.showResourceGain(spider.id, 25, 0, 'kill');
    expect(lane().children).toEqual([coin]);
  });

  it('places only positive breach energy above damage and energy burn', () => {
    const session = game();
    const spider = addSpider(session, 'burner', 0, 0.99);
    field.render(session.state);
    field.showDamagePop(spider.id, 20, 5);
    field.showResourceGain(spider.id, 0, 3, 'breach');
    field.showResourceGain(spider.id, 0, 0, 'breach');
    const gains = lane().children.filter((element) => element.classList.contains('resource-pop'));
    expect(gains).toHaveLength(1);
    expect(gains[0].style.top).toBe('calc(0.99 * 100% - 56px)');
    expect(gains[0].children.map((element) => [element.className, element.textContent])).toEqual([
      ['resource-pop__energy', '+3'],
    ]);
  });

  it('pauses feedback with the game and resets all feedback between runs', () => {
    const session = game();
    const spider = addSpider(session);
    field.render(session.state);
    field.showCoinDrop(spider.id, 5);
    field.showResourceGain(spider.id, 5, 1, 'kill');
    session.state.phase = 'levelUp';
    field.render(session.state);
    expect(container.classList.contains('game-field--paused')).toBe(true);
    session.state.phase = 'playing';
    field.render(session.state);
    expect(container.classList.contains('game-field--paused')).toBe(false);
    field.reset();
    field.showDamagePop(spider.id, 20, 0);
    field.showCoinDrop(spider.id, 5);
    field.showResourceGain(spider.id, 5, 1, 'kill');
    expect(lane().children).toEqual([]);
  });
});
