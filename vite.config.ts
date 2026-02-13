import { defineConfig } from 'vite';

export default defineConfig({
  root: '.',
  build: {
    outDir: 'dist',
    target: 'esnext',
    minify: 'esbuild',
    chunkSizeWarningLimit: 1000
  },
  server: {
    port: 3000
  },
  define: {
    // Robust shim for process and process.env
    'process.env': {
      API_KEY: JSON.stringify(process.env.API_KEY || '')
    },
    'process.env.API_KEY': JSON.stringify(process.env.API_KEY || '')
  }
});