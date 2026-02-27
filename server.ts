import express from "express";
console.log("SERVER.TS: STARTING UP...");
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

app.use(express.json());

// 1. IMMEDIATE LOGGING & DEBUGGING
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] REQUEST: ${req.method} ${req.url}`);
  if (req.url === '/debug-test') {
    return res.json({ status: "Express is alive", time: new Date().toISOString() });
  }
  next();
});

// 2. API ROUTES
app.get(["/ping", "/api/ping"], (req, res) => {
  res.json({ status: "ok", path: req.url });
});

app.post(["/create-booking", "/api/create-booking"], async (req, res) => {
  try {
    const booking = { ...req.body, id: Math.random().toString(36).substr(2, 9), timestamp: Date.now(), status: "pending" };
    const data = fs.readFileSync(BOOKINGS_FILE, "utf-8");
    const bookings = JSON.parse(data);
    bookings.unshift(booking);
    fs.writeFileSync(BOOKINGS_FILE, JSON.stringify(bookings, null, 2));
    
    // Simple email notification
    if (process.env.SMTP_USER && process.env.SMTP_PASS) {
      const transporter = nodemailer.createTransport({
        host: "smtp.gmail.com", port: 465, secure: true,
        auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
      });
      transporter.sendMail({
        from: `"HBL" <${process.env.SMTP_USER}>`,
        to: "kevin.paul.brown@gmail.com",
        subject: "New Booking",
        text: `New booking from ${booking.name}`
      }).catch(console.error);
    }
    
    res.status(201).json(booking);
  } catch (e) {
    res.status(500).json({ error: "Server error" });
  }
});

app.get(["/get-bookings", "/api/get-bookings"], (req, res) => {
  try {
    const data = fs.readFileSync(BOOKINGS_FILE, "utf-8");
    res.json(JSON.parse(data));
  } catch (e) {
    res.status(500).json({ error: "Read error" });
  }
});

// 3. VITE / STATIC ASSETS
async function setupVite() {
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
    console.log(`Server running on port ${PORT}`);
  });
}

setupVite();
