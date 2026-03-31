const BloodRequest = require("../models/bloodRequest.model");
const BloodRequestMatch = require("../models/bloodRequestMatch.model");
const { sendEmailForMatches } = require("./notification.service");

const RADIUS_STEP_METERS = [3000, 6000, 9000];

function normalizeBloodGroup(value) {
  if (!value || typeof value !== "string") return null;
  return value.trim().toUpperCase();
}

function toPositiveInteger(value, fallback) {
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed <= 0) return fallback;
  return parsed;
}

function getNextExpansionRadius(currentRadiusMeters) {
  const current = toPositiveInteger(currentRadiusMeters, 0);
  for (const step of RADIUS_STEP_METERS) {
    if (current < step) return step;
  }
  return null;
}

function buildEmptyResponseSummary() {
  return {
    total_count: 0,
    pending_count: 0,
    notified_count: 0,
    accepted_count: 0,
    declined_count: 0,
    no_response_count: 0,
  };
}

async function attachResponseSummaries(requests = []) {
  if (!Array.isArray(requests) || requests.length === 0) {
    return [];
  }

  const ids = requests.map((request) => Number(request.id)).filter((id) => Number.isInteger(id));
  const summaries = await BloodRequestMatch.getResponseSummaryByRequestIds(ids);
  const summaryMap = new Map(summaries.map((item) => [Number(item.request_id), item]));

  return requests.map((request) => ({
    ...request,
    response_summary: summaryMap.get(Number(request.id)) || buildEmptyResponseSummary(),
  }));
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

  const notificationResults = await sendEmailForMatches(matches, request);
  const requestStatus = matches.length > 0 ? "matched" : "open";

  const updatedRequest = await BloodRequest.updateBloodRequestStatus({
    request_id: request.id,
    status: requestStatus,
  });

  return {
    ok: true,
    status: 201,
    request: updatedRequest || request,
    initial_matches_count: matches.length,
    matches,
    notifications: notificationResults,
  };
}

async function getRequestForHospital({ request_id, hospital_id }) {
  const request = await BloodRequest.getBloodRequestById(request_id);
  if (!request) {
    return { ok: false, status: 404, error: "Blood request not found" };
  }

  if (request.hospital_id !== hospital_id) {
    return { ok: false, status: 403, error: "Forbidden" };
  }

  const [requestWithSummary] = await attachResponseSummaries([request]);
  const matches = await BloodRequestMatch.getMatchesByRequestId(request.id);

  return {
    ok: true,
    status: 200,
    request: {
      ...(requestWithSummary || request),
      matches,
    },
  };
}

async function rematchRequest({ hospital_id, request_id, radius_meters, limit = 25 }) {
  const requestResult = await getRequestForHospital({ request_id, hospital_id });
  if (!requestResult.ok) {
    return requestResult;
  }

  const request = requestResult.request;
  const matches = await BloodRequest.createMatches({
    request_id,
    radius_meters: Number(radius_meters ?? request.search_radius_meters ?? 5000),
    limit: Number(limit),
  });

  if (matches.length > 0 && request.status !== "matched") {
    await BloodRequest.updateBloodRequestStatus({
      request_id,
      status: "matched",
    });
  }

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
  const requestsWithSummary = await attachResponseSummaries(requests);

  return {
    ok: true,
    status: 200,
    requests: requestsWithSummary,
  };
}

async function runAutoRadiusExpansionBatch({
  interval_minutes = 5,
  request_limit = 50,
  match_limit = 25,
} = {}) {
  const intervalMinutes = toPositiveInteger(interval_minutes, 5);
  const requestLimit = toPositiveInteger(request_limit, 50);
  const matchLimit = toPositiveInteger(match_limit, 25);

  const eligibleRequests = await BloodRequest.listRequestsEligibleForAutoExpansion({
    interval_minutes: intervalMinutes,
    limit: requestLimit,
  });

  const results = [];

  for (const request of eligibleRequests) {
    const fromRadiusMeters = toPositiveInteger(request.search_radius_meters, 0);
    const nextRadiusMeters = getNextExpansionRadius(fromRadiusMeters);

    if (!nextRadiusMeters) {
      results.push({
        request_id: request.id,
        ok: false,
        skipped: true,
        reason: "Max radius already reached",
      });
      continue;
    }

    try {
      const updatedRequest = await BloodRequest.updateSearchRadius({
        request_id: request.id,
        new_radius_meters: nextRadiusMeters,
      });

      if (!updatedRequest) {
        results.push({
          request_id: request.id,
          ok: false,
          skipped: true,
          reason: "Radius update skipped (already updated or invalid transition)",
        });
        continue;
      }

      const matches = await BloodRequest.createMatches({
        request_id: request.id,
        radius_meters: nextRadiusMeters,
        limit: matchLimit,
      });

      const notifications = await sendEmailForMatches(matches, updatedRequest);

      results.push({
        request_id: request.id,
        ok: true,
        from_radius_meters: fromRadiusMeters,
        to_radius_meters: nextRadiusMeters,
        new_matches_count: matches.length,
        notification_attempts: notifications.length,
      });
    } catch (err) {
      results.push({
        request_id: request.id,
        ok: false,
        from_radius_meters: fromRadiusMeters,
        to_radius_meters: nextRadiusMeters,
        error: err.message,
      });
    }
  }

  return {
    ok: true,
    status: 200,
    interval_minutes: intervalMinutes,
    eligible_count: eligibleRequests.length,
    expanded_count: results.filter((item) => item.ok).length,
    results,
  };
}

module.exports = {
  createEmergencyRequest,
  getRequestForHospital,
  rematchRequest,
  listHospitalRequests,
  runAutoRadiusExpansionBatch,
};
