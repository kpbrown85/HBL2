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
    // Inject the API key as a literal string in the bundled code
    'process.env.API_KEY': JSON.stringify(process.env.API_KEY || '')
  }
});