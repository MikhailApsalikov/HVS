import type { GameState } from '../../core/GameState.js';
import type { SpriteRegistry } from '../SpriteRegistry.js';
import type { TalentSystem } from '../../core/TalentSystem.js';
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

const ABILITY_NAMES: Record<AbilityId, string> = {
  freeze: 'Заморозка времени',
  blizzard: 'Вьюга',
  prep: 'Подготовка',
  heal: 'Лечение',
  volley: 'Залп',
  stand: 'Ни шагу назад!',
  armageddon: 'Армагеддон',
};

const ABILITY_HOTKEYS: Record<AbilityId, string> = {
  freeze: 'Q',
  blizzard: 'W',
  prep: 'E',
  heal: 'R',
  volley: 'T',
  stand: 'Y',
  armageddon: 'U',
};

const ABILITY_UNLOCK_LEVELS: Record<AbilityId, number> = {
  freeze: 4,
  blizzard: 8,
  prep: 12,
  heal: 16,
  volley: 20,
  stand: 24,
  armageddon: 28,
};

const ABILITY_DESCRIPTIONS: Record<AbilityId, string> = {
  freeze: 'Полностью останавливает игру. Повторное нажатие Q — возобновляет бесплатно.',
  blizzard: 'Замедляет всех пауков на поле.',
  prep: 'Мгновенно восстанавливает 300 энергии.',
  heal: 'Мгновенно восстанавливает HP.',
  volley: 'Выпускает стрелы из случайных линий.',
  stand: 'Полная неуязвимость на время действия.',
  armageddon: 'Все пауки на поле постепенно сгорают (задержка 1.7 сек).',
};

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
  private _abilityButtons: HTMLElement[] = [];
  private _abilityTooltips: Map<AbilityId, HTMLElement> = new Map();
  private _shootTooltip: HTMLElement | null = null;
  private readonly _spriteRegistry: SpriteRegistry;
  private _talentSystem: TalentSystem | null = null;

  public constructor(container: HTMLElement, spriteRegistry: SpriteRegistry) {
    this._container = container;
    this._spriteRegistry = spriteRegistry;
    this._build();
  }

  public setTalentSystem(ts: TalentSystem): void {
    this._talentSystem = ts;
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

    const shootSection = document.createElement('div');
    shootSection.className = 'hud__shoot-info';
    shootSection.innerHTML = '<span class="hud__shoot-label">Выстрел [1-9]</span>';
    this._shootTooltip = document.createElement('div');
    this._shootTooltip.className = 'tooltip tooltip--shoot';
    shootSection.appendChild(this._shootTooltip);
    shootSection.addEventListener('mouseenter', () => this._updateShootTooltip());
    this._container.appendChild(shootSection);

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

  private _createAbilityButton(id: AbilityId): HTMLElement {
    const wrapper = document.createElement('div');
    wrapper.className = 'ability-btn-wrapper';

    const btn = document.createElement('button');
    btn.className = 'ability-btn';
    btn.dataset.ability = id;
    btn.type = 'button';

    const iconDiv = document.createElement('span');
    iconDiv.className = 'ability-btn__icon';
    iconDiv.innerHTML = this._spriteRegistry.get(ABILITY_SPRITE_MAP[id]);
    btn.appendChild(iconDiv);

    const infoDiv = document.createElement('span');
    infoDiv.className = 'ability-btn__info';
    infoDiv.innerHTML = `<span class="ability-btn__name">${ABILITY_NAMES[id]}</span>
      <span class="ability-btn__hotkey">[${ABILITY_HOTKEYS[id]}]</span>`;
    btn.appendChild(infoDiv);

    const cdText = document.createElement('span');
    cdText.className = 'ability-btn__cd-text';
    btn.appendChild(cdText);

    wrapper.appendChild(btn);

    const tooltip = document.createElement('div');
    tooltip.className = 'tooltip tooltip--ability';
    wrapper.appendChild(tooltip);
    this._abilityTooltips.set(id, tooltip);

    wrapper.addEventListener('mouseenter', () => this._updateAbilityTooltip(id));

    return wrapper;
  }

  private _updateShootTooltip(): void {
    if (!this._shootTooltip || !this._talentSystem) return;
    const ts = this._talentSystem;
    const baseCost = 35;
    const cost = baseCost - ts.getShootCostReduction();
    const baseCd = 1.5;
    const cd = baseCd * ts.getShootCooldownMultiplier();
    const speedMult = ts.getArrowSpeedMultiplier();
    const travelTime = 1.5 / speedMult;

    this._shootTooltip.innerHTML = `
      <div class="tooltip__title">Выстрел [1-9]</div>
      <div class="tooltip__desc">Стреляет стрелой по линии. Убивает первого паука на пути.</div>
      <div class="tooltip__stat">Стоимость: <b>${cost}</b> энергии</div>
      <div class="tooltip__stat">Кулдаун: <b>${cd.toFixed(2)}</b> сек</div>
      <div class="tooltip__stat">Время полёта: <b>${travelTime.toFixed(2)}</b> сек</div>
      ${ts.getShootCostReduction() > 0 ? `<div class="tooltip__talent">Мастерство охотника: −${ts.getShootCostReduction()} стоимость</div>` : ''}
      ${ts.getRank('rapidFire') > 0 ? `<div class="tooltip__talent">Скорострельность: −${(ts.getRank('rapidFire') * 10)}% кулдаун, +${(ts.getRank('rapidFire') * 10)}% скорость</div>` : ''}
    `;
  }

  private _updateAbilityTooltip(id: AbilityId): void {
    const tooltip = this._abilityTooltips.get(id);
    if (!tooltip) return;
    const ts = this._talentSystem;

    const unlockLevel = ABILITY_UNLOCK_LEVELS[id];
    const name = ABILITY_NAMES[id];
    const hotkey = ABILITY_HOTKEYS[id];
    const desc = ABILITY_DESCRIPTIONS[id];

    let statsHtml = '';
    if (ts) {
      statsHtml = this._getAbilityStatsHtml(id, ts);
    }

    tooltip.innerHTML = `
      <div class="tooltip__title">${name} [${hotkey}]</div>
      <div class="tooltip__desc">${desc}</div>
      <div class="tooltip__stat">Открывается: <b>уровень ${unlockLevel}</b></div>
      ${statsHtml}
    `;
  }

  private _getAbilityStatsHtml(id: AbilityId, ts: TalentSystem): string {
    switch (id) {
      case 'freeze':
        return `<div class="tooltip__stat">Стоимость: <b>50</b> энергии</div>
                <div class="tooltip__stat">Кулдаун: <b>нет</b></div>`;
      case 'blizzard': {
        const slow = 40 + ts.getBlizzardSlowBonus() * 100;
        const dur = 4 + ts.getBlizzardDurationBonus();
        return `<div class="tooltip__stat">Стоимость: <b>40</b> энергии</div>
                <div class="tooltip__stat">Кулдаун: <b>15</b> сек</div>
                <div class="tooltip__stat">Замедление: <b>${slow.toFixed(0)}%</b></div>
                <div class="tooltip__stat">Длительность: <b>${dur}</b> сек</div>
                ${ts.getRank('blizzardMastery') > 0 ? `<div class="tooltip__talent">Беспощадная вьюга: +${(ts.getRank('blizzardMastery') * 7)}% замедл., +${ts.getRank('blizzardMastery')} сек</div>` : ''}`;
      }
      case 'prep': {
        const cd = 60 - ts.getPrepCooldownReduction();
        return `<div class="tooltip__stat">Стоимость: <b>0</b> энергии</div>
                <div class="tooltip__stat">Кулдаун: <b>${cd}</b> сек</div>
                <div class="tooltip__stat">Восстанавливает: <b>300</b> энергии</div>
                ${ts.getRank('improvedPrep') > 0 ? `<div class="tooltip__talent">Улучш. подготовка: −${ts.getPrepCooldownReduction()} сек кулдаун</div>` : ''}`;
      }
      case 'heal': {
        const healAmount = 150 + ts.getHealBonus();
        return `<div class="tooltip__stat">Стоимость: <b>100</b> энергии</div>
                <div class="tooltip__stat">Кулдаун: <b>10</b> сек</div>
                <div class="tooltip__stat">Восстанавливает: <b>${healAmount}</b> HP</div>
                ${ts.getRank('healBoost') > 0 ? `<div class="tooltip__talent">Усил. лечение: +${ts.getHealBonus()} HP, +${ts.getHpRegenBonus()} HP/сек</div>` : ''}`;
      }
      case 'volley': {
        const lanes = 4 + ts.getVolleyExtraLanes();
        const cd = 12 * ts.getShootCooldownMultiplier();
        return `<div class="tooltip__stat">Стоимость: <b>100</b> энергии</div>
                <div class="tooltip__stat">Кулдаун: <b>${cd.toFixed(1)}</b> сек</div>
                <div class="tooltip__stat">Линий: <b>${lanes}</b></div>
                ${ts.getRank('volleyMastery') > 0 ? `<div class="tooltip__talent">Искусный залп: +${ts.getVolleyExtraLanes()} линий</div>` : ''}
                ${ts.getRank('rapidFire') > 0 ? `<div class="tooltip__talent">Скорострельность: −${(ts.getRank('rapidFire') * 10)}% кулдаун</div>` : ''}`;
      }
      case 'stand': {
        const dur = 7 + ts.getStandDurationBonus();
        const cd = 120 - ts.getStandCooldownReduction();
        return `<div class="tooltip__stat">Стоимость: <b>15</b> энергии</div>
                <div class="tooltip__stat">Кулдаун: <b>${cd}</b> сек</div>
                <div class="tooltip__stat">Длительность: <b>${dur}</b> сек</div>
                ${ts.getRank('dutyBound') > 0 ? `<div class="tooltip__talent">Чувство долга: +${ts.getStandDurationBonus()} сек, −${ts.getStandCooldownReduction()} сек кд</div>` : ''}`;
      }
      case 'armageddon':
        return `<div class="tooltip__stat">Стоимость: <b>100</b> энергии</div>
                <div class="tooltip__stat">Кулдаун: <b>120</b> сек</div>
                <div class="tooltip__stat">Задержка: <b>1.7</b> сек, затем <b>2</b> сек горения</div>`;
      default:
        return '';
    }
  }

  public render(state: GameState): void {
    const hpPct = state.maxHp > 0 ? (state.hp / state.maxHp) * 100 : 0;
    if (this._hpFill) this._hpFill.style.setProperty('--fill', `${hpPct}%`);
    if (this._hpText) this._hpText.textContent = `${Math.floor(state.hp)} / ${Math.floor(state.maxHp)}`;

    const energyPct = state.maxEnergy > 0 ? (state.energy / state.maxEnergy) * 100 : 0;
    if (this._energyFill) this._energyFill.style.setProperty('--fill', `${energyPct}%`);
    if (this._energyText) this._energyText.textContent = `${Math.floor(state.energy)} / ${Math.floor(state.maxEnergy)}`;

    if (this._coinsDisplay) this._coinsDisplay.textContent = `Монетки: ${Math.floor(state.coins)}`;
    if (this._levelTimerDisplay) this._levelTimerDisplay.textContent = `Таймер: ${Math.ceil(state.levelTimer)}с`;
    if (this._levelNumberDisplay) this._levelNumberDisplay.textContent = `Уровень ${state.level}`;

    for (let i = 0; i < ABILITY_ORDER.length; i++) {
      const abilityId = ABILITY_ORDER[i];
      const ability = state.getAbility(abilityId);
      const wrapper = this._abilityButtons[i];
      if (!ability || !wrapper) continue;
      const btn = wrapper.querySelector('.ability-btn') as HTMLElement | null;
      if (!btn) continue;

      const available = ability.isAvailableAt(state.level);
      btn.classList.toggle('ability-btn--locked', !available);
      btn.style.setProperty('--cd-pct', `${ability.cooldownFraction * 100}%`);
      btn.classList.toggle('ability-btn--cooldown', ability.isOnCooldown);

      const cdText = btn.querySelector('.ability-btn__cd-text');
      if (cdText) {
        cdText.textContent = ability.isOnCooldown && ability.remainingCooldown > 0
          ? `${Math.ceil(ability.remainingCooldown)}с`
          : '';
      }

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

  public getContainer(): HTMLElement {
    return this._container;
  }

  public getAbilityButtonsContainer(): HTMLElement {
    return this._container.querySelector('#ability-buttons') ?? this._container;
  }
}
