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
  const supabaseSet = !!(process.env.SUPABASE_URL && process.env.SUPABASE_ANON_KEY);
  const smtpSet = !!(process.env.SMTP_USER && process.env.SMTP_PASS);
  
  res.json({ 
    status: "ok", 
    mode: supabaseSet ? "supabase" : "local", 
    diagnostics: {
      supabase: supabaseSet,
      smtp: smtpSet,
      node_env: process.env.NODE_ENV
    },
    timestamp: new Date().toISOString() 
  });
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

    let savedTo = "local";

    // 1. Try Supabase first
    if (process.env.SUPABASE_URL && process.env.SUPABASE_ANON_KEY) {
      const { error } = await supabase
        .from('bookings')
        .insert([booking]);
      
      if (error) {
        console.error("Supabase insert error:", error);
        throw error;
      }
      savedTo = "supabase";
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
      
      const emailHtml = `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #eee; padding: 20px; border-radius: 10px;">
          <h2 style="color: #166534; border-bottom: 2px solid #166534; padding-bottom: 10px;">New Expedition Request</h2>
          <p><strong>Name:</strong> ${booking.name}</p>
          <p><strong>Email:</strong> ${booking.email}</p>
          <p><strong>Phone:</strong> ${booking.phone}</p>
          <p><strong>Dates:</strong> ${booking.startDate} to ${booking.endDate}</p>
          <p><strong>Llamas:</strong> ${booking.numLlamas}</p>
          <p><strong>Trailer Needed:</strong> ${booking.trailerNeeded ? 'Yes' : 'No'}</p>
          <p><strong>First Timer:</strong> ${booking.isFirstTimer ? 'Yes' : 'No'}</p>
          <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
          <p style="font-size: 12px; color: #666;">Stored in: ${savedTo}</p>
          <a href="https://www.helenallamas.com/admin" style="display: inline-block; background: #166534; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; font-weight: bold;">View Dashboard</a>
        </div>
      `;

      transporter.sendMail({
        from: `"HBL Notifications" <${process.env.SMTP_USER}>`,
        to: "kevin.paul.brown@gmail.com",
        subject: `New Booking: ${booking.name}`,
        html: emailHtml
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
    const { id, action, status, isRead } = req.body;
    const effectiveAction = action || (status === 'confirmed' ? 'approve' : status === 'canceled' ? 'reject' : null);

    if (process.env.SUPABASE_URL && process.env.SUPABASE_ANON_KEY) {
      if (effectiveAction === 'delete') {
        const { error } = await supabase.from('bookings').delete().eq('id', id);
        if (error) throw error;
      } else {
        const update: any = {};
        if (effectiveAction === 'approve' || status === 'confirmed') update.status = 'confirmed';
        if (effectiveAction === 'reject' || status === 'canceled') update.status = 'canceled';
        if (effectiveAction === 'markRead' || isRead) update.isRead = true;
        
        const { error } = await supabase.from('bookings').update(update).eq('id', id);
        if (error) throw error;
      }
      res.json({ success: true });
    } else {
      const data = fs.readFileSync(BOOKINGS_FILE, "utf-8");
      let bookings = JSON.parse(data);
      const index = bookings.findIndex((b: any) => b.id === id);
      if (index !== -1) {
        if (effectiveAction === 'approve' || status === 'confirmed') bookings[index].status = 'confirmed';
        if (effectiveAction === 'reject' || status === 'canceled') bookings[index].status = 'canceled';
        if (effectiveAction === 'delete') {
          bookings = bookings.filter((b: any) => b.id !== id);
        } else if (effectiveAction === 'markRead' || isRead) {
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
