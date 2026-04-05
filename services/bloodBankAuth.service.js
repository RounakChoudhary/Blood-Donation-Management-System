const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const BloodBank = require("../models/bloodBank.model");

const JWT_SECRET = process.env.JWT_SECRET;
const BCRYPT_ROUNDS = 12;

function isLocked(lockedUntil) {
  return Boolean(lockedUntil && new Date(lockedUntil).getTime() > Date.now());
}

async function registerBloodBank({
  name,
  license_number,
  address,
  lon,
  lat,
  contact_person,
  contact_phone,
  email,
  operating_hours,
  facilities,
}) {
  if (!name || !license_number || !address || !contact_person || !contact_phone || !email) {
    return { ok: false, status: 400, error: "Missing required fields" };
  }

  if (
    lon === undefined ||
    lat === undefined ||
    Number.isNaN(Number(lon)) ||
    Number.isNaN(Number(lat))
  ) {
    return { ok: false, status: 400, error: "Valid lon and lat are required" };
  }

  const existingByLicense = await BloodBank.getBloodBankByLicenseNumber(license_number);
  if (existingByLicense) {
    return { ok: false, status: 409, error: "License number already registered" };
  }

  const existingByEmail = await BloodBank.getBloodBankByEmail(email);
  if (existingByEmail) {
    return { ok: false, status: 409, error: "Email already registered" };
  }

  const bloodBank = await BloodBank.createBloodBank({
    name,
    license_number,
    address,
    lon: Number(lon),
    lat: Number(lat),
    contact_person,
    contact_phone,
    email,
    operating_hours,
    facilities,
  });

  return {
    ok: true,
    status: 201,
    bloodBank,
  };
}

async function setupBloodBankAuth({ blood_bank_id, email, password }) {
  if (!email || !password) {
    return { ok: false, status: 400, error: "Missing fields" };
  }

  const id = Number(blood_bank_id);
  if (!Number.isInteger(id) || id <= 0) {
    return { ok: false, status: 400, error: "Invalid blood bank id" };
  }

  const existing = await BloodBank.getBloodBankById(id);
  if (!existing) {
    return { ok: false, status: 404, error: "Blood bank not found" };
  }

  if (existing.onboarding_status !== "verified") {
    return { ok: false, status: 403, error: "Blood bank is not verified yet" };
  }

  const emailInUse = await BloodBank.getBloodBankByEmail(email);
  if (emailInUse && emailInUse.id !== id) {
    return { ok: false, status: 409, error: "Email already registered" };
  }

  const password_hash = await bcrypt.hash(password, BCRYPT_ROUNDS);

  const bloodBank = await BloodBank.setBloodBankAuth({
    bloodBankId: id,
    email,
    password_hash,
  });

  if (!bloodBank) {
    return { ok: false, status: 404, error: "Blood bank not found" };
  }

  return { ok: true, status: 200, bloodBank };
}

async function loginBloodBank({ email, password }) {
  if (!email || !password) {
    return { ok: false, status: 400, error: "Missing fields" };
  }

  const bloodBank = await BloodBank.getBloodBankByEmail(email);
  if (!bloodBank) {
    return { ok: false, status: 401, error: "Invalid credentials" };
  }

  if (isLocked(bloodBank.locked_until)) {
    return { ok: false, status: 423, error: "Account is locked. Try again later." };
  }

  if (bloodBank.onboarding_status !== "verified") {
    return { ok: false, status: 403, error: "Blood bank is not verified yet" };
  }

  if (!bloodBank.password_hash) {
    return { ok: false, status: 403, error: "Blood bank login is not configured" };
  }

  const ok = await bcrypt.compare(password, bloodBank.password_hash);
  if (!ok) {
    await BloodBank.recordFailedLoginAttempt(bloodBank.id);
    return { ok: false, status: 401, error: "Invalid credentials" };
  }

  await BloodBank.resetLoginAttempts(bloodBank.id);

  const token = jwt.sign(
    {
      bloodBankId: bloodBank.id,
      actorType: "bloodbank",
      isVerified: true,
    },
    JWT_SECRET,
    { expiresIn: "24h" }
  );

  return {
    ok: true,
    status: 200,
    token,
    bloodBank: {
      id: bloodBank.id,
      name: bloodBank.name,
      email: bloodBank.email,
    },
  };
}

module.exports = {
  registerBloodBank,
  setupBloodBankAuth,
  loginBloodBank,
};
