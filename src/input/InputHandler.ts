import type { AbilityId } from '../config/types.js';

export class InputHandler {
  private _onShoot: (lane: number) => void;
  private _onAbility: (abilityId: AbilityId) => void;
  private _enabled: boolean;
  private _boundKeydown: (e: KeyboardEvent) => void;

  public constructor(
    onShoot: (lane: number) => void,
    onAbility: (abilityId: AbilityId) => void
  ) {
    this._onShoot = onShoot;
    this._onAbility = onAbility;
    this._enabled = true;
    this._boundKeydown = this._handleKeydown.bind(this);
    window.addEventListener('keydown', this._boundKeydown);
  }

  private _handleKeydown(e: KeyboardEvent): void {
    if (!this._enabled) return;

    const key = e.key.toLowerCase();
    const code = e.code;

    if (key >= '1' && key <= '9') {
      this._onShoot(parseInt(key, 10) - 1);
      return;
    }

    const abilityByKey: Record<string, AbilityId> = {
      q: 'freeze',
      w: 'blizzard',
      e: 'prep',
      r: 'heal',
      t: 'volley',
      y: 'stand',
      u: 'armageddon',
      'й': 'freeze',
      'ц': 'blizzard',
      'у': 'prep',
      'к': 'heal',
      'е': 'volley',
      'н': 'stand',
      'г': 'armageddon',
    };

    const abilityByCode: Record<string, AbilityId> = {
      KeyQ: 'freeze',
      KeyW: 'blizzard',
      KeyE: 'prep',
      KeyR: 'heal',
      KeyT: 'volley',
      KeyY: 'stand',
      KeyU: 'armageddon',
    };

    const abilityId = abilityByKey[key] ?? abilityByCode[code];
    if (abilityId) {
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
