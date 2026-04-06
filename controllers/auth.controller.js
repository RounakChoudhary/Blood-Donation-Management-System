const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const User = require("../models/user.model");
const otpService = require("../services/otp.service");
const passwordResetService = require("../services/passwordReset.service");
const { validateEmail, validatePhone, validatePassword, validateCoordinates } = require("../utils/validation");

const JWT_SECRET = process.env.JWT_SECRET;
const BCRYPT_ROUNDS = Number(process.env.BCRYPT_ROUNDS || 12);

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

    // Validate required fields
    if (!full_name || typeof full_name !== 'string' || full_name.trim().length < 2) {
      return res.status(400).json({ error: "Full name is required and must be at least 2 characters" });
    }

    const emailValidation = validateEmail(email);
    if (!emailValidation.isValid) {
      return res.status(400).json({ error: emailValidation.error });
    }

    const passwordValidation = validatePassword(password);
    if (!passwordValidation.isValid) {
      return res.status(400).json({ error: passwordValidation.error });
    }

    const phoneValidation = validatePhone(phone);
    if (!phoneValidation.isValid) {
      return res.status(400).json({ error: phoneValidation.error });
    }

    // Validate coordinates if provided
    let validatedLat = null;
    let validatedLon = null;
    if (lon !== undefined && lat !== undefined) {
      const coordValidation = validateCoordinates(lat, lon);
      if (!coordValidation.isValid) {
        return res.status(400).json({ error: coordValidation.error });
      }
      validatedLat = coordValidation.lat;
      validatedLon = coordValidation.lon;
    }

    const conflicts = [];

    const existingEmail = await User.getUserByEmail(emailValidation.value);
    if (existingEmail) {
      conflicts.push("email");
    }

    const existingPhone = await User.getUserByPhone(phoneValidation.value);
    if (existingPhone) {
      conflicts.push("phone");
    }

    if (conflicts.length > 0) {
      return res.status(409).json({
        error: `${conflicts.join(" and ")} already registered`,
      });
    }

    const password_hash = await bcrypt.hash(passwordValidation.value, BCRYPT_ROUNDS);

    const user = await User.createUser({
      full_name: full_name.trim(),
      email: emailValidation.value,
      password_hash,
      phone: phoneValidation.value,
      lon: validatedLon,
      lat: validatedLat,
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

    const emailValidation = validateEmail(email);
    if (!emailValidation.isValid) {
      return res.status(400).json({ error: emailValidation.error });
    }

    const passwordValidation = validatePassword(password);
    if (!passwordValidation.isValid) {
      return res.status(400).json({ error: passwordValidation.error });
    }

    const user = await User.getUserByEmail(emailValidation.value);
    if (!user) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    if (isLocked(user.locked_until)) {
      return res.status(423).json({ error: "Account is locked due to too many failed login attempts" });
    }

    const passwordMatches = await bcrypt.compare(passwordValidation.value, user.password_hash);
    if (!passwordMatches) {
      // Increment failed attempts (assuming User model handles this)
      await User.recordFailedLoginAttempt(user.id);
      return res.status(401).json({ error: "Invalid credentials" });
    }

    // Reset failed attempts on successful login
    await User.resetLoginAttempts(user.id);

    if (!user.email_verified || !user.is_active || user.access_status !== "active") {
      return res.status(403).json({ error: "Account not verified or inactive" });
    }

    const token = signToken(user);

    return res.json({
      message: "Login successful",
      token,
      user: {
        id: user.id,
        full_name: user.full_name,
        email: user.email,
        role: user.role,
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
