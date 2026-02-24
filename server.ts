import express from "express";
import { createServer as createViteServer } from "vite";
import nodemailer from "nodemailer";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const BOOKINGS_FILE = path.join(__dirname, "bookings.json");

// Initialize bookings file if it doesn't exist
if (!fs.existsSync(BOOKINGS_FILE)) {
  fs.writeFileSync(BOOKINGS_FILE, JSON.stringify([]));
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Email Transporter (Lazy initialization)
  const getTransporter = () => {
    const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS } = process.env;
    if (!SMTP_HOST || !SMTP_USER || !SMTP_PASS) {
      console.warn("SMTP not fully configured. Email notifications will be skipped.");
      return null;
    }
    return nodemailer.createTransport({
      host: SMTP_HOST,
      port: Number(SMTP_PORT) || 587,
      secure: false,
      auth: {
        user: SMTP_USER,
        pass: SMTP_PASS,
      },
    });
  };

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

      // Send Email Notification
      const transporter = getTransporter();
      const adminEmail = process.env.ADMIN_EMAIL || "kevin.paul.brown@gmail.com";

      if (transporter) {
        const mailOptions = {
          from: `"Helena Backcountry Llamas" <${process.env.SMTP_USER}>`,
          to: adminEmail,
          subject: `New Booking Request: ${booking.name}`,
          text: `
            New expedition request received!
            
            Name: ${booking.name}
            Email: ${booking.email}
            Phone: ${booking.phone}
            Dates: ${booking.startDate} to ${booking.endDate}
            Llamas: ${booking.numLlamas}
            Trailer Needed: ${booking.trailerNeeded ? "Yes" : "No"}
            First Timer: ${booking.isFirstTimer ? "Yes" : "No"}
            
            View details in the admin dashboard.
          `,
          html: `
            <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #eee; padding: 20px; border-radius: 10px;">
              <h2 style="color: #166534;">New Expedition Request</h2>
              <p>A new booking request has been submitted through the website.</p>
              <hr style="border: 0; border-top: 1px solid #eee;" />
              <table style="width: 100%; border-collapse: collapse;">
                <tr><td style="padding: 10px 0; font-weight: bold;">Name:</td><td>${booking.name}</td></tr>
                <tr><td style="padding: 10px 0; font-weight: bold;">Email:</td><td>${booking.email}</td></tr>
                <tr><td style="padding: 10px 0; font-weight: bold;">Phone:</td><td>${booking.phone}</td></tr>
                <tr><td style="padding: 10px 0; font-weight: bold;">Dates:</td><td>${booking.startDate} to ${booking.endDate}</td></tr>
                <tr><td style="padding: 10px 0; font-weight: bold;">Llamas:</td><td>${booking.numLlamas}</td></tr>
                <tr><td style="padding: 10px 0; font-weight: bold;">Trailer:</td><td>${booking.trailerNeeded ? "Yes" : "No"}</td></tr>
                <tr><td style="padding: 10px 0; font-weight: bold;">First Timer:</td><td>${booking.isFirstTimer ? "Yes" : "No"}</td></tr>
              </table>
              <p style="margin-top: 20px; font-size: 12px; color: #666;">View and manage this request in your admin dashboard.</p>
            </div>
          `,
        };

        await transporter.sendMail(mailOptions);
      }

      res.status(201).json(booking);
    } catch (error) {
      console.error("Booking Error:", error);
      res.status(500).json({ error: "Failed to process booking" });
    }
  });

  // API: Update booking status
  app.patch("/api/bookings/:id", (req, res) => {
    const { id } = req.params;
    const updates = req.body;

    try {
      const data = fs.readFileSync(BOOKINGS_FILE, "utf-8");
      let bookings = JSON.parse(data);
      bookings = bookings.map((b: any) => (b.id === id ? { ...b, ...updates } : b));
      fs.writeFileSync(BOOKINGS_FILE, JSON.stringify(bookings, null, 2));
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to update booking" });
    }
  });

  // API: Delete booking
  app.delete("/api/bookings/:id", (req, res) => {
    const { id } = req.params;

    try {
      const data = fs.readFileSync(BOOKINGS_FILE, "utf-8");
      let bookings = JSON.parse(data);
      bookings = bookings.filter((b: any) => b.id !== id);
      fs.writeFileSync(BOOKINGS_FILE, JSON.stringify(bookings, null, 2));
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete booking" });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
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
