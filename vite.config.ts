import { defineConfig } from 'vite';
console.log("VITE.CONFIG.TS: LOADING...");
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import express from 'express';
import api from './api';

const app = express();
app.use(express.json());
app.use('/api', api);
app.use(api); // Also mount at root for aliases

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    {
      name: 'api-server',
      configureServer(server) {
        server.middlewares.use((req, res, next) => {
          res.setHeader('X-Vite-Global', 'V8.1-Active');
          const url = req.url || '';
          if (url.includes('/vite-ping')) {
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ status: 'Vite CLI is active', v: 'V8.1', timestamp: new Date().toISOString() }));
          } else if (url.includes('/api/ping')) {
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ status: 'Vite API Bypass', v: 'V8.1' }));
          } else {
            next();
          }
        });
        server.middlewares.use(app);
      }
    }
  ],
  build: {
    outDir: 'dist',
    target: 'esnext'
  },
  server: {
    port: 3000,
    host: '0.0.0.0',
    allowedHosts: true
  },
  define: {
    'process.env.API_KEY': JSON.stringify(process.env.API_KEY || ''),
    'process.env.GEMINI_API_KEY': JSON.stringify(process.env.GEMINI_API_KEY || '')
  }
});