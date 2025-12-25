import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import nodemailer from "nodemailer";
import { pool } from "./db.js";

dotenv.config();

const app = express();

const allowedOrigins = [
  "http://localhost:3000",
  "https://andreeaportofolio.netlify.app",
];

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);

      if (
        origin.includes("netlify.app") ||
        origin === "http://localhost:3000"
      ) {
        return callback(null, true);
      }

      return callback(new Error("CORS not allowed"));
    },
    methods: ["GET", "POST", "OPTIONS"],
  })
);

app.use(express.json());

app.options("/api/contact", cors());

app.post("/api/contact", async (req, res) => {
  try {
    const { name, email, message } = req.body;

    await pool.query(
      "INSERT INTO contact_messages (name, email, message, created_at) VALUES ($1, $2, $3, NOW())",
      [name, email, message]
    );

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    await transporter.sendMail({
      from: `"Portfolio Contact" <${process.env.EMAIL_USER}>`,
      to: process.env.EMAIL_TO,
      subject: "New message from your portfolio 💌",
      text: `Name: ${name}\nEmail: ${email}\n\n${message}`,
    });

    res.status(200).json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false });
  }
});

app.get("/api/contact", (req, res) => {
  res.json({ status: "API is alive " });
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => console.log("Server running on", PORT));
