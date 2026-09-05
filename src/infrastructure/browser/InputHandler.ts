import type { AbilityId } from '../../domain/types.js';
import { ABILITIES, ABILITY_ORDER } from '../../content/abilities.js';
import { WORLD } from '../../domain/rules/world.js';

const ABILITY_BY_CODE = new Map(ABILITY_ORDER.map((id) => [`Key${ABILITIES[id].key}`, id]));

export class InputHandler {
  private _onShoot: (lane: number) => void;
  private _onAbility: (abilityId: AbilityId) => void;
  private _enabled: boolean;
  private _boundKeydown: (e: KeyboardEvent) => void;

  public constructor(onShoot: (lane: number) => void, onAbility: (abilityId: AbilityId) => void) {
    this._onShoot = onShoot;
    this._onAbility = onAbility;
    this._enabled = true;
    this._boundKeydown = this._handleKeydown.bind(this);
    window.addEventListener('keydown', this._boundKeydown);
  }

  private _handleKeydown(e: KeyboardEvent): void {
    if (!this._enabled) return;

    if (
      e.ctrlKey ||
      e.altKey ||
      e.metaKey ||
      (e.target instanceof Element &&
        e.target.closest('input, textarea, select, [contenteditable="true"]'))
    )
      return;

    const key = e.key.toLowerCase();
    const code = e.code;

    if (Number(key) >= 1 && Number(key) <= WORLD.lanes && key.length === 1) {
      this._onShoot(parseInt(key, 10) - 1);
      return;
    }

    const abilityId = ABILITY_BY_CODE.get(code);
    if (abilityId) {
      if (e.repeat) return;
      e.preventDefault();
      this._onAbility(abilityId);
    }
  }

  public setEnabled(enabled: boolean): void {
    this._enabled = enabled;
  }

  public destroy(): void {
    window.removeEventListener('keydown', this._boundKeydown);
  }
}
