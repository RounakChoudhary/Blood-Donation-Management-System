const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:3000";

const FALLBACK_ADMIN_DASHBOARD = {
  metrics: {
    totalDonors: "1,280",
    requestsToday: 47,
    fulfillmentRate: "94.2%",
  },
  centralInventory: [
    { type: "A+", count: 12, critical: false },
    { type: "A-", count: 4, critical: false },
    { type: "O-", count: 2, critical: true },
    { type: "B+", count: 8, critical: false },
    { type: "B-", count: 5, critical: false },
    { type: "O+", count: 32, critical: false },
    { type: "AB+", count: 18, critical: false },
    { type: "AB-", count: 1, critical: true },
  ],
  recentActivity: [
    {
      id: 1,
      type: "match",
      title: "Match Successful",
      description: "John D. matched with City General (O-)",
      timeAgo: "2m ago",
    },
    {
      id: 2,
      type: "alert",
      title: "Critical Shortage",
      description: "O- blood stock dropped below 5 units.",
      timeAgo: "14m ago",
    },
  ],
};

function getStoredToken() {
  const tokenKeys = ["token", "authToken", "accessToken", "jwt", "adminToken"];

  for (const key of tokenKeys) {
    const value = window.localStorage.getItem(key);
    if (value) return value;
  }

  return null;
}

function toDashboardData(stats = {}) {
  const parsedFulfillmentRate = Number(stats.fulfillmentRate);
  const hasFulfillmentRate = Number.isFinite(parsedFulfillmentRate);

  return {
    ...FALLBACK_ADMIN_DASHBOARD,
    metrics: {
      totalDonors: Number(stats.users || 0).toLocaleString(),
      requestsToday: Number(stats.requestsToday ?? stats.bloodRequests ?? 0),
      fulfillmentRate: hasFulfillmentRate
        ? `${parsedFulfillmentRate.toFixed(1)}%`
        : FALLBACK_ADMIN_DASHBOARD.metrics.fulfillmentRate,
    },
  };
}

export const getAdminDashboard = async () => {
  const token = getStoredToken();

  if (!token) {
    await new Promise((resolve) => setTimeout(resolve, 600));
    return FALLBACK_ADMIN_DASHBOARD;
  }

  try {
    const response = await fetch(`${API_BASE_URL}/admin/stats`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch admin stats (${response.status})`);
    }

    const payload = await response.json();
    return toDashboardData(payload?.stats);
  } catch (error) {
    console.warn("Falling back to mocked admin dashboard data:", error);
    await new Promise((resolve) => setTimeout(resolve, 600));
    return FALLBACK_ADMIN_DASHBOARD;
  }
};
