import type { GameState } from '../../domain/model/GameState.js';
import type { PlayerEffect } from '../../domain/model/PlayerEffect.js';
import type { SpriteRegistry } from '../SpriteRegistry.js';
import {
  effectPanelGroups,
  PLAYER_EFFECT_ROW_CAPACITY,
  type EffectPanelGroup,
} from '../effectPanelModel.js';
import { formatSeconds, playerEffectDescription } from '../presenters.js';
import { TooltipManager } from './TooltipManager.js';

interface EffectSlot {
  readonly container: HTMLElement;
  readonly button: HTMLButtonElement;
  readonly icon: HTMLElement;
  readonly timer: HTMLElement;
  readonly stacks: HTMLElement;
  effect: PlayerEffect | null;
}

interface EffectRow {
  readonly slots: readonly EffectSlot[];
  readonly overflow: HTMLButtonElement;
  group: EffectPanelGroup;
}

export class PlayerEffectPanel {
  readonly container = document.createElement('div');
  private readonly tooltip = TooltipManager.getInstance();
  private readonly rows: Record<PlayerEffect['kind'], EffectRow>;
  private readonly tooltipContent = new Map<HTMLButtonElement, () => string>();
  private hovered: HTMLButtonElement | null = null;
  private focused: HTMLButtonElement | null = null;
  private shownAnchor: HTMLButtonElement | null = null;
  private shownHtml = '';

  constructor(private readonly sprites: SpriteRegistry) {
    this.container.className = 'player-effects';
    this.container.setAttribute('role', 'group');
    this.container.setAttribute('aria-label', 'Активные эффекты');
    this.rows = {
      buff: this.createRow('buff', 'Положительные эффекты'),
      debuff: this.createRow('debuff', 'Отрицательные эффекты'),
    };
  }

  render(state: GameState): void {
    const groups = effectPanelGroups(state.activeEffects);
    for (const kind of ['buff', 'debuff'] as const) {
      const row = this.rows[kind];
      row.group = groups[kind];
      row.slots.forEach((slot, index) => {
        const effect = row.group.visible[index] ?? null;
        if (effect?.sprite !== slot.effect?.sprite)
          slot.icon.innerHTML = effect ? this.sprites.get(effect.sprite) : '';
        slot.effect = effect;
        slot.container.hidden = !effect;
        slot.button.hidden = !effect;
        if (!effect) {
          this.clearAnchor(slot.button);
          return;
        }
        slot.timer.textContent =
          effect.remaining === null ? '∞' : `${formatSeconds(effect.remaining)}с`;
        slot.stacks.textContent = effect.stacks === null ? '' : String(effect.stacks);
        const time =
          effect.remaining === null
            ? 'Без таймера'
            : `Осталось ${formatSeconds(effect.remaining)} с`;
        slot.button.setAttribute(
          'aria-label',
          `${effect.name}. ${time}.${effect.stacks === null ? '' : ` Счётчик: ${effect.stacks}.`}`,
        );
      });
      const hiddenCount = row.group.overflow.length;
      row.overflow.hidden = hiddenCount === 0;
      row.overflow.textContent = hiddenCount > 0 ? `+${hiddenCount}` : '';
      row.overflow.setAttribute('aria-label', `Ещё эффекты: ${hiddenCount}`);
      if (hiddenCount === 0) this.clearAnchor(row.overflow);
    }
    this.updateTooltip();
  }

  private createRow(kind: PlayerEffect['kind'], label: string): EffectRow {
    const container = document.createElement('div');
    container.className = `player-effects__row player-effects__row--${kind}`;
    container.setAttribute('role', 'group');
    container.setAttribute('aria-label', label);
    const badges = document.createElement('div');
    badges.className = 'player-effects__badges';
    const slots = Array.from({ length: PLAYER_EFFECT_ROW_CAPACITY }, () => {
      const slotContainer = document.createElement('div');
      slotContainer.className = 'player-effect-slot';
      slotContainer.hidden = true;
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'player-effect';
      button.hidden = true;
      const artwork = document.createElement('span');
      artwork.className = 'player-effect__artwork';
      artwork.setAttribute('aria-hidden', 'true');
      const icon = document.createElement('span');
      icon.className = 'player-effect__icon';
      const stacks = document.createElement('span');
      stacks.className = 'player-effect__stacks';
      artwork.append(icon, stacks);
      const timer = document.createElement('span');
      timer.className = 'player-effect__timer';
      timer.setAttribute('aria-hidden', 'true');
      button.append(artwork, timer);
      slotContainer.append(button);
      badges.append(slotContainer);
      const slot: EffectSlot = {
        container: slotContainer,
        button,
        icon,
        timer,
        stacks,
        effect: null,
      };
      this.bindTooltip(button, () => (slot.effect ? playerEffectDescription(slot.effect) : ''));
      return slot;
    });
    const overflow = document.createElement('button');
    overflow.type = 'button';
    overflow.className = 'player-effects__overflow';
    overflow.hidden = true;
    const row: EffectRow = { slots, overflow, group: { visible: [], overflow: [] } };
    this.bindTooltip(overflow, () => {
      if (row.group.overflow.length === 0) return '';
      return `<div class="tooltip__title">Ещё эффекты: ${row.group.overflow.length}</div>${row.group.overflow
        .map(
          (effect) =>
            `<div class="player-effects__overflow-detail"><span class="player-effects__overflow-icon" aria-hidden="true">${this.sprites.get(effect.sprite)}</span><div>${playerEffectDescription(effect)}</div></div>`,
        )
        .join('')}`;
    });
    badges.append(overflow);
    container.append(badges);
    this.container.append(container);
    return row;
  }

  private bindTooltip(button: HTMLButtonElement, content: () => string): void {
    this.tooltipContent.set(button, content);
    button.addEventListener('mouseenter', () => {
      this.hovered = button;
      this.updateTooltip(true);
    });
    button.addEventListener('mouseleave', () => {
      if (this.hovered === button) this.hovered = null;
      this.updateTooltip();
    });
    button.addEventListener('focus', () => {
      this.focused = button;
      this.updateTooltip(true);
    });
    button.addEventListener('blur', () => {
      if (this.focused === button) this.focused = null;
      this.updateTooltip();
    });
  }

  private clearAnchor(button: HTMLButtonElement): void {
    if (this.hovered === button) this.hovered = null;
    if (this.focused === button) this.focused = null;
  }

  private updateTooltip(claim = false): void {
    const anchor = this.hovered ?? this.focused;
    const html = anchor ? (this.tooltipContent.get(anchor)?.() ?? '') : '';
    if (!anchor || !html) {
      if (this.shownAnchor) this.tooltip.hide(this.shownAnchor);
      this.shownAnchor = null;
      this.shownHtml = '';
      return;
    }
    if (!claim && (!this.shownAnchor || !this.tooltip.isShowing(this.shownAnchor))) return;
    if (anchor === this.shownAnchor && html === this.shownHtml && this.tooltip.isShowing(anchor))
      return;
    this.shownAnchor = anchor;
    this.shownHtml = html;
    this.tooltip.show(anchor, html);
  }
}
