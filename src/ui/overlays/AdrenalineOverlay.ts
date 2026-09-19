import type { GameState } from '../../domain/model/GameState.js';
import type { SpriteRegistry } from '../SpriteRegistry.js';
import { ABILITIES } from '../../content/abilities.js';
import { formatSeconds } from '../presenters.js';

export class AdrenalineOverlay {
  private readonly container = document.createElement('div');
  private readonly count: HTMLElement;
  private readonly timer: HTMLElement;
  private previousShots = 0;
  private flash: Animation | null = null;

  constructor(
    parent: HTMLElement,
    sprites: SpriteRegistry,
    private readonly ability: 'adrenaline' | 'eagleEye' = 'adrenaline',
  ) {
    this.container.className = `adrenaline-overlay ${ability === 'eagleEye' ? 'eagle-eye-overlay' : ''}`;
    this.container.innerHTML = `<div class="adrenaline-overlay__aura"></div><div class="adrenaline-overlay__sparks">${Array.from({ length: 9 }, (_, index) => `<i style="--spark:${index}"></i>`).join('')}</div><div class="adrenaline-overlay__badge"><span class="adrenaline-overlay__icon">${sprites.get(ABILITIES[ability].sprite)}</span><div class="adrenaline-overlay__readout"><span class="adrenaline-overlay__label">${ability === 'eagleEye' ? 'Критические стрелы' : 'Бесплатные стрелы'}</span><strong class="adrenaline-overlay__count"></strong></div><span class="adrenaline-overlay__timer"></span></div>`;
    this.count = this.container.querySelector('.adrenaline-overlay__count')!;
    this.timer = this.container.querySelector('.adrenaline-overlay__timer')!;
    parent.append(this.container);
  }

  render(state: GameState): void {
    const shots = this.ability === 'eagleEye' ? state.eagleEyeShots : state.adrenalineShots;
    const timer = state.abilityActiveTimer(this.ability);
    const active = timer > 0 && shots > 0 && state.phase !== 'gameOver';
    this.container.classList.toggle('active', active);
    this.container.classList.toggle('adrenaline-overlay--paused', state.phase !== 'playing');
    this.container.setAttribute('aria-hidden', String(!active));
    if (active) {
      this.count.textContent = String(shots);
      this.timer.textContent = `${formatSeconds(timer)} с`;
      this.container.setAttribute(
        'aria-label',
        `${ABILITIES[this.ability].name}: выстрелов ${shots}, осталось ${formatSeconds(timer)} с`,
      );
      if (this.previousShots > shots && !matchMedia('(prefers-reduced-motion: reduce)').matches) {
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
    this.previousShots = active ? shots : 0;
  }
}
