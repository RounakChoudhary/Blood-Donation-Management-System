const express = require("express");
const router = express.Router();

const auth = require("../middleware/auth.middleware");
const requireRole = require("../middleware/requireRole");
const { loginLimiter, bloodRequestLimiter } = require("../middleware/rateLimit.middleware");
const {
  register,
  listPending,
  verify,
  setupAuth,
  login,
} = require("../controllers/hospitalAuth.controller");

router.post("/register", bloodRequestLimiter, register);
router.post("/login", loginLimiter, login);
router.get("/pending", auth, requireRole("admin"), listPending);
router.post("/:id/verify", auth, requireRole("admin"), verify);
router.post("/:id/setup-auth", auth, requireRole("admin"), setupAuth);

module.exports = router;
