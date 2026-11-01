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

function versionChanges(directory: string): { generation: 3; changes: VersionChange[] } {
  const release: unknown = JSON.parse(
    readFileSync(resolve(directory, 'game-version.json'), 'utf8'),
  );
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
  const git = (args: string[]) =>
    execFileSync('git', args, { cwd: directory, encoding: 'utf8', windowsHide: true }).trim();
  if (git(['rev-parse', '--is-shallow-repository']) === 'true')
    throw new Error('Game build number needs full Git history. Run git fetch --unshallow.');
  const build = git(['rev-list', '--count', 'HEAD']);
  if (!/^\d+$/.test(build)) throw new Error('Invalid Git commit count.');
  const balance = release.changes.filter((change) => change.type === 'balance').length;
  const cosmetic = release.changes.filter((change) => change.type === 'cosmetic').length;
  return `${release.generation}.${balance}.${cosmetic}.${build}`;
}
