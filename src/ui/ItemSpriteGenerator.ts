import type { ItemDefinition, StatType } from '../config/items.js';

function djb2(s: string): number {
  let h = 5381;
  for (let i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) & 0x7fffffff;
  return h;
}

function hsl(h: number, s: number, l: number): string {
  return `hsl(${Math.round(((h % 360) + 360) % 360)},${Math.round(s)}%,${Math.round(l)}%)`;
}

const BASE_HUES: Record<StatType, number> = {
  maxHp: 0,
  hpRegen: 130,
  damageReduction: 220,
  maxEnergy: 205,
  energyRegen: 50,
  energyPerKill: 285,
  energyPerBreach: 28,
  coinsPerKill: 42,
};

// ─── Shape templates per stat type ──────────────────────────────────────────
// Placeholders: $1 = main fill, $2 = dark fill, $3 = light/accent fill

const SHAPES: Record<StatType, string[]> = {
  maxHp: [
    '<path d="M24 40C24 40 8 28 8 18C8 12 12 8 18 8C22 8 24 12 24 12C24 12 26 8 30 8C36 8 40 12 40 18C40 28 24 40 24 40Z" fill="$1"/><path d="M24 35C24 35 13 26 13 20C13 16 16 14 19 14C21 14 23 16 24 18C25 16 27 14 29 14C32 14 35 16 35 20C35 26 24 35 24 35Z" fill="$3" opacity=".3"/>',
    '<path d="M24 42C24 42 6 28 6 17C6 10 11 6 17 6C21 6 24 10 24 10C24 10 27 6 31 6C37 6 42 10 42 17C42 28 24 42 24 42Z" fill="$1"/><rect x="21" y="15" width="6" height="16" rx="1" fill="$3" opacity=".5"/><rect x="14" y="21" width="20" height="6" rx="1" fill="$3" opacity=".5"/>',
    '<path d="M24 4L40 12V26Q40 38 24 44Q8 38 8 26V12Z" fill="$2"/><path d="M24 34C24 34 16 28 16 22C16 19 18 17 20 17C22 17 24 19 24 19C24 19 26 17 28 17C30 17 32 19 32 22C32 28 24 34 24 34Z" fill="$1"/>',
    '<path d="M14 8L34 8L40 16V36L34 44H14L8 36V16Z" fill="$1"/><path d="M14 8L34 8L40 16H8Z" fill="$3" opacity=".25"/><line x1="24" y1="8" x2="24" y2="44" stroke="$2" stroke-width="2" opacity=".3"/><line x1="8" y1="26" x2="40" y2="26" stroke="$2" stroke-width="1.5" opacity=".25"/>',
    '<circle cx="17" cy="18" r="10" fill="$1"/><circle cx="31" cy="18" r="10" fill="$1"/><path d="M7 18L24 42L41 18" fill="$1"/><circle cx="17" cy="18" r="6" fill="$3" opacity=".2"/><circle cx="31" cy="18" r="6" fill="$3" opacity=".2"/>',
    '<rect x="16" y="8" width="16" height="32" rx="4" fill="$1" transform="rotate(45 24 24)"/><rect x="16" y="8" width="16" height="32" rx="4" fill="$1" transform="rotate(-45 24 24)"/><circle cx="24" cy="24" r="5" fill="$3" opacity=".35"/>',
  ],

  hpRegen: [
    '<rect x="19" y="4" width="10" height="8" rx="2" fill="$2"/><ellipse cx="24" cy="30" rx="13" ry="14" fill="$1"/><ellipse cx="24" cy="34" rx="9" ry="6" fill="$3" opacity=".25"/><circle cx="18" cy="26" r="2" fill="$3" opacity=".4"/>',
    '<rect x="20" y="4" width="8" height="6" rx="1" fill="$2"/><path d="M20 10L14 22V38Q14 44 24 44Q34 44 34 38V22L28 10Z" fill="$1"/><ellipse cx="24" cy="36" rx="7" ry="4" fill="$3" opacity=".3"/>',
    '<path d="M24 4Q42 12 40 30Q38 44 24 44Q10 44 8 30Q6 12 24 4Z" fill="$1"/><path d="M24 10V40" stroke="$2" stroke-width="2"/><path d="M24 18Q32 16 36 22" stroke="$2" stroke-width="1.5" fill="none"/><path d="M24 26Q16 24 12 28" stroke="$2" stroke-width="1.5" fill="none"/>',
    '<path d="M24 4L36 26Q40 34 36 40Q32 46 24 46Q16 46 12 40Q8 34 12 26Z" fill="$1"/><ellipse cx="24" cy="34" rx="8" ry="6" fill="$3" opacity=".2"/><circle cx="20" cy="28" r="3" fill="$3" opacity=".35"/>',
    '<rect x="18" y="6" width="12" height="36" rx="3" fill="$1"/><rect x="6" y="18" width="36" height="12" rx="3" fill="$1"/><rect x="20" y="8" width="8" height="32" rx="2" fill="$3" opacity=".2"/><rect x="8" y="20" width="32" height="8" rx="2" fill="$3" opacity=".2"/>',
    '<ellipse cx="24" cy="20" rx="16" ry="14" fill="$1"/><rect x="20" y="30" width="8" height="14" rx="2" fill="$2"/><circle cx="18" cy="16" r="3" fill="$3" opacity=".35"/><circle cx="30" cy="14" r="2" fill="$3" opacity=".3"/><circle cx="24" cy="22" r="4" fill="$3" opacity=".2"/>',
  ],

  damageReduction: [
    '<path d="M24 4L42 14V28Q42 40 24 46Q6 40 6 28V14Z" fill="$1"/><path d="M24 8L38 16V28Q38 37 24 42Q10 37 10 28V16Z" fill="$2" opacity=".3"/><line x1="24" y1="8" x2="24" y2="42" stroke="$3" stroke-width="1.5" opacity=".3"/>',
    '<circle cx="24" cy="24" r="20" fill="$1"/><circle cx="24" cy="24" r="15" fill="$2" opacity=".25"/><circle cx="24" cy="24" r="6" fill="$3" opacity=".3"/><line x1="24" y1="4" x2="24" y2="44" stroke="$3" stroke-width="1" opacity=".2"/><line x1="4" y1="24" x2="44" y2="24" stroke="$3" stroke-width="1" opacity=".2"/>',
    '<rect x="6" y="6" width="36" height="36" rx="4" fill="$1"/><rect x="10" y="10" width="28" height="28" rx="3" fill="$2" opacity=".2"/><rect x="14" y="14" width="20" height="20" rx="2" fill="none" stroke="$3" stroke-width="1.5" opacity=".3"/>',
    '<circle cx="24" cy="24" r="18" fill="$1"/><circle cx="24" cy="24" r="12" fill="$2" opacity=".3"/><circle cx="24" cy="24" r="5" fill="$1"/><circle cx="24" cy="24" r="3" fill="$3" opacity=".4"/>',
    '<path d="M10 6H38V34Q38 44 24 46Q10 44 10 34Z" fill="$1"/><path d="M14 10H34V32Q34 40 24 42Q14 40 14 32Z" fill="$2" opacity=".2"/><path d="M24 10V42" stroke="$3" stroke-width="2" opacity=".25"/>',
    '<path d="M8 12Q8 6 16 6H20V42H16Q8 42 8 36Z" fill="$1"/><path d="M28 6H32Q40 6 40 12V36Q40 42 32 42H28Z" fill="$1"/><rect x="10" y="16" width="8" height="4" rx="1" fill="$3" opacity=".3"/><rect x="30" y="16" width="8" height="4" rx="1" fill="$3" opacity=".3"/><rect x="10" y="28" width="8" height="4" rx="1" fill="$3" opacity=".3"/><rect x="30" y="28" width="8" height="4" rx="1" fill="$3" opacity=".3"/>',
  ],

  maxEnergy: [
    '<polygon points="24,4 38,14 38,34 24,44 10,34 10,14" fill="$1"/><polygon points="24,4 38,14 24,20 10,14" fill="$3" opacity=".35"/><polygon points="24,20 38,14 38,34 24,44" fill="$2" opacity=".25"/>',
    '<polygon points="24,2 44,24 24,46 4,24" fill="$1"/><polygon points="24,2 44,24 24,24 4,24" fill="$3" opacity=".25"/><line x1="24" y1="2" x2="24" y2="46" stroke="$3" stroke-width="1" opacity=".3"/>',
    '<circle cx="24" cy="24" r="18" fill="$1"/><ellipse cx="20" cy="18" rx="8" ry="6" fill="$3" opacity=".25"/><circle cx="16" cy="16" r="3" fill="$3" opacity=".35"/>',
    '<polygon points="24,2 28,18 44,18 32,28 36,44 24,34 12,44 16,28 4,18 20,18" fill="$1"/><polygon points="24,2 28,18 20,18" fill="$3" opacity=".3"/>',
    '<polygon points="18,4 30,4 38,18 38,36 30,44 18,44 10,36 10,18" fill="$1"/><polygon points="18,4 30,4 38,18 10,18" fill="$3" opacity=".3"/><line x1="24" y1="4" x2="24" y2="44" stroke="$3" stroke-width="1" opacity=".25"/>',
    '<polygon points="16,6 22,6 28,18 22,30 16,30 10,18" fill="$1"/><polygon points="26,18 32,18 38,30 32,42 26,42 20,30" fill="$1"/><polygon points="16,6 22,6 28,18 10,18" fill="$3" opacity=".3"/><polygon points="26,18 32,18 38,30 20,30" fill="$3" opacity=".2"/>',
  ],

  energyRegen: [
    '<path d="M28 4L14 22H22L10 44L38 20H28Z" fill="$1"/><path d="M26 8L16 22H22L14 36" fill="none" stroke="$3" stroke-width="1.5" opacity=".35"/>',
    '<path d="M24 8A16 16 0 0 1 40 24A12 12 0 0 1 28 36A8 8 0 0 1 20 28A4 4 0 0 1 24 24" fill="none" stroke="$1" stroke-width="5" stroke-linecap="round"/><circle cx="24" cy="24" r="3" fill="$3"/>',
    '<polygon points="24,4 27,18 40,14 30,24 44,28 30,30 36,44 24,34 12,44 18,30 4,28 18,24 8,14 21,18" fill="$1"/><circle cx="24" cy="24" r="5" fill="$3" opacity=".4"/>',
    '<rect x="14" y="10" width="20" height="32" rx="3" fill="$2"/><rect x="20" y="6" width="8" height="6" rx="1" fill="$2"/><rect x="16" y="20" width="16" height="20" rx="2" fill="$1"/><rect x="18" y="24" width="12" height="14" rx="1" fill="$3" opacity=".25"/>',
    '<path d="M22 4L12 20H18L8 38" fill="none" stroke="$1" stroke-width="4" stroke-linecap="round"/><path d="M34 10L24 26H30L20 44" fill="none" stroke="$1" stroke-width="4" stroke-linecap="round"/><path d="M22 4L12 20H18L8 38" fill="none" stroke="$3" stroke-width="1.5" opacity=".3"/>',
    '<circle cx="24" cy="24" r="16" fill="none" stroke="$1" stroke-width="4"/><circle cx="24" cy="24" r="8" fill="$1"/><circle cx="24" cy="24" r="4" fill="$3" opacity=".5"/><path d="M24 8A16 16 0 0 1 40 24" fill="none" stroke="$3" stroke-width="3" opacity=".35"/>',
  ],

  energyPerKill: [
    '<path d="M24 4L28 6V30H20V6Z" fill="$1"/><path d="M24 4L28 6V30H24Z" fill="$3" opacity=".2"/><rect x="16" y="30" width="16" height="4" rx="1" fill="$2"/><rect x="21" y="34" width="6" height="8" rx="1" fill="$2"/>',
    '<path d="M24 4L30 8L26 32H22L18 8Z" fill="$1"/><rect x="18" y="30" width="12" height="3" rx="1" fill="$2"/><rect x="21" y="33" width="6" height="10" rx="1" fill="$2"/><line x1="22" y1="8" x2="22" y2="28" stroke="$3" stroke-width="1" opacity=".3"/>',
    '<rect x="22" y="6" width="4" height="36" rx="1" fill="$2"/><path d="M26 10Q42 16 38 28L26 24Z" fill="$1"/><path d="M26 10Q42 16 40 20L26 16Z" fill="$3" opacity=".3"/>',
    '<circle cx="24" cy="20" r="14" fill="$1"/><ellipse cx="24" cy="36" rx="8" ry="8" fill="$1"/><circle cx="18" cy="18" r="4" fill="$2"/><circle cx="30" cy="18" r="4" fill="$2"/><path d="M20 28Q24 32 28 28" fill="none" stroke="$2" stroke-width="2"/>',
    '<path d="M10 6Q14 20 20 34L24 30L28 34Q34 20 38 6" fill="none" stroke="$1" stroke-width="4" stroke-linecap="round"/><path d="M16 10Q18 20 22 32" fill="none" stroke="$1" stroke-width="3"/><path d="M32 10Q30 20 26 32" fill="none" stroke="$1" stroke-width="3"/><circle cx="24" cy="40" r="5" fill="$1"/>',
    '<path d="M14 6L24 44L34 6" fill="$1"/><path d="M14 6L24 38L20 6Z" fill="$3" opacity=".25"/>',
  ],

  energyPerBreach: [
    '<rect x="12" y="16" width="24" height="28" fill="$1"/><rect x="8" y="12" width="8" height="8" fill="$1"/><rect x="32" y="12" width="8" height="8" fill="$1"/><rect x="10" y="8" width="4" height="6" fill="$2"/><rect x="34" y="8" width="4" height="6" fill="$2"/><rect x="20" y="30" width="8" height="14" rx="4 4 0 0" fill="$2"/>',
    '<rect x="6" y="14" width="36" height="30" fill="$1"/><rect x="6" y="8" width="8" height="8" fill="$1"/><rect x="20" y="8" width="8" height="8" fill="$1"/><rect x="34" y="8" width="8" height="8" fill="$1"/><line x1="6" y1="24" x2="42" y2="24" stroke="$2" stroke-width="1"/><line x1="6" y1="34" x2="42" y2="34" stroke="$2" stroke-width="1"/>',
    '<rect x="6" y="6" width="36" height="38" fill="$1"/><path d="M14 44V22Q14 14 24 14Q34 14 34 22V44" fill="$2"/><rect x="6" y="6" width="36" height="6" fill="$3" opacity=".2"/>',
    '<polygon points="24,4 42,16 42,44 6,44 6,16" fill="$1"/><polygon points="24,4 42,16 6,16" fill="$3" opacity=".2"/><rect x="18" y="26" width="12" height="18" fill="$2"/><rect x="20" y="16" width="3" height="6" fill="$2" opacity=".4"/><rect x="26" y="16" width="3" height="6" fill="$2" opacity=".4"/>',
    '<polygon points="24,4 32,12 32,40 16,40 16,12" fill="$1"/><polygon points="24,4 32,12 16,12" fill="$3" opacity=".3"/><rect x="20" y="20" width="8" height="4" rx="1" fill="$3" opacity=".2"/><rect x="20" y="28" width="8" height="4" rx="1" fill="$3" opacity=".2"/>',
    '<rect x="16" y="20" width="16" height="24" fill="$1"/><polygon points="14,20 24,8 34,20" fill="$1"/><polygon points="14,20 24,8 24,20" fill="$3" opacity=".2"/><rect x="20" y="28" width="8" height="10" fill="$2"/><circle cx="24" cy="16" r="2" fill="$3" opacity=".4"/>',
  ],

  coinsPerKill: [
    '<circle cx="24" cy="24" r="16" fill="$1"/><circle cx="24" cy="24" r="12" fill="$3" opacity=".2"/><circle cx="24" cy="24" r="8" fill="$2" opacity=".15"/><text x="24" y="30" font-size="14" font-weight="bold" fill="$2" text-anchor="middle" font-family="serif">$</text>',
    '<ellipse cx="24" cy="36" rx="14" ry="6" fill="$2"/><ellipse cx="24" cy="34" rx="14" ry="6" fill="$1"/><ellipse cx="24" cy="28" rx="12" ry="5" fill="$2"/><ellipse cx="24" cy="26" rx="12" ry="5" fill="$1"/><ellipse cx="24" cy="20" rx="10" ry="4" fill="$2"/><ellipse cx="24" cy="18" rx="10" ry="4" fill="$1"/><ellipse cx="24" cy="18" rx="6" ry="2" fill="$3" opacity=".3"/>',
    '<rect x="8" y="20" width="32" height="22" rx="2" fill="$2"/><path d="M8 20Q8 10 24 10Q40 10 40 20" fill="$1"/><rect x="20" y="26" width="8" height="6" rx="1" fill="$3"/><circle cx="24" cy="16" r="2" fill="$3" opacity=".4"/>',
    '<ellipse cx="24" cy="30" rx="14" ry="12" fill="$1"/><path d="M16 22Q18 14 24 12Q30 14 32 22" fill="$2"/><path d="M20 12Q24 6 28 12" fill="none" stroke="$2" stroke-width="2"/><circle cx="24" cy="30" r="7" fill="$3" opacity=".3"/><text x="24" y="34" font-size="10" font-weight="bold" fill="$2" text-anchor="middle" font-family="serif">$</text>',
    '<polygon points="12,20 36,20 42,32 42,40 6,40 6,32" fill="$1"/><polygon points="12,20 36,20 42,32 6,32" fill="$3" opacity=".25"/>',
    '<path d="M16 16Q16 8 24 8Q32 8 32 16" fill="none" stroke="$2" stroke-width="3"/><ellipse cx="24" cy="30" rx="16" ry="14" fill="$1"/><path d="M14 20Q16 16 24 16Q32 16 34 20" fill="$2"/><text x="24" y="35" font-size="12" font-weight="bold" fill="$3" text-anchor="middle" font-family="serif">$</text>',
  ],
};

// ─── Decoration overlays ────────────────────────────────────────────────────

const DECORATIONS: string[] = [
  '',
  '<circle cx="38" cy="10" r="4" fill="$3" opacity=".3"/>',
  '<path d="M36 8L40 12L36 16L32 12Z" fill="$3" opacity=".25"/>',
  '<circle cx="10" cy="10" r="3" fill="$3" opacity=".25"/><circle cx="38" cy="38" r="2" fill="$3" opacity=".2"/>',
  '<rect x="4" y="4" width="6" height="6" rx="1" fill="$3" opacity=".15"/>',
  '<path d="M4 44L10 38" stroke="$3" stroke-width="2" opacity=".2"/><path d="M38 4L44 10" stroke="$3" stroke-width="2" opacity=".2"/>',
  '<circle cx="8" cy="40" r="3" fill="$3" opacity=".2"/>',
  '<path d="M40 36L44 40L40 44L36 40Z" fill="$3" opacity=".2"/>',
];

// ─── Inner detail overlays (adds variety within same shape) ─────────────────

const INNER_DETAILS: string[] = [
  '',
  '<circle cx="24" cy="24" r="3" fill="$3" opacity=".2"/>',
  '<line x1="18" y1="20" x2="30" y2="28" stroke="$3" stroke-width="1" opacity=".2"/>',
  '<rect x="20" y="20" width="8" height="8" rx="1" fill="$3" opacity=".12"/>',
  '<circle cx="24" cy="24" r="6" fill="none" stroke="$3" stroke-width="1" opacity=".2"/>',
];

// ─── Generator ──────────────────────────────────────────────────────────────

const _cache = new Map<string, string>();

export function generateItemSvg(item: ItemDefinition): string {
  const cached = _cache.get(item.id);
  if (cached) return cached;

  const seed = djb2(item.id);
  const primaryStat = item.stats[0]?.type ?? 'maxHp';
  const baseHue = BASE_HUES[primaryStat];

  const hueOffset = (seed % 50) - 25;
  const satOffset = ((seed >> 5) % 20) - 5;
  const litOffset = ((seed >> 9) % 14) - 7;

  const h = baseHue + hueOffset;
  const s = 62 + satOffset;

  const mainColor = hsl(h, s, 48 + litOffset);
  const darkColor = hsl(h, s - 5, 28 + litOffset);
  const lightColor = hsl(h + 10, s - 12, 74 + litOffset);

  const shapes = SHAPES[primaryStat];
  const shapeIdx = (seed >> 3) % shapes.length;
  const decoIdx = (seed >> 7) % DECORATIONS.length;
  const detailIdx = (seed >> 11) % INNER_DETAILS.length;

  let body = shapes[shapeIdx] + DECORATIONS[decoIdx] + INNER_DETAILS[detailIdx];

  body = body
    .replace(/\$1/g, mainColor)
    .replace(/\$2/g, darkColor)
    .replace(/\$3/g, lightColor);

  if (item.stats.length >= 2) {
    const secHue = BASE_HUES[item.stats[1].type];
    body += `<circle cx="40" cy="40" r="5" fill="${hsl(secHue, 65, 50)}" stroke="#111" stroke-width="1.5"/>`;
  }
  if (item.stats.length >= 3) {
    const terHue = BASE_HUES[item.stats[2].type];
    body += `<circle cx="8" cy="40" r="4.5" fill="${hsl(terHue, 65, 50)}" stroke="#111" stroke-width="1.5"/>`;
  }

  if (item.rarity === 'legendary') {
    body += '<polygon points="24,1 26.5,7.5 33,8 28,12.5 29.5,19 24,15.5 18.5,19 20,12.5 15,8 21.5,7.5" fill="#ffd700" opacity=".55"/>';
  }

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48">${body}</svg>`;
  _cache.set(item.id, svg);
  return svg;
}
