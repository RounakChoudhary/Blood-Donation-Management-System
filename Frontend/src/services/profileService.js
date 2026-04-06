import { getAuthToken } from './authService';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:3000";

export const getProfileSettings = async () => {
  const token = getAuthToken();
  if (!token) throw new Error("Not authenticated");

  const response = await fetch(`${API_BASE_URL}/donors/me`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`
    }
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch profile settings (${response.status})`);
  }

  const payload = await response.json();
  const donor = payload?.donor || {};

  return {
    fullName: donor.full_name || "",
    bloodGroup: donor.blood_group || "",
    phoneNumber: donor.phone || "",
    location: donor.address || "",
    donorLevel: "Volunteer", 
    isEligible: !donor.cooldown_active && donor.availability_status !== 'unavailable',
    notifications: {
      emergencyAlerts: donor.eligible_for_notifications || true,
      emailUpdates: false 
    }
  };
};

export const updateProfile = async (data) => {
  const token = getAuthToken();
  if (!token) throw new Error("Not authenticated");

  const payload = {
    phone: data.phoneNumber,
    address: data.location,
    // We intentionally don't send bloodGroup or email since they can't be changed via this endpoint
  };

  const response = await fetch(`${API_BASE_URL}/donors/profile`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || `Failed to update profile (${response.status})`);
  }

  const result = await response.json();
  return { success: true, message: result.message, data: result.donor };
};
