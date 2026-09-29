import { afterEach, describe, expect, it, vi } from 'vitest';
import { InputHandler } from '../src/infrastructure/browser/InputHandler.js';
import { GameSession } from '../src/domain/GameSession.js';
import { ABILITIES } from '../src/content/abilities.js';
import type { AbilityResult } from '../src/domain/types.js';

afterEach(() => vi.unstubAllGlobals());

describe('physical ability keys through session commands', () => {
  it.each([
    ['KeyQ', 'й', 'freeze'],
    ['KeyW', 'ц', 'volley'],
    ['KeyE', 'у', 'prep'],
    ['KeyR', 'к', 'heal'],
    ['KeyT', 'е', 'blizzard'],
    ['KeyY', 'н', 'armageddon'],
    ['KeyU', 'г', 'eagleEye'],
    ['KeyI', 'ш', 'stand'],
    ['KeyO', 'щ', 'lastHope'],
    ['KeyP', 'з', 'aimedFire'],
    ['BracketLeft', 'х', 'recharge'],
    ['BracketRight', 'ъ', 'adrenaline'],
  ] as const)('%s activates %s / %s independently of the keyboard layout', (code, key, id) => {
    let keydown!: (event: KeyboardEvent) => void;
    const removeEventListener = vi.fn();
    vi.stubGlobal('window', {
      addEventListener: (_name: string, handler: typeof keydown) => {
        keydown = handler;
      },
      removeEventListener,
    });
    vi.stubGlobal('Element', class {});
    const session = new GameSession('normal', () => 0.999999, { level: 60 });
    const talent = ABILITIES[id].talent;
    if (talent) session.talents.loadFromSave([{ id: talent, rank: 1 }]);
    session.refreshStats();
    session.state.phase = 'playing';
    session.state.energy = session.state.maxEnergy;
    const results: AbilityResult[] = [];
    const activated: string[] = [];
    const input = new InputHandler(
      () => {},
      (ability) => {
        activated.push(ability);
        results.push(session.activateAbility(ability));
      },
    );
    const preventDefault = vi.fn();
    const event = { code, key, target: null, preventDefault } as unknown as KeyboardEvent;
    keydown(event);
    expect(activated).toEqual([id]);
    expect(results).toEqual(['activated']);
    expect(preventDefault).toHaveBeenCalledOnce();
    keydown({ ...event, repeat: true });
    keydown({ ...event, ctrlKey: true });
    input.setEnabled(false);
    keydown(event);
    expect(activated).toEqual([id]);
    input.destroy();
    expect(removeEventListener).toHaveBeenCalledWith('keydown', keydown);
  });
});
