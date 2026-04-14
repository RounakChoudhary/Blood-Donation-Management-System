import { getAuthToken } from './authService';
import { API_BASE_URL } from './apiBaseUrl';

function formatDateLabel(value) {
  if (!value) return "TBD";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "TBD";
  return parsed.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function formatTimeLabel(value) {
  if (!value) return "Time TBA";

  const [hour = "0", minute = "0"] = String(value).split(":");
  const parsed = new Date();
  parsed.setHours(Number(hour), Number(minute), 0, 0);

  return parsed.toLocaleTimeString("en-IN", {
    hour: "numeric",
    minute: "2-digit",
  });
}

function mapCamp(camp = {}) {
  return {
    id: camp.id,
    name: camp.name || "Blood Donation Camp",
    date: camp.date || null,
    time: camp.time || null,
    dateLabel: formatDateLabel(camp.date),
    timeLabel: formatTimeLabel(camp.time),
    venueName: camp.venue_name || "Venue TBA",
    address: camp.address || "Address unavailable",
    capacity: camp.capacity === null || camp.capacity === undefined ? null : Number(camp.capacity),
    organiserName: camp.organiser_name || "Organiser",
    approvalStatus: camp.approval_status || null,
    distanceKm: camp.distance_meters === null || camp.distance_meters === undefined
      ? null
      : (Number(camp.distance_meters) / 1000).toFixed(1),
  };
}

export const proposeCamp = async (payload) => {
  const response = await fetch(`${API_BASE_URL}/camps`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  let data = null;
  try {
    data = await response.json();
  } catch {
    data = null;
  }

  if (!response.ok) {
    throw new Error(data?.error || `Failed to submit camp proposal (${response.status})`);
  }

  return {
    message: data?.message || "Blood camp proposal submitted for review",
    camp: mapCamp(data?.camp || {}),
  };
};

export const searchNearbyCamps = async ({
  lon,
  lat,
  radius_meters = 10000,
  start_date,
  end_date,
} = {}) => {
  const params = new URLSearchParams({
    lon: String(lon),
    lat: String(lat),
    radius_meters: String(radius_meters),
  });

  if (start_date) {
    params.set("start_date", start_date);
  }

  if (end_date) {
    params.set("end_date", end_date);
  }

  const response = await fetch(`${API_BASE_URL}/camps/nearby?${params.toString()}`, {
    method: "GET",
  });

  let data = null;
  try {
    data = await response.json();
  } catch {
    data = null;
  }

  if (!response.ok) {
    throw new Error(data?.error || `Failed to search nearby camps (${response.status})`);
  }

  return (data?.camps || []).map(mapCamp);
};

export const getCampDiscoveryBase = async () => {
  const token = getAuthToken();

  if (!token) {
    throw new Error("Donor auth token not found. Please login again.");
  }

  const response = await fetch(`${API_BASE_URL}/donors/me`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  let data = null;
  try {
    data = await response.json();
  } catch {
    data = null;
  }

  if (!response.ok) {
    throw new Error(data?.error || `Failed to fetch donor location (${response.status})`);
  }

  const donor = data?.donor || {};
  return {
    address: donor.address || "",
    lat: donor.lat === null || donor.lat === undefined ? "" : String(donor.lat),
    lon: donor.lon === null || donor.lon === undefined ? "" : String(donor.lon),
  };
};
