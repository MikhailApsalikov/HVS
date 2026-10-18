interface Point {
  readonly x: number;
  readonly y: number;
}

function boltPoints(from: Point, to: Point, seed: number, depth = 5): Point[] {
  if (depth === 0) return [from, to];
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const length = Math.hypot(dx, dy) || 1;
  const displacement = Math.sin(seed * 12.9898) * length * 0.13;
  const middle = {
    x: (from.x + to.x) / 2 - (dy / length) * displacement,
    y: (from.y + to.y) / 2 + (dx / length) * displacement,
  };
  return [
    ...boltPoints(from, middle, seed + 1.7, depth - 1).slice(0, -1),
    ...boltPoints(middle, to, seed + 5.3, depth - 1),
  ];
}
function path(points: readonly Point[]): string {
  return points
    .map((point, index) => `${index === 0 ? 'M' : 'L'}${point.x.toFixed(2)} ${point.y.toFixed(2)}`)
    .join(' ');
}

/** Thin white cores, blue ionization and smaller offshoots around the actual sprite. */
export function electricWrap(kind: 'arrow' | 'archer' | 'impact'): string {
  const routes =
    kind === 'arrow'
      ? [
          'M32 2 27 8 35 12 29 18 36 23 28 28 34 34 29 40 35 47 30 54 32 62',
          'M30 10 23 16 26 22 23 27 28 33 24 40 29 45 25 51 31 57',
          'M35 14 40 19 36 24 40 30 36 36 41 42 36 48',
          'M28 28 21 25 18 29M35 47 42 50 45 46',
        ]
      : [
          'M27 5 18 9 21 15 10 20 15 27 8 34 16 39 12 47 23 49 27 59',
          'M36 5 43 13 39 19 53 23 48 30 57 37 47 43 49 50 38 54 34 61',
          'M12 26 24 22 30 29 38 25 51 30M17 43 26 39 32 45 40 39 48 43',
          'M18 9 10 6 7 12M53 23 59 18 62 21M23 49 19 56 12 54M47 43 58 48 60 43',
        ];
  return `<svg class="electric-arcs electric-arcs--${kind}" viewBox="0 0 64 64" aria-hidden="true"><g fill="none" stroke-linecap="round" stroke-linejoin="round">${routes.map((route, index) => `<g class="electric-arcs__thread electric-arcs__thread--${index}"><path class="electric-arcs__halo" d="${route}"/><path class="electric-arcs__core" d="${route}"/></g>`).join('')}</g></svg>`;
}

export function chainLightningMarkup(from: Point, to: Point): string {
  const variants = [1, 2]
    .map((variant) => {
      const points = boltPoints(from, to, variant * 17);
      const branches = [7, 15, 23]
        .map((index) => {
          const root = points[index];
          const direction = variant * (index % 2 ? 1 : -1);
          const tip = { x: root.x + direction * 20, y: root.y - 12 - index };
          return `<path class="lightning-chain__branch" d="${path(boltPoints(root, tip, index * variant, 3))}"/>`;
        })
        .join('');
      const route = path(points);
      return `<g class="lightning-chain__stroke lightning-chain__stroke--${variant}"><path class="lightning-chain__glow" d="${route}"/><path class="lightning-chain__blue" d="${route}"/><path class="lightning-chain__core" d="${route}"/>${branches}</g>`;
    })
    .join('');
  return `<svg class="lightning-chain" viewBox="0 0 900 900" preserveAspectRatio="none" aria-hidden="true"><g fill="none" stroke-linejoin="round" stroke-linecap="round">${variants}</g></svg><div class="lightning-impact">${electricWrap('impact')}</div>`;
}

export function fireExplosionMarkup(): string {
  const flames = Array.from({ length: 14 }, (_, index) => {
    const angle = (index * 360) / 14;
    const distance = 30 + (index % 3) * 8;
    return `<i class="fire-explosion__flame" style="--flame-angle:${angle}deg;--flame-distance:${distance}%;--flame-delay:${(index % 4) * 0.012}s;--flame-size:${20 + (index % 3) * 6}%"></i>`;
  }).join('');
  const embers = Array.from(
    { length: 18 },
    (_, index) =>
      `<b class="fire-explosion__ember" style="--ember-x:${Math.sin(index * 2.4) * 48}%;--ember-y:${Math.cos(index * 2.4) * 42}%;--ember-delay:${(index % 3) * 0.025}s"></b>`,
  ).join('');
  return `<div class="fire-explosion"><div class="fire-explosion__smoke"></div><div class="fire-explosion__flash"></div>${flames}<div class="fire-explosion__core"></div>${embers}</div>`;
}
