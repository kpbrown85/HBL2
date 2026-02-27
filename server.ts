import express from "express";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import api from "./api";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// HEARTBEAT
try {
  fs.writeFileSync(path.join(__dirname, "server-heartbeat.txt"), `ALIVE AT ${new Date().toISOString()}`);
} catch (e) {
  console.error("Failed to write heartbeat", e);
}

const app = express();
const PORT = 3000;

// 1. GLOBAL MIDDLEWARE - SET HEADERS ON EVERY SINGLE RESPONSE
app.use((req, res, next) => {
  res.setHeader("X-HBL-Server", "Express-V8-Active");
  res.setHeader("Access-Control-Allow-Origin", "*");
  console.log(`[V8] ${req.method} ${req.url}`);
  next();
});

app.use(express.json());

// 2. NAKED API ROUTES (No Router)
app.get("/api/ping", (req, res) => {
  res.json({ status: "ok", v: "V8-DIRECT", time: new Date().toISOString() });
});

app.get("/ping", (req, res) => {
  res.json({ status: "ok", v: "V8-ROOT", time: new Date().toISOString() });
});

// 3. ROUTER API
app.use("/api", api);
app.use(api); 

// 4. VITE / STATIC ASSETS
async function startApp() {
  if (process.env.NODE_ENV !== "production") {
    console.log("Starting in DEVELOPMENT mode (Vite Middleware)");
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    console.log("Starting in PRODUCTION mode (Static Dist)");
    const distPath = path.join(__dirname, "dist");
    if (!fs.existsSync(distPath)) {
      console.warn("DIST FOLDER MISSING! API will work but frontend may 404.");
    }
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[V8] HBL Server listening on port ${PORT}`);
  });
}

startApp();
