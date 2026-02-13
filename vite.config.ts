
import { defineConfig } from 'vite';

export default defineConfig({
  root: '.',
  build: {
    outDir: 'dist',
    target: 'esnext',
    minify: 'esbuild'
  },
  server: {
    port: 3000
  },
  define: {
    // Specifically target the exact string to avoid breaking libraries that check for the process object
    'process.env.API_KEY': JSON.stringify(process.env.API_KEY || '')
  }
});
