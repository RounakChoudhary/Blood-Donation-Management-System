import { API_BASE_URL } from "./apiBaseUrl";

function getStoredToken() {
  const tokenKeys = ["token", "authToken", "accessToken", "jwt", "adminToken"];

  for (const key of tokenKeys) {
    const value = window.localStorage.getItem(key);
    if (value) return value;
  }

  return null;
}

export const getAdminDashboard = async () => {
  const token = getStoredToken();

  if (!token) {
    throw new Error("Admin auth token not found. Please login again.");
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
    return payload?.stats || {};
  } catch (error) {
    throw new Error(error.message || "Failed to fetch admin stats.");
  }
};

export const getAdminReports = async () => {
  const token = getStoredToken();

  if (!token) {
    throw new Error("Admin auth token not found. Please login again.");
  }

  try {
    const response = await fetch(`${API_BASE_URL}/api/admin/reports`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch admin reports (${response.status})`);
    }

    const payload = await response.json();
    return payload?.reports || {};
  } catch (error) {
    throw new Error(error.message || "Failed to fetch admin reports.");
  }
};

export const getAdminUsers = async ({ search = "", limit = 10, page = 1 } = {}) => {
  const token = getStoredToken();
  if (!token) {
    throw new Error("Admin auth token not found. Please login again.");
  }

  const normalizedLimit = Number.isInteger(Number(limit)) && Number(limit) > 0 ? Number(limit) : 10;
  const normalizedPage = Number.isInteger(Number(page)) && Number(page) > 0 ? Number(page) : 1;
  const offset = (normalizedPage - 1) * normalizedLimit;

  const params = new URLSearchParams({
    limit: String(normalizedLimit),
    offset: String(offset),
  });

  if (search && String(search).trim()) {
    params.set("search", String(search).trim());
  }

  const response = await fetch(`${API_BASE_URL}/admin/users?${params.toString()}`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  let payload = null;
  try {
    payload = await response.json();
  } catch {
    payload = null;
  }

  if (!response.ok) {
    throw new Error(payload?.error || `Failed to fetch users (${response.status})`);
  }

  return {
    users: payload?.data || [],
    pagination: payload?.pagination || {
      totalCount: 0,
      currentPage: normalizedPage,
      totalPages: 1,
    },
  };
};

export const getAdminHospitals = async ({ search = "", limit = 10, page = 1 } = {}) => {
  const token = getStoredToken();
  if (!token) {
    throw new Error("Admin auth token not found. Please login again.");
  }

  const normalizedLimit = Number.isInteger(Number(limit)) && Number(limit) > 0 ? Number(limit) : 10;
  const normalizedPage = Number.isInteger(Number(page)) && Number(page) > 0 ? Number(page) : 1;
  const offset = (normalizedPage - 1) * normalizedLimit;

  const params = new URLSearchParams({
    limit: String(normalizedLimit),
    offset: String(offset),
  });

  if (search && String(search).trim()) {
    params.set("search", String(search).trim());
  }

  const response = await fetch(`${API_BASE_URL}/admin/hospitals?${params.toString()}`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  let payload = null;
  try {
    payload = await response.json();
  } catch {
    payload = null;
  }

  if (!response.ok) {
    throw new Error(payload?.error || `Failed to fetch hospitals (${response.status})`);
  }

  return {
    hospitals: payload?.data || [],
    pagination: payload?.pagination || {
      totalCount: 0,
      currentPage: normalizedPage,
      totalPages: 1,
    },
  };
};

export const approveHospital = async (hospitalId) => {
  const token = getStoredToken();
  if (!token) {
    throw new Error("Admin auth token not found. Please login again.");
  }

  const normalizedId = Number(hospitalId);
  if (!Number.isInteger(normalizedId) || normalizedId <= 0) {
    throw new Error("Invalid hospital id.");
  }

  const response = await fetch(`${API_BASE_URL}/admin/hospitals/${normalizedId}/approve`, {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  let payload = null;
  try {
    payload = await response.json();
  } catch {
    payload = null;
  }

  if (!response.ok) {
    throw new Error(payload?.error || `Failed to approve hospital (${response.status})`);
  }

  return payload;
};

export const rejectHospital = async (hospitalId) => {
  const token = getStoredToken();
  if (!token) {
    throw new Error("Admin auth token not found. Please login again.");
  }

  const normalizedId = Number(hospitalId);
  if (!Number.isInteger(normalizedId) || normalizedId <= 0) {
    throw new Error("Invalid hospital id.");
  }

  const response = await fetch(`${API_BASE_URL}/admin/hospitals/${normalizedId}/reject`, {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  let payload = null;
  try {
    payload = await response.json();
  } catch {
    payload = null;
  }

  if (!response.ok) {
    throw new Error(payload?.error || `Failed to reject hospital (${response.status})`);
  }

  return payload;
};

export const getAdminBloodBanks = async ({ search = "", limit = 10, page = 1 } = {}) => {
  const token = getStoredToken();
  if (!token) {
    throw new Error("Admin auth token not found. Please login again.");
  }

  const normalizedLimit = Number.isInteger(Number(limit)) && Number(limit) > 0 ? Number(limit) : 10;
  const normalizedPage = Number.isInteger(Number(page)) && Number(page) > 0 ? Number(page) : 1;
  const offset = (normalizedPage - 1) * normalizedLimit;

  const params = new URLSearchParams({
    limit: String(normalizedLimit),
    offset: String(offset),
  });

  if (search && String(search).trim()) {
    params.set("search", String(search).trim());
  }

  const response = await fetch(`${API_BASE_URL}/admin/blood-banks?${params.toString()}`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  let payload = null;
  try {
    payload = await response.json();
  } catch {
    payload = null;
  }

  if (!response.ok) {
    throw new Error(payload?.error || `Failed to fetch blood banks (${response.status})`);
  }

  return {
    bloodBanks: payload?.data || [],
    pagination: payload?.pagination || {
      totalCount: 0,
      currentPage: normalizedPage,
      totalPages: 1,
    },
  };
};

export const verifyBloodBank = async (bloodBankId) => {
  const token = getStoredToken();
  if (!token) {
    throw new Error("Admin auth token not found. Please login again.");
  }

  const normalizedId = Number(bloodBankId);
  if (!Number.isInteger(normalizedId) || normalizedId <= 0) {
    throw new Error("Invalid blood bank id.");
  }

  const response = await fetch(`${API_BASE_URL}/admin/blood-banks/${normalizedId}/verify`, {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  let payload = null;
  try {
    payload = await response.json();
  } catch {
    payload = null;
  }

  if (!response.ok) {
    throw new Error(payload?.error || `Failed to verify blood bank (${response.status})`);
  }

  return payload;
};

export const getAdminBloodRequests = async ({ search = "", limit = 10, page = 1 } = {}) => {
  const token = getStoredToken();
  if (!token) {
    throw new Error("Admin auth token not found. Please login again.");
  }

  const normalizedLimit = Number.isInteger(Number(limit)) && Number(limit) > 0 ? Number(limit) : 10;
  const normalizedPage = Number.isInteger(Number(page)) && Number(page) > 0 ? Number(page) : 1;
  const offset = (normalizedPage - 1) * normalizedLimit;

  const params = new URLSearchParams({
    limit: String(normalizedLimit),
    offset: String(offset),
  });

  if (search && String(search).trim()) {
    params.set("search", String(search).trim());
  }

  const response = await fetch(`${API_BASE_URL}/admin/blood-requests?${params.toString()}`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  let payload = null;
  try {
    payload = await response.json();
  } catch {
    payload = null;
  }

  if (!response.ok) {
    throw new Error(payload?.error || `Failed to fetch blood requests (${response.status})`);
  }

  return {
    requests: payload?.data || [],
    pagination: payload?.pagination || {
      totalCount: 0,
      currentPage: normalizedPage,
      totalPages: 1,
    },
  };
};

export const deleteAdminBloodRequest = async (requestId) => {
  const token = getStoredToken();
  if (!token) {
    throw new Error("Admin auth token not found. Please login again.");
  }

  const normalizedId = Number(requestId);
  if (!Number.isInteger(normalizedId) || normalizedId <= 0) {
    throw new Error("Invalid blood request id.");
  }

  const response = await fetch(`${API_BASE_URL}/admin/blood-requests/${normalizedId}`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  let payload = null;
  try {
    payload = await response.json();
  } catch {
    payload = null;
  }

  if (!response.ok) {
    throw new Error(payload?.error || `Failed to delete blood request (${response.status})`);
  }

  return payload;
};
