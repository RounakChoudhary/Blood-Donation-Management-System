const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:3000";

const FALLBACK_HOSPITAL_DASHBOARD = {
  activeRequests: [
    { id: 1, group: "O-", hosp: "City General Hospital", info: "4 Units - Required ASAP", status: "critical" },
    { id: 2, group: "A+", hosp: "St. Mary Medical", info: "2 Units - Within 24hrs", status: "pending" },
    { id: 3, group: "B-", hosp: "Mercy Clinic", info: "1 Unit - Routine", status: "matched" },
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
    const accepted = Number(summary.accepted_count || 0);
    const pending = Number(summary.pending_count || 0);

    return {
      id: request.id,
      group: request.blood_group,
      hosp: `Request #${request.id}`,
      info: `${request.units_required} Units - ${accepted} accepted - ${pending} pending`,
      status: toUiRequestStatus(request.status),
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
  await new Promise((resolve) => setTimeout(resolve, 600));
  return { success: true, message: "Request broadcasted successfully", data: payload };
};
