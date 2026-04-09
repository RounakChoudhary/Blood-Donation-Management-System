const jwt = require("jsonwebtoken");
const BloodBank = require("../models/bloodBank.model");

const JWT_SECRET = process.env.JWT_SECRET;

async function bloodBankAuth(req, res, next) {
  try {
    if (!JWT_SECRET) {
      return res.status(500).json({ error: "JWT_SECRET is not configured" });
    }

    const header = req.headers.authorization;
    if (!header) {
      return res.status(401).json({ error: "No token provided" });
    }

    const parts = header.split(" ");
    if (parts.length !== 2 || parts[0] !== "Bearer") {
      return res.status(401).json({ error: "Invalid token format" });
    }

    const token = parts[1];
    const decoded = jwt.verify(token, JWT_SECRET);

    if (decoded.actorType !== "bloodbank") {
      return res.status(403).json({ error: "Blood bank access required" });
    }

    const bloodBank = await BloodBank.getBloodBankById(decoded.bloodBankId);
    if (!bloodBank) {
      return res.status(403).json({ error: "Blood bank account not found or inactive" });
    }

    if (!decoded.isVerified || bloodBank.onboarding_status !== "verified") {
      return res.status(403).json({ error: "Only verified blood banks can access this route" });
    }

    req.bloodBank = {
      id: bloodBank.id,
      actorType: decoded.actorType,
      isVerified: true,
    };
    req.actor = {
      id: bloodBank.id,
      role: "bloodbank",
      actorType: "bloodbank",
    };

    next();
  } catch (err) {
    return res.status(401).json({ error: "Invalid or expired token" });
  }
}

module.exports = bloodBankAuth;
