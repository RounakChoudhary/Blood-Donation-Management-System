const bcrypt = require("bcrypt");
const crypto = require("crypto");

const PasswordResetToken = require("../models/passwordResetToken.model");
const User = require("../models/user.model");
const { sendPasswordResetEmail } = require("./email.service");

const RESET_TOKEN_TTL_MINUTES = Number(process.env.PASSWORD_RESET_TTL_MINUTES || 30);
const BCRYPT_ROUNDS = 12;

function buildRawToken() {
  return crypto.randomBytes(32).toString("hex");
}

function hashToken(rawToken) {
  return crypto.createHash("sha256").update(rawToken).digest("hex");
}

function buildExpiryDate() {
  const expiresAt = new Date();
  expiresAt.setMinutes(expiresAt.getMinutes() + RESET_TOKEN_TTL_MINUTES);
  return expiresAt;
}

async function requestPasswordReset({ email }) {
  if (!email) {
    return { ok: false, status: 400, error: "Email is required" };
  }

  const user = await User.getUserByEmail(email);
  if (!user || !user.is_active || !user.email_verified) {
    return {
      ok: true,
      status: 200,
      message: "If the account exists, a password reset link has been sent.",
    };
  }

  const rawToken = buildRawToken();
  const token_hash = hashToken(rawToken);
  const expires_at = buildExpiryDate();

  await PasswordResetToken.invalidateActiveTokens({
    actor_type: "user",
    user_or_hospital_id: user.id,
  });

  await PasswordResetToken.createPasswordResetToken({
    actor_type: "user",
    user_or_hospital_id: user.id,
    token_hash,
    expires_at,
  });

  await sendPasswordResetEmail({
    to: user.email,
    token: rawToken,
    expiresInMinutes: RESET_TOKEN_TTL_MINUTES,
  });

  return {
    ok: true,
    status: 200,
    message: "If the account exists, a password reset link has been sent.",
  };
}

async function resetPassword({ token, new_password }) {
  if (!token || !new_password) {
    return { ok: false, status: 400, error: "token and new_password are required" };
  }

  const token_hash = hashToken(token);
  const resetToken = await PasswordResetToken.getActiveTokenByHash(token_hash);
  if (!resetToken) {
    return { ok: false, status: 400, error: "Reset token is invalid, expired, or already used" };
  }

  if (resetToken.actor_type !== "user") {
    return { ok: false, status: 400, error: "Unsupported reset token type" };
  }

  const password_hash = await bcrypt.hash(new_password, BCRYPT_ROUNDS);
  const updatedUser = await User.updatePasswordById({
    userId: resetToken.user_or_hospital_id,
    password_hash,
  });

  if (!updatedUser) {
    return { ok: false, status: 404, error: "User not found" };
  }

  await PasswordResetToken.consumePasswordResetToken(resetToken.id);
  await User.resetLoginAttempts(updatedUser.id);

  return {
    ok: true,
    status: 200,
    message: "Password updated successfully",
  };
}

module.exports = {
  requestPasswordReset,
  resetPassword,
};
