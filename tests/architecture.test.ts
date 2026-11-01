import { describe, expect, it } from 'vitest';
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import path from 'node:path';
import { ITEM_CATALOG } from '../src/content/items.js';
import { RETIRED_ITEM_REFUNDS } from '../src/content/retiredItems.js';
import { generateItemSvg } from '../src/ui/ItemSpriteGenerator.js';
import { normalConfig } from '../src/content/normal.js';
import { SPIDER_DAMAGE } from '../src/domain/rules/stats.js';
import {
  SOUND_FILES,
  SOUND_FALLBACKS,
  MUSIC_FILES,
  MusicTrack,
  SoundEffect,
} from '../src/infrastructure/audio/catalog.js';

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
  it('accounts for every legacy item with a current item or a full refund', () => {
    const currentIds = new Set(ITEM_CATALOG.map((item) => item.id));
    for (const { id } of baseline.items) {
      expect(currentIds.has(id) || RETIRED_ITEM_REFUNDS[id] > 0, id).toBe(true);
    }
  });
  it('keeps legacy balance except for the explicit current rule changes', () => {
    const { spiderDamageStep: _linearDamage, ...normalBaseline } = baseline.normal;
    expect(normalConfig).toEqual({
      ...normalBaseline,
      initialAssistanceMultiplier: 0.5,
      spiderSpeedBase: 0.064,
      spiderSpeedStep: 0.0032,
      spiderDamageBase: 10,
      spiderDamageGrowth: SPIDER_DAMAGE.growth.normal,
      armorEffectiveness: 1.5,
      spawnP0: 0.0006,
      spawnDP: 0.0000405,
      spiderChanceGolden: 0.005,
      spiderChanceMegaFat: 0.01,
      spiderChanceFast: 0.07,
      spiderChancePoisonous: 0.01,
      baseHp: 100,
      hpRegen: 0,
      energyRegen: 8,
      coinsPerSec: 4,
      startingCoins: 250,
      shootCooldown: 3,
      arrowTravelTime: 3,
      abilities: {
        ...baseline.normal.abilities,
        freeze: { cost: 25, cooldown: 0 },
        heal: { cost: 100, cooldown: 17 },
        volley: { cost: 100, cooldown: 36 },
        aimedFire: { cost: 100, cooldown: 100 },
        lightningArrows: { cost: 70, cooldown: 90 },
        lightningShield: { cost: 0, cooldown: 300 },
        recharge: { cost: 65, cooldown: 120 },
        stand: { cost: 15, cooldown: 180 },
        lastHope: { cost: 45, cooldown: 40 },
        eagleEye: { cost: 20, cooldown: 45 },
        armageddon: { cost: 100, cooldown: 180 },
        adrenaline: { cost: 0, cooldown: 120 },
      },
      talents: {
        ...Object.fromEntries(
          Object.entries(
            baseline.normal.talents as Record<string, { maxRanks: number; unlocksAtLevel: number }>,
          ).map(([id, { maxRanks, unlocksAtLevel }]) => [
            id,
            { maxRanks, tier: unlocksAtLevel / 10 + 1 },
          ]),
        ),
        greed: { maxRanks: 5, tier: 1 },
        healBoost: { maxRanks: 5, tier: 5 },
        willToWin: { maxRanks: 5, tier: 6 },
        learningFromMistakes: { maxRanks: 5, tier: 6 },
        poisonResistance: { maxRanks: 5, tier: 6 },
        adrenaline: { maxRanks: 1, tier: 7 },
        marauder: { maxRanks: 3, tier: 4 },
        warriorArmor: { maxRanks: 5, tier: 2 },
        spiderArmor: { maxRanks: 10, tier: 3 },
        titanArmor: { maxRanks: 10, tier: 6 },
        endurance: { maxRanks: 7, tier: 1 },
        tireless: { maxRanks: 7, tier: 2 },
        agility: { maxRanks: 10, tier: 1 },
        eagleEye: { maxRanks: 1, tier: 3 },
        improvedCriticalShot: { maxRanks: 8, tier: 4 },
        agileCriticalShot: { maxRanks: 5, tier: 4 },
        vampirism: { maxRanks: 5, tier: 1 },
        masochism: { maxRanks: 5, tier: 3 },
        volleyMastery: { maxRanks: 5, tier: 2 },
        titanPreparation: { maxRanks: 5, tier: 5 },
        aimedFire: { maxRanks: 1, tier: 7 },
        rapidFire: { maxRanks: 7, tier: 5 },
        killingStreak: { maxRanks: 5, tier: 3 },
        enthusiasm: { maxRanks: 5, tier: 4 },
        improvedKillingStreak: { maxRanks: 5, tier: 5 },
        criticalShot: { maxRanks: 5, tier: 2 },
        piercingReward: { maxRanks: 7, tier: 2 },
        hunterMastery: { maxRanks: 5, tier: 1 },
        hunterArsenal: { maxRanks: 5, tier: 1 },
        rationality: { maxRanks: 5, tier: 2 },
        economy: { maxRanks: 5, tier: 6 },
        improvedEndurance: { maxRanks: 5, tier: 1 },
        improvedAgility: { maxRanks: 5, tier: 1 },
        improvedIntellect: { maxRanks: 5, tier: 1 },
        magicArmor: { maxRanks: 5, tier: 5 },
        blizzardMastery: { maxRanks: 6, tier: 4 },
        recharge: { maxRanks: 1, tier: 7 },
        permafrost: { maxRanks: 10, tier: 6 },
        lightningArrows: { maxRanks: 1, tier: 2 },
        lightningShield: { maxRanks: 1, tier: 4 },
        improvedLightning: { maxRanks: 5, tier: 3 },
        fireExplosion: { maxRanks: 10, tier: 3 },
        improvedArmageddon: { maxRanks: 6, tier: 4 },
        iceArrows: { maxRanks: 5, tier: 5 },
        dutyBound: { maxRanks: 5, tier: 5 },
        divineShield: { maxRanks: 1, tier: 4 },
        shieldBlock: { maxRanks: 7, tier: 2 },
        lastHope: { maxRanks: 1, tier: 3 },
        improvedLastHope: { maxRanks: 5, tier: 4 },
        bestDefense: { maxRanks: 10, tier: 5 },
      },
    });
  });
  it('retains sound and music catalogs with their assets', () => {
    expect(SOUND_FILES).toEqual({
      ...baseline.sounds,
      [SoundEffect.VICTORY]: 'greed_main.mp3',
      [SoundEffect.ADRENALINE_ACTIVATE]: 'bloodlust_player_cast_head.ogg',
      [SoundEffect.EAGLE_EYE_ACTIVATE]: 'InnerFireC.ogg',
      [SoundEffect.LIGHTNING_ARROWS_ACTIVATE]: 'SPELL_LightningBolt_Impact_04.ogg',
      [SoundEffect.LIGHTNING_SHIELD_ACTIVATE]: 'LightningShieldImpact.ogg',
      [SoundEffect.AIMED_FIRE_ACTIVATE]: 'BowPullback.ogg',
      [SoundEffect.MENU_BACK]: 'Select2.wav',
      [SoundEffect.FULL_BLOCK]: 'WoodenShieldBlock1.ogg',
      [SoundEffect.PARTIAL_BLOCK]: 'WoodenShieldBlock2.ogg',
      [SoundEffect.LAST_HOPE_ACTIVATE]: 'ShieldWallTarget.ogg',
      [SoundEffect.KILL_GOLDEN_SPIDER]: 'LootCoinSmall.ogg',
      [SoundEffect.TANK_DAMAGE]: 'Takedmg.wav',
      [SoundEffect.PIERCING_DAMAGE]: null,
      [SoundEffect.PARTIAL_DEFENSE_DAMAGE]: 'Takedmg.wav',
    });
    expect(MUSIC_FILES).toEqual({
      ...baseline.music,
      [MusicTrack.HELP]: '2.mp3',
      [MusicTrack.FREEZE]: 'bg36.mp3',
      [MusicTrack.CRITICAL_HEALTH]: 'game_sboss.wav',
    });
    const assets = files('src/sprites').map((file) => path.basename(file));
    for (const filename of [...Object.values(SOUND_FILES), ...Object.values(MUSIC_FILES)].filter(
      (filename) => filename !== null,
    ))
      expect(assets).toContain(filename);
    for (const fallback of Object.values(SOUND_FALLBACKS))
      expect(SOUND_FILES[fallback]).not.toBeNull();
  });
});
