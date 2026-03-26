const express = require("express");
const router = express.Router();
const { register, login, verifyOtp } = require("../controllers/auth.controller");

router.post("/register", register);
router.post("/login", login);
router.post("/verify-otp", verifyOtp);

module.exports = router;
