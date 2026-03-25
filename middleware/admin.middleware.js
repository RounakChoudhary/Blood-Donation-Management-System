module.exports = function adminMiddleware(req, res, next) {
  try {
    // req.user comes from authMiddleware
    if (!req.user) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    if (req.user.role !== "admin") {
      return res.status(403).json({ error: "Admin access required" });
    }

    next();
  } catch (err) {
    return res.status(500).json({ error: "Server error" });
  }
};