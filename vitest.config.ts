import { defineConfig } from 'vitest/config';
import { gameVersion } from './scripts/version.js';

export default defineConfig({
  define: { __GAME_VERSION__: JSON.stringify(gameVersion(process.cwd())) },
  test: {
    include: ['tests/**/*.test.ts'],
    coverage: {
      provider: 'v8',
      include: [
        'src/domain/**/*.ts',
        'src/application/**/*.ts',
        'src/infrastructure/browser/FrameLoop.ts',
        'src/infrastructure/storage/**/*.ts',
      ],
      exclude: ['src/domain/types.ts', 'src/domain/itemTypes.ts'],
      reporter: ['text', 'html', 'json-summary'],
      thresholds: { statements: 90, lines: 90, functions: 90, branches: 80 },
    },
  },
});
