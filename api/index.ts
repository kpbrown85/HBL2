import express from "express";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import nodemailer from "nodemailer";
import { createClient } from '@supabase/supabase-js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const BOOKINGS_FILE = path.join(__dirname, "..", "bookings.json");

// Direct Supabase client setup to avoid path issues
const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || '';
const supabase = (supabaseUrl && supabaseAnonKey) ? createClient(supabaseUrl, supabaseAnonKey) : null;

const app = express();
app.use(express.json());

const api = express.Router();

api.get("/ping", (req, res) => {
  res.json({ 
    status: "ok", 
    supabase: !!supabase,
    smtp: !!(process.env.SMTP_USER && process.env.SMTP_PASS),
    timestamp: new Date().toISOString() 
  });
});

api.post("/create-booking", async (req, res) => {
  const booking = { 
    ...req.body, 
    id: Math.random().toString(36).substr(2, 9), 
    timestamp: Date.now(), 
    status: "pending",
    isRead: false
  };

  let dbError = null;
  let emailSent = false;

  // 1. Try Database
  try {
    if (supabase) {
      const { error } = await supabase.from('bookings').insert([booking]);
      if (error) throw error;
    } else {
      const data = fs.existsSync(BOOKINGS_FILE) ? fs.readFileSync(BOOKINGS_FILE, "utf-8") : "[]";
      const bookings = JSON.parse(data);
      bookings.unshift(booking);
      fs.writeFileSync(BOOKINGS_FILE, JSON.stringify(bookings, null, 2));
    }
  } catch (err: any) {
    console.error("Database error:", err);
    dbError = err.message || String(err);
  }

  // 2. Try Email (Always attempt)
  try {
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
          <p><strong>Trailer:</strong> ${booking.trailerNeeded ? 'Yes' : 'No'}</p>
          <p><strong>Clinic:</strong> ${booking.isFirstTimer ? 'Yes' : 'No'}</p>
          ${dbError ? `<p style="color: red;"><strong>Note:</strong> Database save failed, but request was captured via email.</p>` : ''}
          <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
          <a href="https://www.helenallamas.com/admin" style="display: inline-block; background: #166534; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; font-weight: bold;">View Dashboard</a>
        </div>
      `;

      await transporter.sendMail({
        from: `"HBL Notifications" <${process.env.SMTP_USER}>`,
        to: "kevin.paul.brown@gmail.com",
        subject: `New Booking: ${booking.name}`,
        html: emailHtml
      });
      emailSent = true;
    }
  } catch (err) {
    console.error("Email error:", err);
  }

  // Respond with success if at least one method worked
  if (!dbError || emailSent) {
    res.status(201).json({ ...booking, _diagnostics: { dbError, emailSent } });
  } else {
    res.status(500).json({ error: "Booking failed completely", dbError });
  }
});

api.get("/get-bookings", async (req, res) => {
  try {
    if (supabase) {
      const { data, error } = await supabase
        .from('bookings')
        .select('*')
        .order('timestamp', { ascending: false });
      if (error) throw error;
      res.json(data || []);
    } else {
      const data = fs.existsSync(BOOKINGS_FILE) ? fs.readFileSync(BOOKINGS_FILE, "utf-8") : "[]";
      res.json(JSON.parse(data));
    }
  } catch (e: any) {
    console.error("Fetch error:", e);
    res.status(500).json({ error: "Failed to load bookings", details: e.message });
  }
});

api.post("/update-booking", async (req, res) => {
  try {
    const { id, action, status, isRead } = req.body;
    const update: any = {};
    if (action === 'approve' || status === 'confirmed') update.status = 'confirmed';
    if (action === 'reject' || status === 'canceled') update.status = 'canceled';
    if (action === 'markRead' || isRead) update.isRead = true;

    if (supabase) {
      if (action === 'delete') {
        const { error } = await supabase.from('bookings').delete().eq('id', id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('bookings').update(update).eq('id', id);
        if (error) throw error;
      }
    } else {
      const data = fs.readFileSync(BOOKINGS_FILE, "utf-8");
      let bookings = JSON.parse(data);
      const index = bookings.findIndex((b: any) => b.id === id);
      if (index !== -1) {
        if (action === 'delete') {
          bookings = bookings.filter((b: any) => b.id !== id);
        } else {
          bookings[index] = { ...bookings[index], ...update };
        }
        fs.writeFileSync(BOOKINGS_FILE, JSON.stringify(bookings, null, 2));
      }
    }
    res.json({ success: true });
  } catch (e: any) {
    res.status(500).json({ error: "Update failed", details: e.message });
  }
});

app.use("/api", api);
app.use("/", api);

export default app;
