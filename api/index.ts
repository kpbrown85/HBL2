import express from "express";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import nodemailer from "nodemailer";
import { createClient } from '@supabase/supabase-js';
import twilio from 'twilio';

import { v4 as uuidv4 } from 'uuid';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const BOOKINGS_FILE = path.join(__dirname, "..", "bookings.json");
const GEAR_FILE = path.join(__dirname, "..", "gear.json");

// Direct Supabase client setup to avoid path issues
const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || '';
const supabase = (supabaseUrl && supabaseAnonKey) ? createClient(supabaseUrl, supabaseAnonKey) : null;

// Twilio Setup
const twilioClient = (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN) 
  ? twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN) 
  : null;

const api = express.Router();

// Middleware to log all API requests
api.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] API Request: ${req.method} ${req.url}`);
  next();
});

api.get("/ping", (req, res) => {
  res.json({ 
    status: "ok", 
    supabase: !!supabase,
    smtp: !!(process.env.SMTP_USER && process.env.SMTP_PASS),
    timestamp: new Date().toISOString() 
  });
});

api.get("/test-api", (req, res) => {
  res.json({ ok: true, message: "API Router is working" });
});

api.get("/test-api", (req, res) => {
  res.json({ ok: true, message: "API Router is working" });
});

api.get("/test-api", (req, res) => {
  res.json({ ok: true, message: "API Router is working" });
});

api.get("/test-api", (req, res) => {
  res.json({ ok: true, message: "API Router is working" });
});

api.get("/test-api", (req, res) => {
  res.json({ ok: true, message: "API Router is working" });
});

api.get("/test-api", (req, res) => {
  res.json({ ok: true, message: "API Router is working" });
});

api.get("/test-api", (req, res) => {
  res.json({ ok: true, message: "API Router is working" });
});

api.post("/sign-waiver", async (req, res) => {
  try {
    const { id, signatureData } = req.body;
    const update = { 
      signature_data: signatureData, 
      signed_at: new Date().toISOString() 
    };

    if (supabase) {
      const { error } = await supabase.from('bookings').update(update).eq('id', id);
      if (error) throw error;
    } else {
      if (!fs.existsSync(BOOKINGS_FILE)) {
        throw new Error("No bookings found to sign. Please ensure your booking request was recorded.");
      }
      const data = fs.readFileSync(BOOKINGS_FILE, "utf-8");
      let bookings = JSON.parse(data);
      const index = bookings.findIndex((b: any) => b.id === id);
      if (index !== -1) {
        bookings[index] = { ...bookings[index], ...update };
        fs.writeFileSync(BOOKINGS_FILE, JSON.stringify(bookings, null, 2));
      } else {
        throw new Error(`Booking ID ${id} not found in local records.`);
      }
    }
    res.json({ success: true });
  } catch (e: any) {
    res.status(500).json({ error: "Signature failed", details: e.message });
  }
});

api.post("/create-booking", async (req, res) => {
  const booking = { 
    ...req.body, 
    id: uuidv4(), 
    timestamp: Date.now(), 
    status: "pending",
    isRead: false
  };

  const waiverUrl = `${process.env.APP_URL || 'https://www.helenallamas.com'}/sign/${booking.id}`;

  let dbError = null;
  let emailSent = false;

  // 1. Try Database
  try {
    if (supabase) {
      const { error } = await supabase.from('bookings').insert([{
        id: booking.id,
        name: booking.name,
        email: booking.email,
        phone: booking.phone,
        startDate: booking.startDate,
        endDate: booking.endDate,
        numLlamas: booking.numLlamas,
        trailerNeeded: booking.trailerNeeded,
        isFirstTimer: booking.isFirstTimer,
        timestamp: booking.timestamp,
        status: booking.status,
        isRead: booking.isRead
      }]);
      if (error) {
        console.error("Supabase Insert Error:", error);
        throw new Error(`Database save failed: ${error.message}. Please ensure your Supabase table has columns: id (text/uuid), name, email, phone, startDate, endDate, numLlamas, trailerNeeded, isFirstTimer, timestamp, status, isRead.`);
      }
    } else {
      let bookings = [];
      if (fs.existsSync(BOOKINGS_FILE)) {
        try {
          const data = fs.readFileSync(BOOKINGS_FILE, "utf-8");
          bookings = JSON.parse(data);
        } catch (e) {
          console.error("Error parsing bookings file, resetting:", e);
          bookings = [];
        }
      }
      bookings.unshift(booking);
      fs.writeFileSync(BOOKINGS_FILE, JSON.stringify(bookings, null, 2));
    }
  } catch (err: any) {
    console.error("Database error:", err);
    dbError = err.message || String(err);
    // If Supabase is configured, we MUST fail if the DB save fails
    if (supabase) {
      return res.status(500).json({ error: "Database save failed", details: dbError });
    }
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
          <h2 style="color: #166534; border-bottom: 2px solid #166534; padding-bottom: 10px;">New ${booking.bookingType === 'clinic' ? 'Clinic' : 'Expedition'} Request</h2>
          <p><strong>Name:</strong> ${booking.name}</p>
          <p><strong>Email:</strong> ${booking.email}</p>
          <p><strong>Phone:</strong> ${booking.phone}</p>
          <p><strong>Dates:</strong> ${booking.startDate} ${booking.bookingType === 'clinic' ? '' : `to ${booking.endDate}`}</p>
          ${booking.bookingType === 'clinic' ? '' : `<p><strong>Llamas:</strong> ${booking.numLlamas}</p>`}
          ${booking.bookingType === 'clinic' ? '' : `<p><strong>Trailer:</strong> ${booking.trailerNeeded ? 'Yes' : 'No'}</p>`}
          <p><strong>Clinic Required:</strong> ${booking.isFirstTimer ? 'Yes' : 'No'}</p>
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
          <p>Thank you for requesting a ${booking.bookingType === 'clinic' ? 'Llama Packing Clinic' : 'expedition'} with our herd! We've received your request and our team is currently reviewing the ${booking.bookingType === 'clinic' ? 'clinic schedule' : 'trail conditions and llama availability'} for your dates.</p>
          
          <div style="background: #f0fdf4; padding: 25px; border-radius: 15px; margin: 25px 0; border: 2px dashed #166534; text-align: center;">
            <h3 style="margin-top: 0; color: #166534;">MANDATORY: Sign Your Waiver</h3>
            <p>To finalize your booking, please sign the Rental Agreement and Liability Waiver electronically:</p>
            <a href="${waiverUrl}" style="display: inline-block; background: #166534; color: white; padding: 15px 30px; text-decoration: none; border-radius: 10px; font-weight: bold; font-size: 16px; margin-top: 10px;">Sign Agreement Now</a>
          </div>

          <div style="background: #f9f9f9; padding: 20px; border-radius: 10px; margin: 20px 0;">
            <h3 style="margin-top: 0; color: #166534;">Request Summary:</h3>
            <ul style="list-style: none; padding: 0;">
              <li><strong>Dates:</strong> ${booking.startDate} ${booking.bookingType === 'clinic' ? '' : `to ${booking.endDate}`}</li>
              ${booking.bookingType === 'clinic' ? '<li><strong>Type:</strong> Llama Packing Clinic Training</li>' : `
              <li><strong>Llamas:</strong> ${booking.numLlamas} Pack Animals</li>
              <li><strong>Equipment:</strong> ${booking.trailerNeeded ? 'Trailer Rental Requested' : 'Standard Gear'}</li>
              `}
            </ul>
          </div>

          <p><strong>What's Next?</strong></p>
          <p>Once your waiver is signed, we will review your request and contact you at <strong>${booking.phone}</strong> within 24-48 hours to finalize the details and discuss trail logistics.</p>
          
          <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;" />
          <p style="font-size: 12px; color: #999; text-align: center;">
            Helena Backcountry Llamas<br/>
            Helena, Montana
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

    // 3. Try SMS (Twilio)
    if (twilioClient && process.env.TWILIO_PHONE_NUMBER && booking.phone) {
      try {
        await twilioClient.messages.create({
          body: `HBL: Expedition request received for ${booking.startDate}. Please check your email to sign the mandatory waiver.`,
          from: process.env.TWILIO_PHONE_NUMBER,
          to: booking.phone
        });
      } catch (smsErr) {
        console.error("SMS Alert failed:", smsErr);
      }
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
  console.log(`[${new Date().toISOString()}] GET /get-bookings hit`);
  try {
    if (supabase) {
      const { data, error } = await supabase
        .from('bookings')
        .select('*')
        .order('timestamp', { ascending: false });
      
      if (error) {
        console.error("Supabase Fetch Error:", error);
        return res.status(500).json({ error: "Supabase fetch failed", details: error.message, hint: "Check if Row Level Security (RLS) is blocking access." });
      }
      
      console.log(`[${new Date().toISOString()}] Supabase: Fetched ${data?.length || 0} bookings`);
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

    let booking: any = null;

    if (supabase) {
      if (action === 'delete') {
        const { error } = await supabase.from('bookings').delete().eq('id', id);
        if (error) throw error;
      } else {
        // Fetch booking first to get email for notification
        const { data: existing } = await supabase.from('bookings').select('*').eq('id', id).single();
        booking = existing;
        
        const { error } = await supabase.from('bookings').update(update).eq('id', id);
        if (error) throw error;
      }
    } else {
      const data = fs.readFileSync(BOOKINGS_FILE, "utf-8");
      let bookings = JSON.parse(data);
      const index = bookings.findIndex((b: any) => b.id === id);
      if (index !== -1) {
        booking = bookings[index];
        if (action === 'delete') {
          bookings = bookings.filter((b: any) => b.id !== id);
        } else {
          bookings[index] = { ...bookings[index], ...update };
        }
        fs.writeFileSync(BOOKINGS_FILE, JSON.stringify(bookings, null, 2));
      }
    }

    // Send Approval Email if status changed to confirmed
    if (booking && (action === 'approve' || status === 'confirmed') && process.env.SMTP_USER && process.env.SMTP_PASS) {
      const transporter = nodemailer.createTransport({
        host: "smtp.gmail.com", port: 465, secure: true,
        auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
      });

      const branding = req.body.branding || {};
      const venmoHandle = branding.venmoHandle || "@helenallamas";
      const venmoLink = `https://venmo.com/u/${venmoHandle.replace('@', '')}`;
      
      // Pricing logic (matching client-side)
      const priceLlama = branding.pricePerLlamaDay || 65;
      const priceTrailer = branding.priceTrailerDay || 25;
      const priceClinic = branding.priceClinic || 75;
      
      const start = new Date(booking.startDate);
      const end = new Date(booking.endDate);
      const diffTime = Math.abs(end.getTime() - start.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) || 1;
      
      let dailyRate = priceLlama;
      if (diffDays > 5) dailyRate *= 0.85; // 15% discount for long trips

      const llamaTotal = booking.numLlamas * dailyRate * diffDays;
      const trailerTotal = booking.trailerNeeded ? (priceTrailer * diffDays) : 0;
      const clinicTotal = booking.isFirstTimer ? priceClinic : 0;
      const grandTotal = llamaTotal + trailerTotal + clinicTotal;

      const invoiceHtml = `
        <div style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e7e5e4; border-radius: 16px; overflow: hidden; background: #fff;">
          <div style="background: #166534; padding: 40px; text-align: center; color: white;">
            ${branding.logoUrl ? `<img src="${branding.logoUrl}" alt="Logo" style="height: 60px; margin-bottom: 20px; border-radius: 8px;" />` : ''}
            <h1 style="margin: 0; font-size: 28px; font-weight: 900; letter-spacing: -0.02em;">Booking Confirmed</h1>
            <p style="margin: 10px 0 0; opacity: 0.8; font-size: 14px; text-transform: uppercase; letter-spacing: 0.1em;">Invoice #${booking.id.slice(0,8).toUpperCase()}</p>
          </div>
          
          <div style="padding: 40px;">
            <p style="font-size: 16px; color: #444; margin-bottom: 30px;">Hello <strong>${booking.name}</strong>, your expedition into the Montana high country is officially scheduled. Below is your invoice and payment instructions.</p>
            
            <table style="width: 100%; border-collapse: collapse; margin-bottom: 30px;">
              <thead>
                <tr style="border-bottom: 2px solid #f5f5f4;">
                  <th style="text-align: left; padding: 12px 0; font-size: 10px; text-transform: uppercase; letter-spacing: 0.1em; color: #a8a29e;">Description</th>
                  <th style="text-align: right; padding: 12px 0; font-size: 10px; text-transform: uppercase; letter-spacing: 0.1em; color: #a8a29e;">Amount</th>
                </tr>
              </thead>
              <tbody>
                <tr style="border-bottom: 1px solid #f5f5f4;">
                  <td style="padding: 16px 0;">
                    <div style="font-weight: bold; color: #1c1917;">Llama String (${booking.numLlamas} animals)</div>
                    <div style="font-size: 12px; color: #78716c;">${diffDays} days @ $${dailyRate.toFixed(2)}/day</div>
                  </td>
                  <td style="text-align: right; font-weight: bold; color: #1c1917;">$${llamaTotal.toFixed(2)}</td>
                </tr>
                ${booking.trailerNeeded ? `
                <tr style="border-bottom: 1px solid #f5f5f4;">
                  <td style="padding: 16px 0;">
                    <div style="font-weight: bold; color: #1c1917;">Stock Trailer Rental</div>
                    <div style="font-size: 12px; color: #78716c;">${diffDays} days @ $${priceTrailer.toFixed(2)}/day</div>
                  </td>
                  <td style="text-align: right; font-weight: bold; color: #1c1917;">$${trailerTotal.toFixed(2)}</td>
                </tr>` : ''}
                ${booking.isFirstTimer ? `
                <tr style="border-bottom: 1px solid #f5f5f4;">
                  <td style="padding: 16px 0;">
                    <div style="font-weight: bold; color: #1c1917;">Backcountry Pack Clinic</div>
                    <div style="font-size: 12px; color: #78716c;">Mandatory for first-time packers</div>
                  </td>
                  <td style="text-align: right; font-weight: bold; color: #1c1917;">$${priceClinic.toFixed(2)}</td>
                </tr>` : ''}
                <tr>
                  <td style="padding: 24px 0; font-size: 18px; font-weight: 900; color: #1c1917;">Total Due</td>
                  <td style="padding: 24px 0; text-align: right; font-size: 24px; font-weight: 900; color: #166534;">$${grandTotal.toFixed(2)}</td>
                </tr>
              </tbody>
            </table>

            <div style="background: #f0fdf4; border: 1px solid #dcfce7; border-radius: 12px; padding: 24px; text-align: center;">
              <h3 style="margin: 0 0 12px; color: #166534; font-size: 14px; text-transform: uppercase; letter-spacing: 0.1em;">Payment via Venmo</h3>
              <p style="margin: 0 0 20px; font-size: 14px; color: #166534;">Please send payment to <strong>${venmoHandle}</strong> to secure your dates.</p>
              <a href="${venmoLink}" style="display: inline-block; background: #008CFF; color: white; padding: 14px 32px; text-decoration: none; border-radius: 12px; font-weight: 900; font-size: 16px; box-shadow: 0 4px 12px rgba(0,140,255,0.3);">Pay with Venmo</a>
            </div>
          </div>
          
          <div style="background: #fafaf9; padding: 30px; text-align: center; border-top: 1px solid #e7e5e4;">
            <p style="margin: 0; font-size: 12px; color: #a8a29e;">&copy; ${new Date().getFullYear()} ${branding.siteName || 'Helena Backcountry Llamas'}</p>
            <p style="margin: 5px 0 0; font-size: 10px; color: #d6d3d1; text-transform: uppercase; letter-spacing: 0.1em;">Grounding: Helena National Forest, Montana</p>
          </div>
        </div>
      `;

      await transporter.sendMail({
        from: `"Helena Backcountry Llamas" <${process.env.SMTP_USER}>`,
        to: booking.email,
        subject: `Booking Confirmed & Invoice: ${booking.startDate} Expedition`,
        html: invoiceHtml
      }).catch(err => console.error("Approval email failed:", err));

      // Send SMS Approval Alert
      if (twilioClient && process.env.TWILIO_PHONE_NUMBER && booking.phone) {
        try {
          await twilioClient.messages.create({
            body: `HBL: Your expedition for ${booking.startDate} is CONFIRMED! Check your email for the invoice and payment link.`,
            from: process.env.TWILIO_PHONE_NUMBER,
            to: booking.phone
          });
        } catch (smsErr) {
          console.error("SMS Approval Alert failed:", smsErr);
        }
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
  
  api.get("/get-gear", async (req, res) => {
    try {
      if (supabase) {
        const { data, error } = await supabase
          .from('gear')
          .select('*')
          .order('name', { ascending: true });
        if (error) throw error;
        res.json(data || []);
      } else {
        const data = fs.existsSync(GEAR_FILE) ? fs.readFileSync(GEAR_FILE, "utf-8") : "[]";
        res.json(JSON.parse(data));
      }
    } catch (e: any) {
      console.error("Gear fetch error:", e);
      res.status(500).json({ error: "Failed to load gear", details: e.message });
    }
  });
  
  api.post("/save-gear", async (req, res) => {
    try {
      const { gear } = req.body;
      if (supabase) {
        await supabase.from('gear').delete().neq('id', '00000000-0000-0000-0000-000000000000');
        const { error } = await supabase.from('gear').insert(gear.map((item: any) => ({
          id: item.id,
          name: item.name,
          category: item.category,
          price: item.price,
          description: item.description,
          imageUrl: item.imageUrl
        })));
        if (error) throw error;
      } else {
        fs.writeFileSync(GEAR_FILE, JSON.stringify(gear, null, 2));
      }
      res.json({ success: true });
    } catch (e: any) {
      console.error("Gear save error:", e);
      res.status(500).json({ error: "Failed to save gear", details: e.message });
    }
  });

export { api };
export default api;
