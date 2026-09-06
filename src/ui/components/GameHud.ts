import type { GameState } from '../../domain/model/GameState.js';
import type { AbilityId } from '../../domain/types.js';
import type { SpriteRegistry } from '../SpriteRegistry.js';
import { ABILITIES, ABILITY_ORDER } from '../../content/abilities.js';
import { PRIMARY_STATS, STATS } from '../../domain/rules/stats.js';
import { abilityDescription, attributeDescription, formatStat, statRows } from '../presenters.js';
import { TooltipManager } from './TooltipManager.js';

export class HUD {
  private state: GameState | null = null;
  private readonly tooltip = TooltipManager.getInstance();
  private readonly bars = new Map<string, { fill: HTMLElement; text: HTMLElement }>();
  private readonly buttons = new Map<AbilityId, HTMLButtonElement>();
  private readonly coins = document.createElement('div');
  private readonly level = document.createElement('div');
  private readonly attributes = document.createElement('div');
  private readonly abilities = document.createElement('div');

  constructor(
    private readonly container: HTMLElement,
    sprites: SpriteRegistry,
  ) {
    container.className = 'hud';
    const resources = document.createElement('div');
    resources.className = 'resource-bars';
    for (const [id, label] of [
      ['hp', 'Здоровье'],
      ['energy', 'Энергия'],
      ['timer', 'Время уровня'],
    ]) {
      const bar = document.createElement('div');
      bar.id = `${id}-bar`;
      bar.className = 'resource-bar';
      bar.setAttribute('aria-label', label);
      bar.innerHTML =
        '<div class="resource-bar__fill"></div><div class="resource-bar__text"></div>';
      this.bars.set(id, {
        fill: bar.children[0] as HTMLElement,
        text: bar.children[1] as HTMLElement,
      });
      bar.addEventListener('mouseenter', () => {
        if (!this.state) return;
        const stats =
          id === 'hp'
            ? (['maxHp', 'hpRegen', 'damageFactor'] as const)
            : id === 'energy'
              ? (['maxEnergy', 'energyRegen', 'energyPerKill', 'energyPerBreach'] as const)
              : [];
        this.tooltip.show(
          bar,
          `<div class="tooltip__title">${label}</div>${id === 'timer' ? `${this.state.levelTimerMax.toFixed(2)} с` : statRows(this.state.stats, stats)}`,
        );
      });
      bar.addEventListener('mouseleave', () => this.tooltip.hide());
      resources.append(bar);
    }
    this.coins.className = 'coins-display';
    this.coins.innerHTML = `<span class="coins-display__icon">${sprites.get('Coin')}</span><span class="coins-display__text"></span>`;
    this.coins.addEventListener('mouseenter', () => {
      if (this.state)
        this.tooltip.show(
          this.coins,
          statRows(this.state.stats, ['coinsPerSec', 'coinsPerKill', 'jackpotChance']),
        );
    });
    this.coins.addEventListener('mouseleave', () => this.tooltip.hide());
    this.level.className = 'level-number';
    this.attributes.className = 'character-attributes';
    for (const id of [...PRIMARY_STATS, 'armor', 'blockChance', 'blockPower'] as const) {
      const row = document.createElement('div');
      row.className = 'character-attribute';
      row.dataset.stat = id;
      row.tabIndex = 0;
      const show = () => {
        if (this.state) this.tooltip.show(row, attributeDescription(this.state, id));
      };
      row.addEventListener('mouseenter', show);
      row.addEventListener('focus', show);
      row.addEventListener('mouseleave', () => this.tooltip.hide());
      row.addEventListener('blur', () => this.tooltip.hide());
      this.attributes.append(row);
    }
    this.abilities.className = 'ability-buttons';
    this.abilities.id = 'ability-buttons';
    for (const id of ABILITY_ORDER) {
      const definition = ABILITIES[id];
      const wrapper = document.createElement('div');
      wrapper.className = 'ability-btn-wrapper';
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'ability-btn';
      button.dataset.ability = id;
      button.setAttribute('aria-label', definition.name);
      button.innerHTML = `<span class="ability-btn__icon">${sprites.get(definition.sprite)}</span><span class="ability-btn__info"><span class="ability-btn__name">${definition.name}</span><span class="ability-btn__hotkey">[${definition.key}]</span><span class="ability-btn__effect-text"></span></span><span class="ability-btn__cd-text"></span><span class="ability-btn__lock">${sprites.get('Lock')}</span>`;
      wrapper.append(button);
      this.buttons.set(id, button);
      wrapper.addEventListener('mouseenter', () => {
        if (this.state) this.tooltip.show(wrapper, abilityDescription(this.state, id));
      });
      wrapper.addEventListener('mouseleave', () => this.tooltip.hide());
      this.abilities.append(wrapper);
    }
    container.append(resources, this.coins, this.level, this.attributes, this.abilities);
  }
  getShootTooltipHtml(lane: number): string {
    return this.state
      ? `<div class="tooltip__title">Лучник ${lane}</div>${statRows(this.state.stats, ['shootCost', 'shootCooldown', 'arrowSpeed'])}${this.state.energy < this.state.stats.shootCost ? '<div class="action-unavailable">Недостаточно энергии</div>' : ''}${this.state.archers[lane - 1].isOnCooldown ? '<div class="action-unavailable">Выстрел перезаряжается</div>' : ''}`
      : '';
  }
  render(state: GameState): void {
    this.state = state;
    for (const [id, current, max] of [
      ['hp', state.hp, state.maxHp],
      ['energy', state.energy, state.maxEnergy],
      ['timer', state.levelTimer, state.levelTimerMax],
    ] as const) {
      const bar = this.bars.get(id)!;
      bar.fill.style.setProperty('--fill', `${max > 0 ? (current / max) * 100 : 0}%`);
      bar.text.textContent =
        id === 'timer'
          ? `${current.toFixed(2)}с / ${max.toFixed(2)}с`
          : `${Math.floor(current)} / ${max}`;
    }
    this.coins.children[1].textContent = String(state.coins);
    this.level.textContent = `Уровень ${state.level}`;
    ([...PRIMARY_STATS, 'armor', 'blockChance', 'blockPower'] as const).forEach((id, index) => {
      this.attributes.children[index].textContent =
        `${STATS[id].label}: ${formatStat(id, state.stats[id])}`;
    });
    for (const [id, button] of this.buttons) {
      const cooldown = state.getAbility(id);
      const locked = !state.isAbilityUnlocked(id);
      button.parentElement!.hidden = Boolean(ABILITIES[id].talent) && locked;
      const activeTimer =
        id === 'lastHope' ? state.lastHopeTimer : id === 'stand' ? state.invulnerableTimer : 0;
      button.classList.toggle('ability-btn--active', activeTimer > 0);
      button.querySelector('.ability-btn__effect-text')!.textContent =
        activeTimer > 0 ? `Действует: ${activeTimer.toFixed(2)} с` : '';
      button.classList.toggle('ability-btn--locked', locked);
      button.classList.toggle('ability-btn--cooldown', cooldown.isOnCooldown);
      button.classList.toggle('ability-btn--no-energy', state.energy < state.stats[`${id}.cost`]);
      button.style.setProperty('--cd-pct', `${cooldown.cooldownFraction * 100}%`);
      (button.querySelector('.ability-btn__lock') as HTMLElement).hidden = !locked;
      button.querySelector('.ability-btn__cd-text')!.textContent = cooldown.isOnCooldown
        ? `${cooldown.remainingCooldown.toFixed(2)}с`
        : '';
    }
  }
  getContainer(): HTMLElement {
    return this.container;
  }
  getAbilityButtonsContainer(): HTMLElement {
    return this.abilities;
  }
}
