const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const Hospital = require("../models/hospital.model");

const JWT_SECRET = process.env.JWT_SECRET;

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
    { expiresIn: "7d" }
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
  loginHospital,
};