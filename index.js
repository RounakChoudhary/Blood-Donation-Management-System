require("dns").setDefaultResultOrder("ipv4first");
const express = require("express");
const cors = require("cors");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 3000;

require("./models/db");

const requestContext = require("./middleware/requestContext.middleware");
const requestLogger = require("./middleware/requestLogger.middleware");
const { startBackgroundJobs } = require("./services/scheduler.service");

// Railway sits behind a proxy, so trust the first forwarded hop for IP-based middleware.
app.set("trust proxy", 1);

function normalizeOrigin(origin) {
  return String(origin || "").trim().replace(/\/$/, "");
}

const allowedOrigins = [
  process.env.FRONTEND_URL,
  "http://localhost:5173",
].map(normalizeOrigin).filter(Boolean);

function isAllowedVercelOrigin(origin) {
  const allowVercelPreviews = String(process.env.ALLOW_VERCEL_PREVIEW_ORIGINS || "false")
    .toLowerCase() === "true";

  if (!allowVercelPreviews) {
    return false;
  }

  try {
    const { hostname } = new URL(origin);
    return hostname.endsWith(".vercel.app");
  } catch {
    return false;
  }
}

const corsOptions = {
  origin(origin, callback) {
    if (!origin) {
      return callback(null, true);
    }

    const normalizedOrigin = normalizeOrigin(origin);
    if (allowedOrigins.includes(normalizedOrigin) || isAllowedVercelOrigin(normalizedOrigin)) {
      return callback(null, true);
    }

    return callback(new Error(`CORS origin not allowed: ${origin}`));
  },
  credentials: true,
  optionsSuccessStatus: 204,
};

app.use(express.json());
app.use(cors(corsOptions));
app.options(/.*/, cors(corsOptions));
app.use(requestContext);
app.use(requestLogger);

const authRoutes = require("./routes/auth.routes");
const userRoutes = require("./routes/user.routes");
const donorRoutes = require("./routes/donor.routes");
const donorRequestRoutes = require("./routes/donorRequest.routes");
const hospitalAuthRoutes = require("./routes/hospitalAuth.routes");
const bloodRequestRoutes = require("./routes/bloodRequest.routes");
const bloodBankAuthRoutes = require("./routes/bloodBankAuth.routes");
const bloodBankRoutes = require("./routes/bloodBank.routes");
const bloodCampRoutes = require("./routes/bloodCamp.routes");
const adminRoutes = require("./routes/admin.routes");
const apiRoutes = require("./routes/api.routes");
const systemRoutes = require("./routes/system.routes");

app.use("/", systemRoutes);
app.use("/auth", authRoutes);
app.use("/users", userRoutes);
app.use("/donors", donorRoutes);
app.use("/donor-requests", donorRequestRoutes);
app.use("/hospitals", hospitalAuthRoutes);
app.use("/blood-requests", bloodRequestRoutes);
app.use("/blood-banks", bloodBankAuthRoutes);
app.use("/blood-banks", bloodBankRoutes);
app.use("/camps", bloodCampRoutes);
app.use("/admin", adminRoutes);
app.use("/api", apiRoutes);

app.get("/", (req, res) => {
  res.json({ ok: true, message: "Blood Donation Management System API running" });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  startBackgroundJobs();
});
