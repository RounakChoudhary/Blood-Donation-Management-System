const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const Hospital = require("../models/hospital.model");
const {
  validateEmail,
  validatePhone,
  validateCoordinates,
  validateRequiredText,
} = require("../utils/validation");

const JWT_SECRET = process.env.JWT_SECRET;
const BCRYPT_ROUNDS = 12;
const ALLOWED_HOSPITAL_TYPES = new Set(["Government", "Private", "Trust"]);

function isLocked(lockedUntil) {
  return Boolean(lockedUntil && new Date(lockedUntil).getTime() > Date.now());
}

function normalizeHospitalType(value) {
  if (!value || typeof value !== "string") return null;
  const normalized = value.trim().toLowerCase();
  if (normalized === "government") return "Government";
  if (normalized === "private") return "Private";
  if (normalized === "trust") return "Trust";
  return null;
}

async function registerHospital({
  name,
  phone,
  email,
  address,
  license_number,
  emergency_contact_phone,
  hospital_type,
  lon,
  lat,
}) {
  const nameValidation = validateRequiredText(name, "name");
  if (!nameValidation.isValid) {
    return { ok: false, status: 400, error: nameValidation.error };
  }

  const phoneValidation = validatePhone(phone);
  if (!phoneValidation.isValid) {
    return { ok: false, status: 400, error: phoneValidation.error };
  }

  const emailValidation = validateEmail(email);
  if (!emailValidation.isValid) {
    return { ok: false, status: 400, error: emailValidation.error };
  }

  const addressValidation = validateRequiredText(address, "address", 5);
  if (!addressValidation.isValid) {
    return { ok: false, status: 400, error: addressValidation.error };
  }

  const licenseValidation = validateRequiredText(license_number, "license_number", 4);
  if (!licenseValidation.isValid) {
    return { ok: false, status: 400, error: licenseValidation.error };
  }

  const emergencyPhoneValidation = validatePhone(emergency_contact_phone);
  if (!emergencyPhoneValidation.isValid) {
    return { ok: false, status: 400, error: `emergency_contact_phone: ${emergencyPhoneValidation.error}` };
  }

  const normalizedHospitalType = normalizeHospitalType(hospital_type);
  if (!normalizedHospitalType || !ALLOWED_HOSPITAL_TYPES.has(normalizedHospitalType)) {
    return { ok: false, status: 400, error: "hospital_type must be Government, Private, or Trust" };
  }

  const coordValidation = validateCoordinates(lat, lon);
  if (!coordValidation.isValid) {
    return { ok: false, status: 400, error: coordValidation.error };
  }

  if (emergencyPhoneValidation.value === phoneValidation.value) {
    return { ok: false, status: 400, error: "emergency_contact_phone must be different from phone" };
  }

  const existingPhone = await Hospital.getHospitalByPhone(phoneValidation.value);
  if (existingPhone) {
    return { ok: false, status: 409, error: "phone already registered" };
  }
  
  const existingEmail = await Hospital.getHospitalByEmail(emailValidation.value);
  if (existingEmail) {
    return { ok: false, status: 409, error: "email already registered" };
  }

  const existingLicense = await Hospital.getHospitalByLicenseNumber(licenseValidation.value);
  if (existingLicense) {
    return { ok: false, status: 409, error: "license_number already registered" };
  }

  const hospital = await Hospital.createHospital({
    name: nameValidation.value,
    phone: phoneValidation.value,
    email: emailValidation.value,
    address: addressValidation.value,
    license_number: licenseValidation.value,
    emergency_contact_phone: emergencyPhoneValidation.value,
    hospital_type: normalizedHospitalType,
    lon: coordValidation.lon,
    lat: coordValidation.lat,
  });

  return {
    ok: true,
    status: 201,
    hospital,
  };
}

async function listPendingHospitals({ limit = 50, offset = 0 }) {
  const hospitals = await Hospital.getHospitalsByStatus(
    "pending",
    Number(limit),
    Number(offset)
  );

  return {
    ok: true,
    status: 200,
    hospitals,
  };
}

async function verifyHospital({ hospital_id }) {
  const id = Number(hospital_id);
  if (!Number.isInteger(id) || id <= 0) {
    return { ok: false, status: 400, error: "Invalid hospital id" };
  }

  const existing = await Hospital.getHospitalById(id);
  if (!existing) {
    return { ok: false, status: 404, error: "Hospital not found" };
  }

  if (existing.onboarding_status === "verified") {
    return { ok: true, status: 200, hospital: existing };
  }

  const hospital = await Hospital.updateHospitalStatus(id, 'verified');
  if (!hospital) {
    return { ok: false, status: 404, error: "Hospital not found" };
  }

  return {
    ok: true,
    status: 200,
    hospital,
  };
}

async function setupHospitalAuth({ hospital_id, email, password }) {
  if (!email || !password) {
    return { ok: false, status: 400, error: "Missing fields" };
  }

  const id = Number(hospital_id);
  if (!Number.isInteger(id) || id <= 0) {
    return { ok: false, status: 400, error: "Invalid hospital id" };
  }

  const existing = await Hospital.getHospitalById(id);
  if (!existing) {
    return { ok: false, status: 404, error: "Hospital not found" };
  }

  if (existing.onboarding_status !== "verified") {
    return { ok: false, status: 403, error: "Hospital is not verified yet" };
  }

  const emailInUse = await Hospital.getHospitalByEmail(email);
  if (emailInUse && emailInUse.id !== id) {
    return { ok: false, status: 409, error: "email already registered" };
  }

  const password_hash = await bcrypt.hash(password, BCRYPT_ROUNDS);

  const hospital = await Hospital.setHospitalAuth({
    hospitalId: id,
    email,
    password_hash,
  });

  if (!hospital) {
    return { ok: false, status: 404, error: "Hospital not found" };
  }

  return {
    ok: true,
    status: 200,
    hospital,
  };
}

async function loginHospital({ email, password }) {
  if (!email || !password) {
    return { ok: false, status: 400, error: "Missing fields" };
  }

  const hospital = await Hospital.getHospitalByEmail(email);
  if (!hospital) {
    return { ok: false, status: 401, error: "Invalid credentials" };
  }

  if (isLocked(hospital.locked_until)) {
    return { ok: false, status: 423, error: "Account is locked. Try again later." };
  }

  if (hospital.onboarding_status !== "verified") {
    return { ok: false, status: 403, error: "Hospital is not verified yet" };
  }

  if (!hospital.password_hash) {
    return { ok: false, status: 403, error: "Hospital login is not configured" };
  }

  const ok = await bcrypt.compare(password, hospital.password_hash);
  if (!ok) {
    await Hospital.recordFailedLoginAttempt(hospital.id);
    return { ok: false, status: 401, error: "Invalid credentials" };
  }

  await Hospital.resetLoginAttempts(hospital.id);

  const token = jwt.sign(
    {
      hospitalId: hospital.id,
      actorType: "hospital",
      isVerified: true,
    },
    JWT_SECRET,
    { expiresIn: "24h" }
  );

  return {
    ok: true,
    status: 200,
    token,
    hospital: {
      id: hospital.id,
      name: hospital.name,
      email: hospital.email,
    },
  };
}

module.exports = {
  registerHospital,
  listPendingHospitals,
  verifyHospital,
  setupHospitalAuth,
  loginHospital,
};
