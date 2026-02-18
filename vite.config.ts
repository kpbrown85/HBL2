import { defineConfig } from 'vite';

export default defineConfig({
  root: '.',
  build: {
    outDir: 'dist',
    target: 'esnext',
    minify: 'esbuild',
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        // Splitting large libraries into separate chunks to resolve the 500kB warning
        manualChunks: {
          'vendor-react': ['react', 'react-dom'],
          'vendor-icons': ['lucide-react'],
          'vendor-ai': ['@google/genai']
        }
      }
    }
  },
  server: {
    port: 3000
  },
  define: {
    // Inject the API key from environment variables during the build process
    'process.env.API_KEY': JSON.stringify(process.env.API_KEY || '')
  }
});