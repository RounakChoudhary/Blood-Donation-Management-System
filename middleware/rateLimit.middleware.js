// middleware/rateLimit.middleware.js
// Rate limiting middleware for BDMS backend security.
// Implements IP-based rate limiting for sensitive endpoints to prevent abuse.
// Based on SRS requirements: OTP (5/min), login (10/hour), requests (10/hour/hospital).

const rateLimit = require("express-rate-limit");

// OTP rate limit: 5 requests per minute per IP
const otpLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 5, // 5 requests
  message: {
    error: "Too many OTP requests. Please wait 1 minute before trying again.",
  },
  standardHeaders: true, // Return rate limit info in `RateLimit-*` headers
  legacyHeaders: false, // Disable `X-RateLimit-*` headers
});

// Login rate limit: 10 requests per hour per IP
const loginLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 200, // 200 requests
  message: {
    error: "Too many login attempts. Please wait 1 hour before trying again.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Blood request rate limit: 10 requests per hour per IP (for hospitals, but IP-based as proxy)
const bloodRequestLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10, // 10 requests
  message: {
    error: "Too many blood request attempts. Please wait 1 hour before trying again.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

module.exports = {
  otpLimiter,
  loginLimiter,
  bloodRequestLimiter,
};
