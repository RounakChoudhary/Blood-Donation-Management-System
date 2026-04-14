const express = require("express");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 5000;

require("./models/db");

const requestContext = require("./middleware/requestContext.middleware");
const requestLogger = require("./middleware/requestLogger.middleware");

app.use(express.json());
app.use(requestContext);
app.use(requestLogger);

// Local-dev friendly CORS support.
// Explicit origins can be configured via ALLOWED_ORIGINS (comma-separated).
const cors = require("cors");

const cors = require("cors");

app.use(
  cors({
    origin: true,
    credentials: true,
  })
);

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
const { startBackgroundJobs } = require("./services/scheduler.service");

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
