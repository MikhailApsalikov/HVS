import { execFileSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { checkVersionFlags, gameVersion, markVersionChange } from '../scripts/version.js';

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

function changeGame(directory: string, contents = 'export const music = "new-track";\n') {
  mkdirSync(join(directory, 'src'), { recursive: true });
  writeFileSync(join(directory, 'src', 'music.ts'), contents);
}

// Real Git/Node process startup on Windows is slower under coverage than in isolated runs.
describe('game version from AI flags and Git', { timeout: 20_000 }, () => {
  it('rejects untracked and staged game changes until AI adds a meaningful flag', () => {
    const { directory, git } = repository();
    changeGame(directory);
    expect(() => checkVersionFlags(directory)).toThrow('missing a new AI version flag');
    git('add', 'src/music.ts');
    markVersionChange(directory, 'none', 'technical-task');
    expect(() => checkVersionFlags(directory)).toThrow('missing a new AI version flag');
    markVersionChange(directory, 'cosmetic', 'new-music');
    expect(() => checkVersionFlags(directory)).not.toThrow();
    expect(gameVersion(directory)).toBe('3.0.1.1');
  });
  it('accepts a committed cosmetic flag and a fresh balance flag for the next game edit', () => {
    const { directory, git } = repository();
    changeGame(directory);
    markVersionChange(directory, 'cosmetic', 'new-music');
    git('add', 'src/music.ts', 'game-version.json');
    git('commit', '--quiet', '-m', 'Music updated with an AI flag');
    expect(() => checkVersionFlags(directory)).not.toThrow();
    changeGame(directory, 'export const startingHp = 200;\n');
    expect(() => checkVersionFlags(directory)).toThrow('missing a new AI version flag');
    markVersionChange(directory, 'balance', 'increase-starting-health');
    expect(() => checkVersionFlags(directory)).not.toThrow();
    expect(gameVersion(directory)).toBe('3.1.1.2');
  });
  it('detects the omitted music flag after commit and accepts one retrospective flag', () => {
    const { directory, git } = repository();
    changeGame(directory);
    git('add', 'src/music.ts');
    git('commit', '--quiet', '-m', 'Music updated without a flag');
    expect(git('status', '--porcelain').trim()).toBe('');
    expect(gameVersion(directory)).toBe('3.0.0.2');
    expect(() => checkVersionFlags(directory)).toThrow('missing a new AI version flag');
    markVersionChange(directory, 'none', 'check-tooling');
    expect(() => checkVersionFlags(directory)).toThrow('missing a new AI version flag');
    markVersionChange(directory, 'cosmetic', 'recover-music-flag');
    expect(() => checkVersionFlags(directory)).not.toThrow();
    markVersionChange(directory, 'cosmetic', 'recover-music-flag');
    expect(gameVersion(directory)).toBe('3.0.1.2');
  });
  it('allows documentation and ordinary commits to increase only Z', () => {
    const { directory, git } = repository();
    writeFileSync(join(directory, 'README.md'), 'Documentation only.\n');
    expect(() => checkVersionFlags(directory)).not.toThrow();
    git('add', 'README.md');
    git('commit', '--quiet', '-m', 'Documentation');
    expect(() => checkVersionFlags(directory)).not.toThrow();
    expect(gameVersion(directory)).toBe('3.0.0.2');
  });
  it.each(['public/music.ogg', 'index.html'])(
    'requires an AI flag for game assets and entry HTML: %s',
    (path) => {
      const { directory } = repository();
      mkdirSync(join(directory, 'public'), { recursive: true });
      writeFileSync(join(directory, path), 'changed');
      expect(() => checkVersionFlags(directory)).toThrow('missing a new AI version flag');
      markVersionChange(directory, 'cosmetic', 'update-game-assets');
      expect(() => checkVersionFlags(directory)).not.toThrow();
    },
  );
  it.each([{ changes: [] }, { changes: [{ id: 'original-music', type: 'balance' }] }])(
    'rejects rewritten flags before and after commit: $changes',
    ({ changes }) => {
      const { directory, git } = repository();
      markVersionChange(directory, 'cosmetic', 'original-music');
      git('add', 'game-version.json');
      git('commit', '--quiet', '-m', 'Record original music flag');
      writeFileSync(
        join(directory, 'game-version.json'),
        JSON.stringify({ generation: 3, changes }),
      );
      expect(() => checkVersionFlags(directory)).toThrow('must not be removed or changed');
      git('add', 'game-version.json');
      git('commit', '--quiet', '-m', 'Rewrite a recorded flag');
      expect(() => checkVersionFlags(directory)).toThrow('must not be removed or changed');
    },
  );
  it('makes the version-check command fail for an unclassified game commit', () => {
    const { directory, git } = repository();
    changeGame(directory);
    git('add', 'src/music.ts');
    git('commit', '--quiet', '-m', 'Forgotten music flag');
    const check = () =>
      execFileSync(process.execPath, [resolve('scripts/check-version.mjs')], {
        cwd: directory,
        encoding: 'utf8',
        windowsHide: true,
        stdio: 'pipe',
      });
    expect(check).toThrow('missing a new AI version flag');
    markVersionChange(directory, 'cosmetic', 'correct-music-version');
    expect(check()).toContain('AI version flags match game changes');
  });
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
