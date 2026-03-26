const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const Hospital = require("../models/hospital.model");

const JWT_SECRET = process.env.JWT_SECRET;
const BCRYPT_ROUNDS = 12;

async function registerHospital({ name, phone, address, lon, lat }) {
  if (!name || !phone) {
    return { ok: false, status: 400, error: "Missing fields" };
  }

  if (
    lon === undefined ||
    lat === undefined ||
    Number.isNaN(Number(lon)) ||
    Number.isNaN(Number(lat))
  ) {
    return { ok: false, status: 400, error: "Valid lon and lat are required" };
  }

  const existingPhone = await Hospital.getHospitalByPhone(phone);
  if (existingPhone) {
    return { ok: false, status: 409, error: "phone already registered" };
  }

  const hospital = await Hospital.createHospital({
    name,
    phone,
    address: address ?? null,
    lon: Number(lon),
    lat: Number(lat),
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

  if (hospital.onboarding_status !== "verified") {
    return { ok: false, status: 403, error: "Hospital is not verified yet" };
  }

  if (!hospital.password_hash) {
    return { ok: false, status: 403, error: "Hospital login is not configured" };
  }

  const ok = await bcrypt.compare(password, hospital.password_hash);
  if (!ok) {
    return { ok: false, status: 401, error: "Invalid credentials" };
  }

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
