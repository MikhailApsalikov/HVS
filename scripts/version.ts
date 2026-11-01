import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

/** X/Y are edited by the owner; Git supplies Z independently of commit authors and hooks. */
export function gameVersion(directory: string): string {
  const release = JSON.parse(readFileSync(resolve(directory, 'game-version.json'), 'utf8')) as {
    generation: number;
    balance: number;
    cosmetic: number;
  };
  if (
    release.generation !== 3 ||
    ![release.balance, release.cosmetic].every((value) => Number.isSafeInteger(value) && value >= 0)
  )
    throw new Error(
      'Invalid game-version.json: expected generation 3 and nonnegative integer X/Y.',
    );
  const git = (args: string[]) =>
    execFileSync('git', args, { cwd: directory, encoding: 'utf8', windowsHide: true }).trim();
  if (git(['rev-parse', '--is-shallow-repository']) === 'true')
    throw new Error('Game build number needs full Git history. Run git fetch --unshallow.');
  const build = git(['rev-list', '--count', 'HEAD']);
  if (!/^\d+$/.test(build)) throw new Error('Invalid Git commit count.');
  return `${release.generation}.${release.balance}.${release.cosmetic}.${build}`;
}
