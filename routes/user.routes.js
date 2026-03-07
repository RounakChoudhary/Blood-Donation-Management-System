const express = require("express");
const router = express.Router();

const auth = require("../middleware/auth.middleware");
const requireRole = require("../middleware/requireRole");
const User = require("../models/user.model");

/**
 * GET /users/me
 * Returns the authenticated user's profile.
 * Requires valid JWT authentication.
 */
router.get("/me", auth, async (req, res) => {
  try {
    const user = await User.getUserById(req.user.id);

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    return res.json({ user });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Server error" });
  }
});

/**
 * GET /users/admin/ping
 * Health-check endpoint to verify admin role access.
 * Accessible only by users with role = admin.
 */
router.get("/admin/ping", auth, requireRole("admin"), (req, res) => {
  return res.json({
    ok: true,
    message: "Admin access works",
    user: req.user,
  });
});

module.exports = router;