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
    res.json({ status: "ok", timestamp: new Date().toISOString(), env: process.env.NODE_ENV });
  });

  // Test POST endpoint
  app.post("/api/test-post", (req, res) => {
    console.log(`[${new Date().toISOString()}] Server: Test POST received`, req.body);
    res.json({ success: true, received: req.body });
  });

  // API: Get all bookings
  app.get(["/api/bookings", "/api/get-bookings"], (req, res) => {
    try {
      const data = fs.readFileSync(BOOKINGS_FILE, "utf-8");
      res.json(JSON.parse(data));
    } catch (error) {
      res.status(500).json({ error: "Failed to read bookings" });
    }
  });

  // API: Create a booking
  app.post(["/api/bookings", "/api/create-booking"], async (req, res) => {
    const booking = req.body;
    booking.id = Math.random().toString(36).substr(2, 9);
    booking.timestamp = Date.now();
    booking.status = "pending";
    booking.isRead = false;

    console.log(`[${new Date().toISOString()}] Server: New booking request from ${booking.name} (${booking.email})`);

    try {
      // 1. Save to file (Logging on the site)
      const data = fs.readFileSync(BOOKINGS_FILE, "utf-8");
      const bookings = JSON.parse(data);
      bookings.unshift(booking);
      fs.writeFileSync(BOOKINGS_FILE, JSON.stringify(bookings, null, 2));
      console.log(`[${new Date().toISOString()}] Server: Booking ${booking.id} saved to database`);

      // 2. Send Email Notification
      const adminEmail = "kevin.paul.brown@gmail.com";
      const smtpUser = process.env.SMTP_USER;
      const smtpPass = process.env.SMTP_PASS;

      if (smtpUser && smtpPass) {
        console.log(`[${new Date().toISOString()}] Server: Attempting to send email to ${adminEmail}`);
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
              
              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 30px;">
                <div style="background: #f0fdf4; padding: 20px; border-radius: 15px; border: 1px solid #dcfce7;">
                  <p style="margin: 0 0 5px 0; font-size: 10px; font-weight: 900; color: #166534; text-transform: uppercase; letter-spacing: 1px;">Dates</p>
                  <p style="margin: 0; font-size: 14px; font-weight: 700;">${booking.startDate} to ${booking.endDate}</p>
                </div>
                <div style="background: #f0fdf4; padding: 20px; border-radius: 15px; border: 1px solid #dcfce7;">
                  <p style="margin: 0 0 5px 0; font-size: 10px; font-weight: 900; color: #166534; text-transform: uppercase; letter-spacing: 1px;">Fleet</p>
                  <p style="margin: 0; font-size: 14px; font-weight: 700;">${booking.numLlamas} Pack Animals</p>
                </div>
              </div>

              <div style="margin-bottom: 40px;">
                <p style="margin: 0 0 10px 0; font-size: 12px; font-weight: 900; color: #a8a29e; text-transform: uppercase; letter-spacing: 2px;">Equipment & Training</p>
                <ul style="margin: 0; padding: 0; list-style: none;">
                  <li style="padding: 10px 0; border-bottom: 1px solid #f5f5f4; font-size: 14px; font-weight: 600;">Trailer Needed: ${booking.trailerNeeded ? '✅ Yes' : '❌ No'}</li>
                  <li style="padding: 10px 0; border-bottom: 1px solid #f5f5f4; font-size: 14px; font-weight: 600;">First Timer Clinic: ${booking.isFirstTimer ? '✅ Yes' : '❌ No'}</li>
                </ul>
              </div>

              <a href="${process.env.APP_URL || 'https://www.helenallamas.com'}" style="display: block; background: #166534; color: white; padding: 20px; text-align: center; text-decoration: none; border-radius: 15px; font-weight: 900; font-size: 14px; text-transform: uppercase; letter-spacing: 2px;">Manage in Dashboard</a>
              
              <p style="margin-top: 40px; font-size: 10px; color: #a8a29e; text-align: center; text-transform: uppercase; letter-spacing: 1px;">Helena Backcountry Llamas - Automated Dispatch</p>
            </div>
          `,
        };

        transporter.sendMail(mailOptions)
          .then(() => console.log(`[${new Date().toISOString()}] Server: Email sent successfully to ${adminEmail}`))
          .catch(err => console.error(`[${new Date().toISOString()}] Server: Email failed:`, err));
      } else {
        console.warn(`[${new Date().toISOString()}] Server: SMTP credentials missing. Email not sent, but booking was logged.`);
      }

      res.status(201).json(booking);
    } catch (error) {
      console.error(`[${new Date().toISOString()}] Server: Booking Error:`, error);
      res.status(500).json({ error: "Failed to process booking" });
    }
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
    res.status(404).json({ error: `API route not found: ${req.method} ${req.url}` });
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

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
