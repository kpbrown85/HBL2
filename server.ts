import express from "express";
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
