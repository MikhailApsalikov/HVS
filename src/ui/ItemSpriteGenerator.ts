import type { ItemDefinition } from '../config/items.js';
import { COMMON_SVGS } from './_common_svgs.js';
import { RARE_SVGS } from './_rare_svgs.js';
import { EPIC_SVGS } from './_epic_svgs.js';
import { LEGENDARY_SVGS } from './_legendary_svgs.js';

const ITEM_SVGS: Record<string, string> = {
  ...COMMON_SVGS,
  ...RARE_SVGS,
  ...EPIC_SVGS,
  ...LEGENDARY_SVGS,
};

const FALLBACK = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48"><rect x="8" y="8" width="32" height="32" rx="4" fill="#555"/><text x="24" y="28" text-anchor="middle" fill="#aaa" font-size="12">?</text></svg>';

export function generateItemSvg(item: ItemDefinition): string {
  return ITEM_SVGS[item.id] ?? FALLBACK;
}
