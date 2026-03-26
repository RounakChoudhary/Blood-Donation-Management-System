const jwt = require("jsonwebtoken");
const Hospital = require("../models/hospital.model");

const JWT_SECRET = process.env.JWT_SECRET;

async function hospitalAuth(req, res, next) {
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

    if (decoded.actorType !== "hospital") {
      return res.status(403).json({ error: "Hospital access required" });
    }

    const hospital = await Hospital.getHospitalById(decoded.hospitalId);
    if (!hospital) {
      return res.status(403).json({ error: "Hospital account not found or inactive" });
    }

    if (!decoded.isVerified || hospital.onboarding_status !== "verified") {
      return res.status(403).json({ error: "Only verified hospitals can access this route" });
    }

    req.hospital = {
      id: hospital.id,
      actorType: decoded.actorType,
      isVerified: true,
    };

    next();
  } catch (err) {
    return res.status(401).json({ error: "Invalid or expired token" });
  }
}

module.exports = hospitalAuth;
