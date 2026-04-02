const BloodRequest = require("../models/bloodRequest.model");
const BloodRequestMatch = require("../models/bloodRequestMatch.model");
const { sendEmailForMatches } = require("./notification.service");

const RADIUS_STEP_METERS = [3000, 6000, 9000];
const DEFAULT_SEARCH_RADIUS_METERS = 3000;
const ACTIVE_REQUEST_STATUSES = new Set(["pending", "matching", "active"]);
const ALLOWED_URGENCY_LEVELS = new Set(["Critical", "Urgent", "Routine"]);

function normalizeBloodGroup(value) {
  if (!value || typeof value !== "string") return null;
  return value.trim().toUpperCase();
}

function toPositiveInteger(value, fallback) {
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed <= 0) return fallback;
  return parsed;
}

function normalizeUrgencyLevel(value) {
  if (!value || typeof value !== "string") return null;

  const normalized = value.trim().toLowerCase();
  const map = {
    critical: "Critical",
    urgent: "Urgent",
    routine: "Routine",
  };

  return map[normalized] || null;
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
  urgency_level,
  patient_name = null,
  notes = null,
  search_radius_meters = DEFAULT_SEARCH_RADIUS_METERS,
  match_limit = 25,
}) {
  const normalizedGroup = normalizeBloodGroup(blood_group);
  if (!normalizedGroup) {
    return { ok: false, status: 400, error: "Invalid blood_group" };
  }

  const normalizedUrgencyLevel = normalizeUrgencyLevel(urgency_level);
  if (!normalizedUrgencyLevel || !ALLOWED_URGENCY_LEVELS.has(normalizedUrgencyLevel)) {
    return { ok: false, status: 400, error: "urgency_level must be Critical, Urgent, or Routine" };
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

  const radius = toPositiveInteger(search_radius_meters, DEFAULT_SEARCH_RADIUS_METERS);

  const existingActiveRequest = await BloodRequest.getActiveBloodRequestByHospitalAndGroup({
    hospital_id,
    blood_group: normalizedGroup,
  });
  if (existingActiveRequest) {
    return {
      ok: false,
      status: 409,
      error: "An active emergency request already exists for this hospital and blood group",
    };
  }

  const request = await BloodRequest.createBloodRequest({
    hospital_id,
    blood_group: normalizedGroup,
    units_required: units,
    lon: Number(lon),
    lat: Number(lat),
    urgency_level: normalizedUrgencyLevel,
    patient_name: patient_name ?? null,
    notes: notes ?? null,
    search_radius_meters: radius,
  });

  await BloodRequest.transitionBloodRequestStatus({
    request_id: request.id,
    from_statuses: ["pending"],
    to_status: "matching",
  });

  const matches = await BloodRequest.createMatches({
    request_id: request.id,
    radius_meters: radius,
    limit: Number(match_limit),
  });

  const notificationResults = await sendEmailForMatches(matches, request);
  const requestStatus = matches.length > 0 ? "active" : "matching";

  const updatedRequest = await BloodRequest.transitionBloodRequestStatus({
    request_id: request.id,
    from_statuses: ["pending", "matching"],
    to_status: requestStatus,
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
  if (!ACTIVE_REQUEST_STATUSES.has(request.status)) {
    return {
      ok: false,
      status: 409,
      error: "Only pending, matching, or active requests can be rematched",
    };
  }

  await BloodRequest.transitionBloodRequestStatus({
    request_id,
    from_statuses: ["pending", "matching", "active"],
    to_status: "matching",
  });

  const matches = await BloodRequest.createMatches({
    request_id,
    radius_meters: toPositiveInteger(
      radius_meters,
      toPositiveInteger(request.search_radius_meters, DEFAULT_SEARCH_RADIUS_METERS)
    ),
    limit: Number(limit),
  });

  const totalMatchCount = await BloodRequestMatch.countMatchesByRequestId(request_id);
  const nextStatus = matches.length > 0 || totalMatchCount > 0
    ? "active"
    : "matching";

  await BloodRequest.transitionBloodRequestStatus({
    request_id,
    from_statuses: ["pending", "matching", "active"],
    to_status: nextStatus,
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
      const nextStatus = matches.length > 0 ? "active" : "matching";

      await BloodRequest.transitionBloodRequestStatus({
        request_id: request.id,
        from_statuses: ["pending", "matching", "active"],
        to_status: nextStatus,
      });

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
