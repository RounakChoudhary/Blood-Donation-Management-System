const express = require("express");
const router = express.Router();
const {
  register,
  login,
  verifyOtp,
  forgotPassword,
  resetPassword,
} = require("../controllers/auth.controller");
const { otpLimiter, loginLimiter } = require("../middleware/rateLimit.middleware");

router.post("/register", otpLimiter, register); // Rate limit OTP-related
router.post("/login", loginLimiter, login);
router.post("/verify-otp", otpLimiter, verifyOtp); // Also rate limit verify
router.post("/forgot-password", otpLimiter, forgotPassword);
router.post("/reset-password", loginLimiter, resetPassword); // Similar to login

module.exports = router;
