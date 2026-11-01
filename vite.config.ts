import { defineConfig } from 'vite';
import { execFileSync } from 'node:child_process';
import { watchFile, unwatchFile } from 'node:fs';
import { resolve } from 'node:path';
import { gameVersion } from './scripts/version.js';

export default defineConfig({
  root: '.',
  define: { __GAME_VERSION__: JSON.stringify(gameVersion(process.cwd())) },
  plugins: [
    {
      name: 'game-version-refresh',
      configureServer(server) {
        const root = server.config.root;
        const headLog = execFileSync('git', ['rev-parse', '--git-path', 'logs/HEAD'], {
          cwd: root,
          encoding: 'utf8',
          windowsHide: true,
        }).trim();
        const paths = [resolve(root, headLog), resolve(root, 'game-version.json')];
        let current = gameVersion(root);
        const refresh = () => {
          try {
            const next = gameVersion(root);
            if (next === current) return;
            current = next;
            void server.restart();
          } catch (error) {
            server.config.logger.error(String(error));
          }
        };
        for (const path of paths) watchFile(path, { interval: 500, persistent: false }, refresh);
        server.httpServer?.once('close', () => {
          for (const path of paths) unwatchFile(path, refresh);
        });
      },
    },
  ],
  publicDir: 'public',
  build: {
    outDir: 'dist',
    target: 'es2022',
  },
  assetsInclude: ['**/*.svg'],
});
