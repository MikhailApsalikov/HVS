import type { GameState } from '../../domain/model/GameState.js';
import type { TalentSystem } from '../../domain/model/TalentSystem.js';
import type { ItemSystem } from '../../domain/model/ItemSystem.js';
import type { TalentId } from '../../domain/types.js';
import type { SpriteRegistry } from '../SpriteRegistry.js';
import { TALENTS } from '../../content/talents.js';
import { talentDescription } from '../presenters.js';
import { ShopPanel, type ShopActions } from '../components/ShopPanel.js';
import { TooltipManager } from '../components/TooltipManager.js';

export interface LevelUpActions extends ShopActions {
  upgrade(id: TalentId): boolean;
  confirm(): boolean;
}

export class LevelUpScreen {
  private readonly shop = new ShopPanel();
  private readonly tooltip = TooltipManager.getInstance();
  constructor(
    private readonly container: HTMLElement,
    private readonly sprites: SpriteRegistry,
  ) {
    container.className = 'level-up-screen';
    container.dataset.screen = 'level-up';
  }
  show(state: GameState, talents: TalentSystem, items: ItemSystem, actions: LevelUpActions): void {
    this.container.replaceChildren();
    const layout = document.createElement('div');
    layout.className = 'level-up-layout';
    const panel = document.createElement('div');
    panel.className = 'talent-panel';
    panel.innerHTML = `<div class="talent-panel__title-bar"><div class="talent-panel__title">Дерево талантов — уровень ${state.level}</div><div class="talent-panel__points talent-panel__points--has-points">Очков таланта: ${state.pendingTalentPoints}</div></div>`;
    const tree = document.createElement('div');
    tree.className = 'talent-tree';
    const levels = [...new Set(talents.talents.map((talent) => talent.unlocksAtLevel))].sort(
      (a, b) => a - b,
    );
    for (const level of levels) {
      const tier = document.createElement('div');
      tier.className = 'talent-tree__tier';
      tier.innerHTML = `<div class="talent-tree__tier-label">${level <= 1 ? 'Начальные таланты' : `Требуется ${level} уровень`}</div>`;
      const row = document.createElement('div');
      row.className = 'talent-tree__tier-row';
      for (const talent of talents.talents.filter((talent) => talent.unlocksAtLevel === level)) {
        const definition = TALENTS[talent.id];
        const locked = state.level < level;
        const maxed = talent.rank >= talent.maxRanks;
        const available = !locked && !maxed && state.pendingTalentPoints > 0;
        const button = document.createElement('button');
        button.type = 'button';
        button.dataset.talentId = talent.id;
        button.className = `talent-btn${locked ? ' talent-btn--locked' : maxed ? ' talent-btn--maxed' : available ? ' talent-btn--available' : ''}`;
        button.setAttribute('aria-label', definition.name);
        button.setAttribute('aria-disabled', String(!available));
        button.innerHTML = `<div class="talent-btn__icon">${this.sprites.get(definition.sprite)}</div><div class="talent-btn__rank">${talent.rank}/${talent.maxRanks}</div>`;
        button.addEventListener('click', () => {
          if (actions.upgrade(talent.id)) {
            this.tooltip.hide();
            this.show(state, talents, items, actions);
          }
        });
        button.addEventListener('mouseenter', () =>
          this.tooltip.show(
            button,
            `<div class="tooltip__title">${definition.name}</div><p>За ранг:<br>${talentDescription(talent.id)}</p>${talent.rank > 0 ? `<p>Сейчас (ранг ${talent.rank}):<br>${talentDescription(talent.id, talent.rank)}</p>` : ''}<div>Ранг ${talent.rank}/${talent.maxRanks}. Требуется уровень ${level}.</div>`,
          ),
        );
        button.addEventListener('mouseleave', () => this.tooltip.hide());
        row.append(button);
      }
      tier.append(row);
      tree.append(tier);
    }
    panel.append(tree);
    this.shop.render(state, talents, items, actions);
    layout.append(panel, this.shop.container);
    const footer = document.createElement('div');
    footer.className = 'level-up-footer';
    const confirm = document.createElement('button');
    confirm.className = 'talent-panel__confirm';
    confirm.type = 'button';
    confirm.dataset.action = 'confirm';
    confirm.textContent = 'Продолжить';
    confirm.disabled = state.pendingTalentPoints > 0 && talents.hasAvailableUpgrades(state.level);
    confirm.addEventListener('click', () => {
      if (actions.confirm()) this.hide();
    });
    footer.append(confirm);
    this.container.append(layout, footer);
    this.container.classList.add('level-up-screen--visible');
  }
  hide(): void {
    this.container.classList.remove('level-up-screen--visible');
    this.tooltip.hide();
  }
  getContainer(): HTMLElement {
    return this.container;
  }
}
