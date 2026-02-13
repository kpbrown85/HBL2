
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
    // This shims the entire process.env object more robustly
    'process.env': {
      API_KEY: JSON.stringify(process.env.API_KEY || '').replace(/"/g, '') 
    },
    // Also explicitly replace the string to catch library internal usage
    'process.env.API_KEY': JSON.stringify(process.env.API_KEY || '')
  }
});
