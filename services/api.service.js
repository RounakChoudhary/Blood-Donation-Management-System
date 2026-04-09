const BloodRequest = require("../models/bloodRequest.model");
const UserNotification = require("../models/userNotification.model");
const BloodInventory = require("../models/bloodInventory.model");
const { validateBloodGroup, validatePositiveInteger } = require("../utils/validation");

const ALLOWED_REQUEST_STATUSES = new Set(["pending", "accepted", "completed"]);
const DEFAULT_MATCH_RADIUS_METERS = 10000;

async function matchDonorsForRequest({ requestId, hospitalId }) {
  const request = await BloodRequest.getBloodRequestById(requestId);
  if (!request) {
    return { ok: false, status: 404, error: "Blood request not found" };
  }

  if (request.hospital_id !== hospitalId) {
    return { ok: false, status: 403, error: "Forbidden" };
  }

  const donors = await BloodRequest.findDonorsWithinFixedRadius({
    requestId,
    radiusMeters: DEFAULT_MATCH_RADIUS_METERS,
    limit: 50,
  });

  return { ok: true, status: 200, donors };
}

async function listNotifications({ userId }) {
  return await UserNotification.getNotificationsByUserId(userId);
}

async function markNotificationAsRead({ notificationId, userId }) {
  return await UserNotification.markNotificationRead({ notificationId, userId });
}

async function getRequestById({ requestId, hospitalId }) {
  const request = await BloodRequest.getBloodRequestById(requestId);
  if (!request) {
    return { ok: false, status: 404, error: "Blood request not found" };
  }

  if (request.hospital_id !== hospitalId) {
    return { ok: false, status: 403, error: "Forbidden" };
  }

  return { ok: true, status: 200, request };
}

async function updateRequestStatus({ requestId, hospitalId, status }) {
  if (!status || typeof status !== "string" || !ALLOWED_REQUEST_STATUSES.has(status)) {
    return { ok: false, status: 400, error: "Invalid status. Must be pending, accepted, or completed" };
  }

  const request = await BloodRequest.getBloodRequestById(requestId);
  if (!request) {
    return { ok: false, status: 404, error: "Blood request not found" };
  }

  if (request.hospital_id !== hospitalId) {
    return { ok: false, status: 403, error: "Forbidden" };
  }

  const updatedRequest = await BloodRequest.updateBloodRequestStatus({ request_id: requestId, status });
  if (!updatedRequest) {
    return { ok: false, status: 500, error: "Unable to update request status" };
  }

  return { ok: true, status: 200, request: updatedRequest };
}

async function getBloodBankInventory({ bloodBankId }) {
  const inventory = await BloodInventory.getInventoryByHospitalId(bloodBankId);
  return { ok: true, status: 200, inventory };
}

async function updateBloodBankInventory({ bloodBankId, blood_group, units_available }) {
  const bloodGroupValidation = validateBloodGroup(blood_group);
  if (!bloodGroupValidation.isValid) {
    return { ok: false, status: 400, error: bloodGroupValidation.error };
  }

  const unitsValidation = validatePositiveInteger(units_available, "units_available");
  if (!unitsValidation.isValid) {
    return { ok: false, status: 400, error: unitsValidation.error };
  }

  const inventory = await BloodInventory.upsertInventory({
    hospital_id: bloodBankId,
    blood_group: bloodGroupValidation.value,
    units_available: unitsValidation.value,
  });

  return { ok: true, status: 200, inventory };
}

module.exports = {
  matchDonorsForRequest,
  listNotifications,
  markNotificationAsRead,
  getRequestById,
  updateRequestStatus,
  getBloodBankInventory,
  updateBloodBankInventory,
};
