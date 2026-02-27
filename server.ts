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

  // Global Request Logger
  app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
    next();
  });

  // Health Check / Ping
  app.get("/api/ping", (req, res) => {
    console.log(`[${new Date().toISOString()}] GET Ping received from ${req.ip}`);
    res.json({ 
      status: "ok", 
      timestamp: new Date().toISOString(), 
      env: process.env.NODE_ENV,
      url: req.url,
      method: req.method
    });
  });

  app.post("/api/ping", (req, res) => {
    console.log(`[${new Date().toISOString()}] POST Ping received from ${req.ip}`, req.body);
    res.json({ 
      status: "ok", 
      timestamp: new Date().toISOString(), 
      method: req.method,
      receivedBody: req.body
    });
  });

  // API: Get all bookings
  app.get("/api/get-bookings", (req, res) => {
    try {
      const data = fs.readFileSync(BOOKINGS_FILE, "utf-8");
      res.json(JSON.parse(data));
    } catch (error) {
      res.status(500).json({ error: "Failed to read bookings" });
    }
  });

  // API: Create a booking
  app.post("/api/create-booking", async (req, res) => {
    const booking = req.body;
    booking.id = Math.random().toString(36).substr(2, 9);
    booking.timestamp = Date.now();
    booking.status = "pending";
    booking.isRead = false;

    console.log(`[${new Date().toISOString()}] Server: New booking request from ${booking.name}`);

    try {
      const data = fs.readFileSync(BOOKINGS_FILE, "utf-8");
      const bookings = JSON.parse(data);
      bookings.unshift(booking);
      fs.writeFileSync(BOOKINGS_FILE, JSON.stringify(bookings, null, 2));

      // Send Email Notification
      const adminEmail = "kevin.paul.brown@gmail.com";
      const smtpUser = process.env.SMTP_USER;
      const smtpPass = process.env.SMTP_PASS;

      if (smtpUser && smtpPass) {
        const transporter = getTransporter();
        const mailOptions = {
          from: `"HBL Booking System" <${smtpUser}>`,
          to: adminEmail,
          subject: `NEW BOOKING: ${booking.name} - ${booking.startDate}`,
          html: `
            <div style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; padding: 40px; color: #1c1917; max-width: 600px; margin: auto; border: 1px solid #f5f5f4; border-radius: 20px;">
              <h1 style="color: #166534; font-size: 24px; font-weight: 900; margin-bottom: 20px; text-transform: uppercase; letter-spacing: 1px;">New Expedition Request</h1>
              <div style="background: #fafaf9; padding: 30px; border-radius: 15px; margin-bottom: 30px;">
                <p style="margin: 0 0 10px 0; font-size: 12px; font-weight: 900; color: #a8a29e; text-transform: uppercase; letter-spacing: 2px;">Lead Contact</p>
                <p style="margin: 0; font-size: 18px; font-weight: 700;">${booking.name}</p>
                <p style="margin: 5px 0 0 0; font-size: 14px; color: #57534e;">${booking.email} | ${booking.phone}</p>
              </div>
              <div style="margin-bottom: 40px;">
                <p style="margin: 0 0 10px 0; font-size: 12px; font-weight: 900; color: #a8a29e; text-transform: uppercase; letter-spacing: 2px;">Equipment & Training</p>
                <ul style="margin: 0; padding: 0; list-style: none;">
                  <li style="padding: 10px 0; border-bottom: 1px solid #f5f5f4; font-size: 14px; font-weight: 600;">Dates: ${booking.startDate} to ${booking.endDate}</li>
                  <li style="padding: 10px 0; border-bottom: 1px solid #f5f5f4; font-size: 14px; font-weight: 600;">Fleet: ${booking.numLlamas} Pack Animals</li>
                  <li style="padding: 10px 0; border-bottom: 1px solid #f5f5f4; font-size: 14px; font-weight: 600;">Trailer Needed: ${booking.trailerNeeded ? '✅ Yes' : '❌ No'}</li>
                  <li style="padding: 10px 0; border-bottom: 1px solid #f5f5f4; font-size: 14px; font-weight: 600;">First Timer Clinic: ${booking.isFirstTimer ? '✅ Yes' : '❌ No'}</li>
                </ul>
              </div>
              <a href="${process.env.APP_URL || 'https://www.helenallamas.com'}" style="display: block; background: #166534; color: white; padding: 20px; text-align: center; text-decoration: none; border-radius: 15px; font-weight: 900; font-size: 14px; text-transform: uppercase; letter-spacing: 2px;">Manage in Dashboard</a>
            </div>
          `,
        };
        transporter.sendMail(mailOptions).catch(err => console.error("Email failed:", err));
      }

      res.status(201).json(booking);
    } catch (error) {
      console.error("Booking Error:", error);
      res.status(500).json({ error: "Failed to process booking" });
    }
  });

  // Legacy route support
  app.post("/api/bookings", (req, res) => {
    res.redirect(307, "/api/create-booking");
  });
  app.get("/api/bookings", (req, res) => {
    res.redirect(301, "/api/get-bookings");
  });

  // Specific POST catch-all for debugging
  app.post("/api/*", (req, res) => {
    console.warn(`[${new Date().toISOString()}] Unmatched API POST: ${req.url}`);
    res.status(404).json({
      error: "Unmatched API POST",
      method: req.method,
      url: req.url,
      msg: "This request reached Express but matched no POST route"
    });
  });

  // API: Update booking status
  app.post("/api/update-booking", (req, res) => {
    const { id, ...updates } = req.body;
    console.log(`[${new Date().toISOString()}] Server: Updating booking ${id}`, updates);

    if (!id) {
      console.error(`[${new Date().toISOString()}] Server: Update failed - Missing ID`);
      return res.status(400).json({ error: "Missing booking ID" });
    }

    try {
      const data = fs.readFileSync(BOOKINGS_FILE, "utf-8");
      let bookings = JSON.parse(data);
      const index = bookings.findIndex((b: any) => b.id === id);
      
      if (index === -1) {
        console.warn(`[${new Date().toISOString()}] Server: Booking ${id} not found for update`);
        return res.status(404).json({ error: "Booking not found" });
      }

      bookings[index] = { ...bookings[index], ...updates };
      fs.writeFileSync(BOOKINGS_FILE, JSON.stringify(bookings, null, 2));
      console.log(`[${new Date().toISOString()}] Server: Booking ${id} updated successfully`);
      res.json({ success: true });
    } catch (error) {
      console.error(`[${new Date().toISOString()}] Server: Update Error:`, error);
      res.status(500).json({ error: "Failed to update booking" });
    }
  });

  // API: Delete booking
  app.post("/api/delete-booking", (req, res) => {
    const { id } = req.body;
    console.log(`[${new Date().toISOString()}] Server: Deleting booking ${id}`);

    if (!id) {
      console.error(`[${new Date().toISOString()}] Server: Delete failed - Missing ID`);
      return res.status(400).json({ error: "Missing booking ID" });
    }

    try {
      const data = fs.readFileSync(BOOKINGS_FILE, "utf-8");
      let bookings = JSON.parse(data);
      const initialLength = bookings.length;
      bookings = bookings.filter((b: any) => b.id !== id);
      
      if (bookings.length === initialLength) {
        console.warn(`[${new Date().toISOString()}] Server: Booking ${id} not found for delete`);
        return res.status(404).json({ error: "Booking not found" });
      }

      fs.writeFileSync(BOOKINGS_FILE, JSON.stringify(bookings, null, 2));
      console.log(`[${new Date().toISOString()}] Server: Booking ${id} deleted successfully`);
      res.json({ success: true });
    } catch (error) {
      console.error(`[${new Date().toISOString()}] Server: Delete Error:`, error);
      res.status(500).json({ error: "Failed to delete booking" });
    }
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
