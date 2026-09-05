import type { GameState } from '../../domain/model/GameState.js';
import type { TalentSystem } from '../../domain/model/TalentSystem.js';
import type { ItemSystem } from '../../domain/model/ItemSystem.js';
import type { TalentId, TalentBranch } from '../../domain/types.js';
import type { SpriteRegistry } from '../SpriteRegistry.js';
import { TALENTS, TALENT_BRANCHES } from '../../content/talents.js';
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
    for (const branch of Object.keys(TALENT_BRANCHES) as TalentBranch[]) {
      const column = document.createElement('section');
      column.className = 'talent-branch';
      column.dataset.branch = branch;
      const invested = talents.branchPoints(branch);
      column.innerHTML = `<h2 class="talent-branch__title">${TALENT_BRANCHES[branch]}</h2><div class="talent-branch__points">Вложено очков: ${invested}</div>`;
      const branchTalents = talents.talents.filter((talent) => talent.branch === branch);
      const tiers = [...new Set(branchTalents.map((talent) => talent.tier))].sort((a, b) => a - b);
      for (const tierNumber of tiers) {
        const tierTalents = branchTalents.filter((talent) => talent.tier === tierNumber);
        const { unlocksAtLevel: level, requiredBranchPoints } = tierTalents[0];
        const tier = document.createElement('div');
        tier.className = 'talent-tree__tier';
        tier.dataset.tier = String(tierNumber);
        tier.innerHTML = `<div class="talent-tree__tier-label">Тир ${tierNumber} · <span class="${state.level < level ? 'action-unavailable' : ''}">ур. ${level}</span> · <span class="${invested < requiredBranchPoints ? 'action-unavailable' : ''}">${requiredBranchPoints} очк.</span></div>`;
        const row = document.createElement('div');
        row.className = 'talent-tree__tier-row';
        for (const talent of tierTalents) {
          const definition = TALENTS[talent.id];
          const locked = state.level < level || invested < requiredBranchPoints;
          const maxed = talent.rank >= talent.maxRanks;
          const available =
            talents.canUpgrade(talent.id, state.level) && state.pendingTalentPoints > 0;
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
          const showTooltip = () =>
            this.tooltip.show(
              button,
              `<div class="tooltip__title">${definition.name}</div><div>${TALENT_BRANCHES[branch]} · Тир ${tierNumber}</div><p>За ранг:<br>${talentDescription(talent.id)}</p>${talent.rank > 0 ? `<p>Сейчас (ранг ${talent.rank}):<br>${talentDescription(talent.id, talent.rank)}</p>` : ''}<div>Ранг ${talent.rank}/${talent.maxRanks}</div><div class="${state.level < level ? 'action-unavailable' : ''}">Требуется уровень ${level}</div><div class="${invested < requiredBranchPoints ? 'action-unavailable' : ''}">Вложено в ветку: ${invested} / ${requiredBranchPoints}</div>${maxed ? '<div class="action-unavailable">Максимальный ранг</div>' : state.pendingTalentPoints === 0 ? '<div class="action-unavailable">Нет очков таланта</div>' : ''}`,
            );
          button.addEventListener('mouseenter', showTooltip);
          button.addEventListener('focus', showTooltip);
          button.addEventListener('mouseleave', () => this.tooltip.hide());
          button.addEventListener('blur', () => this.tooltip.hide());
          const option = document.createElement('div');
          option.className = 'talent-option';
          const name = document.createElement('div');
          name.className = 'talent-option__name';
          name.textContent = definition.name;
          option.append(button, name);
          row.append(option);
        }
        tier.append(row);
        column.append(tier);
      }
      tree.append(column);
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
    if (confirm.disabled) {
      const reason = document.createElement('div');
      reason.className = 'action-unavailable';
      reason.textContent = 'Распределите очки таланта';
      footer.append(reason);
    }
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
