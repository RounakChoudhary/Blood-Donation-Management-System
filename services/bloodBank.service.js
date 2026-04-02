const bloodBankAuthService = require("./bloodBankAuth.service");
const BloodBank = require("../models/bloodBank.model");
const Hospital = require("../models/hospital.model");

async function registerBloodBank(payload) {
  return bloodBankAuthService.registerBloodBank(payload);
}

async function findNearbyBloodBanks({
  lon,
  lat,
  radius_meters = 10000,
  hospital_id = null,
}) {
  let resolvedLon = lon;
  let resolvedLat = lat;

  if ((resolvedLon === undefined || resolvedLat === undefined) && hospital_id !== null && hospital_id !== undefined) {
    const hospital = await Hospital.getHospitalById(Number(hospital_id));
    if (!hospital) {
      return { ok: false, status: 404, error: "Hospital not found" };
    }

    resolvedLon = hospital.lon;
    resolvedLat = hospital.lat;
  }

  if (
    resolvedLon === undefined ||
    resolvedLat === undefined ||
    Number.isNaN(Number(resolvedLon)) ||
    Number.isNaN(Number(resolvedLat))
  ) {
    return { ok: false, status: 400, error: "Valid lon and lat are required" };
  }

  const blood_banks = await BloodBank.findNearbyBloodBanks({
    lon: Number(resolvedLon),
    lat: Number(resolvedLat),
    radius_meters: Number(radius_meters) > 0 ? Number(radius_meters) : 10000,
  });

  return {
    ok: true,
    status: 200,
    blood_banks,
  };
}

module.exports = {
  registerBloodBank,
  findNearbyBloodBanks,
};
