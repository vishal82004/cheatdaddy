
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  base: './', // Important for Electron to load assets
  root: 'src', // Keep source in src
  publicDir: '../public', // If we have public assets outside src
  build: {
    outDir: '../dist',
    emptyOutDir: true,
    target: 'esnext', // Support modern syntax
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
