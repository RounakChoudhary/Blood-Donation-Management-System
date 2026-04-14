const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const pool = require("../models/db");
const User = require("../models/user.model");
const Donor = require("../models/donor.model");
const otpService = require("../services/otp.service");
const passwordResetService = require("../services/passwordReset.service");
const {
  validateEmail,
  validatePhone,
  validatePassword,
  validateRequiredText,
  validateCoordinates,
  validateDateOfBirth,
  validateBloodGroup,
} = require("../utils/validation");

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
    const {
      full_name,
      email,
      password,
      phone,
      lon,
      lat,
      date_of_birth,
      blood_group,
      address,
      emergency_contact_name,
      emergency_contact_phone,
    } = req.body;

    const nameValidation = validateRequiredText(full_name, "full_name");
    if (!nameValidation.isValid) {
      return res.status(400).json({ error: nameValidation.error });
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

    const coordValidation = validateCoordinates(lat, lon);
    if (!coordValidation.isValid) {
      return res.status(400).json({ error: coordValidation.error });
    }

    const dobValidation = validateDateOfBirth(date_of_birth);
    if (!dobValidation.isValid) {
      return res.status(400).json({ error: dobValidation.error });
    }

    const bloodGroupValidation = validateBloodGroup(blood_group);
    if (!bloodGroupValidation.isValid) {
      return res.status(400).json({ error: bloodGroupValidation.error });
    }

    const addressValidation = validateRequiredText(address, "address", 5);
    if (!addressValidation.isValid) {
      return res.status(400).json({ error: addressValidation.error });
    }

    const emergencyNameValidation = validateRequiredText(
      emergency_contact_name,
      "emergency_contact_name"
    );
    if (!emergencyNameValidation.isValid) {
      return res.status(400).json({ error: emergencyNameValidation.error });
    }

    const emergencyPhoneValidation = validatePhone(emergency_contact_phone);
    if (!emergencyPhoneValidation.isValid) {
      return res.status(400).json({ error: `emergency_contact_phone: ${emergencyPhoneValidation.error}` });
    }

    if (emergencyPhoneValidation.value === phoneValidation.value) {
      return res.status(400).json({ error: "emergency_contact_phone must be different from phone" });
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

    const client = await pool.connect();
    let user;
    let donor;

    try {
      await client.query("BEGIN");

      user = await User.createUser({
        full_name: nameValidation.value,
        email: emailValidation.value,
        password_hash,
        phone: phoneValidation.value,
        lon: coordValidation.lon,
        lat: coordValidation.lat,
        role: "user",
      }, client);

      donor = await Donor.createDonor({
        user_id: user.id,
        blood_group: bloodGroupValidation.value,
        date_of_birth: dobValidation.value,
        address: addressValidation.value,
        emergency_contact_name: emergencyNameValidation.value,
        emergency_contact_phone: emergencyPhoneValidation.value,
      }, client);

      await client.query("COMMIT");
    } catch (transactionError) {
      await client.query("ROLLBACK");
      throw transactionError;
    } finally {
      client.release();
    }

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
      donor: {
        id: donor.id,
        blood_group: donor.blood_group,
        date_of_birth: donor.date_of_birth,
        address: donor.address,
        emergency_contact_name: donor.emergency_contact_name,
        emergency_contact_phone: donor.emergency_contact_phone,
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

    const donor = await Donor.getDonorByUserId(result.user.id);

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
      donor: donor
        ? {
            id: donor.id,
            blood_group: donor.blood_group,
          }
        : null,
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
