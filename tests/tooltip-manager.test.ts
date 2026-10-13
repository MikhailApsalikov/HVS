import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { TooltipManager } from '../src/ui/components/TooltipManager.js';

let tooltip: TooltipManager;
let visible: Set<string>;
let element: { innerHTML: string };

beforeEach(async () => {
  vi.resetModules();
  visible = new Set();
  const tipElement = {
    innerHTML: '',
    className: '',
    classList: {
      add: (name: string) => visible.add(name),
      remove: (name: string) => visible.delete(name),
    },
    offsetWidth: 120,
    offsetHeight: 80,
    style: {},
  };
  element = tipElement;
  vi.stubGlobal('document', {
    createElement: () => tipElement,
    body: { appendChild: vi.fn() },
  });
  vi.stubGlobal('window', { innerWidth: 800, innerHeight: 600 });
  const { TooltipManager } = await import('../src/ui/components/TooltipManager.js');
  tooltip = TooltipManager.getInstance();
});

afterEach(() => vi.unstubAllGlobals());

function anchor(): HTMLElement {
  return {
    getBoundingClientRect: () => ({ left: 400, right: 420, top: 100 }),
  } as HTMLElement;
}

describe('shared tooltip ownership', () => {
  it('protects a newer tooltip from the previous control’s hide request', () => {
    const effect = anchor();
    const resource = anchor();
    tooltip.show(effect, 'Effect');
    tooltip.show(resource, 'Resource');
    tooltip.hide(effect);
    expect(tooltip.isShowing(effect)).toBe(false);
    expect(tooltip.isShowing(resource)).toBe(true);
    expect(element.innerHTML).toBe('Resource');
    expect(visible.has('game-tooltip--visible')).toBe(true);
    tooltip.hide(resource);
    expect(tooltip.isShowing(resource)).toBe(false);
    expect(visible.has('game-tooltip--visible')).toBe(false);
  });

  it('allows a new pointer or focus event to reclaim an effect tooltip', () => {
    const effect = anchor();
    const resource = anchor();
    tooltip.show(effect, 'Effect');
    tooltip.show(resource, 'Resource');
    tooltip.show(effect, 'Effect');
    expect(tooltip.isShowing(effect)).toBe(true);
    expect(tooltip.isShowing(resource)).toBe(false);
    expect(element.innerHTML).toBe('Effect');
  });

  it('preserves unconditional hide for existing controls', () => {
    const resource = anchor();
    tooltip.show(resource, 'Resource');
    tooltip.hide();
    expect(tooltip.isShowing(resource)).toBe(false);
    expect(visible.has('game-tooltip--visible')).toBe(false);
  });
});
