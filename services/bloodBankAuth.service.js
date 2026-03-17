const BloodBank = require("../models/bloodBank.model");

async function registerBloodBank({
  name,
  license_number,
  address,
  lon,
  lat,
  contact_person,
  contact_phone,
  operating_hours,
  facilities,
}) {
  if (
    !name ||
    !license_number ||
    !address ||
    !contact_person ||
    !contact_phone
  ) {
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

  // Check if license number already exists
  const existingByLicense = await BloodBank.getBloodBankByLicenseNumber(license_number);
  if (existingByLicense) {
    return { ok: false, status: 409, error: "License number already registered" };
  }

  const bloodBank = await BloodBank.createBloodBank({
    name,
    license_number,
    address,
    lon: Number(lon),
    lat: Number(lat),
    contact_person,
    contact_phone,
    operating_hours,
    facilities,
  });

  return {
    ok: true,
    status: 201,
    bloodBank,
  };
}

module.exports = {
  registerBloodBank,
};
