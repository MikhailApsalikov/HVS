import { describe, expect, it } from 'vitest';
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import path from 'node:path';
import { ITEM_CATALOG } from '../src/content/items.js';
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

describe('legacy feature inventory captured before rewrite', () => {
  const baseline = JSON.parse(readFileSync('tests/fixtures/legacy-content.json', 'utf8'));
  it('retains every item name, ID and base price', () => {
    expect(ITEM_CATALOG.map(({ id, name, price }) => ({ id, name, price }))).toEqual(
      baseline.items,
    );
  });
  it('retains original base balance, unlocks and rank limits', () => {
    expect(normalConfig).toEqual(baseline.normal);
  });
  it('retains sound and music catalogs with their assets', () => {
    expect(SOUND_FILES).toEqual(baseline.sounds);
    expect(MUSIC_FILES).toEqual(baseline.music);
    const assets = files('src/sprites').map((file) => path.basename(file));
    for (const filename of [...Object.values(SOUND_FILES), ...Object.values(MUSIC_FILES)])
      expect(assets).toContain(filename);
  });
});
