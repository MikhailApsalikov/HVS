const { getDefaultConfig, mergeConfig } = require('@react-native/metro-config');
const path = require('node:path');
const fs = require('node:fs');
const root = path.resolve(__dirname, '../..');

module.exports = mergeConfig(getDefaultConfig(__dirname), {
  watchFolders: [root],
  resolver: {
    nodeModulesPaths: [path.join(__dirname, 'node_modules'), path.join(root, 'node_modules')],
    // The shared ESM source uses .js specifiers for TypeScript files, as Vite does.
    resolveRequest(context, name, platform) {
      if (name.startsWith('.') && name.endsWith('.js')) {
        const source = path.resolve(
          path.dirname(context.originModulePath),
          name.slice(0, -3) + '.ts',
        );
        if (fs.existsSync(source)) return { type: 'sourceFile', filePath: source };
      }
      return context.resolveRequest(context, name, platform);
    },
  },
});
