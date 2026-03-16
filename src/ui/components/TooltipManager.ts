export class TooltipManager {
  private static _instance: TooltipManager | null = null;
  private readonly _el: HTMLElement;

  private constructor() {
    this._el = document.createElement('div');
    this._el.className = 'game-tooltip';
    document.body.appendChild(this._el);
  }

  public static getInstance(): TooltipManager {
    if (!TooltipManager._instance) {
      TooltipManager._instance = new TooltipManager();
    }
    return TooltipManager._instance;
  }

  public show(anchor: HTMLElement, html: string): void {
    this._el.innerHTML = html;
    this._el.classList.add('game-tooltip--visible');

    const rect = anchor.getBoundingClientRect();
    const tipWidth = this._el.offsetWidth;
    const tipHeight = this._el.offsetHeight;

    let left = rect.left - tipWidth - 8;
    let top = rect.top;

    if (left < 4) {
      left = rect.right + 8;
    }

    if (top + tipHeight > window.innerHeight - 4) {
      top = window.innerHeight - tipHeight - 4;
    }
    if (top < 4) {
      top = 4;
    }

    this._el.style.left = `${left}px`;
    this._el.style.top = `${top}px`;
  }

  public hide(): void {
    this._el.classList.remove('game-tooltip--visible');
  }
}
