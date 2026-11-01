import type { SpiderType } from '../domain/types.js';

export const SPIDER_SPRITE_MAP: Readonly<Record<SpiderType, string>> = {
  normal: 'SpiderNormal',
  golden: 'SpiderGolden',
  megaFat: 'SpiderMegaFat',
  fat: 'SpiderFat',
  fast: 'SpiderFast',
  poisonous: 'SpiderPoisonous',
  diseased: 'SpiderDiseased',
  cursing: 'SpiderCursing',
  cleanser: 'SpiderCleanser',
  ninja: 'SpiderNinja',
  burner: 'SpiderBurner',
  tank: 'SpiderTank',
};

const images = import.meta.glob('../sprites/spiders/*.svg', {
  query: '?url',
  import: 'default',
  eager: true,
}) as Record<string, string>;

export function spiderImageUrl(type: SpiderType): string {
  return images[`../sprites/spiders/${SPIDER_SPRITE_MAP[type]}.svg`];
}
