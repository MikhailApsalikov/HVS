import type { GameState } from '../../domain/model/GameState.js';
import { WORLD } from '../../domain/rules/world.js';
import { formatSeconds, formatStat } from '../presenters.js';

export class PreparationOverlay {
  private readonly container = document.createElement('div');
  constructor(parent: HTMLElement) {
    this.container.className = 'preparation-overlay';
    this.container.innerHTML = `<div class="preparation-overlay__streams">${Array.from({ length: WORLD.lanes }, (_, index) => `<i style="--stream:${index}"></i>`).join('')}</div>`;
    parent.append(this.container);
  }

  render(state: GameState): void {
    const remaining = state.abilityActiveTimer('prep');
    const active = remaining > 0 && state.phase !== 'gameOver';
    this.container.classList.toggle('active', active);
    this.container.classList.toggle('preparation-overlay--paused', state.phase !== 'playing');
    this.container.setAttribute('aria-hidden', String(!active));
    if (!active) return;
    const rate = formatStat('prep.energyRegen', state.stats['prep.energyRegen']);
    const timer = formatSeconds(remaining);
    this.container.setAttribute(
      'aria-label',
      `Подготовка: +${rate} энергии в секунду, осталось ${timer} с`,
    );
  }
}
