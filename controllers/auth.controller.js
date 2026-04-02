const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const User = require("../models/user.model");
const otpService = require("../services/otp.service");
const passwordResetService = require("../services/passwordReset.service");

const JWT_SECRET = process.env.JWT_SECRET;
const BCRYPT_ROUNDS = 12;

function isLocked(lockedUntil) {
  return Boolean(lockedUntil && new Date(lockedUntil).getTime() > Date.now());
}

function signToken(user) {
  if (!JWT_SECRET) {
    throw new Error("JWT_SECRET is not set");
  }

  return jwt.sign(
    {
      userId: user.id,
      role: user.role,
    },
    JWT_SECRET,
    { expiresIn: "24h" }
  );
}

async function register(req, res) {
  try {
    const { full_name, email, password, phone, lon, lat } = req.body;

    if (!full_name || !email || !password || !phone) {
      return res.status(400).json({ error: "Missing fields" });
    }

    const conflicts = [];

    const existingEmail = await User.getUserByEmail(email);
    if (existingEmail) {
      conflicts.push("email");
    }

    const existingPhone = await User.getUserByPhone(phone);
    if (existingPhone) {
      conflicts.push("phone");
    }

    if (conflicts.length > 0) {
      return res.status(409).json({
        error: `${conflicts.join(" and ")} already registered`,
      });
    }

    const password_hash = await bcrypt.hash(password, BCRYPT_ROUNDS);

    const user = await User.createUser({
      full_name,
      email,
      password_hash,
      phone,
      lon: lon ?? null,
      lat: lat ?? null,
      role: "user",
    });

    await otpService.issueEmailVerificationOtp(user);

    return res.status(201).json({
      message: "Registration successful. Verify the OTP sent to your email to activate your account.",
      user: {
        id: user.id,
        full_name: user.full_name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        email_verified: user.email_verified,
        is_active: user.is_active,
        created_at: user.created_at,
      },
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Server error" });
  }
}

async function login(req, res) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: "Missing fields" });
    }

    const user = await User.getUserByEmail(email);
    if (!user) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    if (isLocked(user.locked_until)) {
      return res.status(423).json({ error: "Account is locked. Try again later." });
    }

    if (!user.email_verified || !user.is_active) {
      return res.status(403).json({ error: "Account is not activated. Verify OTP first." });
    }

    const ok = await bcrypt.compare(password, user.password_hash);
    if (!ok) {
      await User.recordFailedLoginAttempt(user.id);
      return res.status(401).json({ error: "Invalid credentials" });
    }

    await User.resetLoginAttempts(user.id);

    const token = signToken(user);

    return res.status(200).json({
      token,
      user: {
        id: user.id,
        full_name: user.full_name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        created_at: user.created_at,
      },
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Server error" });
  }
}

async function verifyOtp(req, res) {
  try {
    const { email, otp } = req.body;
    const result = await otpService.verifyEmailVerificationOtp({ email, otp });

    if (!result.ok) {
      return res.status(result.status).json({ error: result.error });
    }

    return res.status(result.status).json({
      message: result.already_verified
        ? "Account is already verified"
        : "OTP verified successfully. Account activated.",
      user: {
        id: result.user.id,
        full_name: result.user.full_name,
        email: result.user.email,
        phone: result.user.phone,
        role: result.user.role,
        email_verified: result.user.email_verified,
        is_active: result.user.is_active,
        created_at: result.user.created_at,
      },
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Server error" });
  }
}

async function forgotPassword(req, res) {
  try {
    const result = await passwordResetService.requestPasswordReset({
      email: req.body.email,
    });

    if (!result.ok) {
      return res.status(result.status).json({ error: result.error });
    }

    return res.status(result.status).json({
      message: result.message,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Server error" });
  }
}

async function resetPassword(req, res) {
  try {
    const result = await passwordResetService.resetPassword({
      token: req.body.token,
      new_password: req.body.new_password,
    });

    if (!result.ok) {
      return res.status(result.status).json({ error: result.error });
    }

    return res.status(result.status).json({
      message: result.message,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Server error" });
  }
}

module.exports = { register, login, verifyOtp, forgotPassword, resetPassword };
