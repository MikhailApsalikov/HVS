import type { GameState } from '../../domain/model/GameState.js';
import type { SpriteRegistry } from '../SpriteRegistry.js';
import { formatSeconds, killingStreakDescription } from '../presenters.js';
import { TooltipManager } from './TooltipManager.js';

export class KillingStreakEffect {
  readonly container = document.createElement('div');
  private readonly count: HTMLElement;
  private readonly timer: HTMLElement;
  private readonly bonus: HTMLElement;
  private readonly pips: HTMLElement;
  private previousStacks = 0;
  private flash: Animation | null = null;
  private state: GameState | null = null;

  constructor(sprites: SpriteRegistry) {
    this.container.className = 'killing-streak';
    this.container.hidden = true;
    this.container.tabIndex = 0;
    this.container.innerHTML = `<div class="killing-streak__heading"><span class="killing-streak__icon">${sprites.get('TalentKillingStreak')}</span><span>Череда убийств</span><strong class="killing-streak__count"></strong></div><div class="killing-streak__pips" aria-hidden="true"></div><div class="killing-streak__bonus"></div><div class="killing-streak__track" aria-hidden="true"><div class="killing-streak__progress"></div></div><div class="killing-streak__timer"></div>`;
    this.count = this.container.querySelector('.killing-streak__count')!;
    this.timer = this.container.querySelector('.killing-streak__timer')!;
    this.bonus = this.container.querySelector('.killing-streak__bonus')!;
    this.pips = this.container.querySelector('.killing-streak__pips')!;
    const tooltip = TooltipManager.getInstance();
    const show = () => {
      if (this.state) tooltip.show(this.container, killingStreakDescription(this.state));
    };
    this.container.addEventListener('mouseenter', show);
    this.container.addEventListener('focus', show);
    this.container.addEventListener('mouseleave', () => tooltip.hide());
    this.container.addEventListener('blur', () => tooltip.hide());
  }

  render(state: GameState): void {
    this.state = state;
    this.container.hidden = !state.killingStreakLearned || state.phase === 'gameOver';
    const stacks = state.killingStreakStacks;
    const maximum = state.stats['killingStreak.maxStacks'];
    this.container.classList.toggle('killing-streak--active', stacks > 0);
    this.container.classList.toggle('killing-streak--full', state.killingStreakFull);
    this.count.textContent = `${stacks}/${maximum}`;
    this.bonus.textContent =
      stacks > 0 ? `−${stacks} энергии за выстрел` : 'Не получайте урон, чтобы набрать эффект';
    this.timer.textContent = state.killingStreakFull
      ? 'Максимум эффектов'
      : `Следующий через ${formatSeconds(state.killingStreakRemaining)} с${state.phase !== 'playing' ? ' · Пауза' : ''}`;
    this.container.style.setProperty('--streak-progress', String(state.killingStreakFraction));
    this.container.setAttribute(
      'aria-label',
      `Череда убийств: ${stacks} из ${maximum}. ${this.timer.textContent}`,
    );
    if (this.pips.childElementCount !== maximum)
      this.pips.replaceChildren(
        ...Array.from({ length: maximum }, () => document.createElement('i')),
      );
    Array.from(this.pips.children).forEach((pip, index) =>
      pip.classList.toggle('filled', index < stacks),
    );
    if (stacks !== this.previousStacks && !matchMedia('(prefers-reduced-motion: reduce)').matches) {
      this.flash?.cancel();
      this.flash = this.count.animate(
        [
          { transform: 'scale(1.35)', color: stacks > this.previousStacks ? '#d9ffb0' : '#ffbe9d' },
          { transform: 'scale(1)', color: '#f4e6b4' },
        ],
        { duration: 450, easing: 'ease-out' },
      );
    }
    if (state.phase !== 'playing') this.flash?.pause();
    else if (this.flash?.playState === 'paused') this.flash.play();
    this.previousStacks = stacks;
  }
}
