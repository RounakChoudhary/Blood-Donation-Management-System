const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:3000";

const FALLBACK_DONOR_DASHBOARD = {
  daysRemaining: 74,
  isCooldown: true,
  profileCompletion: 80,
  totalDonations: 4,
  livesImpacted: 12,
  history: [
    {
      id: 1,
      date: "Oct 12, 2025",
      location: "City General Hospital",
      bloodGroup: "O-",
      status: "Fulfilled",
    },
    {
      id: 2,
      date: "Jul 04, 2025",
      location: "St. Mary Medical Center",
      bloodGroup: "O-",
      status: "Fulfilled",
    },
  ],
};

const FALLBACK_PENDING_REQUESTS = [
  {
    matchId: 1,
    requestId: 101,
    bloodGroup: "O-",
    unitsRequired: 1,
    hospitalName: "City General Hospital",
    distanceKm: "2.3",
    createdAt: "Today",
  },
];

function getStoredToken() {
  const tokenKeys = ["token", "authToken", "accessToken", "jwt"];

  for (const key of tokenKeys) {
    const value = window.localStorage.getItem(key);
    if (value) return value;
  }

  return null;
}

function mapDonorProfileToDashboard(donor = {}) {
  const daysRemaining = Number(donor.days_remaining || 0);
  const isCooldown = Boolean(donor.cooldown_active);

  return {
    ...FALLBACK_DONOR_DASHBOARD,
    daysRemaining,
    isCooldown,
  };
}

function formatDateLabel(value) {
  if (!value) return "Unknown";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "Unknown";
  return parsed.toLocaleDateString("en-US", {
    month: "short",
    day: "2-digit",
    year: "numeric",
  });
}

function mapPendingRequests(requests = []) {
  if (!Array.isArray(requests)) return [];

  return requests.map((request) => ({
    matchId: request.match_id,
    requestId: request.request_id,
    bloodGroup: request.blood_group,
    unitsRequired: Number(request.units_required || 0),
    hospitalName: request.hospital_name || "Nearby Hospital",
    distanceKm: (
      Number(request.hospital_distance_meters ?? request.distance_meters ?? 0) / 1000
    ).toFixed(1),
    createdAt: formatDateLabel(request.created_at),
  }));
}

export const getDonorDashboard = async () => {
  const token = getStoredToken();

  if (!token) {
    await new Promise((resolve) => setTimeout(resolve, 600));
    return FALLBACK_DONOR_DASHBOARD;
  }

  try {
    const response = await fetch(`${API_BASE_URL}/donors/me`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch donor profile (${response.status})`);
    }

    const payload = await response.json();
    return mapDonorProfileToDashboard(payload?.donor || {});
  } catch (error) {
    console.warn("Falling back to mocked donor dashboard data:", error);
    await new Promise((resolve) => setTimeout(resolve, 600));
    return FALLBACK_DONOR_DASHBOARD;
  }
};

export const getDonorRequests = async () => {
  const token = getStoredToken();

  if (!token) {
    return [];
  }

  try {
    const response = await fetch(`${API_BASE_URL}/donor-requests`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      return [];
    }

    let payloadData = null;
    try {
      payloadData = await response.json();
    } catch {
      payloadData = null;
    }

    return mapPendingRequests(payloadData?.requests || []);
  } catch (error) {
    console.warn("Could not load donor requests:", error);
    return [];
  }
};

export const respondToDonorRequest = async (matchId, action) => {
  const token = getStoredToken();

  if (!token) {
    throw new Error("Donor auth token not found. Please login again.");
  }

  const normalizedMatchId = Number(matchId);
  if (!Number.isInteger(normalizedMatchId) || normalizedMatchId <= 0) {
    throw new Error("Invalid match id.");
  }

  const normalizedAction = action === "accept" ? "accept" : "reject";
  const response = await fetch(`${API_BASE_URL}/donor-requests/${normalizedMatchId}/${normalizedAction}`, {
    method: "POST",
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
    throw new Error(payloadData?.error || `Failed to ${normalizedAction} request (${response.status})`);
  }

  return payloadData;
};
