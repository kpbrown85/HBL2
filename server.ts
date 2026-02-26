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

  // API: Get all bookings
  app.get("/api/bookings", (req, res) => {
    try {
      const data = fs.readFileSync(BOOKINGS_FILE, "utf-8");
      res.json(JSON.parse(data));
    } catch (error) {
      res.status(500).json({ error: "Failed to read bookings" });
    }
  });

  // API: Create a booking
  app.post("/api/bookings", async (req, res) => {
    const booking = req.body;
    booking.id = Math.random().toString(36).substr(2, 9);
    booking.timestamp = Date.now();
    booking.status = booking.status || "pending";
    booking.isRead = false;

    try {
      // Save to file
      const data = fs.readFileSync(BOOKINGS_FILE, "utf-8");
      const bookings = JSON.parse(data);
      bookings.unshift(booking);
      fs.writeFileSync(BOOKINGS_FILE, JSON.stringify(bookings, null, 2));

      // Send Email Notification (Non-blocking)
      const adminEmail = process.env.ADMIN_EMAIL || "kevin.paul.brown@gmail.com";
      if (process.env.SMTP_USER && process.env.SMTP_PASS) {
        const transporter = getTransporter();
        const mailOptions = {
          from: `"HBL Booking System" <${process.env.SMTP_USER}>`,
          to: adminEmail,
          subject: `New Booking Request: ${booking.name}`,
          html: `
            <div style="font-family: sans-serif; padding: 20px; color: #1c1917;">
              <h2 style="color: #166534;">New Expedition Request</h2>
              <p><strong>Contact:</strong> ${booking.name}</p>
              <p><strong>Email:</strong> ${booking.email}</p>
              <p><strong>Phone:</strong> ${booking.phone}</p>
              <hr style="border: 1px solid #f5f5f4;" />
              <p><strong>Dates:</strong> ${booking.startDate} to ${booking.endDate}</p>
              <p><strong>Llamas:</strong> ${booking.numLlamas}</p>
              <p><strong>Trailer Needed:</strong> ${booking.trailerNeeded ? 'Yes' : 'No'}</p>
              <p><strong>First Timer:</strong> ${booking.isFirstTimer ? 'Yes' : 'No'}</p>
              <br />
              <a href="${process.env.APP_URL || '#'}" style="background: #166534; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">View in Admin Dashboard</a>
            </div>
          `,
        };

        transporter.sendMail(mailOptions).catch(err => {
          console.error("Email Sending Error:", err);
        });
      }

      res.status(201).json(booking);
    } catch (error) {
      console.error("Booking Error:", error);
      res.status(500).json({ error: "Failed to process booking" });
    }
  });

  // API: Update booking status
  app.post(["/api/bookings/update", "/api/bookings-update"], (req, res) => {
    const { id, ...updates } = req.body;
    console.log(`Server: Updating booking ${id}`, updates);

    if (!id) return res.status(400).json({ error: "Missing booking ID" });

    try {
      const data = fs.readFileSync(BOOKINGS_FILE, "utf-8");
      let bookings = JSON.parse(data);
      const index = bookings.findIndex((b: any) => b.id === id);
      
      if (index === -1) {
        console.warn(`Server: Booking ${id} not found for update`);
        return res.status(404).json({ error: "Booking not found" });
      }

      bookings[index] = { ...bookings[index], ...updates };
      fs.writeFileSync(BOOKINGS_FILE, JSON.stringify(bookings, null, 2));
      console.log(`Server: Booking ${id} updated successfully`);
      res.json({ success: true });
    } catch (error) {
      console.error("Server: Update Error:", error);
      res.status(500).json({ error: "Failed to update booking" });
    }
  });

  // API: Delete booking
  app.post(["/api/bookings/delete", "/api/bookings-delete"], (req, res) => {
    const { id } = req.body;
    console.log(`Server: Deleting booking ${id}`);

    if (!id) return res.status(400).json({ error: "Missing booking ID" });

    try {
      const data = fs.readFileSync(BOOKINGS_FILE, "utf-8");
      let bookings = JSON.parse(data);
      const initialLength = bookings.length;
      bookings = bookings.filter((b: any) => b.id !== id);
      
      if (bookings.length === initialLength) {
        console.warn(`Server: Booking ${id} not found for delete`);
        return res.status(404).json({ error: "Booking not found" });
      }

      fs.writeFileSync(BOOKINGS_FILE, JSON.stringify(bookings, null, 2));
      console.log(`Server: Booking ${id} deleted successfully`);
      res.json({ success: true });
    } catch (error) {
      console.error("Server: Delete Error:", error);
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
