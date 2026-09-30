import type { GameState } from '../../domain/model/GameState.js';
import type { SpriteRegistry } from '../SpriteRegistry.js';
import { activeDebuffs, descriptionParagraphs, escapeHtml, formatSeconds } from '../presenters.js';
import { TooltipManager } from './TooltipManager.js';

const ICONS = {
  goldLock: 'DebuffGoldLock',
  healingReduction: 'DebuffHealingReduction',
  poison: 'DebuffPoison',
} as const;

export class DebuffPanel {
  readonly container = document.createElement('div');
  private readonly badges = new Map<string, HTMLButtonElement>();
  private readonly tooltip = TooltipManager.getInstance();
  private effects: ReturnType<typeof activeDebuffs> = [];
  private activeId: string | null = null;
  private shownHtml = '';

  constructor(sprites: SpriteRegistry) {
    this.container.className = 'player-debuffs';
    this.container.setAttribute('aria-label', 'Дебаффы от пауков');
    for (const [id, sprite] of Object.entries(ICONS)) {
      const slot = document.createElement('div');
      slot.className = 'player-debuff-slot';
      const badge = document.createElement('button');
      badge.type = 'button';
      badge.className = `player-debuff player-debuff--${id}`;
      badge.hidden = true;
      badge.innerHTML = `<span class="player-debuff__icon" aria-hidden="true">${sprites.get(sprite)}</span><span class="player-debuff__timer" aria-hidden="true"></span><span class="player-debuff__stacks" aria-hidden="true"></span>`;
      const show = () => {
        this.activeId = id;
        this.shownHtml = '';
        this.updateTooltip();
      };
      const hide = () => {
        this.activeId = null;
        this.tooltip.hide();
      };
      badge.addEventListener('mouseenter', show);
      badge.addEventListener('focus', show);
      badge.addEventListener('mouseleave', hide);
      badge.addEventListener('blur', hide);
      this.badges.set(id, badge);
      slot.append(badge);
      this.container.append(slot);
    }
  }

  render(state: GameState): void {
    this.effects = activeDebuffs(state);
    for (const [id, badge] of this.badges) {
      const effect = this.effects.find((entry) => entry.id === id);
      badge.hidden = !effect;
      if (!effect) continue;
      badge.children[1].textContent = `${formatSeconds(effect.timer)}с`;
      badge.children[2].textContent = id === 'poison' ? String(state.poisonDamage.length) : '';
      badge.setAttribute(
        'aria-label',
        `${effect.name}. Осталось ${formatSeconds(effect.timer)} с. ${effect.detail}`,
      );
    }
    this.updateTooltip();
  }

  private updateTooltip(): void {
    if (!this.activeId) return;
    const effect = this.effects.find((entry) => entry.id === this.activeId);
    if (!effect) {
      this.activeId = null;
      this.tooltip.hide();
      return;
    }
    const html = `<div class="tooltip__title">${escapeHtml(effect.name)}</div>${descriptionParagraphs(effect.detail)}<p>Осталось ${formatSeconds(effect.timer)} с.</p>`;
    if (html === this.shownHtml) return;
    this.shownHtml = html;
    this.tooltip.show(this.badges.get(effect.id)!, html);
  }
}
