import type { GameState } from '../../domain/model/GameState.js';
import type { SpriteRegistry } from '../SpriteRegistry.js';
import { ABILITIES } from '../../content/abilities.js';
import { formatSeconds, formatStat } from '../presenters.js';

export class PreparationOverlay {
  private readonly container = document.createElement('div');
  private readonly rate: HTMLElement;
  private readonly timer: HTMLElement;

  constructor(parent: HTMLElement, sprites: SpriteRegistry) {
    this.container.className = 'preparation-overlay';
    this.container.innerHTML = `<div class="preparation-overlay__streams">${Array.from({ length: 9 }, (_, index) => `<i style="--stream:${index}"></i>`).join('')}</div><div class="preparation-overlay__badge"><span class="preparation-overlay__icon">${sprites.get(ABILITIES.prep.sprite)}</span><div><span class="preparation-overlay__label">${ABILITIES.prep.name}</span><strong class="preparation-overlay__rate"></strong></div><span class="preparation-overlay__timer"></span><div class="preparation-overlay__progress"></div></div>`;
    this.rate = this.container.querySelector('.preparation-overlay__rate')!;
    this.timer = this.container.querySelector('.preparation-overlay__timer')!;
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
    this.rate.textContent = `+${rate} энергии/с`;
    this.timer.textContent = `${timer} с`;
    this.container.style.setProperty(
      '--remaining',
      String(remaining / state.stats['prep.duration']),
    );
    this.container.setAttribute(
      'aria-label',
      `Подготовка: +${rate} энергии в секунду, осталось ${timer} с`,
    );
  }
}
