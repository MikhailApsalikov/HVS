import type { GameState } from '../../domain/model/GameState.js';
import type { SpriteRegistry } from '../SpriteRegistry.js';
import { formatSeconds } from '../presenters.js';

export class AdrenalineOverlay {
  private readonly container = document.createElement('div');
  private readonly count: HTMLElement;
  private readonly timer: HTMLElement;
  private previousShots = 0;
  private flash: Animation | null = null;

  constructor(parent: HTMLElement, sprites: SpriteRegistry) {
    this.container.className = 'adrenaline-overlay';
    this.container.innerHTML = `<div class="adrenaline-overlay__aura"></div><div class="adrenaline-overlay__sparks">${Array.from({ length: 9 }, (_, index) => `<i style="--spark:${index}"></i>`).join('')}</div><div class="adrenaline-overlay__badge"><span class="adrenaline-overlay__icon">${sprites.get('AbilityAdrenaline')}</span><div class="adrenaline-overlay__readout"><span class="adrenaline-overlay__label">Бесплатные стрелы</span><strong class="adrenaline-overlay__count"></strong></div><span class="adrenaline-overlay__timer"></span></div>`;
    this.count = this.container.querySelector('.adrenaline-overlay__count')!;
    this.timer = this.container.querySelector('.adrenaline-overlay__timer')!;
    parent.append(this.container);
  }

  render(state: GameState): void {
    const active = state.adrenalineActive && state.phase !== 'gameOver';
    this.container.classList.toggle('active', active);
    this.container.classList.toggle('adrenaline-overlay--paused', state.phase !== 'playing');
    this.container.setAttribute('aria-hidden', String(!active));
    if (active) {
      this.count.textContent = String(state.adrenalineShots);
      this.timer.textContent = `${formatSeconds(state.adrenalineTimer)} с`;
      this.container.setAttribute(
        'aria-label',
        `Адреналин: бесплатных стрел ${state.adrenalineShots}, осталось ${formatSeconds(state.adrenalineTimer)} с`,
      );
      if (
        this.previousShots > state.adrenalineShots &&
        !matchMedia('(prefers-reduced-motion: reduce)').matches
      ) {
        this.flash?.cancel();
        this.flash = this.count.animate(
          [
            { transform: 'scale(1.3)', color: '#fff' },
            { transform: 'scale(1)', color: '#ffd8a1' },
          ],
          { duration: 220, easing: 'ease-out' },
        );
      }
    } else {
      this.flash?.cancel();
      this.flash = null;
    }
    this.previousShots = active ? state.adrenalineShots : 0;
  }
}
