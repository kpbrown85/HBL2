import express from "express";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { Resend } from 'resend';
import { createClient } from '@supabase/supabase-js';
import twilio from 'twilio';

import { v4 as uuidv4 } from 'uuid';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const BOOKINGS_FILE = path.join(__dirname, "..", "bookings.json");
const GEAR_FILE = path.join(__dirname, "..", "gear.json");
const LLAMAS_FILE = path.join(__dirname, "..", "llamas.json");
const BRANDING_FILE = path.join(__dirname, "..", "branding.json");
const GALLERY_FILE = path.join(__dirname, "..", "gallery.json");

// Ensure data files exist
[BOOKINGS_FILE, GEAR_FILE, LLAMAS_FILE, BRANDING_FILE, GALLERY_FILE].forEach(file => {
  if (!fs.existsSync(file)) {
    try {
      fs.writeFileSync(file, JSON.stringify(file === BRANDING_FILE ? {} : [], null, 2));
      console.log(`[${new Date().toISOString()}] Created missing data file: ${file}`);
    } catch (e) {
      console.error(`[${new Date().toISOString()}] Failed to create data file: ${file}`, e);
    }
  }
});

// DEBUG: Write env keys to a file for inspection
try {
  const resendKey = process.env.RESEND_API_KEY;
  const debugData = [
    `RESEND_API_KEY present: ${!!resendKey}`,
    `RESEND_API_KEY length: ${resendKey?.length || 0}`,
    `RESEND_API_KEY prefix: ${resendKey ? resendKey.substring(0, 3) : 'none'}`,
    `All Keys:`,
    ...Object.keys(process.env).sort()
  ].join("\n");
  fs.writeFileSync(path.join(__dirname, "..", "env_debug.txt"), debugData);
} catch (e) {}

// Direct Supabase client setup to avoid path issues
const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || '';
let supabase: any = null;
try {
  if (supabaseUrl && supabaseAnonKey) {
    supabase = createClient(supabaseUrl, supabaseAnonKey);
  }
} catch (e) {
  console.error("Supabase initialization failed:", e);
}

// Twilio Setup
const twilioClient = (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN) 
  ? twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN) 
  : null;

// Email Helper
const getResendApiKey = () => {
  const key = (process.env.RESEND_API_KEY || process.env.VITE_RESEND_API_KEY || process.env.RESEND_KEY || process.env.RESEND_TOKEN)?.trim();
  if (!key) {
    const allKeys = Object.keys(process.env);
    const resendRelated = allKeys.filter(k => k.toLowerCase().includes('resend'));
    if (resendRelated.length > 0) {
      console.log(`[${new Date().toISOString()}] RESEND_API_KEY missing, but found related keys: ${resendRelated.join(', ')}`);
    }
  }
  return key;
};

const getResendClient = () => {
  const apiKey = getResendApiKey();
  if (!apiKey) return null;
  return new Resend(apiKey);
};

const api = express();
api.use(express.json({ limit: '50mb' }));
api.use(express.urlencoded({ limit: '50mb', extended: true }));

// Version for deployment verification
const API_VERSION = "1.0.6";

// Path normalization for Vercel rewrites
api.use((req, res, next) => {
  res.setHeader("X-API-Version", API_VERSION);
  console.log(`[${new Date().toISOString()}] API Request: ${req.method} ${req.url} (v${API_VERSION})`);
  
  // If mounted at /api, req.url is already relative. 
  // But if called directly (e.g. Vercel), it might start with /api
  if (req.url.startsWith('/api')) {
    req.url = req.url.replace('/api', '') || '/';
  }
  next();
});

console.log(`[${new Date().toISOString()}] API App Initialized`);

// Debug state to track initialization
const debugInfo = {
  initialized: true,
  supabaseConfigured: !!(process.env.SUPABASE_URL && process.env.SUPABASE_ANON_KEY),
  supabaseActive: !!supabase,
  resendConfigured: !!getResendApiKey(),
  bookingsFile: BOOKINGS_FILE,
  gearFile: GEAR_FILE,
  env: {
    NODE_ENV: process.env.NODE_ENV,
    PORT: process.env.PORT
  }
};

console.log(`[${new Date().toISOString()}] API App Initialized. Resend: ${!!getResendApiKey() ? 'CONFIGURED' : 'MISSING'}`);

// Middleware to log all API requests
api.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] API Request: ${req.method} ${req.url}`);
  next();
});

api.get("/health", (req, res) => {
  res.json({ 
    status: "ok", 
    message: "API Router is healthy", 
    resend: !!getResendApiKey(),
    timestamp: new Date().toISOString() 
  });
});

api.get("/debug", (req, res) => {
  res.json(debugInfo);
});

api.get("/debug-env-keys", (req, res) => {
  const allKeys = Object.keys(process.env);
  res.json({ 
    keys: allKeys.sort(),
    count: allKeys.length,
    timestamp: new Date().toISOString()
  });
});

api.get("/debug-env", (req, res) => {
  const allKeys = Object.keys(process.env);
  const resendRelated = allKeys.filter(k => k.toLowerCase().includes('resend'));
  const key = getResendApiKey();
  
  res.json({ 
    resendPresent: !!key,
    resendLength: key?.length || 0,
    resendPrefix: key ? key.substring(0, 3) + "..." : "none",
    resendRelatedKeys: resendRelated,
    supabasePresent: !!process.env.SUPABASE_URL,
    allKeysCount: allKeys.length,
    nodeEnv: process.env.NODE_ENV,
    cwd: process.cwd(),
    timestamp: new Date().toISOString()
  });
});

api.get("/ping", (req, res) => {
  const resendKey = getResendApiKey();
  const allKeys = Object.keys(process.env);
  const resendRelated = allKeys.filter(k => k.toLowerCase().includes('resend'));
  
  console.log(`[${new Date().toISOString()}] Ping received. Resend key present: ${!!resendKey}, length: ${resendKey?.length || 0}`);
  res.json({ 
    status: "ok", 
    supabase: !!supabase,
    resend: !!resendKey,
    resendRelated: resendRelated,
    resendLength: resendKey?.length || 0,
    resendPrefix: resendKey ? resendKey.substring(0, 3) : null,
    timestamp: new Date().toISOString() 
  });
});

api.get("/test-supabase", async (req, res) => {
  if (!supabase) {
    return res.json({ status: "error", message: "Supabase not configured. Please set SUPABASE_URL and SUPABASE_ANON_KEY environment variables." });
  }
  try {
    const tables = ['gear', 'llamas', 'branding', 'gallery', 'bookings'];
    const results: any = {};
    
    for (const table of tables) {
      const { error } = await supabase.from(table).select('count', { count: 'exact', head: true });
      results[table] = error ? { status: "missing", error: error.message } : { status: "ok" };
    }
    
    // Specifically check for new columns in bookings table
    if (results['bookings'].status === "ok") {
      const { error: columnError } = await supabase.from('bookings').select('bookingType, totalPrice').limit(1);
      if (columnError) {
        results['bookings'] = { 
          status: "outdated", 
          error: "Missing required columns: bookingType or totalPrice",
          details: columnError.message
        };
      }
    }
    
    const missingTables = Object.entries(results).filter(([_, v]: any) => v.status === "missing").map(([k]) => k);
    const outdatedTables = Object.entries(results).filter(([_, v]: any) => v.status === "outdated").map(([k]) => k);
    
    if (missingTables.length > 0 || outdatedTables.length > 0) {
      let message = "";
      if (missingTables.length > 0) message += `Some tables are missing: ${missingTables.join(', ')}. `;
      if (outdatedTables.length > 0) message += `Some tables are missing required columns: ${outdatedTables.join(', ')}. `;
      
      res.json({ 
        status: "partial", 
        message: message.trim(),
        details: "You need to update your Supabase schema. I can provide the SQL script for you.",
        results 
      });
    } else {
      res.json({ status: "ok", message: "All Supabase tables and columns are correctly configured!", results });
    }
  } catch (e: any) {
    res.status(500).json({ status: "error", message: "Supabase connection failed", details: e.message || JSON.stringify(e) });
  }
});


const sendEmail = async (options: { to: string, subject: string, html: string, fromName?: string }) => {
  const resend = getResendClient();
  if (!resend) {
    console.error("Email failed: RESEND_API_KEY not configured");
    throw new Error("Email provider not configured");
  }

  console.log(`Attempting to send email via Resend to ${options.to}...`);
  try {
    const { data, error } = await resend.emails.send({
      from: `${options.fromName || 'HBL Notifications'} <onboarding@resend.dev>`, // Default Resend domain
      to: options.to,
      subject: options.subject,
      html: options.html,
    });
    
    if (error) throw error;
    console.log(`Email sent via Resend! ID: ${data?.id}`);
    return data;
  } catch (error: any) {
    console.error(`Email failed via Resend to ${options.to}:`, error);
    throw error;
  }
};

api.get("/test-email", async (req, res) => {
  try {
    const resendKey = getResendApiKey();
    
    if (!resendKey) {
      return res.json({ 
        status: "error", 
        message: "Resend API Key missing",
        details: "Please set RESEND_API_KEY in environment variables."
      });
    }
    
    await sendEmail({
      to: process.env.ADMIN_EMAIL || "kevin.paul.brown@gmail.com",
      subject: "HBL Email System Test",
      html: `
        <div style="font-family: sans-serif; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
          <h2 style="color: #0B1D21;">Email System Test Successful!</h2>
          <p>Your Resend configuration is working correctly.</p>
          <p>Timestamp: ${new Date().toISOString()}</p>
          <p>If you received this, your email system is fully operational.</p>
        </div>
      `
    });
    
    res.json({ status: "ok", message: `Test email sent to ${process.env.ADMIN_EMAIL || "kevin.paul.brown@gmail.com"}` });
  } catch (e: any) {
    console.error("Email test failed:", e);
    res.status(500).json({ 
      status: "error", 
      message: "Email test failed", 
      details: e.message,
      code: e.code,
      diagnostics: {
        hasResendKey: !!getResendApiKey()
      }
    });
  }
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
    id: req.body.id || uuidv4(), 
    timestamp: req.body.timestamp || Date.now(), 
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
        uid: booking.uid || 'guest',
        name: booking.name,
        email: booking.email,
        phone: booking.phone,
        startDate: booking.startDate,
        endDate: booking.endDate,
        numLlamas: booking.numLlamas,
        trailerNeeded: booking.trailerNeeded,
        isFirstTimer: booking.isFirstTimer,
        bookingType: booking.bookingType,
        totalPrice: booking.totalPrice,
        depositPaid: booking.depositPaid || 0,
        totalPaid: booking.totalPaid || 0,
        timestamp: booking.timestamp,
        status: booking.status,
        isRead: booking.isRead
      }]);
      if (error) {
        console.error("Supabase Insert Error:", error);
        const sqlFix = `ALTER TABLE bookings ADD COLUMN IF NOT EXISTS "bookingType" TEXT; ALTER TABLE bookings ADD COLUMN IF NOT EXISTS "totalPrice" NUMERIC; ALTER TABLE bookings ADD COLUMN IF NOT EXISTS "depositPaid" NUMERIC DEFAULT 0; ALTER TABLE bookings ADD COLUMN IF NOT EXISTS "totalPaid" NUMERIC DEFAULT 0;`;
        throw new Error(`Database save failed: ${error.message}. Please run this SQL in your Supabase SQL Editor: ${sqlFix}`);
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
    if (getResendApiKey()) {
      // ADMIN NOTIFICATION
      const adminHtml = `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #eee; padding: 20px; border-radius: 10px;">
          <h2 style="color: #0B1D21; border-bottom: 2px solid #0B1D21; padding-bottom: 10px;">New ${booking.bookingType === 'clinic' ? 'Clinic' : 'Expedition'} Request</h2>
          <p><strong>Name:</strong> ${booking.name}</p>
          <p><strong>Email:</strong> ${booking.email}</p>
          <p><strong>Phone:</strong> ${booking.phone}</p>
          <p><strong>Dates:</strong> ${booking.startDate} ${booking.bookingType === 'clinic' ? '' : `to ${booking.endDate}`}</p>
          ${booking.bookingType === 'clinic' ? '' : `<p><strong>Llamas:</strong> ${booking.numLlamas}</p>`}
          ${booking.bookingType === 'clinic' ? '' : `<p><strong>Trailer:</strong> ${booking.trailerNeeded ? 'Yes' : 'No'}</p>`}
          <p><strong>Clinic Required:</strong> ${booking.isFirstTimer ? 'Yes' : 'No'}</p>
          ${dbError ? `<p style="color: red;"><strong>Note:</strong> Database save failed, but request was captured via email.</p>` : ''}
          <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
          <a href="${process.env.APP_URL || 'https://www.helenallamas.com'}/admin" style="display: inline-block; background: #0B1D21; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; font-weight: bold;">View Dashboard</a>
        </div>
      `;

      await sendEmail({
        to: process.env.ADMIN_EMAIL || "kevin.paul.brown@gmail.com",
        subject: `New Booking: ${booking.name}`,
        html: adminHtml,
        fromName: "HBL Notifications"
      });

      // CUSTOMER CONFIRMATION
      const customerHtml = `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #eee; padding: 30px; border-radius: 15px; color: #333;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #0B1D21; margin: 0;">Helena Backcountry Llamas</h1>
            <p style="color: #666; font-style: italic;">Your High Country Adventure Starts Here</p>
          </div>
          <p>Hi ${booking.name},</p>
          <p>Thank you for requesting a ${booking.bookingType === 'clinic' ? 'Llama Packing Clinic' : 'expedition'} with our herd! We've received your request and our team is currently reviewing the ${booking.bookingType === 'clinic' ? 'clinic schedule' : 'trail conditions and llama availability'} for your dates.</p>
          
          <div style="background: #f0fdf4; padding: 25px; border-radius: 15px; margin: 25px 0; border: 2px dashed #0B1D21; text-align: center;">
            <h3 style="margin-top: 0; color: #0B1D21;">MANDATORY: Sign Your Waiver</h3>
            <p>To finalize your booking, please sign the Rental Agreement and Liability Waiver electronically:</p>
            <a href="${waiverUrl}" style="display: inline-block; background: #0B1D21; color: white; padding: 15px 30px; text-decoration: none; border-radius: 10px; font-weight: bold; font-size: 16px; margin-top: 10px;">Sign Agreement Now</a>
          </div>

          <div style="background: #f9f9f9; padding: 20px; border-radius: 10px; margin: 20px 0;">
            <h3 style="margin-top: 0; color: #0B1D21;">Request Summary:</h3>
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

      await sendEmail({
        to: booking.email,
        subject: `Expedition Request Received: ${booking.startDate}`,
        html: customerHtml,
        fromName: "Helena Backcountry Llamas"
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
      try {
        const data = fs.existsSync(BOOKINGS_FILE) ? fs.readFileSync(BOOKINGS_FILE, "utf-8") : "[]";
        res.json(JSON.parse(data));
      } catch (parseErr) {
        console.error("Error parsing bookings file:", parseErr);
        res.json([]);
      }
    }
  } catch (e: any) {
    console.error("Fetch error:", e);
    res.status(500).json({ error: "Failed to load bookings", details: e.message });
  }
});

api.post("/update-booking", async (req, res) => {
  try {
    const { id, action, status, isRead, depositPaid, totalPaid } = req.body;
    const update: any = {};
    if (action === 'approve' || status === 'confirmed') update.status = 'confirmed';
    if (action === 'reject' || status === 'canceled') update.status = 'canceled';
    if (action === 'markRead' || isRead) update.isRead = true;
    if (depositPaid !== undefined) update.depositPaid = Number(depositPaid);
    if (totalPaid !== undefined) update.totalPaid = Number(totalPaid);

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
        if (error) {
          console.error("Supabase Update Error:", error);
          const sqlFix = `ALTER TABLE bookings ADD COLUMN IF NOT EXISTS "depositPaid" NUMERIC DEFAULT 0; ALTER TABLE bookings ADD COLUMN IF NOT EXISTS "totalPaid" NUMERIC DEFAULT 0;`;
          throw new Error(`${error.message}. Please run this SQL in your Supabase SQL Editor: ${sqlFix}`);
        }
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

    // Calculate totalPrice if status is confirmed
    if (booking && (action === 'approve' || status === 'confirmed')) {
      const branding = req.body.branding || {};
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

      // Update booking with calculated totalPrice
      if (supabase) {
        await supabase.from('bookings').update({ totalPrice: grandTotal }).eq('id', id);
      } else {
        const data = fs.readFileSync(BOOKINGS_FILE, "utf-8");
        let bookings = JSON.parse(data);
        const idx = bookings.findIndex((b: any) => b.id === id);
        if (idx !== -1) {
          bookings[idx].totalPrice = grandTotal;
          fs.writeFileSync(BOOKINGS_FILE, JSON.stringify(bookings, null, 2));
        }
      }

      // Send Approval Email if status changed to confirmed
      const resendKey = getResendApiKey();
      if (resendKey) {
        const venmoHandle = branding.venmoHandle || "@helenallams";
        const venmoLink = `https://venmo.com/u/${venmoHandle.replace('@', '')}`;
        const waiverUrl = `${process.env.APP_URL || 'https://www.helenallamas.com'}/sign/${booking.id}`;
      
        const invoiceHtml = `
        <div style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e7e5e4; border-radius: 16px; overflow: hidden; background: #fff;">
          <div style="background: #0B1D21; padding: 40px; text-align: center; color: white;">
            ${branding.logoUrl ? `<img src="${branding.logoUrl}" alt="Logo" style="height: 60px; margin-bottom: 20px; border-radius: 8px;" />` : ''}
            <h1 style="margin: 0; font-size: 28px; font-weight: 900; letter-spacing: -0.02em;">Booking Accepted</h1>
            <p style="margin: 10px 0 0; opacity: 0.8; font-size: 14px; text-transform: uppercase; letter-spacing: 0.1em;">Invoice #${booking.id.slice(0,8).toUpperCase()}</p>
          </div>
          
          <div style="padding: 40px;">
            <p style="font-size: 16px; color: #444; margin-bottom: 30px;">Hello <strong>${booking.name}</strong>, your ${booking.bookingType === 'clinic' ? 'Llama Packing Clinic' : 'expedition into the Montana high country'} has been accepted! To secure your dates, please sign the waiver and pay a $100 deposit.</p>
            
            <div style="background: #f0fdf4; border: 1px solid #dcfce7; border-radius: 12px; padding: 24px; text-align: center; margin-bottom: 30px;">
              <h3 style="margin: 0 0 12px; color: #0B1D21; font-size: 14px; text-transform: uppercase; letter-spacing: 0.1em;">Action Required: Sign Waiver</h3>
              <p style="margin: 0 0 20px; font-size: 14px; color: #0B1D21;">Please sign the mandatory rental agreement and liability waiver.</p>
              <a href="${waiverUrl}" style="display: inline-block; background: #0B1D21; color: white; padding: 14px 32px; text-decoration: none; border-radius: 12px; font-weight: 900; font-size: 16px;">Sign Waiver Now</a>
            </div>

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
                  <td style="padding: 24px 0; text-align: right; font-size: 24px; font-weight: 900; color: #0B1D21;">$${grandTotal.toFixed(2)}</td>
                </tr>
              </tbody>
            </table>

            <div style="background: #f0fdf4; border: 1px solid #dcfce7; border-radius: 12px; padding: 24px; text-align: center;">
              <h3 style="margin: 0 0 12px; color: #0B1D21; font-size: 14px; text-transform: uppercase; letter-spacing: 0.1em;">Payment via Venmo</h3>
              <p style="margin: 0 0 20px; font-size: 14px; color: #0B1D21;">Please send a <strong>$100 deposit</strong> to <strong>${venmoHandle}</strong> to secure your dates. The remaining balance will be due before your trip.</p>
              <a href="${venmoLink}" style="display: inline-block; background: #008CFF; color: white; padding: 14px 32px; text-decoration: none; border-radius: 12px; font-weight: 900; font-size: 16px; box-shadow: 0 4px 12px rgba(0,140,255,0.3);">Pay $100 Deposit</a>
            </div>
          </div>
          
          <div style="background: #fafaf9; padding: 30px; text-align: center; border-top: 1px solid #e7e5e4;">
            <p style="margin: 0; font-size: 12px; color: #a8a29e;">&copy; ${new Date().getFullYear()} ${branding.siteName || 'Helena Backcountry Llamas'}</p>
            <p style="margin: 5px 0 0; font-size: 10px; color: #d6d3d1; text-transform: uppercase; letter-spacing: 0.1em;">Grounding: Helena National Forest, Montana</p>
          </div>
        </div>
      `;

      await sendEmail({
        to: booking.email,
        subject: `Booking Confirmed & Invoice: ${booking.startDate} Expedition`,
        html: invoiceHtml,
        fromName: "Helena Backcountry Llamas"
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
    }

    res.json({ success: true });
  } catch (e: any) {
    res.status(500).json({ error: "Update failed", details: e.message });
  }
});

api.get("/invoice/:id", async (req, res) => {
  try {
    const { id } = req.params;
    let booking: any = null;
    let branding: any = {};

    // 1. Fetch Booking
    if (supabase) {
      const { data, error } = await supabase.from('bookings').select('*').eq('id', id).single();
      if (error) throw error;
      booking = data;
    } else {
      const data = fs.readFileSync(BOOKINGS_FILE, "utf-8");
      const bookings = JSON.parse(data);
      booking = bookings.find((b: any) => b.id === id);
    }

    if (!booking) {
      return res.status(404).send("Booking not found");
    }

    // 2. Fetch Branding
    if (supabase) {
      const { data, error } = await supabase.from('branding').select('*').limit(1);
      if (!error && data && data.length > 0) branding = data[0];
    } else {
      if (fs.existsSync(BRANDING_FILE)) {
        branding = JSON.parse(fs.readFileSync(BRANDING_FILE, "utf-8"));
      }
    }

    // 3. Calculate Totals
    const priceLlama = branding.pricePerLlamaDay || 65;
    const priceTrailer = branding.priceTrailerDay || 25;
    const priceClinic = branding.priceClinic || 75;
    
    const start = new Date(booking.startDate);
    const end = new Date(booking.endDate);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) || 1;
    
    let dailyRate = priceLlama;
    if (diffDays > 5) dailyRate *= 0.85;

    const llamaTotal = booking.numLlamas * dailyRate * diffDays;
    const trailerTotal = booking.trailerNeeded ? (priceTrailer * diffDays) : 0;
    const clinicTotal = booking.isFirstTimer ? priceClinic : 0;
    const grandTotal = llamaTotal + trailerTotal + clinicTotal;

    const depositPaid = booking.depositPaid || 0;
    const totalPaid = booking.totalPaid || 0;
    const remainingBalance = grandTotal - depositPaid - totalPaid;

    const venmoHandle = branding.venmoHandle || "@helenallams";

    // 4. Generate HTML
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Invoice - ${booking.name}</title>
        <style>
          body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; color: #1c1917; margin: 0; padding: 40px; background: #f5f5f4; }
          .invoice-box { max-width: 800px; margin: auto; padding: 40px; border: 1px solid #e7e5e4; background: #fff; border-radius: 16px; box-shadow: 0 10px 25px rgba(0,0,0,0.05); }
          .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 40px; border-bottom: 2px solid #0B1D21; padding-bottom: 20px; }
          .logo { height: 60px; border-radius: 8px; }
          .title { font-size: 32px; font-weight: 900; color: #0B1D21; margin: 0; }
          .meta { text-align: right; }
          .meta p { margin: 5px 0; font-size: 14px; color: #78716c; }
          .details { display: grid; grid-template-columns: 1fr 1fr; gap: 40px; margin-bottom: 40px; }
          .details h3 { font-size: 12px; text-transform: uppercase; letter-spacing: 0.1em; color: #a8a29e; margin-bottom: 10px; }
          .details p { margin: 5px 0; font-weight: bold; }
          table { width: 100%; border-collapse: collapse; margin-bottom: 40px; }
          th { text-align: left; font-size: 12px; text-transform: uppercase; letter-spacing: 0.1em; color: #a8a29e; padding: 10px 0; border-bottom: 1px solid #e7e5e4; }
          td { padding: 20px 0; border-bottom: 1px solid #f5f5f4; }
          .total-row td { border-bottom: none; padding-top: 30px; }
          .total-label { font-size: 20px; font-weight: 900; }
          .total-amount { font-size: 32px; font-weight: 900; color: #0B1D21; text-align: right; }
          .footer { text-align: center; margin-top: 60px; border-top: 1px solid #e7e5e4; padding-top: 20px; font-size: 12px; color: #a8a29e; }
          @media print {
            body { background: white; padding: 0; }
            .invoice-box { border: none; box-shadow: none; padding: 0; }
            .no-print { display: none; }
          }
          .print-btn { position: fixed; top: 20px; right: 20px; background: #0B1D21; color: white; border: none; padding: 12px 24px; border-radius: 8px; font-weight: bold; cursor: pointer; box-shadow: 0 4px 12px rgba(11,29,33,0.3); }
        </style>
      </head>
      <body>
        <button class="print-btn no-print" onclick="window.print()">Print Invoice</button>
        <div class="invoice-box">
          <div class="header">
            <div>
              ${branding.logoUrl ? `<img src="${branding.logoUrl}" class="logo" />` : '<div style="font-size: 24px; font-weight: 900; color: #0B1D21;">HBL</div>'}
              <h1 class="title">INVOICE</h1>
            </div>
            <div class="meta">
              <p>Invoice #: ${booking.id.slice(0,8).toUpperCase()}</p>
              <p>Date: ${new Date(booking.timestamp).toLocaleDateString()}</p>
              <p>Status: ${booking.status.toUpperCase()}</p>
            </div>
          </div>

          <div class="details">
            <div>
              <h3>Billed To</h3>
              <p>${booking.name}</p>
              <p>${booking.email}</p>
              <p>${booking.phone}</p>
            </div>
            <div>
              <h3>Expedition Details</h3>
              <p>${booking.startDate} to ${booking.endDate}</p>
              <p>${booking.numLlamas} Pack Animals</p>
              <p>${booking.trailerNeeded ? 'Trailer Rental Included' : 'No Trailer'}</p>
            </div>
          </div>

          <table>
            <thead>
              <tr>
                <th>Description</th>
                <th style="text-align: right;">Amount</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>
                  <div style="font-weight: bold;">Llama Pack String Rental</div>
                  <div style="font-size: 12px; color: #78716c;">${booking.numLlamas} llamas for ${diffDays} days @ $${dailyRate.toFixed(2)}/day</div>
                </td>
                <td style="text-align: right; font-weight: bold;">$${llamaTotal.toFixed(2)}</td>
              </tr>
              ${booking.trailerNeeded ? `
              <tr>
                <td>
                  <div style="font-weight: bold;">Custom Llama Trailer</div>
                  <div style="font-size: 12px; color: #78716c;">${diffDays} days @ $${priceTrailer.toFixed(2)}/day</div>
                </td>
                <td style="text-align: right; font-weight: bold;">$${trailerTotal.toFixed(2)}</td>
              </tr>` : ''}
              ${booking.isFirstTimer ? `
              <tr>
                <td>
                  <div style="font-weight: bold;">Backcountry Pack Clinic</div>
                  <div style="font-size: 12px; color: #78716c;">Mandatory for first-time packers</div>
                </td>
                <td style="text-align: right; font-weight: bold;">$${priceClinic.toFixed(2)}</td>
              </tr>` : ''}
              <tr class="total-row">
                <td class="total-label">Total Amount Due</td>
                <td class="total-amount">$${grandTotal.toFixed(2)}</td>
              </tr>
              ${depositPaid > 0 ? `
              <tr>
                <td style="padding: 10px 0; color: #0B1D21; font-weight: bold;">Deposit Paid</td>
                <td style="padding: 10px 0; text-align: right; color: #0B1D21; font-weight: bold;">-$${depositPaid.toFixed(2)}</td>
              </tr>` : ''}
              ${totalPaid > 0 ? `
              <tr>
                <td style="padding: 10px 0; color: #0B1D21; font-weight: bold;">Additional Payments</td>
                <td style="padding: 10px 0; text-align: right; color: #0B1D21; font-weight: bold;">-$${totalPaid.toFixed(2)}</td>
              </tr>` : ''}
              <tr style="border-top: 2px solid #0B1D21;">
                <td style="padding: 20px 0; font-size: 24px; font-weight: 900;">Remaining Balance</td>
                <td style="padding: 20px 0; text-align: right; font-size: 32px; font-weight: 900; color: ${remainingBalance <= 0 ? '#0B1D21' : '#1c1917'};">
                  ${remainingBalance <= 0 ? 'PAID IN FULL' : `$${remainingBalance.toFixed(2)}`}
                </td>
              </tr>
            </tbody>
          </table>

          <div style="background: #f0fdf4; border: 1px solid #dcfce7; border-radius: 12px; padding: 24px;">
            <h3 style="margin: 0 0 10px; color: #0B1D21; font-size: 12px; text-transform: uppercase; letter-spacing: 0.1em;">Payment Instructions</h3>
            ${remainingBalance > 0 ? `
              <p style="margin: 0; font-size: 14px;">Please send your payment to Venmo: <strong>${venmoHandle}</strong>. Reference Invoice #${booking.id.slice(0,8).toUpperCase()}.</p>
            ` : `
              <p style="margin: 0; font-size: 14px; font-weight: bold; color: #0B1D21;">Thank you! Your expedition is fully paid.</p>
            `}
          </div>

          <div class="footer">
            <p>&copy; ${new Date().getFullYear()} ${branding.siteName || 'Helena Backcountry Llamas'}</p>
            <p>Helena, Montana • Backcountry Logistics Specialists</p>
          </div>
        </div>
      </body>
      </html>
    `;

    res.send(html);
  } catch (e: any) {
    res.status(500).send("Failed to generate invoice: " + e.message);
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
      if (!Array.isArray(gallery)) {
        return res.status(400).json({ error: "Invalid data", details: "Gallery must be an array" });
      }
      
      console.log(`[${new Date().toISOString()}] Saving gallery:`, gallery.length);
      
      if (supabase) {
        console.log(`[${new Date().toISOString()}] Using Supabase for gallery persistence`);
        const { error: deleteError } = await supabase.from('gallery').delete().neq('id', '00000000-0000-0000-0000-000000000000');
        if (deleteError) {
          console.error("Supabase gallery delete error:", deleteError);
          const details = deleteError.message || JSON.stringify(deleteError);
          return res.status(500).json({ error: "Database delete failed", details });
        }

        const { error: insertError } = await supabase.from('gallery').insert(gallery.map((img: any) => ({
          url: img.url,
          caption: img.caption
        })));
        
        if (insertError) {
          console.error("Supabase gallery insert error:", insertError);
          const details = insertError.message || JSON.stringify(insertError);
          return res.status(500).json({ error: "Database insert failed", details });
        }
      } else {
        console.log(`[${new Date().toISOString()}] Using local file system for gallery persistence: ${GALLERY_FILE}`);
        try {
          fs.writeFileSync(GALLERY_FILE, JSON.stringify(gallery, null, 2));
        } catch (fsError: any) {
          console.error("File system write error:", fsError);
          return res.status(500).json({ error: "File system write failed", details: fsError.message });
        }
      }
      res.json({ success: true });
    } catch (e: any) {
      console.error("Gallery save error:", e);
      const details = e.message || (typeof e === 'string' ? e : JSON.stringify(e));
      res.status(500).json({ error: "Failed to save gallery", details });
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
        try {
          const data = fs.existsSync(GEAR_FILE) ? fs.readFileSync(GEAR_FILE, "utf-8") : "[]";
          res.json(JSON.parse(data));
        } catch (parseErr) {
          console.error("Error parsing gear file:", parseErr);
          res.json([]);
        }
      }
    } catch (e: any) {
      console.error("Gear fetch error:", e);
      res.status(500).json({ error: "Failed to load gear", details: e.message });
    }
  });
  
  api.post("/save-gear", async (req, res) => {
    try {
      const { gear } = req.body;
      if (!Array.isArray(gear)) {
        return res.status(400).json({ error: "Invalid data", details: "Gear must be an array" });
      }
      
      console.log(`[${new Date().toISOString()}] Saving gear items:`, gear.length);
      
      if (supabase) {
        console.log(`[${new Date().toISOString()}] Using Supabase for gear persistence`);
        // First delete existing items
        const { error: deleteError } = await supabase.from('gear').delete().neq('id', '00000000-0000-0000-0000-000000000000');
        if (deleteError) {
          console.error("Supabase gear delete error:", deleteError);
          const details = deleteError.message || JSON.stringify(deleteError);
          return res.status(500).json({ error: "Database delete failed", details });
        }

        // Then insert new items
        const { error: insertError } = await supabase.from('gear').insert(gear.map((item: any) => ({
          id: item.id,
          name: item.name,
          category: item.category,
          price: item.price,
          description: item.description,
          imageUrl: item.imageUrl
        })));
        
        if (insertError) {
          console.error("Supabase gear insert error:", insertError);
          const details = insertError.message || JSON.stringify(insertError);
          return res.status(500).json({ error: "Database insert failed", details });
        }
      } else {
        console.log(`[${new Date().toISOString()}] Using local file system for gear persistence: ${GEAR_FILE}`);
        try {
          fs.writeFileSync(GEAR_FILE, JSON.stringify(gear, null, 2));
        } catch (fsError: any) {
          console.error("File system write error:", fsError);
          return res.status(500).json({ error: "File system write failed", details: fsError.message });
        }
      }
      res.json({ success: true });
    } catch (e: any) {
      console.error("Gear save error:", e);
      const details = e.message || (typeof e === 'string' ? e : JSON.stringify(e));
      res.status(500).json({ error: "Failed to save gear", details });
    }
  });

  api.post("/save-llamas", async (req, res) => {
    try {
      const { llamas } = req.body;
      if (!Array.isArray(llamas)) {
        return res.status(400).json({ error: "Invalid data", details: "Llamas must be an array" });
      }
      
      console.log(`[${new Date().toISOString()}] Saving llamas:`, llamas.length);
      
      if (supabase) {
        console.log(`[${new Date().toISOString()}] Using Supabase for llamas persistence`);
        const { error: deleteError } = await supabase.from('llamas').delete().neq('id', '00000000-0000-0000-0000-000000000000');
        if (deleteError) {
          console.error("Supabase llamas delete error:", deleteError);
          const details = deleteError.message || JSON.stringify(deleteError);
          return res.status(500).json({ error: "Database delete failed", details });
        }

        const { error: insertError } = await supabase.from('llamas').insert(llamas.map((l: any) => ({
          id: l.id,
          name: l.name,
          age: l.age,
          personality: l.personality,
          maxLoad: l.maxLoad,
          imageUrl: l.imageUrl,
          specialty: l.specialty
        })));
        
        if (insertError) {
          console.error("Supabase llamas insert error:", insertError);
          const details = insertError.message || JSON.stringify(insertError);
          return res.status(500).json({ error: "Database insert failed", details });
        }
      } else {
        console.log(`[${new Date().toISOString()}] Using local file system for llamas persistence: ${LLAMAS_FILE}`);
        try {
          fs.writeFileSync(LLAMAS_FILE, JSON.stringify(llamas, null, 2));
        } catch (fsError: any) {
          console.error("File system write error:", fsError);
          return res.status(500).json({ error: "File system write failed", details: fsError.message });
        }
      }
      res.json({ success: true });
    } catch (e: any) {
      console.error("Llamas save error:", e);
      const details = e.message || (typeof e === 'string' ? e : JSON.stringify(e));
      res.status(500).json({ error: "Failed to save llamas", details });
    }
  });

  api.post("/save-branding", async (req, res) => {
    try {
      const { branding } = req.body;
      if (!branding || typeof branding !== 'object') {
        return res.status(400).json({ error: "Invalid data", details: "Branding must be an object" });
      }
      
      console.log(`[${new Date().toISOString()}] Saving branding configuration`);
      
      if (supabase) {
        console.log(`[${new Date().toISOString()}] Using Supabase for branding persistence`);
        const { error } = await supabase.from('branding').upsert({
          id: 'site-config', // Single record for branding
          ...branding
        });
        if (error) {
          console.error("Supabase branding upsert error:", error);
          const details = error.message || JSON.stringify(error);
          return res.status(500).json({ error: "Database upsert failed", details });
        }
      } else {
        console.log(`[${new Date().toISOString()}] Using local file system for branding persistence: ${BRANDING_FILE}`);
        try {
          fs.writeFileSync(BRANDING_FILE, JSON.stringify(branding, null, 2));
        } catch (fsError: any) {
          console.error("File system write error:", fsError);
          return res.status(500).json({ error: "File system write failed", details: fsError.message });
        }
      }
      res.json({ success: true });
    } catch (e: any) {
      console.error("Branding save error:", e);
      const details = e.message || (typeof e === 'string' ? e : JSON.stringify(e));
      res.status(500).json({ error: "Failed to save branding", details });
    }
  });

  api.get("/get-config", async (req, res) => {
    try {
      let gear = [];
      let llamas = [];
      let branding = null;
      let gallery = [];

      if (supabase) {
        const { data: gearData } = await supabase.from('gear').select('*');
        const { data: llamaData } = await supabase.from('llamas').select('*');
        const { data: brandingData } = await supabase.from('branding').select('*').eq('id', 'site-config').single();
        const { data: galleryData } = await supabase.from('gallery').select('*');
        gear = gearData || [];
        llamas = llamaData || [];
        branding = brandingData || null;
        gallery = galleryData || [];
      } else {
        if (fs.existsSync(GEAR_FILE)) gear = JSON.parse(fs.readFileSync(GEAR_FILE, 'utf-8'));
        if (fs.existsSync(LLAMAS_FILE)) llamas = JSON.parse(fs.readFileSync(LLAMAS_FILE, 'utf-8'));
        if (fs.existsSync(BRANDING_FILE)) branding = JSON.parse(fs.readFileSync(BRANDING_FILE, 'utf-8'));
        if (fs.existsSync(GALLERY_FILE)) gallery = JSON.parse(fs.readFileSync(GALLERY_FILE, 'utf-8'));
      }

      res.json({ gear, llamas, branding, gallery });
    } catch (e: any) {
      console.error("Config fetch error:", e);
      res.status(500).json({ error: "Failed to fetch config", details: e.message });
    }
  });

export { api };
export default api;
