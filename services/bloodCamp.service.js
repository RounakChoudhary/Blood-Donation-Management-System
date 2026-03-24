const BloodCamp = require("../models/bloodCamp.model");
const { sendCampStatusEmail } = require("./email.service");

async function proposeCamp(payload) {
  const {
    name,
    date,
    time,
    venue_name,
    address,
    lon,
    lat,
    capacity,
    organiser_name,
    organiser_phone,
    organiser_email,
  } = payload;

  if (
    !name ||
    !date ||
    !time ||
    !venue_name ||
    !address ||
    !organiser_name ||
    !organiser_phone ||
    !organiser_email
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

  const camp = await BloodCamp.createCamp({
    name,
    date,
    time,
    venue_name,
    address,
    lon: Number(lon),
    lat: Number(lat),
    capacity: capacity ? Number(capacity) : null,
    organiser_name,
    organiser_phone,
    organiser_email,
  });

  return {
    ok: true,
    status: 201,
    camp,
  };
}

async function reviewCamp({ camp_id, status }) {
  if (!["approved", "rejected"].includes(status)) {
    return { ok: false, status: 400, error: "Invalid status. Must be 'approved' or 'rejected'" };
  }

  const camp = await BloodCamp.getCampById(camp_id);
  if (!camp) {
    return { ok: false, status: 404, error: "Camp not found" };
  }

  const updatedCamp = await BloodCamp.updateCampStatus(camp_id, status);

  try {
    // Notify the organiser asynchronously
    sendCampStatusEmail({
      to: updatedCamp.organiser_email,
      campName: updatedCamp.name,
      status: updatedCamp.approval_status,
    }).catch(err => console.error("Failed to send camp status email:", err));
  } catch (err) {
    console.error("Email setup error:", err);
  }

  return {
    ok: true,
    status: 200,
    camp: updatedCamp,
  };
}

async function searchCamps({ lon, lat, radius_meters = 10000, start_date, end_date }) {
  if (
    lon === undefined ||
    lat === undefined ||
    Number.isNaN(Number(lon)) ||
    Number.isNaN(Number(lat))
  ) {
    return { ok: false, status: 400, error: "Valid lon and lat are required to search nearby camps" };
  }

  const camps = await BloodCamp.getApprovedCampsWithinRadius(
    Number(lon),
    Number(lat),
    Number(radius_meters),
    start_date,
    end_date
  );

  return {
    ok: true,
    status: 200,
    camps,
  };
}

module.exports = {
  proposeCamp,
  reviewCamp,
  searchCamps,
};
