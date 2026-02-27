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

const api = express.Router();

// Middleware to identify the API
api.use((req, res, next) => {
  res.setHeader("X-HBL-API", "Active-V5");
  next();
});

api.get("/ping", (req, res) => {
  res.json({ status: "ok", version: "V5", timestamp: new Date().toISOString() });
});

api.get("/debug-test", (req, res) => {
  res.json({ status: "V5-DEBUG-OK", path: req.url });
});

api.post("/create-booking", async (req, res) => {
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

api.get("/get-bookings", (req, res) => {
  try {
    const data = fs.readFileSync(BOOKINGS_FILE, "utf-8");
    res.json(JSON.parse(data));
  } catch (e) {
    res.status(500).json({ error: "Failed to load bookings" });
  }
});

export default api;
