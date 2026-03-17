const BloodBank = require("../models/bloodBank.model");

async function registerBloodBank({
  name,
  license_number,
  address,
  lon,
  lat,
  contact_person,
  phone,
  operating_hours,
  facilities,
}) {
  if (
    !name ||
    !license_number ||
    !address ||
    !contact_person ||
    !phone ||
    !operating_hours
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

  const existingLicense = await BloodBank.getBloodBankByLicense(license_number);
  if (existingLicense) {
    return { ok: false, status: 409, error: "License number already registered" };
  }

  const existingPhone = await BloodBank.getBloodBankByPhone(phone);
  if (existingPhone) {
    return { ok: false, status: 409, error: "Phone number already registered" };
  }

  const bloodBank = await BloodBank.createBloodBank({
    name,
    license_number,
    address,
    lon: Number(lon),
    lat: Number(lat),
    contact_person,
    phone,
    operating_hours,
    facilities: facilities ?? null,
    status: "pending",
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
