import { checkVersionFlags } from './version.ts';

checkVersionFlags(process.cwd());
process.stdout.write('AI version flags match game changes.\n');
