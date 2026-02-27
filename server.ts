import express from "express";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import nodemailer from "nodemailer";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const BOOKINGS_FILE = path.join(__dirname, "bookings.json");

// Initialize bookings file if it doesn't exist
if (!fs.existsSync(BOOKINGS_FILE)) {
  fs.writeFileSync(BOOKINGS_FILE, JSON.stringify([]));
}

// Email Transporter Configuration
const getTransporter = () => {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST || "smtp.gmail.com",
    port: parseInt(process.env.SMTP_PORT || "465"),
    secure: true,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
};

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // 1. PRIMARY API ROUTES (Defined first for maximum priority)
  
  // Health checks
  app.get(["/ping", "/api/ping", "/health"], (req, res) => {
    console.log(`[${new Date().toISOString()}] Ping received: ${req.method} ${req.url}`);
    res.json({ 
      status: "ok", 
      msg: "Server is alive",
      timestamp: new Date().toISOString(),
      url: req.url
    });
  });

  app.post(["/ping", "/api/ping"], (req, res) => {
    console.log(`[${new Date().toISOString()}] POST Ping received: ${req.url}`);
    res.json({ status: "ok", received: req.body });
  });

  // Booking routes
  app.get(["/get-bookings", "/api/get-bookings", "/api/bookings"], (req, res) => {
    try {
      const data = fs.readFileSync(BOOKINGS_FILE, "utf-8");
      res.json(JSON.parse(data));
    } catch (error) {
      res.status(500).json({ error: "Failed to read bookings" });
    }
  });

  app.post(["/create-booking", "/api/create-booking", "/api/bookings"], async (req, res) => {
    const booking = req.body;
    booking.id = Math.random().toString(36).substr(2, 9);
    booking.timestamp = Date.now();
    booking.status = "pending";
    booking.isRead = false;

    console.log(`[${new Date().toISOString()}] Server: New booking for ${booking.name}`);

    try {
      const data = fs.readFileSync(BOOKINGS_FILE, "utf-8");
      const bookings = JSON.parse(data);
      bookings.unshift(booking);
      fs.writeFileSync(BOOKINGS_FILE, JSON.stringify(bookings, null, 2));

      // Email (Non-blocking)
      const adminEmail = "kevin.paul.brown@gmail.com";
      if (process.env.SMTP_USER && process.env.SMTP_PASS) {
        const transporter = getTransporter();
        transporter.sendMail({
          from: `"HBL" <${process.env.SMTP_USER}>`,
          to: adminEmail,
          subject: `NEW BOOKING: ${booking.name}`,
          text: `New booking from ${booking.name} for ${booking.startDate}. View in dashboard.`
        }).catch(e => console.error("Email fail:", e));
      }

      res.status(201).json(booking);
    } catch (error) {
      res.status(500).json({ error: "Failed to process booking" });
    }
  });

  app.post(["/update-booking", "/api/update-booking"], (req, res) => {
    const { id, ...updates } = req.body;
    try {
      const data = fs.readFileSync(BOOKINGS_FILE, "utf-8");
      let bookings = JSON.parse(data);
      const index = bookings.findIndex((b: any) => b.id === id);
      if (index !== -1) {
        bookings[index] = { ...bookings[index], ...updates };
        fs.writeFileSync(BOOKINGS_FILE, JSON.stringify(bookings, null, 2));
        res.json({ success: true });
      } else {
        res.status(404).json({ error: "Not found" });
      }
    } catch (error) {
      res.status(500).json({ error: "Update failed" });
    }
  });

  app.post(["/delete-booking", "/api/delete-booking"], (req, res) => {
    const { id } = req.body;
    try {
      const data = fs.readFileSync(BOOKINGS_FILE, "utf-8");
      let bookings = JSON.parse(data);
      const initialLength = bookings.length;
      bookings = bookings.filter((b: any) => b.id !== id);
      if (bookings.length !== initialLength) {
        fs.writeFileSync(BOOKINGS_FILE, JSON.stringify(bookings, null, 2));
        res.json({ success: true });
      } else {
        res.status(404).json({ error: "Not found" });
      }
    } catch (error) {
      res.status(500).json({ error: "Delete failed" });
    }
  });

  // 2. MIDDLEWARES & STATIC ASSETS
  
  app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
    next();
  });

  // API Catch-all (JSON 404)
  app.all("/api/*", (req, res) => {
    console.warn(`[${new Date().toISOString()}] API 404: ${req.method} ${req.url}`);
    res.status(404).json({ 
      error: "API route not found", 
      method: req.method, 
      url: req.url,
      timestamp: new Date().toISOString()
    });
  });

  // Vite middleware for development
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

  // Final Fallthrough 404
  app.use((req, res) => {
    console.error(`[${new Date().toISOString()}] Global 404 Fallthrough: ${req.method} ${req.url}`);
    res.status(404).json({ 
      code: "404", 
      message: "The page could not be found",
      detail: "This is the Express final fallthrough 404",
      path: req.url
    });
  });

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
