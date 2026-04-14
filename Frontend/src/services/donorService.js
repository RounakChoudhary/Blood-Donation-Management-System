import { API_BASE_URL } from "./apiBaseUrl";

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

function mapDonorProfileToDashboard(donor = {}, historyData = []) {
  const daysRemaining = Number(donor.days_remaining || 0);
  const isCooldown = Boolean(donor.cooldown_active);

  // Calculate generic profile completion percentage based on stored fields
  // A donor record merged with User provides these fields: full_name, email, phone, blood_group, date_of_birth, address, lon, lat, emergency_contact_name, emergency_contact_phone
  const profileFields = ['full_name', 'email', 'phone', 'blood_group', 'date_of_birth', 'address', 'lon', 'lat', 'emergency_contact_name', 'emergency_contact_phone'];
  let filledFields = 0;
  profileFields.forEach(field => {
    if (donor[field] !== null && donor[field] !== undefined && donor[field] !== '') {
      filledFields++;
    }
  });
  const profileCompletion = Math.round((filledFields / profileFields.length) * 100) || 0;

  const totalDonations = historyData.length;
  const livesImpacted = totalDonations * 3;

  const history = historyData.map((item, index) => ({
    id: item.id || index + 1,
    date: formatDateLabel(item.donation_date || item.created_at),
    location: item.hospital_name || "Unknown Location",
    bloodGroup: item.blood_group || donor.blood_group || "Unknown",
    status: "Fulfilled",
  }));

  return {
    ...FALLBACK_DONOR_DASHBOARD,
    daysRemaining,
    isCooldown,
    profileCompletion,
    totalDonations,
    livesImpacted,
    history: history.length > 0 ? history : [],
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
    const [profileRes, historyRes] = await Promise.all([
      fetch(`${API_BASE_URL}/donors/me`, {
        method: "GET",
        headers: { Authorization: `Bearer ${token}` },
      }),
      fetch(`${API_BASE_URL}/donors/history`, {
        method: "GET",
        headers: { Authorization: `Bearer ${token}` },
      })
    ]);

    if (!profileRes.ok) {
      if (profileRes.status === 404) {
        return { needsOnboarding: true };
      }
      throw new Error(`Failed to fetch donor profile (${profileRes.status})`);
    }

    const payload = await profileRes.json();
    let historyData = [];
    
    if (historyRes.ok) {
      const historyPayload = await historyRes.json();
      historyData = historyPayload?.donation_records || [];
    }

    return mapDonorProfileToDashboard(payload?.donor || {}, historyData);
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

export const becomeVolunteer = async (payload) => {
  const token = getStoredToken();
  if (!token) throw new Error("Not authenticated");

  const response = await fetch(`${API_BASE_URL}/donors/become-volunteer`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      blood_group: payload.bloodGroup,
      age: payload.age,
      bmi: payload.bmi,
      last_donated_date: payload.lastDonatedDate || null,
    }),
  });

  if (!response.ok) {
    const errPayload = await response.json().catch(() => ({}));
    throw new Error(errPayload.error || `Failed to register as volunteer (${response.status})`);
  }

  return response.json();
};
