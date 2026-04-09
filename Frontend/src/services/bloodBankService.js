const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:3000";

function getStoredToken() {
  const tokenKeys = ["token", "authToken", "accessToken", "jwt", "bloodBankToken"];

  for (const key of tokenKeys) {
    const value = window.localStorage.getItem(key);
    if (value) return value;
  }

  return null;
}

function formatDate(value) {
  if (!value) return "No expiry recorded";

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return value;
  }

  return parsed.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function formatDistance(distanceMeters) {
  const normalized = Number(distanceMeters || 0);
  if (!Number.isFinite(normalized) || normalized <= 0) {
    return "Nearby";
  }

  if (normalized < 1000) {
    return `${normalized} m away`;
  }

  return `${(normalized / 1000).toFixed(1)} km away`;
}

function mapInventoryRows(rows = []) {
  if (!Array.isArray(rows)) return [];

  return rows.map((item, index) => ({
    id: `${item.blood_group || "group"}-${index}`,
    type: item.blood_group || "N/A",
    count: Number(item.units_available || 0),
    critical: Boolean(item.critical),
    nearestExpiry: formatDate(item.nearest_expiry),
  }));
}

function mapNearbyBanks(rows = []) {
  if (!Array.isArray(rows)) return [];

  return rows.map((bank) => ({
    id: bank.id,
    name: bank.name,
    distance: formatDistance(bank.distance_meters),
    contactPhone: bank.contact_phone || null,
    address: bank.address || null,
    stock: Array.isArray(bank.stock_summary)
      ? bank.stock_summary.map((item) => ({
          group: item.blood_group,
          count: Number(item.units_available || 0),
          critical: Boolean(item.critical),
        }))
      : [],
  }));
}

function mapIncomingRequests(rows = []) {
  if (!Array.isArray(rows)) return [];

  return rows.map((request) => ({
    id: request.notification_id,
    requestId: request.request_id,
    hospitalName: request.hospital_name || "Hospital",
    hospitalAddress: request.hospital_address || "Address unavailable",
    distance: formatDistance(request.distance_meters),
    bloodGroup: request.blood_group || "N/A",
    unitsRequired: Number(request.units_required || 0),
    requiredDate: formatDate(request.required_date),
    status: String(request.request_status || "pending").toLowerCase(),
    notificationStatus: String(request.notification_status || "pending").toLowerCase(),
    notes: request.notes || "",
    notifiedAt: formatDate(request.notified_at),
  }));
}

export const getBloodBankDashboard = async () => {
  const token = getStoredToken();

  if (!token) {
    throw new Error("Blood bank auth token not found. Please login again.");
  }

  const response = await fetch(`${API_BASE_URL}/blood-banks/dashboard`, {
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
    throw new Error(payloadData?.error || `Failed to fetch blood bank dashboard (${response.status})`);
  }

  return {
    summary: payloadData?.summary || {},
    bloodBank: payloadData?.blood_bank || null,
    inventory: mapInventoryRows(payloadData?.inventory || []),
    nearbyBanks: mapNearbyBanks(payloadData?.nearby_banks || []),
    incomingRequests: mapIncomingRequests(payloadData?.incoming_regular_requests || []),
  };
};

export const updateStock = async (payload) => {
  const token = getStoredToken();

  if (!token) {
    throw new Error("Blood bank auth token not found. Please login again.");
  }

  const requestBody = {
    blood_group: payload?.blood_group,
    action: payload?.action,
    quantity: Number(payload?.quantity),
    expiry_date: payload?.expiry_date || null,
  };

  const response = await fetch(`${API_BASE_URL}/blood-banks/inventory/adjustments`, {
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
    throw new Error(payloadData?.error || `Failed to update stock (${response.status})`);
  }

  return {
    message: payloadData?.message || "Inventory updated successfully",
    inventory: mapInventoryRows(payloadData?.inventory || []),
  };
};
