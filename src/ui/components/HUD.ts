import type { GameState } from '../../core/GameState.js';
import type { SpriteRegistry } from '../SpriteRegistry.js';
import type { AbilityId } from '../../config/types.js';

const ABILITY_ORDER: AbilityId[] = [
  'freeze',
  'blizzard',
  'prep',
  'heal',
  'volley',
  'stand',
  'armageddon',
];

const ABILITY_SPRITE_MAP: Record<AbilityId, string> = {
  freeze: 'AbilityFreeze',
  blizzard: 'AbilityBlizzard',
  prep: 'AbilityPrep',
  heal: 'AbilityHeal',
  volley: 'AbilityVolley',
  stand: 'AbilityStand',
  armageddon: 'AbilityArmageddon',
};

export class HUD {
  private _container: HTMLElement;
  private _hpFill: HTMLElement | null = null;
  private _hpText: HTMLElement | null = null;
  private _energyFill: HTMLElement | null = null;
  private _energyText: HTMLElement | null = null;
  private _coinsDisplay: HTMLElement | null = null;
  private _levelTimerDisplay: HTMLElement | null = null;
  private _levelNumberDisplay: HTMLElement | null = null;
  private _archerButtons: HTMLElement[] = [];
  private _abilityButtons: HTMLElement[] = [];
  private readonly _spriteRegistry: SpriteRegistry;

  public constructor(container: HTMLElement, spriteRegistry: SpriteRegistry) {
    this._container = container;
    this._spriteRegistry = spriteRegistry;
    this._build();
  }

  private _build(): void {
    this._container.className = 'hud';
    this._container.dataset.component = 'hud';

    const resourceBars = document.createElement('div');
    resourceBars.id = 'resource-bars';
    resourceBars.className = 'resource-bars';

    const hpBar = this._createResourceBar('hp-bar', 'HP');
    this._hpFill = hpBar.querySelector('.resource-bar__fill');
    this._hpText = hpBar.querySelector('.resource-bar__text');
    resourceBars.appendChild(hpBar);

    const energyBar = this._createResourceBar('energy-bar', 'Энергия');
    this._energyFill = energyBar.querySelector('.resource-bar__fill');
    this._energyText = energyBar.querySelector('.resource-bar__text');
    resourceBars.appendChild(energyBar);

    this._container.appendChild(resourceBars);

    this._coinsDisplay = document.createElement('div');
    this._coinsDisplay.id = 'coins-display';
    this._coinsDisplay.className = 'coins-display';
    this._container.appendChild(this._coinsDisplay);

    this._levelTimerDisplay = document.createElement('div');
    this._levelTimerDisplay.id = 'level-timer';
    this._levelTimerDisplay.className = 'level-timer';
    this._container.appendChild(this._levelTimerDisplay);

    this._levelNumberDisplay = document.createElement('div');
    this._levelNumberDisplay.id = 'level-number';
    this._levelNumberDisplay.className = 'level-number';
    this._container.appendChild(this._levelNumberDisplay);

    const archerButtons = document.createElement('div');
    archerButtons.id = 'archer-buttons';
    archerButtons.className = 'archer-buttons';
    for (let i = 0; i < 9; i++) {
      const btn = this._createArcherButton(i);
      this._archerButtons.push(btn);
      archerButtons.appendChild(btn);
    }
    this._container.appendChild(archerButtons);

    const abilityButtons = document.createElement('div');
    abilityButtons.id = 'ability-buttons';
    abilityButtons.className = 'ability-buttons';
    for (const id of ABILITY_ORDER) {
      const btn = this._createAbilityButton(id);
      this._abilityButtons.push(btn);
      abilityButtons.appendChild(btn);
    }
    this._container.appendChild(abilityButtons);
  }

  private _createResourceBar(id: string, _label: string): HTMLElement {
    const bar = document.createElement('div');
    bar.id = id;
    bar.className = 'resource-bar';
    bar.innerHTML = `
      <div class="resource-bar__fill" style="--fill: 100%"></div>
      <div class="resource-bar__text">0 / 0</div>
    `;
    return bar;
  }

  private _createArcherButton(lane: number): HTMLElement {
    const btn = document.createElement('button');
    btn.className = 'archer-btn';
    btn.dataset.lane = String(lane);
    btn.type = 'button';
    btn.innerHTML = this._spriteRegistry.get('Archer');
    return btn;
  }

  private _createAbilityButton(id: AbilityId): HTMLElement {
    const btn = document.createElement('button');
    btn.className = 'ability-btn';
    btn.dataset.ability = id;
    btn.type = 'button';
    btn.innerHTML = this._spriteRegistry.get(ABILITY_SPRITE_MAP[id]);
    return btn;
  }

  public render(state: GameState): void {
    const hpPct = state.maxHp > 0 ? (state.hp / state.maxHp) * 100 : 0;
    if (this._hpFill) this._hpFill.style.setProperty('--fill', `${hpPct}%`);
    if (this._hpText) this._hpText.textContent = `${Math.floor(state.hp)} / ${Math.floor(state.maxHp)}`;

    const energyPct = state.maxEnergy > 0 ? (state.energy / state.maxEnergy) * 100 : 0;
    if (this._energyFill) this._energyFill.style.setProperty('--fill', `${energyPct}%`);
    if (this._energyText) this._energyText.textContent = `${Math.floor(state.energy)} / ${Math.floor(state.maxEnergy)}`;

    if (this._coinsDisplay) this._coinsDisplay.textContent = `Монетки: ${state.coins}`;
    if (this._levelTimerDisplay) this._levelTimerDisplay.textContent = `Таймер: ${Math.ceil(state.levelTimer)}с`;
    if (this._levelNumberDisplay) this._levelNumberDisplay.textContent = `Уровень ${state.level}`;

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

    for (let i = 0; i < ABILITY_ORDER.length; i++) {
      const abilityId = ABILITY_ORDER[i];
      const ability = state.getAbility(abilityId);
      const btn = this._abilityButtons[i];
      if (ability && btn) {
        const available = ability.isAvailableAt(state.level);
        btn.classList.toggle('ability-btn--locked', !available);
        btn.style.setProperty('--cd-pct', `${ability.cooldownFraction * 100}%`);
        btn.classList.toggle('ability-btn--cooldown', ability.isOnCooldown);
        let lockEl = btn.querySelector('.ability-btn__lock');
        if (!available && !lockEl) {
          const lock = document.createElement('span');
          lock.className = 'ability-btn__lock';
          lock.innerHTML = this._spriteRegistry.get('Lock');
          btn.appendChild(lock);
        } else if (available && lockEl) {
          lockEl.remove();
        }
      }
    }
  }

  public getContainer(): HTMLElement {
    return this._container;
  }

  public getArcherButtonsContainer(): HTMLElement {
    return this._container.querySelector('#archer-buttons') ?? this._container;
  }

  public getAbilityButtonsContainer(): HTMLElement {
    return this._container.querySelector('#ability-buttons') ?? this._container;
  }
}
