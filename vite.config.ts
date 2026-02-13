
import { defineConfig } from 'vite';

export default defineConfig({
  root: '.',
  build: {
    outDir: 'dist',
    target: 'esnext'
  },
  server: {
    port: 3000
  },
  define: {
    // This shims process.env for the browser environment
    'process.env': {
      API_KEY: process.env.API_KEY
    }
  }
});
