import { describe, expect, it } from 'vitest';
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import path from 'node:path';
import { ITEM_CATALOG } from '../src/content/items.js';
import { generateItemSvg } from '../src/ui/ItemSpriteGenerator.js';
import { normalConfig } from '../src/content/normal.js';
import { SOUND_FILES, MUSIC_FILES } from '../src/infrastructure/audio/catalog.js';

function files(directory: string): string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) =>
    entry.isDirectory()
      ? files(path.join(directory, entry.name))
      : [path.join(directory, entry.name)],
  );
}

describe('architecture boundaries', () => {
  it('domain and content have no dependency on UI, browser, storage or application orchestration', () => {
    for (const file of [...files('src/domain'), ...files('src/content')].filter((file) =>
      file.endsWith('.ts'),
    )) {
      const source = readFileSync(file, 'utf8');
      expect(source, file).not.toMatch(/from\s+['"][^'"]*(?:ui\/|infrastructure\/|application\/)/);
      expect(source, file).not.toMatch(
        /\b(?:document|window|localStorage|requestAnimationFrame|Audio)\s*[.(]/,
      );
    }
  });
  it('presentation only issues commands and does not apply game mutations', () => {
    for (const file of files('src/ui').filter((file) => file.endsWith('.ts'))) {
      const source = readFileSync(file, 'utf8');
      expect(source, file).not.toMatch(
        /\b(?:state|talents|items|talentSystem|itemSystem)\.(?:modifyHp|modifyEnergy|upgrade|buyItem|sellItem|tick|applyRules)\(/,
      );
      expect(source, file).not.toMatch(/from\s+['"][^'"]*(?:domain\/systems|rules\/numbers)/);
    }
  });
  it('has no parallel legacy gameplay implementation', () => {
    for (const file of [
      'src/core/GameEngine.ts',
      'src/core/FormulaCalculator.ts',
      'src/entities/Spider.ts',
      'src/ui/components/HUD.ts',
    ])
      expect(existsSync(file)).toBe(false);
  });
});

describe('catalog illustrations', () => {
  it('gives every item a dedicated illustration instead of the unknown-item placeholder', () => {
    const fallback = generateItemSvg({ ...ITEM_CATALOG[0], id: 'unknown-item' });
    for (const item of ITEM_CATALOG) {
      const svg = generateItemSvg(item);
      expect(svg, item.name).not.toBe(fallback);
      expect(svg, item.name).toContain('viewBox="0 0 48 48"');
    }
    const attributeItems = ITEM_CATALOG.filter(({ id }) => /-(agility|intellect)$/.test(id));
    expect(new Set(attributeItems.map(generateItemSvg)).size).toBe(attributeItems.length);
  });
});

describe('legacy feature inventory captured before rewrite', () => {
  const baseline = JSON.parse(readFileSync('tests/fixtures/legacy-content.json', 'utf8'));
  it('retains every item name and ID', () => {
    const legacyItems = ITEM_CATALOG.filter(({ id }) =>
      baseline.items.some((item: { id: string }) => item.id === id),
    );
    expect(legacyItems.map(({ id, name }) => ({ id, name }))).toEqual(
      baseline.items.map(({ id, name }: { id: string; name: string }) => ({ id, name })),
    );
  });
  it('keeps untouched encounter and ability balance through the attribute update', () => {
    expect(normalConfig).toEqual({
      ...baseline.normal,
      armorEffectiveness: 1.5,
      baseHp: 100,
      hpRegen: 0,
      energyRegen: 8,
      coinsPerSec: 4,
      shootCooldown: 3,
      arrowTravelTime: 3,
      abilities: {
        ...baseline.normal.abilities,
        volley: { cost: 100, cooldown: 36 },
        stand: { cost: 15, cooldown: 180 },
        lastHope: { cost: 45, cooldown: 40 },
        eagleEye: { cost: 20, cooldown: 60 },
        armageddon: { cost: 100, cooldown: 180 },
        adrenaline: { cost: 0, cooldown: 120 },
      },
      talents: {
        ...baseline.normal.talents,
        greed: { maxRanks: 5, unlocksAtLevel: 0 },
        healBoost: { maxRanks: 5, unlocksAtLevel: 40 },
        willToWin: { maxRanks: 5, unlocksAtLevel: 50 },
        adrenaline: { maxRanks: 1, unlocksAtLevel: 60 },
        marauder: { maxRanks: 3, unlocksAtLevel: 30 },
        warriorArmor: { maxRanks: 5, unlocksAtLevel: 10 },
        spiderArmor: { maxRanks: 10, unlocksAtLevel: 20 },
        titanArmor: { maxRanks: 5, unlocksAtLevel: 50 },
        endurance: { maxRanks: 7, unlocksAtLevel: 0 },
        tireless: { maxRanks: 5, unlocksAtLevel: 10 },
        agility: { maxRanks: 5, unlocksAtLevel: 0 },
        eagleEye: { maxRanks: 1, unlocksAtLevel: 20 },
        improvedCriticalShot: { maxRanks: 8, unlocksAtLevel: 30 },
        agileCriticalShot: { maxRanks: 5, unlocksAtLevel: 30 },
        vampirism: { maxRanks: 5, unlocksAtLevel: 0 },
        volleyMastery: { maxRanks: 5, unlocksAtLevel: 30 },
        criticalShot: { maxRanks: 10, unlocksAtLevel: 10 },
        piercingReward: { maxRanks: 8, unlocksAtLevel: 20 },
        hunterMastery: { maxRanks: 5, unlocksAtLevel: 0 },
        hunterArsenal: { maxRanks: 5, unlocksAtLevel: 0 },
        improvedEndurance: { maxRanks: 7, unlocksAtLevel: 0 },
        improvedAgility: { maxRanks: 7, unlocksAtLevel: 0 },
        improvedIntellect: { maxRanks: 7, unlocksAtLevel: 0 },
        magicArmor: { maxRanks: 7, unlocksAtLevel: 10 },
        blizzardMastery: { maxRanks: 6, unlocksAtLevel: 10 },
        recharge: { maxRanks: 1, unlocksAtLevel: 60 },
        permafrost: { maxRanks: 5, unlocksAtLevel: 20 },
        dutyBound: { maxRanks: 5, unlocksAtLevel: 40 },
        divineShield: { maxRanks: 1, unlocksAtLevel: 30 },
        shieldBlock: { maxRanks: 8, unlocksAtLevel: 10 },
        lastHope: { maxRanks: 1, unlocksAtLevel: 20 },
        improvedLastHope: { maxRanks: 5, unlocksAtLevel: 30 },
        bestDefense: { maxRanks: 10, unlocksAtLevel: 40 },
      },
    });
  });
  it('retains sound and music catalogs with their assets', () => {
    expect(SOUND_FILES).toEqual(baseline.sounds);
    expect(MUSIC_FILES).toEqual(baseline.music);
    const assets = files('src/sprites').map((file) => path.basename(file));
    for (const filename of [...Object.values(SOUND_FILES), ...Object.values(MUSIC_FILES)])
      expect(assets).toContain(filename);
  });
});
