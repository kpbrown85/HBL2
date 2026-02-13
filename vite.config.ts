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
    // Inject the API key from environment variables during the build process
    'process.env.API_KEY': JSON.stringify(process.env.API_KEY || '')
  }
});