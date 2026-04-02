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

  const nearbyBloodBanks = await bloodBankService.findNearbyBloodBanks({
    hospital_id,
    radius_meters,
  });

  const notifications = await notificationService.notifyBloodBanksForRegularRequest({
    request,
    bloodBanks: nearbyBloodBanks,
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

module.exports = {
  createRegularRequest,
};
