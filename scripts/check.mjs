import { spawnSync } from 'node:child_process';

const checks = [
  ['TypeScript', 'node_modules/typescript/bin/tsc', '--noEmit'],
  ['Formatting', 'node_modules/prettier/bin/prettier.cjs', '--check', '.'],
  ['Game rules, regressions and coverage', 'node_modules/vitest/vitest.mjs', 'run', '--coverage'],
  ['Production build', 'node_modules/vite/bin/vite.js', 'build'],
  ['Browser scenarios', 'node_modules/@playwright/test/cli.js', 'test'],
];
for (const [name, ...args] of checks) {
  process.stdout.write(`\n${name}\n`);
  const result = spawnSync(process.execPath, args, { stdio: 'inherit', env: process.env });
  if (result.error) throw result.error;
  if (result.status !== 0) process.exit(result.status ?? 1);
}
