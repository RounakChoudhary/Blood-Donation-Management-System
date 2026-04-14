const RegularBloodRequest = require("../models/regularBloodRequest.model");
const { allowedDonorGroupsRBC } = require("../utils/bloodCompat");
const bloodBankService = require("./bloodBank.service");
const notificationService = require("./notification.service");

function normalizeBloodGroup(value) {
  if (!value || typeof value !== "string") return null;
  return value.trim().toUpperCase();
}

function normalizeDateInput(value) {
  if (!value) return null;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return null;
  return d.toISOString().slice(0, 10);
}

function buildNotificationSummary(request) {
  return {
    total_notifications: Number(request.total_notifications || 0),
    sent_notifications: Number(request.sent_notifications || 0),
    failed_notifications: Number(request.failed_notifications || 0),
    pending_notifications: Number(request.pending_notifications || 0),
    last_notified_at: request.last_notified_at || null,
  };
}

async function createRegularRequest({
  hospital_id,
  blood_group,
  units_required,
  required_date,
  notes = null,
  radius_meters = 10000,
}) {
  const normalizedGroup = normalizeBloodGroup(blood_group);
  if (!normalizedGroup || allowedDonorGroupsRBC(normalizedGroup).length === 0) {
    return { ok: false, status: 400, error: "Invalid blood_group" };
  }

  const units = Number(units_required);
  if (!Number.isInteger(units) || units <= 0) {
    return { ok: false, status: 400, error: "units_required must be a positive integer" };
  }

  const normalizedDate = normalizeDateInput(required_date);
  if (!normalizedDate) {
    return { ok: false, status: 400, error: "required_date must be a valid date" };
  }

  const request = await RegularBloodRequest.createRegularBloodRequest({
    hospital_id,
    blood_group: normalizedGroup,
    units_required: units,
    required_date: normalizedDate,
    notes: notes ?? null,
  });

  const nearbyBloodBanksResult = await bloodBankService.findNearbyBloodBanks({
    hospital_id,
    radius_meters,
  });

  const notifications = await notificationService.notifyBloodBanksForRegularRequest({
    request,
    bloodBanks: nearbyBloodBanksResult.ok ? nearbyBloodBanksResult.blood_banks : [],
  });

  const sentCount = notifications.filter((item) => item.ok).length;
  const updatedRequest = await RegularBloodRequest.updateRegularBloodRequestStatus({
    request_id: request.id,
    status: sentCount > 0 ? "notified" : "pending",
  });

  return {
    ok: true,
    status: 201,
    request: updatedRequest || request,
    notified_blood_banks_count: sentCount,
    notifications,
  };
}

async function listRegularRequests({
  hospital_id,
  limit = 50,
  offset = 0,
}) {
  const requests = await RegularBloodRequest.getRegularBloodRequestsByHospitalId({
    hospital_id,
    limit: Number(limit),
    offset: Number(offset),
  });

  return {
    ok: true,
    status: 200,
    requests: requests.map((request) => ({
      ...request,
      notification_summary: buildNotificationSummary(request),
    })),
  };
}

async function getRegularRequestDetails({
  hospital_id,
  request_id,
}) {
  const request = await RegularBloodRequest.getRegularBloodRequestByIdForHospital({
    request_id: Number(request_id),
    hospital_id,
  });

  if (!request) {
    return { ok: false, status: 404, error: "Regular blood request not found" };
  }

  const notifications = await RegularBloodRequest.getNotificationsByRegularRequestId(request.id);

  return {
    ok: true,
    status: 200,
    request: {
      ...request,
      notification_summary: buildNotificationSummary(request),
      notifications,
    },
  };
}

module.exports = {
  createRegularRequest,
  listRegularRequests,
  getRegularRequestDetails,
};
