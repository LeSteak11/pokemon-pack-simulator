import react from '@vitejs/plugin-react';
import path from 'path';
import fs from 'fs';
import {defineConfig, loadEnv, Plugin} from 'vite';

// Copies data/sets/ into dist/data/sets/ after every production build
// so Tauri and static previews can fetch the JSON set files.
function copyDataSetsPlugin(): Plugin {
  return {
    name: 'copy-data-sets',
    closeBundle() {
      const src = path.resolve(__dirname, 'data', 'sets');
      const dest = path.resolve(__dirname, 'dist', 'data', 'sets');
      fs.mkdirSync(dest, { recursive: true });
      for (const file of fs.readdirSync(src)) {
        fs.copyFileSync(path.join(src, file), path.join(dest, file));
      }
      console.log('\u2705 Copied data/sets/ → dist/data/sets/');
    }
  };
}

export default defineConfig(({mode}) => {
  const env = loadEnv(mode, '.', '');
  return {
    plugins: [react(), copyDataSetsPlugin()],
    define: {
      'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY),
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modifyâfile watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
    },
  };
});
