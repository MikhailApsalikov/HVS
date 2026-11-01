import { execFileSync } from 'node:child_process';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { gameVersion, markVersionChange } from '../scripts/version.js';

const directories: string[] = [];
function manifestDirectory() {
  const directory = mkdtempSync(join(tmpdir(), 'hvs-version-'));
  directories.push(directory);
  writeFileSync(
    join(directory, 'game-version.json'),
    JSON.stringify({ generation: 3, changes: [] }),
  );
  return directory;
}
function repository() {
  const directory = manifestDirectory();
  const git = (...args: string[]) =>
    execFileSync(
      'git',
      [
        '-c',
        'user.name=Version test',
        '-c',
        'user.email=version@example.invalid',
        '-c',
        'core.autocrlf=false',
        ...args,
      ],
      { cwd: directory, encoding: 'utf8', windowsHide: true },
    );
  git('init', '--quiet');
  git('add', 'game-version.json');
  git('commit', '--quiet', '-m', 'Initial build');
  return { directory, git };
}
afterEach(() => {
  for (const directory of directories.splice(0)) {
    if (!directory.startsWith(join(tmpdir(), 'hvs-version-')))
      throw new Error('Unexpected cleanup path');
    rmSync(directory, { recursive: true, force: true, maxRetries: 5, retryDelay: 100 });
  }
});

function flagCommand(directory: string, ...args: string[]) {
  return execFileSync(process.execPath, [resolve('scripts/mark-version.mjs'), ...args], {
    cwd: directory,
    encoding: 'utf8',
    windowsHide: true,
    stdio: 'pipe',
  });
}

// Real Git/Node process startup on Windows is slower under coverage than in isolated runs.
describe('game version from AI flags and Git', { timeout: 20_000 }, () => {
  it('generates independent X/Y counters from flags without editing numeric versions', () => {
    const { directory } = repository();
    expect(gameVersion(directory)).toBe('3.0.0.1');
    markVersionChange(directory, 'balance', 'rebalance-talents');
    expect(gameVersion(directory)).toBe('3.1.0.1');
    markVersionChange(directory, 'cosmetic', 'replace-shot-sounds');
    expect(gameVersion(directory)).toBe('3.1.1.1');
    markVersionChange(directory, 'cosmetic', 'redraw-spiders');
    expect(gameVersion(directory)).toBe('3.1.2.1');
    markVersionChange(directory, 'balance', 'rebalance-items');
    expect(gameVersion(directory)).toBe('3.2.2.1');
    expect(JSON.parse(readFileSync(join(directory, 'game-version.json'), 'utf8'))).toEqual({
      generation: 3,
      changes: [
        { id: 'rebalance-talents', type: 'balance' },
        { id: 'replace-shot-sounds', type: 'cosmetic' },
        { id: 'redraw-spiders', type: 'cosmetic' },
        { id: 'rebalance-items', type: 'balance' },
      ],
    });
  });
  it('counts each flag once across repeated commands, builds and ordinary commits', () => {
    const { directory, git } = repository();
    markVersionChange(directory, 'balance', 'rebalance-talents');
    markVersionChange(directory, 'cosmetic', 'redraw-spiders');
    const manifest = readFileSync(join(directory, 'game-version.json'), 'utf8');
    for (let build = 0; build < 3; build++) {
      markVersionChange(directory, 'balance', 'rebalance-talents');
      markVersionChange(directory, 'cosmetic', 'redraw-spiders');
      expect(gameVersion(directory)).toBe('3.1.1.1');
    }
    expect(readFileSync(join(directory, 'game-version.json'), 'utf8')).toBe(manifest);
    git('add', 'game-version.json');
    git('commit', '--quiet', '--no-verify', '-m', 'Commit AI flags');
    expect(gameVersion(directory)).toBe('3.1.1.2');
    git('commit', '--quiet', '--allow-empty', '--no-verify', '-m', 'Ordinary build');
    expect(gameVersion(directory)).toBe('3.1.1.3');
  });
  it('increments Z without AI or hooks and leaves X/Y unchanged for technical tasks', () => {
    const { directory, git } = repository();
    expect(gameVersion(directory)).toBe('3.0.0.1');
    git('commit', '--quiet', '--allow-empty', '--no-verify', '-m', 'Another build');
    expect(gameVersion(directory)).toBe('3.0.0.2');
    markVersionChange(directory, 'none', 'update-tooling');
    expect(gameVersion(directory)).toBe('3.0.0.2');
    git('add', 'game-version.json');
    git('commit', '--quiet', '--allow-empty', '-m', 'Third build');
    expect(gameVersion(directory)).toBe('3.0.0.3');
  });
  it('reconstructs a checked-out version using its recorded flags and history', () => {
    const { directory, git } = repository();
    const initial = git('rev-parse', 'HEAD').trim();
    markVersionChange(directory, 'balance', 'rebalance-talents');
    git('add', 'game-version.json');
    git('commit', '--quiet', '-m', 'Balance change');
    const balanced = git('rev-parse', 'HEAD').trim();
    markVersionChange(directory, 'cosmetic', 'redraw-spiders');
    git('add', 'game-version.json');
    git('commit', '--quiet', '-m', 'Cosmetic change');
    expect(gameVersion(directory)).toBe('3.1.1.3');
    git('checkout', '--quiet', '--detach', balanced);
    expect(gameVersion(directory)).toBe('3.1.0.2');
    git('checkout', '--quiet', '--detach', initial);
    expect(gameVersion(directory)).toBe('3.0.0.1');
  });
  it('provides an AI flag command that generates a version without manual counters', () => {
    const { directory } = repository();
    expect(flagCommand(directory, 'balance', 'cli-balance-change')).toContain(
      'cli-balance-change (balance)',
    );
    expect(gameVersion(directory)).toBe('3.1.0.1');
  });
  it.each([
    { args: [] },
    { args: ['balance'] },
    { args: ['other', 'invalid-flag'] },
    { args: ['balance', 'id', 'extra'] },
  ])('rejects invalid command arguments $args without changing the manifest', ({ args }) => {
    const directory = manifestDirectory();
    const manifest = readFileSync(join(directory, 'game-version.json'), 'utf8');
    expect(() => flagCommand(directory, ...args)).toThrow();
    expect(readFileSync(join(directory, 'game-version.json'), 'utf8')).toBe(manifest);
  });
  it('rejects reusing an existing task ID with a different flag', () => {
    const { directory } = repository();
    markVersionChange(directory, 'balance', 'rebalance-talents');
    expect(() => markVersionChange(directory, 'cosmetic', 'rebalance-talents')).toThrow(
      'already marked as balance',
    );
    expect(gameVersion(directory)).toBe('3.1.0.1');
  });
  it.each([
    ['major', 'task'],
    ['balance', ''],
    ['cosmetic', 'Task name'],
    ['none', '../task'],
  ])('rejects an invalid AI flag or ID: %s %s', (type, id) => {
    const directory = manifestDirectory();
    const manifest = readFileSync(join(directory, 'game-version.json'), 'utf8');
    expect(() => markVersionChange(directory, type, id)).toThrow('Expected a balance');
    expect(readFileSync(join(directory, 'game-version.json'), 'utf8')).toBe(manifest);
  });
  it('rejects shallow history instead of silently showing the wrong build', () => {
    const { directory, git } = repository();
    writeFileSync(join(directory, '.git', 'shallow'), git('rev-parse', 'HEAD'));
    expect(() => gameVersion(directory)).toThrow('full Git history');
  });
  it.each([
    null,
    [],
    { generation: 4, changes: [] },
    { generation: 3, balance: 0, cosmetic: 0 },
    { generation: 3, changes: [], balance: 1 },
    { generation: 3, changes: null },
    { generation: 3, changes: [null] },
    { generation: 3, changes: [{ id: 'task', type: 'other' }] },
    { generation: 3, changes: [{ type: 'balance' }] },
    { generation: 3, changes: [{ id: 'task', type: 'balance', balance: 2 }] },
    {
      generation: 3,
      changes: [
        { id: 'same-task', type: 'balance' },
        { id: 'same-task', type: 'cosmetic' },
      ],
    },
  ])('rejects invalid manifests and manual version counters %j', (release) => {
    const directory = manifestDirectory();
    writeFileSync(join(directory, 'game-version.json'), JSON.stringify(release));
    expect(() => gameVersion(directory)).toThrow('Invalid game-version.json');
    expect(() => markVersionChange(directory, 'balance', 'new-task')).toThrow(
      'Invalid game-version.json',
    );
  });
});
