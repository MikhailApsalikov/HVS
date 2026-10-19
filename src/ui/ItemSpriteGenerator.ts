import type { ItemDefinition } from '../content/items.js';
import { COMMON_SVGS } from './_common_svgs.js';
import { RARE_SVGS } from './_rare_svgs.js';
import { EPIC_SVGS } from './_epic_svgs.js';
import { LEGENDARY_SVGS } from './_legendary_svgs.js';
import { ATTRIBUTE_SVGS } from './_attribute_svgs.js';
import { REWORKED_SVGS } from './_reworked_svgs.js';
import { MAGIC_LEGENDARY_SVGS } from './_magic_legendary_svgs.js';

const ITEM_SVGS: Record<string, string> = {
  ...COMMON_SVGS,
  ...RARE_SVGS,
  ...EPIC_SVGS,
  ...LEGENDARY_SVGS,
  ...ATTRIBUTE_SVGS,
  ...REWORKED_SVGS,
  ...MAGIC_LEGENDARY_SVGS,
  l027: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48">
    <path d="M13 4Q44 24 13 44" fill="none" stroke="#EFC668" stroke-width="5"/>
    <path d="M13 4L20 24L13 44" fill="none" stroke="#FFF0BE" stroke-width="1.5"/>
    <path d="M4 16H37M5 24H41M4 32H37" stroke="#B3DAE2" stroke-width="2.5"/>
    <path d="M31 11L40 16L31 21M35 19L44 24L35 29M31 27L40 32L31 37" fill="#DCEBD2" stroke="#82B0BA" stroke-width="1"/>
    <path d="M2 12L7 16L2 20M3 20L8 24L3 28M2 28L7 32L2 36" fill="#AD6D84"/>
    <circle cx="25" cy="24" r="4" fill="#EACA75" stroke="#FFF0BA" stroke-width="1.5"/>
  </svg>`,
};

const FALLBACK =
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48"><rect x="8" y="8" width="32" height="32" rx="4" fill="#555"/><text x="24" y="28" text-anchor="middle" fill="#aaa" font-size="12">?</text></svg>';

export function generateItemSvg(item: ItemDefinition): string {
  return ITEM_SVGS[item.id] ?? FALLBACK;
}
