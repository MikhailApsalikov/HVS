import { readdirSync, readFileSync, mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const target = path.join(root, 'apps/mobile/src/generated');
const walk = (dir) =>
  readdirSync(dir, { withFileTypes: true }).flatMap((entry) =>
    entry.isDirectory() ? walk(path.join(dir, entry.name)) : [path.join(dir, entry.name)],
  );
const files = walk(path.join(root, 'src/sprites'));
const svgs = Object.fromEntries(
  files
    .filter((file) => file.endsWith('.svg'))
    .map((file) => [path.basename(file, '.svg'), readFileSync(file, 'utf8')]),
);
const audio = files
  .filter((file) => /\.(mp3|wav)$/.test(file))
  .map(
    (file) =>
      `  ${JSON.stringify(path.basename(file))}: require(${JSON.stringify(path.relative(target, file).replaceAll('\\', '/'))}),`,
  );
mkdirSync(target, { recursive: true });
writeFileSync(
  path.join(target, 'resources.ts'),
  `// Generated from the shared source assets by pnpm mobile:assets.\nexport const SVG: Record<string, string> = ${JSON.stringify(svgs)};\nexport const AUDIO: Record<string, number> = {\n${audio.join('\n')}\n};\n`,
);
console.log(
  `Mobile assets: ${Object.keys(svgs).length} SVG illustrations, ${audio.length} audio files.`,
);
