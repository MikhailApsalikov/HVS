import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const css = readFileSync('src/styles.css', 'utf8').replace(/\/\*[\s\S]*?\*\//g, '');
const rules = [...css.matchAll(/([^{}]+)\{([^{}]*)\}/g)].map(([, selector, declarations]) => ({
  selectors: selector.trim().split(/\s*,\s*/),
  declarations: Object.fromEntries(
    declarations
      .split(';')
      .map((declaration) => declaration.trim().split(/:\s*/))
      .filter((parts) => parts.length === 2),
  ),
}));

function declarations(selector: string): Record<string, string> {
  const rule = rules.find((candidate) => candidate.selectors.includes(selector));
  expect(rule, `Missing CSS rule: ${selector}`).toBeDefined();
  return rule!.declarations;
}

describe('combined field effect layout', () => {
  it('clips every effect to a layer outside the lane and archer layout', () => {
    expect(declarations('.game-field__effects')).toMatchObject({
      position: 'absolute',
      inset: '0',
      overflow: 'hidden',
      'pointer-events': 'none',
      isolation: 'isolate',
    });
    for (const overlay of [
      'anti-afk',
      'freeze',
      'armageddon',
      'blizzard',
      'shield',
      'adrenaline',
      'preparation',
    ]) {
      expect(declarations(`.${overlay}-overlay`)).toMatchObject({
        position: 'absolute',
        'pointer-events': 'none',
      });
    }
  });

  it('anchors auras to the same boundary without moving when other effects activate', () => {
    expect(declarations('.shield-overlay').bottom).toBe('0');
    expect(declarations('.adrenaline-overlay').inset).toBe('auto 0 0');
    expect(declarations('.preparation-overlay__streams').inset).toBe('auto 0 0');
    expect(declarations('.armageddon-overlay').bottom).toBe('0');
    for (const rule of rules.filter((candidate) =>
      candidate.selectors.some(
        (selector) => selector.includes(':has(') && selector.includes('overlay.active'),
      ),
    )) {
      for (const property of ['top', 'bottom', 'left', 'right', 'inset', 'height', 'width'])
        expect(rule.declarations, rule.selectors.join(', ')).not.toHaveProperty(property);
    }
  });

  it('centers both shield readouts and gives divine shield visual priority', () => {
    expect(declarations('.shield-overlay__readout')).toMatchObject({
      bottom: '10px',
      left: '50%',
      transform: 'translateX(-50%)',
      'max-width': 'calc(100% - 20px)',
    });
    expect(declarations('.stand-shield-overlay .shield-overlay__readout')).not.toHaveProperty(
      'left',
    );
    expect(
      declarations(
        '.game-field__effects:has(.stand-shield-overlay.active) .last-hope-overlay .shield-overlay__readout',
      ),
    ).toEqual({ display: 'none' });
  });

  it('gives both ammunition counters separate fixed readouts', () => {
    expect(declarations('.adrenaline-overlay__badge')).toMatchObject({
      bottom: '78px',
      right: '14px',
      width: 'min(238px, calc(50% - 20px))',
    });
    expect(declarations('.eagle-eye-overlay .adrenaline-overlay__badge')).toMatchObject({
      left: '14px',
      right: 'auto',
    });
  });
});
