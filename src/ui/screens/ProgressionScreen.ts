import type { GameState } from '../../domain/model/GameState.js';
import type { TalentSystem } from '../../domain/model/TalentSystem.js';
import type { ItemSystem } from '../../domain/model/ItemSystem.js';
import type { TalentId, TalentBranch } from '../../domain/types.js';
import type { SpriteRegistry } from '../SpriteRegistry.js';
import { TALENTS, TALENT_BRANCHES } from '../../content/talents.js';
import { talentDescription, descriptionParagraphs } from '../presenters.js';
import { ShopPanel, type ShopActions } from '../components/ShopPanel.js';
import { TooltipManager } from '../components/TooltipManager.js';

export interface LevelUpActions extends ShopActions {
  upgrade(id: TalentId): boolean;
  confirm(): boolean;
}

export class LevelUpScreen {
  private readonly shop = new ShopPanel();
  private readonly tooltip = TooltipManager.getInstance();
  private readonly resizeObserver = new ResizeObserver(() => this.drawDependencies());
  constructor(
    private readonly container: HTMLElement,
    private readonly sprites: SpriteRegistry,
  ) {
    container.className = 'level-up-screen';
    container.dataset.screen = 'level-up';
  }
  show(state: GameState, talents: TalentSystem, items: ItemSystem, actions: LevelUpActions): void {
    this.resizeObserver.disconnect();
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
      column.innerHTML = `<h2 class="talent-branch__title">${TALENT_BRANCHES[branch]}</h2>`;
      const branchTalents = talents.talents.filter((talent) => talent.branch === branch);
      const tiers = Array.from(
        { length: Math.max(...branchTalents.map((talent) => talent.tier)) },
        (_, index) => index + 1,
      );
      for (const tierNumber of tiers) {
        const tierTalents = branchTalents.filter((talent) => talent.tier === tierNumber);
        const tier = document.createElement('div');
        tier.className = 'talent-tree__tier';
        tier.dataset.tier = String(tierNumber);
        if (tierTalents.length === 0) {
          column.append(tier);
          continue;
        }
        const { unlocksAtLevel: level, requiredBranchPoints } = tierTalents[0];
        const row = document.createElement('div');
        row.className = 'talent-tree__tier-row';
        for (const talent of tierTalents) {
          const definition = TALENTS[talent.id];
          const prerequisite = definition.prerequisite;
          const prerequisiteMet = !prerequisite || talents.getRank(prerequisite) > 0;
          const locked = state.level < level || invested < requiredBranchPoints || !prerequisiteMet;
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
              `<div class="tooltip__title">${definition.name}</div>${talent.rank > 0 ? `<section class="tooltip__rank tooltip__rank--current"><div class="tooltip__rank-label">Изучено · ранг ${talent.rank}</div>${descriptionParagraphs(talentDescription(talent.id, talent.rank, state.stats))}</section>` : ''}${!maxed ? `<section class="tooltip__rank tooltip__rank--next"><div class="tooltip__rank-label">${talent.rank > 0 ? `После улучшения · ранг ${talent.rank + 1}` : 'При изучении'}</div>${descriptionParagraphs(talentDescription(talent.id, talent.rank + 1, state.stats))}</section>` : ''}<div class="tooltip__requirements"><div class="${state.level < level ? 'action-unavailable' : ''}">Требуется уровень ${level}</div><div class="${invested < requiredBranchPoints ? 'action-unavailable' : ''}">Вложено в ветку "${TALENT_BRANCHES[branch]}": ${invested}/${requiredBranchPoints}</div>${prerequisite ? `<div class="${prerequisiteMet ? '' : 'action-unavailable'}">Требуется талант «${TALENTS[prerequisite].name}»: хотя бы 1 ранг</div>` : ''}${maxed ? '<div>Максимальный ранг</div>' : ''}</div>`,
            );
          button.addEventListener('mouseenter', showTooltip);
          button.addEventListener('focus', showTooltip);
          button.addEventListener('mouseleave', () => this.tooltip.hide());
          button.addEventListener('blur', () => this.tooltip.hide());
          const option = document.createElement('div');
          option.className = 'talent-option';
          option.style.gridColumn = String(definition.column ?? tierTalents.indexOf(talent) + 1);
          option.style.gridRow = '1';
          option.append(button);
          row.append(option);
        }
        tier.append(row);
        column.append(tier);
      }
      const connections = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      connections.classList.add('talent-dependencies');
      for (const talent of branchTalents) {
        const prerequisite = TALENTS[talent.id].prerequisite;
        if (!prerequisite) continue;
        const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        path.dataset.from = prerequisite;
        path.dataset.to = talent.id;
        path.classList.add('talent-dependency');
        path.classList.toggle('talent-dependency--met', talents.getRank(prerequisite) > 0);
        path.setAttribute('role', 'img');
        path.setAttribute(
          'aria-label',
          `${TALENTS[prerequisite].name} → ${TALENTS[talent.id].name}`,
        );
        connections.append(path);
      }
      column.append(connections);
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
    this.drawDependencies();
    this.resizeObserver.observe(tree);
  }
  private drawDependencies(): void {
    for (const column of this.container.querySelectorAll<HTMLElement>('.talent-branch')) {
      const bounds = column.getBoundingClientRect();
      for (const path of column.querySelectorAll<SVGPathElement>('.talent-dependency')) {
        const from = column
          .querySelector<HTMLElement>(`[data-talent-id="${path.dataset.from}"]`)!
          .getBoundingClientRect();
        const to = column
          .querySelector<HTMLElement>(`[data-talent-id="${path.dataset.to}"]`)!
          .getBoundingClientRect();
        const startX = from.left - bounds.left + from.width / 2;
        const endX = to.left - bounds.left + to.width / 2;
        const startY = from.bottom - bounds.top + 3;
        const endY = to.top - bounds.top - 4;
        const routeY = (startY + endY) / 2;
        path.setAttribute(
          'd',
          `M ${startX} ${startY} V ${routeY} H ${endX} V ${endY} M ${endX - 4} ${endY - 5} L ${endX} ${endY} L ${endX + 4} ${endY - 5}`,
        );
      }
    }
  }
  hide(): void {
    this.resizeObserver.disconnect();
    this.container.classList.remove('level-up-screen--visible');
    this.tooltip.hide();
  }
  getContainer(): HTMLElement {
    return this.container;
  }
}
