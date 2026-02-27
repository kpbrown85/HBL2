import express from "express";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import nodemailer from "nodemailer";
import { supabase } from "../src/services/supabase.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const BOOKINGS_FILE = path.join(__dirname, "..", "bookings.json");

const app = express();
app.use(express.json());

const api = express.Router();

api.get("/ping", (req, res) => {
  res.json({ status: "ok", mode: process.env.SUPABASE_URL ? "supabase" : "local", timestamp: new Date().toISOString() });
});

api.post("/create-booking", async (req, res) => {
  try {
    const booking = { 
      ...req.body, 
      id: Math.random().toString(36).substr(2, 9), 
      timestamp: Date.now(), 
      status: "pending",
      isRead: false
    };

    // 1. Try Supabase first
    if (process.env.SUPABASE_URL && process.env.SUPABASE_ANON_KEY) {
      const { error } = await supabase
        .from('bookings')
        .insert([booking]);
      
      if (error) throw error;
    } else {
      // 2. Fallback to local file (AI Studio dev mode)
      const data = fs.existsSync(BOOKINGS_FILE) ? fs.readFileSync(BOOKINGS_FILE, "utf-8") : "[]";
      const bookings = JSON.parse(data);
      bookings.unshift(booking);
      fs.writeFileSync(BOOKINGS_FILE, JSON.stringify(bookings, null, 2));
    }
    
    // Email notification
    if (process.env.SMTP_USER && process.env.SMTP_PASS) {
      const transporter = nodemailer.createTransport({
        host: "smtp.gmail.com", port: 465, secure: true,
        auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
      });
      transporter.sendMail({
        from: `"HBL" <${process.env.SMTP_USER}>`,
        to: "kevin.paul.brown@gmail.com",
        subject: "New Booking Request",
        text: `New booking from ${booking.name}. Check your dashboard for details.`
      }).catch(err => console.error("Email error:", err));
    }
    
    res.status(201).json(booking);
  } catch (e: any) {
    console.error("Booking error:", e);
    res.status(500).json({ error: "Booking failed", details: e.message });
  }
});

api.get("/get-bookings", async (req, res) => {
  try {
    if (process.env.SUPABASE_URL && process.env.SUPABASE_ANON_KEY) {
      const { data, error } = await supabase
        .from('bookings')
        .select('*')
        .order('timestamp', { ascending: false });
      
      if (error) throw error;
      res.json(data);
    } else {
      const data = fs.existsSync(BOOKINGS_FILE) ? fs.readFileSync(BOOKINGS_FILE, "utf-8") : "[]";
      res.json(JSON.parse(data));
    }
  } catch (e) {
    res.status(500).json({ error: "Failed to load bookings" });
  }
});

api.post("/update-booking", async (req, res) => {
  try {
    const { id, action } = req.body;

    if (process.env.SUPABASE_URL && process.env.SUPABASE_ANON_KEY) {
      if (action === 'delete') {
        const { error } = await supabase.from('bookings').delete().eq('id', id);
        if (error) throw error;
      } else {
        const update: any = {};
        if (action === 'approve') update.status = 'approved';
        if (action === 'reject') update.status = 'rejected';
        if (action === 'markRead') update.isRead = true;
        
        const { error } = await supabase.from('bookings').update(update).eq('id', id);
        if (error) throw error;
      }
      res.json({ success: true });
    } else {
      const data = fs.readFileSync(BOOKINGS_FILE, "utf-8");
      let bookings = JSON.parse(data);
      const index = bookings.findIndex((b: any) => b.id === id);
      if (index !== -1) {
        if (action === 'approve') bookings[index].status = 'approved';
        if (action === 'reject') bookings[index].status = 'rejected';
        if (action === 'delete') {
          bookings = bookings.filter((b: any) => b.id !== id);
        } else if (action === 'markRead') {
          bookings[index].isRead = true;
        }
        fs.writeFileSync(BOOKINGS_FILE, JSON.stringify(bookings, null, 2));
        res.json({ success: true });
      } else {
        res.status(404).json({ error: "Booking not found" });
      }
    }
  } catch (e) {
    res.status(500).json({ error: "Update failed" });
  }
});

app.use("/api", api);
app.use("/", api);

export default app;
