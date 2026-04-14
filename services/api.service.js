const BloodRequest = require("../models/bloodRequest.model");
const UserNotification = require("../models/userNotification.model");
const BloodInventory = require("../models/bloodInventory.model");
const { validateBloodGroup, validatePositiveInteger } = require("../utils/validation");

const ALLOWED_REQUEST_STATUSES = new Set(["pending", "matching", "active", "fulfilled", "cancelled"]);
const DEFAULT_MATCH_RADIUS_METERS = 10000;
const TERMINAL_REQUEST_STATUSES = new Set(["fulfilled", "cancelled"]);

function canTransitionRequestStatus(currentStatus, nextStatus) {
  const current = String(currentStatus || "").toLowerCase();
  const next = String(nextStatus || "").toLowerCase();

  if (!ALLOWED_REQUEST_STATUSES.has(next)) {
    return false;
  }

  if (current === next) {
    return true;
  }

  if (TERMINAL_REQUEST_STATUSES.has(current)) {
    return false;
  }

  const allowedTransitions = {
    pending: new Set(["matching", "active", "cancelled"]),
    matching: new Set(["active", "fulfilled", "cancelled"]),
    active: new Set(["fulfilled", "cancelled"]),
  };

  return Boolean(allowedTransitions[current]?.has(next));
}

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
  const normalizedStatus = String(status || "").trim().toLowerCase();
  if (!normalizedStatus || !ALLOWED_REQUEST_STATUSES.has(normalizedStatus)) {
    return {
      ok: false,
      status: 400,
      error: "Invalid status. Must be pending, matching, active, fulfilled, or cancelled",
    };
  }

  const request = await BloodRequest.getBloodRequestById(requestId);
  if (!request) {
    return { ok: false, status: 404, error: "Blood request not found" };
  }

  if (request.hospital_id !== hospitalId) {
    return { ok: false, status: 403, error: "Forbidden" };
  }

  if (!canTransitionRequestStatus(request.status, normalizedStatus)) {
    return {
      ok: false,
      status: 409,
      error: `Cannot transition request from ${request.status} to ${normalizedStatus}`,
    };
  }

  const updatedRequest = await BloodRequest.updateBloodRequestStatus({
    request_id: requestId,
    status: normalizedStatus,
  });
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
