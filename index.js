const express = require("express");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 3000;

require("./models/db");

app.use(express.json());

// Minimal CORS support for local frontend development.
const ALLOWED_ORIGINS = (process.env.ALLOWED_ORIGINS ||
  "http://localhost:5173,http://127.0.0.1:5173")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

app.use((req, res, next) => {
  const origin = req.headers.origin;

  if (origin && ALLOWED_ORIGINS.includes(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin);
    res.setHeader("Vary", "Origin");
  }

  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,PATCH,PUT,DELETE,OPTIONS");

  if (req.method === "OPTIONS") {
    return res.sendStatus(204);
  }

  return next();
});

const authRoutes = require("./routes/auth.routes");
const userRoutes = require("./routes/user.routes");
const donorRoutes = require("./routes/donor.routes");
const donorRequestRoutes = require("./routes/donorRequest.routes");
const hospitalAuthRoutes = require("./routes/hospitalAuth.routes");
const bloodRequestRoutes = require("./routes/bloodRequest.routes");
const bloodBankAuthRoutes = require("./routes/bloodBankAuth.routes");
const bloodCampRoutes = require("./routes/bloodCamp.routes");
const adminRoutes = require("./routes/admin.routes");

app.use("/auth", authRoutes);
app.use("/users", userRoutes);
app.use("/donors", donorRoutes);
app.use("/donor-requests", donorRequestRoutes);
app.use("/hospitals", hospitalAuthRoutes);
app.use("/blood-requests", bloodRequestRoutes);
app.use("/blood-banks", bloodBankAuthRoutes);
app.use("/camps", bloodCampRoutes);
app.use("/admin", adminRoutes);

app.get("/", (req, res) => {
  res.json({ ok: true, message: "Blood Donation Management System API running" });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
