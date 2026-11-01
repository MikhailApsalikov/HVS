import { execFileSync } from 'node:child_process';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { gameVersion } from '../scripts/version.js';

const directories: string[] = [];
function repository() {
  const directory = mkdtempSync(join(tmpdir(), 'hvs-version-'));
  directories.push(directory);
  const git = (...args: string[]) =>
    execFileSync(
      'git',
      ['-c', 'user.name=Version test', '-c', 'user.email=version@example.invalid', ...args],
      { cwd: directory, encoding: 'utf8', windowsHide: true },
    );
  git('init', '--quiet');
  writeFileSync(
    join(directory, 'game-version.json'),
    JSON.stringify({ generation: 3, balance: 0, cosmetic: 0 }),
  );
  git('commit', '--quiet', '--allow-empty', '-m', 'Initial build');
  return { directory, git };
}
afterEach(() => {
  for (const directory of directories.splice(0)) {
    if (!directory.startsWith(join(tmpdir(), 'hvs-version-')))
      throw new Error('Unexpected cleanup path');
    rmSync(directory, { recursive: true, force: true, maxRetries: 5, retryDelay: 100 });
  }
});

describe('automatic game version without AI or commit hooks', () => {
  it('increments Z on every ordinary commit and keeps it when X/Y are edited', () => {
    const { directory, git } = repository();
    expect(gameVersion(directory)).toBe('3.0.0.1');
    git('commit', '--quiet', '--allow-empty', '--no-verify', '-m', 'Another build');
    expect(gameVersion(directory)).toBe('3.0.0.2');
    writeFileSync(
      join(directory, 'game-version.json'),
      JSON.stringify({ generation: 3, balance: 2, cosmetic: 4 }),
    );
    expect(gameVersion(directory)).toBe('3.2.4.2');
    git('commit', '--quiet', '--allow-empty', '-m', 'Third build');
    expect(gameVersion(directory)).toBe('3.2.4.3');
  });
  it('rejects shallow history instead of silently showing the wrong build', () => {
    const { directory, git } = repository();
    writeFileSync(join(directory, '.git', 'shallow'), git('rev-parse', 'HEAD'));
    expect(() => gameVersion(directory)).toThrow('full Git history');
  });
  it.each([
    { generation: 4, balance: 0, cosmetic: 0 },
    { generation: 3, balance: -1, cosmetic: 0 },
    { generation: 3, balance: 0, cosmetic: 0.5 },
  ])('rejects invalid release counters %j', (release) => {
    const { directory } = repository();
    writeFileSync(join(directory, 'game-version.json'), JSON.stringify(release));
    expect(() => gameVersion(directory)).toThrow('Invalid game-version.json');
  });
});
