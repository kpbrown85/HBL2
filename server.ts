import express from "express";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import api from "./api";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

// 1. GLOBAL MIDDLEWARE
app.use((req, res, next) => {
  res.setHeader("X-HBL-Server", "Express-V5-Active");
  console.log(`[${new Date().toISOString()}] INCOMING: ${req.method} ${req.url}`);
  next();
});

app.use(express.json());

// 2. API ROUTES
app.use("/api", api);
app.use(api); // Aliases

// 3. VITE / STATIC ASSETS
async function startApp() {
  if (process.env.NODE_ENV !== "production") {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static("dist"));
    app.get("*", (req, res) => {
      res.sendFile(path.join(__dirname, "dist", "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[${new Date().toISOString()}] HBL Server listening on port ${PORT}`);
  });
}

startApp();
