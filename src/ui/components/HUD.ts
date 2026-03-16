import type { GameState } from '../../core/GameState.js';
import type { SpriteRegistry } from '../SpriteRegistry.js';
import type { TalentSystem } from '../../core/TalentSystem.js';
import type { AbilityId } from '../../config/types.js';
import { TooltipManager } from './TooltipManager.js';

export const ABILITY_ORDER: AbilityId[] = [
  'freeze',
  'blizzard',
  'prep',
  'heal',
  'volley',
  'stand',
  'armageddon',
];

export const ABILITY_NAMES: Record<AbilityId, string> = {
  freeze: 'Заморозка времени',
  blizzard: 'Вьюга',
  prep: 'Подготовка',
  heal: 'Лечение',
  volley: 'Залп',
  stand: 'Ни шагу назад!',
  armageddon: 'Армагеддон',
};

export const ABILITY_HOTKEYS: Record<AbilityId, string> = {
  freeze: 'Q',
  blizzard: 'W',
  prep: 'E',
  heal: 'R',
  volley: 'T',
  stand: 'Y',
  armageddon: 'U',
};

export const ABILITY_UNLOCK_LEVELS: Record<AbilityId, number> = {
  freeze: 4,
  blizzard: 8,
  prep: 12,
  heal: 16,
  volley: 20,
  stand: 25,
  armageddon: 30,
};

export const ABILITY_DESCRIPTIONS: Record<AbilityId, string> = {
  freeze: 'Полностью останавливает игру. Повторное нажатие Q — возобновляет.',
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
  private _timerFill: HTMLElement | null = null;
  private _timerText: HTMLElement | null = null;
  private _coinsDisplay: HTMLElement | null = null;
  private _coinsText: HTMLElement | null = null;
  private _levelNumberDisplay: HTMLElement | null = null;
  private _abilityButtons: HTMLElement[] = [];
  private readonly _spriteRegistry: SpriteRegistry;
  private _talentSystem: TalentSystem | null = null;
  private _lastState: GameState | null = null;
  private readonly _tooltip = TooltipManager.getInstance();

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
    hpBar.addEventListener('mouseenter', () => {
      const html = this._getHpTooltipHtml();
      if (html) this._tooltip.show(hpBar, html);
    });
    hpBar.addEventListener('mouseleave', () => this._tooltip.hide());
    resourceBars.appendChild(hpBar);

    const energyBar = this._createResourceBar('energy-bar', 'Энергия');
    this._energyFill = energyBar.querySelector('.resource-bar__fill');
    this._energyText = energyBar.querySelector('.resource-bar__text');
    energyBar.addEventListener('mouseenter', () => {
      const html = this._getEnergyTooltipHtml();
      if (html) this._tooltip.show(energyBar, html);
    });
    energyBar.addEventListener('mouseleave', () => this._tooltip.hide());
    resourceBars.appendChild(energyBar);

    const timerBar = this._createResourceBar('timer-bar', 'Таймер');
    this._timerFill = timerBar.querySelector('.resource-bar__fill');
    this._timerText = timerBar.querySelector('.resource-bar__text');
    timerBar.addEventListener('mouseenter', () => {
      const html = this._getTimerTooltipHtml();
      if (html) this._tooltip.show(timerBar, html);
    });
    timerBar.addEventListener('mouseleave', () => this._tooltip.hide());
    resourceBars.appendChild(timerBar);

    this._container.appendChild(resourceBars);

    this._coinsDisplay = document.createElement('div');
    this._coinsDisplay.id = 'coins-display';
    this._coinsDisplay.className = 'coins-display';
    const coinIcon = document.createElement('span');
    coinIcon.className = 'coins-display__icon';
    coinIcon.innerHTML = this._spriteRegistry.get('Coin');
    this._coinsDisplay.appendChild(coinIcon);
    this._coinsText = document.createElement('span');
    this._coinsText.className = 'coins-display__text';
    this._coinsDisplay.appendChild(this._coinsText);
    this._coinsDisplay.addEventListener('mouseenter', () => {
      const html = this._getCoinsTooltipHtml();
      if (html) this._tooltip.show(this._coinsDisplay!, html);
    });
    this._coinsDisplay.addEventListener('mouseleave', () => this._tooltip.hide());
    this._container.appendChild(this._coinsDisplay);

    this._levelNumberDisplay = document.createElement('div');
    this._levelNumberDisplay.id = 'level-number';
    this._levelNumberDisplay.className = 'level-number';
    this._levelNumberDisplay.addEventListener('mouseenter', () => {
      const html = this._getLevelTooltipHtml();
      if (html) this._tooltip.show(this._levelNumberDisplay!, html);
    });
    this._levelNumberDisplay.addEventListener('mouseleave', () => this._tooltip.hide());
    this._container.appendChild(this._levelNumberDisplay);

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

    wrapper.addEventListener('mouseenter', () => {
      const html = this._getAbilityTooltipHtml(id);
      if (html) this._tooltip.show(wrapper, html);
    });
    wrapper.addEventListener('mouseleave', () => this._tooltip.hide());

    return wrapper;
  }

  private _getHpTooltipHtml(): string | null {
    const state = this._lastState;
    const ts = this._talentSystem;
    if (!state) return null;
    const config = state.config;
    const baseMax = config.baseHp;
    const hpBonus = ts ? ts.getMaxHpBonus() : 0;
    const totalMax = baseMax + hpBonus;
    const baseRegen = config.hpRegen;
    const regenBonus = ts ? ts.getHpRegenBonus() : 0;
    const totalRegen = baseRegen + regenBonus;
    const damageReduction = ts ? ts.getDamageReduction() : 0;

    return `
      <div class="tooltip__title">Здоровье (HP)</div>
      <div class="tooltip__desc">При достижении 0 — игра окончена.</div>
      <div class="tooltip__stat">Текущее: <b>${Math.floor(state.hp)}</b> / <b>${Math.floor(totalMax)}</b></div>
      <div class="tooltip__stat">Базовый максимум: <b>${baseMax}</b></div>
      <div class="tooltip__stat">Регенерация: <b>${totalRegen.toFixed(1)}</b> HP/сек</div>
      ${hpBonus > 0 ? `<div class="tooltip__talent">Выносливость: +${hpBonus} макс. HP</div>` : ''}
      ${regenBonus > 0 ? `<div class="tooltip__talent">Усиленное лечение: +${regenBonus} HP/сек</div>` : ''}
      ${damageReduction > 0 ? `<div class="tooltip__talent">Защита от пауков: −${(damageReduction * 100).toFixed(0)}% входящего урона</div>` : ''}
    `;
  }

  private _getEnergyTooltipHtml(): string | null {
    const state = this._lastState;
    const ts = this._talentSystem;
    if (!state) return null;
    const config = state.config;
    const baseMax = config.baseEnergy;
    const energyBonus = ts ? ts.getMaxEnergyBonus() : 0;
    const totalMax = baseMax + energyBonus;
    const baseRegen = config.energyRegen;
    const regenMult = ts ? ts.getEnergyRegenMultiplier() : 1;
    const totalRegen = baseRegen * regenMult;

    return `
      <div class="tooltip__title">Энергия</div>
      <div class="tooltip__desc">Расходуется на выстрелы и способности.</div>
      <div class="tooltip__stat">Текущая: <b>${Math.floor(state.energy)}</b> / <b>${Math.floor(totalMax)}</b></div>
      <div class="tooltip__stat">Базовый максимум: <b>${baseMax}</b></div>
      <div class="tooltip__stat">Регенерация: <b>${totalRegen.toFixed(1)}</b>/сек</div>
      ${energyBonus > 0 ? `<div class="tooltip__talent">Ловкость: +${energyBonus} макс. энергии</div>` : ''}
      ${regenMult > 1 ? `<div class="tooltip__talent">Неутомимость: +${((regenMult - 1) * 100).toFixed(0)}% регенерации</div>` : ''}
    `;
  }

  private _getTimerTooltipHtml(): string | null {
    const state = this._lastState;
    if (!state) return null;
    const config = state.config;
    const total = state.levelTimerMax;
    const remaining = Math.ceil(state.levelTimer);

    return `
      <div class="tooltip__title">Таймер уровня</div>
      <div class="tooltip__desc">Продержитесь до конца, чтобы перейти на следующий уровень.</div>
      <div class="tooltip__stat">Осталось: <b>${remaining}</b> / <b>${Math.ceil(total)}</b> сек</div>
      <div class="tooltip__stat">Формула: <b>${config.levelTimerBase} + ${config.levelTimerStep} × уровень</b></div>
    `;
  }

  private _getCoinsTooltipHtml(): string | null {
    const state = this._lastState;
    if (!state) return null;
    const config = state.config;

    return `
      <div class="tooltip__title">Монетки</div>
      <div class="tooltip__desc">Валюта для будущих покупок.</div>
      <div class="tooltip__stat">Накоплено: <b>${Math.floor(state.coins)}</b></div>
      <div class="tooltip__stat">Пассивно: <b>${config.coinsPerSec}</b>/сек</div>
      <div class="tooltip__stat">За убийство паука: <b>1–3</b> монетки</div>
    `;
  }

  private _getLevelTooltipHtml(): string | null {
    const state = this._lastState;
    if (!state) return null;
    const level = state.level;

    const nextAbilities: string[] = [];
    for (const id of ABILITY_ORDER) {
      const unlockLvl = ABILITY_UNLOCK_LEVELS[id];
      if (unlockLvl > level) {
        nextAbilities.push(`${ABILITY_NAMES[id]} — уровень <b>${unlockLvl}</b>`);
      }
    }

    return `
      <div class="tooltip__title">Уровень ${level}</div>
      <div class="tooltip__desc">За каждый пройденный уровень — 1 очко таланта.</div>
      <div class="tooltip__stat">Очков талантов: <b>${state.pendingTalentPoints}</b></div>
      ${nextAbilities.length > 0 ? `<div class="tooltip__stat" style="margin-top:4px">Впереди:</div>${nextAbilities.map(a => `<div class="tooltip__stat">${a}</div>`).join('')}` : '<div class="tooltip__stat" style="color:#7bc67b">Все способности открыты!</div>'}
    `;
  }

  public getShootTooltipHtml(laneNumber?: number): string | null {
    return this._getShootTooltipHtml(laneNumber);
  }

  private _getShootTooltipHtml(laneNumber?: number): string | null {
    if (!this._talentSystem) return null;
    const ts = this._talentSystem;
    const baseCost = 35;
    const cost = baseCost - ts.getShootCostReduction();
    const baseCd = 1.5;
    const cd = baseCd * ts.getShootCooldownMultiplier();
    const speedMult = ts.getArrowSpeedMultiplier();
    const travelTime = 1.5 / speedMult;
    const label = laneNumber != null ? `Выстрел [${laneNumber}]` : 'Выстрел [1-9]';

    return `
      <div class="tooltip__title">${label}</div>
      <div class="tooltip__desc">Стреляет стрелой по линии.</div>
      <div class="tooltip__stat">Стоимость: <b>${cost}</b> энергии</div>
      <div class="tooltip__stat">Кулдаун: <b>${cd.toFixed(2)}</b> сек</div>
      <div class="tooltip__stat">Время полёта: <b>${travelTime.toFixed(2)}</b> сек</div>
      ${ts.getShootCostReduction() > 0 ? `<div class="tooltip__talent">Мастерство охотника: −${ts.getShootCostReduction()} стоимость</div>` : ''}
      ${ts.getRank('rapidFire') > 0 ? `<div class="tooltip__talent">Скорострельность: −${(ts.getRank('rapidFire') * 10)}% кулдаун, +${(ts.getRank('rapidFire') * 10)}% скорость</div>` : ''}
    `;
  }

  private _getAbilityTooltipHtml(id: AbilityId): string | null {
    const ts = this._talentSystem;

    const unlockLevel = ABILITY_UNLOCK_LEVELS[id];
    const name = ABILITY_NAMES[id];
    const hotkey = ABILITY_HOTKEYS[id];
    const desc = ABILITY_DESCRIPTIONS[id];

    const isLocked = this._lastState ? !this._lastState.getAbility(id)?.isAvailableAt(this._lastState.level) : true;

    if (isLocked) {
      return `
        <div class="tooltip__title">${name} [${hotkey}]</div>
        <div class="tooltip__desc">${desc}</div>
        <div class="tooltip__stat" style="color:#ff9800;margin-top:6px">🔒 Открывается на <b>уровне ${unlockLevel}</b></div>
      `;
    }

    let statsHtml = '';
    if (ts) {
      statsHtml = this._getAbilityStatsHtml(id, ts);
    }

    const ability = this._lastState?.getAbility(id);
    const cdRemaining = ability && ability.isOnCooldown ? `<div class="tooltip__stat" style="color:#ff6b6b">Перезарядка: <b>${Math.ceil(ability.remainingCooldown)}</b> сек</div>` : '';

    return `
      <div class="tooltip__title">${name} [${hotkey}]</div>
      <div class="tooltip__desc">${desc}</div>
      ${statsHtml}
      ${cdRemaining}
    `;
  }

  private _getAbilityStatsHtml(id: AbilityId, ts: TalentSystem): string {
    const config = this._lastState?.config;
    switch (id) {
      case 'freeze': {
        const cost = config?.abilities.freeze.cost ?? 50;
        return `<div class="tooltip__stat">Стоимость: <b>${cost}</b> энергии</div>
                <div class="tooltip__stat">Кулдаун: <b>нет</b></div>
                <div class="tooltip__stat">Открывается: уровень <b>${ABILITY_UNLOCK_LEVELS.freeze}</b></div>
                <div class="tooltip__stat" style="margin-top:4px;color:#c9b896">Повторное нажатие Q — возобновляет бесплатно.</div>
                <div class="tooltip__stat" style="color:#c9b896">Во время заморозки весь ввод заблокирован, кроме Q.</div>`;
      }
      case 'blizzard': {
        const cost = config?.abilities.blizzard.cost ?? 40;
        const baseCd = config?.abilities.blizzard.cooldown ?? 15;
        const baseSlow = 40;
        const slowBonus = ts.getBlizzardSlowBonus() * 100;
        const totalSlow = baseSlow + slowBonus;
        const baseDur = 4;
        const durBonus = ts.getBlizzardDurationBonus();
        const totalDur = baseDur + durBonus;
        return `<div class="tooltip__stat">Стоимость: <b>${cost}</b> энергии</div>
                <div class="tooltip__stat">Кулдаун: <b>${baseCd}</b> сек</div>
                <div class="tooltip__stat">Замедление: <b>${totalSlow.toFixed(0)}%</b>${slowBonus > 0 ? ` <span style="color:#7bc67b">(базовое ${baseSlow}% + ${slowBonus.toFixed(0)}%)</span>` : ''}</div>
                <div class="tooltip__stat">Длительность: <b>${totalDur}</b> сек${durBonus > 0 ? ` <span style="color:#7bc67b">(базовая ${baseDur} + ${durBonus})</span>` : ''}</div>
                <div class="tooltip__stat">Открывается: уровень <b>${ABILITY_UNLOCK_LEVELS.blizzard}</b></div>
                <div class="tooltip__stat" style="margin-top:4px;color:#c9b896">Замедляет только пауков, уже находящихся на поле.</div>
                ${ts.getRank('blizzardMastery') > 0 ? `<div class="tooltip__talent">Беспощадная вьюга (${ts.getRank('blizzardMastery')}/${ts.getTalent('blizzardMastery').maxRanks}): +${slowBonus.toFixed(0)}% замедл., +${durBonus} сек</div>` : ''}`;
      }
      case 'prep': {
        const cost = config?.abilities.prep.cost ?? 0;
        const baseCd = config?.abilities.prep.cooldown ?? 60;
        const cdReduction = ts.getPrepCooldownReduction();
        const totalCd = Math.max(0, baseCd - cdReduction);
        const restoreAmount = 300;
        return `<div class="tooltip__stat">Стоимость: <b>${cost}</b> энергии</div>
                <div class="tooltip__stat">Кулдаун: <b>${totalCd}</b> сек${cdReduction > 0 ? ` <span style="color:#7bc67b">(базовый ${baseCd} − ${cdReduction})</span>` : ''}</div>
                <div class="tooltip__stat">Восстанавливает: <b>${restoreAmount}</b> энергии</div>
                <div class="tooltip__stat">Открывается: уровень <b>${ABILITY_UNLOCK_LEVELS.prep}</b></div>
                ${ts.getRank('improvedPrep') > 0 ? `<div class="tooltip__talent">Улучш. подготовка (${ts.getRank('improvedPrep')}/${ts.getTalent('improvedPrep').maxRanks}): −${cdReduction} сек кулдаун</div>` : ''}`;
      }
      case 'heal': {
        const cost = config?.abilities.heal.cost ?? 100;
        const baseCd = config?.abilities.heal.cooldown ?? 10;
        const baseHeal = 150;
        const healBonus = ts.getHealBonus();
        const totalHeal = baseHeal + healBonus;
        const regenBonus = ts.getHpRegenBonus();
        return `<div class="tooltip__stat">Стоимость: <b>${cost}</b> энергии</div>
                <div class="tooltip__stat">Кулдаун: <b>${baseCd}</b> сек</div>
                <div class="tooltip__stat">Восстанавливает: <b>${totalHeal}</b> HP${healBonus > 0 ? ` <span style="color:#7bc67b">(базовое ${baseHeal} + ${healBonus})</span>` : ''}</div>
                <div class="tooltip__stat">Открывается: уровень <b>${ABILITY_UNLOCK_LEVELS.heal}</b></div>
                ${ts.getRank('healBoost') > 0 ? `<div class="tooltip__talent">Усил. лечение (${ts.getRank('healBoost')}/${ts.getTalent('healBoost').maxRanks}): +${healBonus} HP за лечение, +${regenBonus} HP/сек пассивной регенерации</div>` : ''}`;
      }
      case 'volley': {
        const cost = config?.abilities.volley.cost ?? 100;
        const baseCd = config?.abilities.volley.cooldown ?? 12;
        const cdMult = ts.getShootCooldownMultiplier();
        const totalCd = baseCd * cdMult;
        const baseLanes = 4;
        const extraLanes = ts.getVolleyExtraLanes();
        const totalLanes = baseLanes + extraLanes;
        return `<div class="tooltip__stat">Стоимость: <b>${cost}</b> энергии</div>
                <div class="tooltip__stat">Кулдаун: <b>${totalCd.toFixed(1)}</b> сек${cdMult < 1 ? ` <span style="color:#7bc67b">(базовый ${baseCd} × ${cdMult.toFixed(2)})</span>` : ''}</div>
                <div class="tooltip__stat">Линий: <b>${totalLanes}</b>${extraLanes > 0 ? ` <span style="color:#7bc67b">(базовые ${baseLanes} + ${extraLanes})</span>` : ''}</div>
                <div class="tooltip__stat">Открывается: уровень <b>${ABILITY_UNLOCK_LEVELS.volley}</b></div>
                <div class="tooltip__stat" style="margin-top:4px;color:#c9b896">Не сбрасывает кулдаун лучников. Линии выбираются случайно.</div>
                ${ts.getRank('volleyMastery') > 0 ? `<div class="tooltip__talent">Искусный залп (${ts.getRank('volleyMastery')}/${ts.getTalent('volleyMastery').maxRanks}): +${extraLanes} линий</div>` : ''}
                ${ts.getRank('rapidFire') > 0 ? `<div class="tooltip__talent">Скорострельность (${ts.getRank('rapidFire')}/${ts.getTalent('rapidFire').maxRanks}): −${(ts.getRank('rapidFire') * 10)}% кулдаун</div>` : ''}`;
      }
      case 'stand': {
        const cost = config?.abilities.stand.cost ?? 15;
        const baseCd = config?.abilities.stand.cooldown ?? 120;
        const baseDur = 7;
        const durBonus = ts.getStandDurationBonus();
        const totalDur = baseDur + durBonus;
        const cdReduction = ts.getStandCooldownReduction();
        const totalCd = Math.max(0, baseCd - cdReduction);
        return `<div class="tooltip__stat">Стоимость: <b>${cost}</b> энергии</div>
                <div class="tooltip__stat">Кулдаун: <b>${totalCd}</b> сек${cdReduction > 0 ? ` <span style="color:#7bc67b">(базовый ${baseCd} − ${cdReduction})</span>` : ''}</div>
                <div class="tooltip__stat">Длительность: <b>${totalDur}</b> сек${durBonus > 0 ? ` <span style="color:#7bc67b">(базовая ${baseDur} + ${durBonus})</span>` : ''}</div>
                <div class="tooltip__stat">Открывается: уровень <b>${ABILITY_UNLOCK_LEVELS.stand}</b></div>
                <div class="tooltip__stat" style="margin-top:4px;color:#c9b896">Блокирует урон по HP и сжигание энергии.</div>
                ${ts.getRank('dutyBound') > 0 ? `<div class="tooltip__talent">Чувство долга (${ts.getRank('dutyBound')}/${ts.getTalent('dutyBound').maxRanks}): +${durBonus} сек длительность, −${cdReduction} сек кулдаун</div>` : ''}`;
      }
      case 'armageddon': {
        const cost = config?.abilities.armageddon.cost ?? 100;
        const baseCd = config?.abilities.armageddon.cooldown ?? 120;
        return `<div class="tooltip__stat">Стоимость: <b>${cost}</b> энергии</div>
                <div class="tooltip__stat">Кулдаун: <b>${baseCd}</b> сек</div>
                <div class="tooltip__stat">Задержка: <b>1.7</b> сек</div>
                <div class="tooltip__stat">Горение: <b>2</b> сек (пауки сгорают постепенно)</div>
                <div class="tooltip__stat">Открывается: уровень <b>${ABILITY_UNLOCK_LEVELS.armageddon}</b></div>
                <div class="tooltip__stat" style="margin-top:4px;color:#c9b896">За каждого убитого паука начисляются монетки (1–3).</div>
                <div class="tooltip__stat" style="color:#c9b896">Применяйте заранее — задержка 1.7 сек до начала горения.</div>`;
      }
      default:
        return '';
    }
  }

  public render(state: GameState): void {
    this._lastState = state;
    const hpPct = state.maxHp > 0 ? (state.hp / state.maxHp) * 100 : 0;
    if (this._hpFill) this._hpFill.style.setProperty('--fill', `${hpPct}%`);
    if (this._hpText) this._hpText.textContent = `${Math.floor(state.hp)} / ${Math.floor(state.maxHp)}`;

    const energyPct = state.maxEnergy > 0 ? (state.energy / state.maxEnergy) * 100 : 0;
    if (this._energyFill) this._energyFill.style.setProperty('--fill', `${energyPct}%`);
    if (this._energyText) this._energyText.textContent = `${Math.floor(state.energy)} / ${Math.floor(state.maxEnergy)}`;

    const timerPct = state.levelTimerMax > 0 ? (state.levelTimer / state.levelTimerMax) * 100 : 0;
    if (this._timerFill) this._timerFill.style.setProperty('--fill', `${timerPct}%`);
    if (this._timerText) this._timerText.textContent = `${Math.ceil(state.levelTimer)}с / ${Math.ceil(state.levelTimerMax)}с`;

    if (this._coinsText) this._coinsText.textContent = `${Math.floor(state.coins)}`;
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
