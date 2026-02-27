import express from "express";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import nodemailer from "nodemailer";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const BOOKINGS_FILE = path.join(__dirname, "bookings.json");

if (!fs.existsSync(BOOKINGS_FILE)) {
  fs.writeFileSync(BOOKINGS_FILE, JSON.stringify([]));
}

const app = express();
const PORT = 3000;

// Add a custom header to identify our server
app.use((req, res, next) => {
  res.setHeader("X-HBL-Server", "Express-Active");
  next();
});

app.use(express.json());

// 1. API ROUTES
app.get("/api/ping", (req, res) => {
  res.json({ status: "ok", source: "HBL-Express-Server", time: new Date().toISOString() });
});

app.get("/debug-test", (req, res) => {
  res.json({ status: "Express is reachable", path: req.url });
});

app.post("/api/create-booking", async (req, res) => {
  try {
    const booking = { 
      ...req.body, 
      id: Math.random().toString(36).substr(2, 9), 
      timestamp: Date.now(), 
      status: "pending" 
    };
    const data = fs.readFileSync(BOOKINGS_FILE, "utf-8");
    const bookings = JSON.parse(data);
    bookings.unshift(booking);
    fs.writeFileSync(BOOKINGS_FILE, JSON.stringify(bookings, null, 2));
    
    // Email (Non-blocking)
    if (process.env.SMTP_USER && process.env.SMTP_PASS) {
      const transporter = nodemailer.createTransport({
        host: "smtp.gmail.com", port: 465, secure: true,
        auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
      });
      transporter.sendMail({
        from: `"HBL" <${process.env.SMTP_USER}>`,
        to: "kevin.paul.brown@gmail.com",
        subject: "New Booking Request",
        text: `New booking from ${booking.name}.`
      }).catch(err => console.error("Email error:", err));
    }
    
    res.status(201).json(booking);
  } catch (e) {
    res.status(500).json({ error: "Booking failed on server" });
  }
});

app.get("/api/get-bookings", (req, res) => {
  try {
    const data = fs.readFileSync(BOOKINGS_FILE, "utf-8");
    res.json(JSON.parse(data));
  } catch (e) {
    res.status(500).json({ error: "Failed to load bookings" });
  }
});

// 2. VITE / STATIC ASSETS
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
