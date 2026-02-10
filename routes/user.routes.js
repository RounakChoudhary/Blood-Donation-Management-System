const express = require("express");
const router = express.Router();

const authMiddleware = require("../middleware/auth.middleware");
const User = require("../models/user.model");

/**
 * GET /users/me
 * Returns logged-in user's profile
 */
router.get("/me", authMiddleware, async (req, res) => {
  try {
    const user = await User.getUserById(req.userId);

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json(user);

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;