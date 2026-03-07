const BloodRequest = require("../models/bloodRequest.model");
const { sendWhatsAppForMatches } = require("./notification.service");

function normalizeBloodGroup(value) {
  if (!value || typeof value !== "string") return null;
  return value.trim().toUpperCase();
}

async function createEmergencyRequest({
  hospital_id,
  blood_group,
  units_required,
  lon,
  lat,
  search_radius_meters = 5000,
  match_limit = 25,
}) {
  const normalizedGroup = normalizeBloodGroup(blood_group);
  if (!normalizedGroup) {
    return { ok: false, status: 400, error: "Invalid blood_group" };
  }

  const units = Number(units_required);
  if (!Number.isInteger(units) || units <= 0) {
    return { ok: false, status: 400, error: "units_required must be a positive integer" };
  }

  if (
    lon === undefined ||
    lat === undefined ||
    Number.isNaN(Number(lon)) ||
    Number.isNaN(Number(lat))
  ) {
    return { ok: false, status: 400, error: "Valid lon and lat are required" };
  }

  const radius = Number(search_radius_meters);
  if (!Number.isInteger(radius) || radius <= 0) {
    return { ok: false, status: 400, error: "search_radius_meters must be a positive integer" };
  }

  const request = await BloodRequest.createBloodRequest({
    hospital_id,
    blood_group: normalizedGroup,
    units_required: units,
    lon: Number(lon),
    lat: Number(lat),
    search_radius_meters: radius,
  });

  const matches = await BloodRequest.createMatches({
    request_id: request.id,
    radius_meters: radius,
    limit: Number(match_limit),
  });

  const notificationResults = await sendWhatsAppForMatches(matches, request);

  return {
    ok: true,
    status: 201,
    request,
    initial_matches_count: matches.length,
    matches,
    notifications: notificationResults,
  };
}

async function rematchRequest({ request_id, radius_meters = 5000, limit = 25 }) {
  const request = await BloodRequest.getBloodRequestById(request_id);
  if (!request) {
    return { ok: false, status: 404, error: "Blood request not found" };
  }

  const matches = await BloodRequest.createMatches({
    request_id,
    radius_meters: Number(radius_meters),
    limit: Number(limit),
  });

  return {
    ok: true,
    status: 200,
    request_id,
    new_matches_count: matches.length,
    matches,
  };
}

async function listHospitalRequests({ hospital_id, limit = 50, offset = 0 }) {
  const requests = await BloodRequest.getBloodRequestsByHospitalId(
    hospital_id,
    Number(limit),
    Number(offset)
  );

  return {
    ok: true,
    status: 200,
    requests,
  };
}

module.exports = {
  createEmergencyRequest,
  rematchRequest,
  listHospitalRequests,
};