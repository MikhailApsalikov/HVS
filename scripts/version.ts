import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

type ChangeType = 'balance' | 'cosmetic' | 'none';
interface VersionChange {
  id: string;
  type: ChangeType;
}

function isChangeType(value: unknown): value is ChangeType {
  return value === 'balance' || value === 'cosmetic' || value === 'none';
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function validChangeId(value: unknown): value is string {
  return typeof value === 'string' && /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value);
}

function parseVersionChanges(release: unknown): { generation: 3; changes: VersionChange[] } {
  const invalid = () =>
    new Error(
      'Invalid game-version.json: expected generation 3 and unique change IDs with balance, cosmetic or none flags; numeric X/Y are generated automatically.',
    );
  if (
    !isRecord(release) ||
    release.generation !== 3 ||
    !Array.isArray(release.changes) ||
    Object.keys(release).some((key) => key !== 'generation' && key !== 'changes')
  )
    throw invalid();
  const changes: VersionChange[] = [];
  const ids = new Set<string>();
  for (const change of release.changes) {
    if (
      !isRecord(change) ||
      !validChangeId(change.id) ||
      !isChangeType(change.type) ||
      Object.keys(change).some((key) => key !== 'id' && key !== 'type') ||
      ids.has(change.id)
    )
      throw invalid();
    ids.add(change.id);
    changes.push({ id: change.id, type: change.type });
  }
  return { generation: 3, changes };
}

function versionChanges(directory: string) {
  return parseVersionChanges(
    JSON.parse(readFileSync(resolve(directory, 'game-version.json'), 'utf8')),
  );
}

function git(directory: string, ...args: string[]): string {
  return execFileSync('git', args, {
    cwd: directory,
    encoding: 'utf8',
    windowsHide: true,
    stdio: 'pipe',
  });
}

/** Fail the required checks when AI forgets to classify game changes. */
export function checkVersionFlags(directory: string): void {
  const current = versionChanges(directory).changes;
  const committedChanges = (ref: string | undefined): VersionChange[] => {
    if (!ref || !git(directory, 'ls-tree', '--name-only', ref, '--', 'game-version.json').trim())
      return [];
    return parseVersionChanges(JSON.parse(git(directory, 'show', `${ref}:game-version.json`)))
      .changes;
  };
  const head = committedChanges('HEAD');
  const preserveRecordedFlags = (previous: VersionChange[]) => {
    for (const recorded of previous) {
      if (!current.some((change) => change.id === recorded.id && change.type === recorded.type))
        throw new Error(`Recorded version flag ${recorded.id} must not be removed or changed.`);
    }
  };
  preserveRecordedFlags(head);
  const requireGameFlag = (paths: string, previous: VersionChange[]) => {
    const gameChanged = paths
      .split('\0')
      .some(
        (path) => path.startsWith('src/') || path.startsWith('public/') || path === 'index.html',
      );
    if (!gameChanged) return;
    const previousIds = new Set(previous.map((change) => change.id));
    if (!current.some((change) => change.type !== 'none' && !previousIds.has(change.id)))
      throw new Error(
        'Game changes are missing a new AI version flag. Run pnpm version:flag <balance|cosmetic> <unique-change-id> before pnpm check.',
      );
  };
  const workingPaths =
    git(directory, 'diff', '--name-only', '-z', 'HEAD') +
    git(directory, 'ls-files', '--others', '--exclude-standard', '-z');
  requireGameFlag(workingPaths, head);
  const parent = git(directory, 'rev-list', '--parents', '-n', '1', 'HEAD').trim().split(' ')[1];
  const committedPaths = parent
    ? git(directory, 'diff', '--name-only', '-z', parent, 'HEAD')
    : git(directory, 'ls-tree', '-r', '--name-only', '-z', 'HEAD');
  const previous = committedChanges(parent);
  preserveRecordedFlags(previous);
  requireGameFlag(committedPaths, previous);
}

/** AI records a flag per task, never a numeric version. Repeating a task ID is idempotent. */
export function markVersionChange(directory: string, type: string, id: string): void {
  if (!isChangeType(type) || !validChangeId(id))
    throw new Error(
      'Expected a balance, cosmetic or none flag and a unique lowercase change ID separated by hyphens.',
    );
  const release = versionChanges(directory);
  const previous = release.changes.find((change) => change.id === id);
  if (previous) {
    if (previous.type !== type)
      throw new Error(`Version change ${id} is already marked as ${previous.type}.`);
    return;
  }
  release.changes.push({ id, type });
  writeFileSync(
    resolve(directory, 'game-version.json'),
    `${JSON.stringify(release, null, 2)}\n`,
    'utf8',
  );
}

/** Flags supply X/Y; Git supplies Z independently of AI, commit authors and hooks. */
export function gameVersion(directory: string): string {
  const release = versionChanges(directory);
  if (git(directory, 'rev-parse', '--is-shallow-repository').trim() === 'true')
    throw new Error('Game build number needs full Git history. Run git fetch --unshallow.');
  const build = git(directory, 'rev-list', '--count', 'HEAD').trim();
  if (!/^\d+$/.test(build)) throw new Error('Invalid Git commit count.');
  const balance = release.changes.filter((change) => change.type === 'balance').length;
  const cosmetic = release.changes.filter((change) => change.type === 'cosmetic').length;
  return `${release.generation}.${balance}.${cosmetic}.${build}`;
}
