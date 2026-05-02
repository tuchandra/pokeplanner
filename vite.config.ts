import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

// Custom domain (tusharc.dev) is on the user pages site (tuchandra.github.io).
// Project pages from username/pokeplanner are served at tusharc.dev/pokeplanner/.
// In dev, no base path. In prod build, base = '/pokeplanner/'.
export default defineConfig(({ command }) => ({
  base: command === 'build' ? '/pokeplanner/' : '/',
  plugins: [react()],
  build: {
    outDir: 'dist',
    sourcemap: true,
  },
}));
