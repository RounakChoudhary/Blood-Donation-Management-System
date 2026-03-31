const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:3000";

const FALLBACK_HOSPITAL_DASHBOARD = {
  activeRequests: [
    {
      id: 1,
      group: "O-",
      hosp: "City General Hospital",
      info: "4 Units - Required ASAP",
      status: "critical",
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
      status: "pending",
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
      status: "matched",
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
    { id: 1, name: "John Doe", initials: "JD", distance: "2.3", group: "O-" },
    { id: 2, name: "Anna Smith", initials: "AS", distance: "0.8", group: "A+" },
    { id: 3, name: "Robert C.", initials: "RC", distance: "4.1", group: "O-" },
    { id: 4, name: "Elena V.", initials: "EV", distance: "5.5", group: "B-" },
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

  if (normalized === "open") return "pending";
  if (normalized === "matched") return "matched";
  if (normalized === "fulfilled") return "success";
  if (normalized === "cancelled") return "default";
  return "default";
}

function mapActiveRequests(requests = []) {
  if (!Array.isArray(requests)) return [];

  return requests.map((request) => {
    const summary = request.response_summary || {};
    const total = Number(summary.total_count || 0);
    const accepted = Number(summary.accepted_count || 0);
    const pending = Number(summary.pending_count || 0);
    const declined = Number(summary.declined_count || 0);
    const unitsRequired = Number(request.units_required || 0);
    const fulfillmentPercent = unitsRequired > 0
      ? Math.min(100, Number(((accepted / unitsRequired) * 100).toFixed(1)))
      : 0;

    return {
      id: request.id,
      group: request.blood_group,
      hosp: `Request #${request.id}`,
      info: `${request.units_required} Units - ${accepted} accepted - ${pending} pending`,
      status: toUiRequestStatus(request.status),
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

export const getHospitalDashboard = async () => {
  const token = getStoredToken();

  if (!token) {
    await new Promise((resolve) => setTimeout(resolve, 600));
    return FALLBACK_HOSPITAL_DASHBOARD;
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
    };
  } catch (error) {
    console.warn("Falling back to mocked hospital dashboard data:", error);
    await new Promise((resolve) => setTimeout(resolve, 600));
    return FALLBACK_HOSPITAL_DASHBOARD;
  }
};

export const createEmergencyRequest = async (payload) => {
  const token = getStoredToken();

  if (!token) {
    throw new Error("Hospital auth token not found. Please login again.");
  }

  const requestBody = {
    blood_group: payload?.blood_group,
    units_required: Number(payload?.units_required),
    lon: Number(payload?.lon),
    lat: Number(payload?.lat),
    search_radius_meters: Number(payload?.search_radius_meters ?? 5000),
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
