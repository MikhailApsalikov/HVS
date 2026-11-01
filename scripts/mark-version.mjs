import { markVersionChange } from './version.ts';

const [type, id, ...extra] = process.argv.slice(2);
if (!type || !id || extra.length)
  throw new Error('Usage: pnpm version:flag <balance|cosmetic|none> <unique-change-id>');

markVersionChange(process.cwd(), type, id);
process.stdout.write(`Version flag recorded: ${id} (${type}).\n`);
