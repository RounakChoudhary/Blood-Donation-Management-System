const express = require("express");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 3000;

require("./models/db");

app.use(express.json());

const authRoutes = require("./routes/auth.routes");
const userRoutes = require("./routes/user.routes");
const donorRoutes = require("./routes/donor.routes");
const donorRequestRoutes = require("./routes/donorRequest.routes");
const hospitalAuthRoutes = require("./routes/hospitalAuth.routes");
const bloodRequestRoutes = require("./routes/bloodRequest.routes");
const bloodBankAuthRoutes = require("./routes/bloodBankAuth.routes");

app.use("/auth", authRoutes);
app.use("/users", userRoutes);
app.use("/donors", donorRoutes);
app.use("/donor-requests", donorRequestRoutes);
app.use("/hospitals", hospitalAuthRoutes);
app.use("/blood-requests", bloodRequestRoutes);
app.use("/blood-banks", bloodBankAuthRoutes);

app.get("/", (req, res) => {
  res.json({ ok: true, message: "Blood Donation Management System API running" });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});