import coinSvg from '../sprites/ui/Coin.svg?raw';

/** The original coin asset is shared by balances, prices and sale tooltips. */
export function coinAmount(amount: number): string {
  return `<span class="coin-amount" aria-label="${amount} монет"><span>${amount}</span><span class="coin-icon" aria-hidden="true">${coinSvg}</span></span>`;
}
