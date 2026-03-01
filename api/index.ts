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
      
      // ADMIN NOTIFICATION
      const adminHtml = `
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
        html: adminHtml
      });

      // CUSTOMER CONFIRMATION
      const customerHtml = `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #eee; padding: 30px; border-radius: 15px; color: #333;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #166534; margin: 0;">Helena Backcountry Llamas</h1>
            <p style="color: #666; font-style: italic;">Your High Country Adventure Starts Here</p>
          </div>
          <p>Hi ${booking.name},</p>
          <p>Thank you for requesting an expedition with our herd! We've received your request and our team is currently reviewing the trail conditions and llama availability for your dates.</p>
          
          <div style="background: #f9f9f9; padding: 20px; border-radius: 10px; margin: 20px 0;">
            <h3 style="margin-top: 0; color: #166534;">Request Summary:</h3>
            <ul style="list-style: none; padding: 0;">
              <li><strong>Dates:</strong> ${booking.startDate} to ${booking.endDate}</li>
              <li><strong>Llamas:</strong> ${booking.numLlamas} Pack Animals</li>
              <li><strong>Equipment:</strong> ${booking.trailerNeeded ? 'Trailer Rental Requested' : 'Standard Gear'}</li>
            </ul>
          </div>

          <p><strong>What's Next?</strong></p>
          <p>We will review your request and contact you at <strong>${booking.phone}</strong> within 24-48 hours to finalize the details and discuss trail logistics.</p>
          
          <p>In the meantime, feel free to check out our <a href="https://www.helenallamas.com/#gallery" style="color: #166534; font-weight: bold;">Journal</a> for inspiration from recent trips.</p>
          
          <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;" />
          <p style="font-size: 12px; color: #999; text-align: center;">
            Helena Backcountry Llamas<br/>
            Helena, Montana<br/>
            <em>"The ultimate backcountry companion."</em>
          </p>
        </div>
      `;

      await transporter.sendMail({
        from: `"Helena Backcountry Llamas" <${process.env.SMTP_USER}>`,
        to: booking.email,
        subject: `Expedition Request Received: ${booking.startDate}`,
        html: customerHtml
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

api.get("/get-gallery", async (req, res) => {
  try {
    if (supabase) {
      const { data, error } = await supabase
        .from('gallery')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      res.json(data || []);
    } else {
      res.json([]);
    }
  } catch (e: any) {
    console.error("Gallery fetch error:", e);
    res.status(500).json({ error: "Failed to load gallery", details: e.message });
  }
});

api.post("/save-gallery", async (req, res) => {
  try {
    const { gallery } = req.body;
    if (supabase) {
      // For simplicity, we'll replace the gallery content
      // In a real app, we'd do incremental updates, but this matches the current localStorage logic
      await supabase.from('gallery').delete().neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all
      const { error } = await supabase.from('gallery').insert(gallery.map((img: any) => ({
        url: img.url,
        caption: img.caption
      })));
      if (error) throw error;
    }
    res.json({ success: true });
  } catch (e: any) {
    console.error("Gallery save error:", e);
    res.status(500).json({ error: "Failed to save gallery", details: e.message });
  }
});

app.use("/api", api);
app.use("/", api);

export default app;
