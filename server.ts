import "dotenv/config";
import express from "express";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { api } from "./api/index.js";

console.log(`[${new Date().toISOString()}] Server starting...`);
console.log(`[${new Date().toISOString()}] RESEND_API_KEY present: ${!!process.env.RESEND_API_KEY}`);
console.log(`[${new Date().toISOString()}] API Router imported type:`, typeof api);
console.log(`[${new Date().toISOString()}] API Router is function:`, typeof api === 'function');

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PORT = 3000;

const app = express();
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// GLOBAL MIDDLEWARE
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  res.setHeader("X-HBL-Server", "Vercel-Ready-V3");
  next();
});

// Direct health check to verify server is alive independently of the API router
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString(), message: "Server is healthy" });
});

app.get("/api/test-direct", (req, res) => {
  res.json({ ok: true, message: "Direct API route in server.ts works" });
});

const apiRouter = (api as any).default || api;
console.log(`[${new Date().toISOString()}] Mounting API Router. Type: ${typeof apiRouter}`);

app.use("/api", apiRouter);

// Specific 404 for /api routes to prevent HTML fallback
app.use("/api", (req, res) => {
  console.log(`[${new Date().toISOString()}] 404 API Route: ${req.method} ${req.url}`);
  res.status(404).json({ 
    error: "API endpoint not found", 
    method: req.method,
    url: req.originalUrl,
    hint: "Check if the route is defined in /api/index.ts"
  });
});

async function startApp() {
  if (process.env.NODE_ENV !== "production") {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(__dirname, "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  // Global Error Handler
  app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    console.error(`[${new Date().toISOString()}] Server Error:`, err);
    res.status(500).json({ 
      error: "Internal Server Error", 
      message: err.message,
      stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
  });

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server listening on port ${PORT}`);
  });
}

startApp();
