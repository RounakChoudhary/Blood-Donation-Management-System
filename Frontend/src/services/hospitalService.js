const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:3000";

const FALLBACK_HOSPITAL_DASHBOARD = {
  activeRequests: [
    {
      id: 1,
      group: "O-",
      hosp: "City General Hospital",
      info: "4 Units - Required ASAP",
      statusVariant: "critical",
      statusLabel: "critical",
      responseSummary: {
        total: 12,
        pending: 6,
        accepted: 4,
        declined: 2,
      },
      fulfillmentPercent: 33.3,
    },
    {
      id: 2,
      group: "A+",
      hosp: "St. Mary Medical",
      info: "2 Units - Within 24hrs",
      statusVariant: "pending",
      statusLabel: "pending",
      responseSummary: {
        total: 4,
        pending: 2,
        accepted: 1,
        declined: 1,
      },
      fulfillmentPercent: 50,
    },
    {
      id: 3,
      group: "B-",
      hosp: "Mercy Clinic",
      info: "1 Unit - Routine",
      statusVariant: "matched",
      statusLabel: "matched",
      responseSummary: {
        total: 3,
        pending: 1,
        accepted: 2,
        declined: 0,
      },
      fulfillmentPercent: 100,
    },
  ],
  matchedDonors: [
    { id: 1, name: "John Doe", initials: "JD", distance: "2.3", group: "O-", status: "pending", rawStatus: "pending" },
    { id: 2, name: "Anna Smith", initials: "AS", distance: "0.8", group: "A+", status: "pending", rawStatus: "pending" },
    { id: 3, name: "Robert C.", initials: "RC", distance: "4.1", group: "O-", status: "default", rawStatus: "declined" },
    { id: 4, name: "Elena V.", initials: "EV", distance: "5.5", group: "B-", status: "success", rawStatus: "accepted" },
  ],
};

function getStoredToken() {
  const tokenKeys = ["token", "authToken", "accessToken", "jwt", "hospitalToken"];

  for (const key of tokenKeys) {
    const value = window.localStorage.getItem(key);
    if (value) return value;
  }

  return null;
}

function toUiRequestStatus(apiStatus) {
  const normalized = String(apiStatus || "").toLowerCase();

  if (normalized === "pending" || normalized === "matching" || normalized === "open") return "pending";
  if (normalized === "active" || normalized === "matched") return "matched";
  if (normalized === "fulfilled") return "success";
  if (normalized === "cancelled") return "default";
  return "default";
}

function toUiMatchStatus(apiStatus) {
  const normalized = String(apiStatus || "").toLowerCase();

  if (normalized === "accepted") return "success";
  if (normalized === "pending" || normalized === "notified") return "pending";
  return "default";
}

function getInitials(name = "") {
  const words = String(name)
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  if (words.length === 0) return "NA";
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();

  return `${words[0][0]}${words[1][0]}`.toUpperCase();
}

function mapActiveRequests(requests = []) {
  if (!Array.isArray(requests)) return [];

  return requests.map((request) => {
    const rawStatus = String(request.status || "unknown").toLowerCase();
    const summary = request.response_summary || {};
    const total = Number(summary.total_count || 0);
    const accepted = Number(summary.accepted_count || 0);
    const pending = Number(summary.pending_count || 0);
    const declined = Number(summary.declined_count || 0);
    const unitsRequired = Number(request.units_required || 0);
    const urgencyLevel = request.urgency_level || "Urgent";
    const fulfillmentPercent = unitsRequired > 0
      ? Math.min(100, Number(((accepted / unitsRequired) * 100).toFixed(1)))
      : 0;

    return {
      id: request.id,
      group: request.blood_group,
      hosp: `Request #${request.id}`,
      info: `${request.units_required} Units - Emergency - ${accepted} accepted - ${pending} pending`,
      statusVariant: toUiRequestStatus(rawStatus),
      statusLabel: rawStatus,
      urgencyLevel,
      searchRadiusMeters: Number(request.search_radius_meters || 5000),
      responseSummary: {
        total,
        pending,
        accepted,
        declined,
      },
      fulfillmentPercent,
    };
  });
}

function mapMatchedDonors(matches = []) {
  if (!Array.isArray(matches)) return [];

  return matches.map((match) => {
    const donorName = match.donor_name || `Donor #${match.donor_id}`;
    const distanceKm = Number(match.distance_meters) / 1000;

    return {
      id: match.match_id,
      donorId: match.donor_id,
      name: donorName,
      phone: match.donor_phone || null,
      initials: getInitials(donorName),
      distance: Number.isFinite(distanceKm) ? distanceKm.toFixed(1) : "0.0",
      group: match.donor_blood_group || "N/A",
      status: toUiMatchStatus(match.status),
      rawStatus: match.status || "unknown",
    };
  });
}

export const getHospitalDashboard = async () => {
  const token = getStoredToken();

  if (!token) {
    await new Promise((resolve) => setTimeout(resolve, 600));
    return {
      ...FALLBACK_HOSPITAL_DASHBOARD,
      usingFallback: true,
    };
  }

  try {
    const response = await fetch(`${API_BASE_URL}/blood-requests/mine`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch hospital requests (${response.status})`);
    }

    const payload = await response.json();
    const activeRequests = mapActiveRequests(payload?.requests || []);

    return {
      ...FALLBACK_HOSPITAL_DASHBOARD,
      activeRequests,
      matchedDonors: [],
      usingFallback: false,
    };
  } catch (error) {
    console.warn("Falling back to mocked hospital dashboard data:", error);
    await new Promise((resolve) => setTimeout(resolve, 600));
    return {
      ...FALLBACK_HOSPITAL_DASHBOARD,
      usingFallback: true,
    };
  }
};

export const getHospitalRequestDetails = async (requestId) => {
  const token = getStoredToken();

  if (!token) {
    return {
      matchedDonors: FALLBACK_HOSPITAL_DASHBOARD.matchedDonors,
      usingFallback: true,
    };
  }

  const normalizedId = Number(requestId);
  if (!Number.isInteger(normalizedId) || normalizedId <= 0) {
    return { matchedDonors: [] };
  }

  const response = await fetch(`${API_BASE_URL}/blood-requests/${normalizedId}`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  let payloadData = null;
  try {
    payloadData = await response.json();
  } catch {
    payloadData = null;
  }

  if (!response.ok) {
    throw new Error(payloadData?.error || `Failed to fetch request details (${response.status})`);
  }

  return {
    matchedDonors: mapMatchedDonors(payloadData?.request?.matches || []),
    usingFallback: false,
  };
};

function toOptionalNumber(value) {
  if (value === "" || value === null || value === undefined) {
    return null;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : Number.NaN;
}

export const createEmergencyRequest = async (payload) => {
  const token = getStoredToken();

  if (!token) {
    throw new Error("Hospital auth token not found. Please login again.");
  }

  const requestBody = {
    blood_group: payload?.blood_group,
    urgency_level: "Critical",
    units_required: toOptionalNumber(payload?.units_required),
    lon: toOptionalNumber(payload?.lon),
    lat: toOptionalNumber(payload?.lat),
    search_radius_meters: toOptionalNumber(payload?.search_radius_meters ?? 3000),
    match_limit: Number(payload?.match_limit ?? 25),
  };

  const response = await fetch(`${API_BASE_URL}/blood-requests`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(requestBody),
  });

  let payloadData = null;
  try {
    payloadData = await response.json();
  } catch {
    payloadData = null;
  }

  if (!response.ok) {
    throw new Error(payloadData?.error || `Failed to create request (${response.status})`);
  }

  return payloadData;
};

export const createRegularRequest = async (payload) => {
  const token = getStoredToken();

  if (!token) {
    throw new Error("Hospital auth token not found. Please login again.");
  }

  const requestBody = {
    blood_group: payload?.blood_group,
    units_required: toOptionalNumber(payload?.units_required),
    required_date: payload?.required_date || null,
    radius_meters: toOptionalNumber(payload?.search_radius_meters ?? 10000),
  };

  const response = await fetch(`${API_BASE_URL}/blood-banks/regular-requests`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(requestBody),
  });

  let payloadData = null;
  try {
    payloadData = await response.json();
  } catch {
    payloadData = null;
  }

  if (!response.ok) {
    throw new Error(payloadData?.error || `Failed to create regular request (${response.status})`);
  }

  return payloadData;
};

export const rematchHospitalRequest = async (requestId, payload = {}) => {
  const token = getStoredToken();

  if (!token) {
    throw new Error("Hospital auth token not found. Please login again.");
  }

  const normalizedId = Number(requestId);
  if (!Number.isInteger(normalizedId) || normalizedId <= 0) {
    throw new Error("Invalid request id for rematch.");
  }

  const requestBody = {
    radius_meters: Number(payload?.radius_meters ?? 5000),
    limit: Number(payload?.limit ?? 25),
  };

  const response = await fetch(`${API_BASE_URL}/blood-requests/${normalizedId}/match`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(requestBody),
  });

  let payloadData = null;
  try {
    payloadData = await response.json();
  } catch {
    payloadData = null;
  }

  if (!response.ok) {
    throw new Error(payloadData?.error || `Failed to rematch request (${response.status})`);
  }

  return payloadData;
};
