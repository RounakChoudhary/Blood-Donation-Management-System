const jwt = require("jsonwebtoken");

const JWT_SECRET = process.env.JWT_SECRET;

const userModel = require("../models/user.model");

async function authMiddleware(req, res, next) {
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

    // Verify user still exists and is not soft-deleted
    const userExists = await userModel.getUserById(decoded.userId);
    if (!userExists || !userExists.is_active) {
      return res.status(403).json({ error: "Account deleted or inactive" });
    }

    req.userId = decoded.userId;
    req.user = {
      id: decoded.userId,
      role: userExists.role,
    };

    next();
  } catch (err) {
    return res.status(401).json({ error: "Invalid or expired token" });
  }
}

module.exports = authMiddleware;
