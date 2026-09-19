import type { GameState } from '../../domain/model/GameState.js';
import { formatSeconds } from '../presenters.js';

export class AntiAfkOverlay {
  private readonly container = document.createElement('div');
  private readonly percent: HTMLElement;
  private readonly caption: HTMLElement;
  private readonly timer: HTMLElement;
  private previousStacks = 0;
  private flash: Animation | null = null;

  constructor(parent: HTMLElement) {
    this.container.className = 'anti-afk-overlay';
    this.container.innerHTML =
      '<div class="anti-afk-overlay__badge"><div class="anti-afk-overlay__readout"><span class="anti-afk-overlay__title">Бездействие</span><strong class="anti-afk-overlay__percent"></strong><span class="anti-afk-overlay__label">Входящий урон</span><span class="anti-afk-overlay__caption"></span></div><span class="anti-afk-overlay__timer"></span><div class="anti-afk-overlay__track" aria-hidden="true"><div class="anti-afk-overlay__progress"></div></div></div>';
    this.percent = this.container.querySelector('.anti-afk-overlay__percent')!;
    this.caption = this.container.querySelector('.anti-afk-overlay__caption')!;
    this.timer = this.container.querySelector('.anti-afk-overlay__timer')!;
    parent.append(this.container);
  }

  render(state: GameState): void {
    const active = state.antiAfkDamagePercent > 0 && state.phase !== 'gameOver';
    const recovering = state.antiAfkRecoveryTimer > 0;
    this.container.classList.toggle('active', active);
    this.container.classList.toggle('anti-afk-overlay--recovering', recovering);
    this.container.classList.toggle('anti-afk-overlay--paused', state.phase !== 'playing');
    this.container.setAttribute('aria-hidden', String(!active));
    if (active) {
      this.percent.textContent = `+${state.antiAfkDamagePercent}%`;
      this.caption.textContent = recovering ? 'До снятия штрафа' : 'Потратьте энергию';
      this.timer.textContent = recovering ? `${formatSeconds(state.antiAfkRecoveryTimer)} с` : '';
      this.container.style.setProperty('--recovery', String(state.antiAfkRecoveryFraction));
      this.container.setAttribute(
        'aria-label',
        `Бездействие: входящий урон +${state.antiAfkDamagePercent}%. ${this.caption.textContent} ${this.timer.textContent}`,
      );
      if (
        state.antiAfkStacks > this.previousStacks &&
        !matchMedia('(prefers-reduced-motion: reduce)').matches
      ) {
        this.flash?.cancel();
        this.flash = this.percent.animate(
          [
            { transform: 'scale(1)', color: '#fff', textShadow: '0 0 24px #ff5252' },
            {
              transform: 'scale(1.55)',
              color: '#fff',
              textShadow: '0 0 32px #ff5252',
              offset: 0.2,
            },
            { transform: 'scale(1)', color: '#ffb5b5', textShadow: '0 0 0 transparent' },
          ],
          { duration: 750, easing: 'ease-out' },
        );
      }
      if (state.phase !== 'playing') this.flash?.pause();
      else if (this.flash?.playState === 'paused') this.flash.play();
    } else {
      this.flash?.cancel();
      this.flash = null;
    }
    this.previousStacks = active ? state.antiAfkStacks : 0;
  }
}
