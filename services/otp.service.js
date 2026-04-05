const bcrypt = require("bcrypt");
const crypto = require("crypto");

const OtpToken = require("../models/otpToken.model");
const User = require("../models/user.model");
const { sendOtpEmail } = require("./email.service");

const OTP_PURPOSE = "email_verification";
const OTP_TTL_MINUTES = Number(process.env.OTP_TTL_MINUTES || 10);
const BCRYPT_ROUNDS = Number(process.env.BCRYPT_ROUNDS || 12);

function generateOtpCode() {
  return crypto.randomInt(0, 1000000).toString().padStart(6, "0");
}

function buildExpiryDate() {
  const expiresAt = new Date();
  expiresAt.setMinutes(expiresAt.getMinutes() + OTP_TTL_MINUTES);
  return expiresAt;
}

async function issueEmailVerificationOtp(user) {
  const otp = generateOtpCode();
  const otp_hash = await bcrypt.hash(otp, BCRYPT_ROUNDS);
  const expires_at = buildExpiryDate();

  await OtpToken.invalidateActiveTokens({
    user_id: user.id,
    purpose: OTP_PURPOSE,
  });

  await OtpToken.createOtpToken({
    user_id: user.id,
    purpose: OTP_PURPOSE,
    otp_hash,
    expires_at,
  });

  await sendOtpEmail({
    to: user.email,
    otp,
    expiresInMinutes: OTP_TTL_MINUTES,
  });

  return {
    expires_at,
  };
}

async function verifyEmailVerificationOtp({ email, otp }) {
  if (!email || !otp) {
    return { ok: false, status: 400, error: "Email and otp are required" };
  }

  const user = await User.getUserByEmail(email);
  if (!user) {
    return { ok: false, status: 404, error: "User not found" };
  }

  if (user.email_verified && user.is_active) {
    return {
      ok: true,
      status: 200,
      user,
      already_verified: true,
    };
  }

  const token = await OtpToken.getLatestActiveToken({
    user_id: user.id,
    purpose: OTP_PURPOSE,
  });

  if (!token) {
    return { ok: false, status: 400, error: "OTP expired or not found" };
  }

  const matches = await bcrypt.compare(String(otp), token.otp_hash);
  if (!matches) {
    return { ok: false, status: 400, error: "Invalid OTP" };
  }

  await OtpToken.consumeOtpToken(token.id);
  const activatedUser = await User.activateUser(user.id);

  return {
    ok: true,
    status: 200,
    user: activatedUser,
    already_verified: false,
  };
}

module.exports = {
  issueEmailVerificationOtp,
  verifyEmailVerificationOtp,
};
