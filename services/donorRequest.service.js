const Match = require("../models/bloodRequestMatch.model");
const Donor = require("../models/donor.model");
const DonationRecord = require("../models/donationRecord.model");
const responseTokenService = require("./responseToken.service");
const BloodRequest = require("../models/bloodRequest.model");
const { sendHospitalDonorAcceptanceEmail } = require("./email.service");
const systemConfigModel = require("../models/systemConfig.model");
const ACTIONABLE_MATCH_STATUSES = new Set(["pending", "notified"]);
const DEFAULT_COOLDOWN_DAYS = 120;

async function getCooldownDays() {
  const config = await systemConfigModel.getSystemConfig();
  const cooldownDays = Number(config?.cooldown_days);
  if (Number.isInteger(cooldownDays) && cooldownDays > 0) {
    return cooldownDays;
  }
  return DEFAULT_COOLDOWN_DAYS;
}

async function finalizeAcceptedDonation({ match, donor_id }) {
  const cooldownDays = await getCooldownDays();
  const donationSnapshot = await Donor.markDonated({
    donor_id,
    donation_date: new Date().toISOString().slice(0, 10),
    cooldown_days: cooldownDays,
  });

  const donor = await Donor.updateAvailabilityByDonorId({
    donor_id,
    availability_status: "unavailable",
  });

  const context = await Match.getMatchResponseContext(match.id);
  if (context?.hospital_id && context?.blood_group) {
    await DonationRecord.createDonationRecord({
      donor_id,
      hospital_id: context.hospital_id,
      blood_group: context.blood_group,
      units: 1,
      donation_date: donationSnapshot?.last_donation_date || null,
    });
  }

  return {
    donor: donor || donationSnapshot || null,
    context,
  };
}

async function syncRequestStatusForMatch(matchOrId) {
  const match = typeof matchOrId === "object" ? matchOrId : await Match.getMatchById(matchOrId);
  if (!match) return null;

  const request = await BloodRequest.getBloodRequestById(match.request_id);
  if (!request) return null;

  const acceptedCount = await Match.countAcceptedMatchesByRequestId(match.request_id);
  const totalCount = await Match.countMatchesByRequestId(match.request_id);

  let nextStatus = "matching";
  if (acceptedCount >= Number(request.units_required)) {
    nextStatus = "fulfilled";
  } else if (totalCount > 0) {
    nextStatus = "active";
  }

  return BloodRequest.transitionBloodRequestStatus({
    request_id: match.request_id,
    from_statuses: ["pending", "matching", "active", "fulfilled"],
    to_status: nextStatus,
  });
}

async function getDonorRequests(user_id) {
  await responseTokenService.expirePendingResponses();

  const donor = await Donor.getDonorByUserId(user_id);

  if (!donor) {
    return { ok: false, status: 404, error: "Donor profile not found" };
  }

  const matches = await Match.getPendingMatchesForDonor(donor.id);

  return {
    ok: true,
    status: 200,
    matches,
  };
}

async function acceptRequest({ user_id, match_id }) {
  const donor = await Donor.getDonorByUserId(user_id);

  if (!donor) {
    return { ok: false, status: 404, error: "Donor profile not found" };
  }

  const match = await Match.getMatchById(match_id);

  if (!match) {
    return { ok: false, status: 404, error: "Match not found" };
  }

  if (match.donor_id !== donor.id) {
    return { ok: false, status: 403, error: "Forbidden" };
  }

  if (!ACTIONABLE_MATCH_STATUSES.has(match.status)) {
    return { ok: false, status: 400, error: "Match already responded" };
  }

  const updated = await Match.updateMatchStatus(match_id, "accepted", {
    response_channel: "email",
    responded_at: new Date(),
  });
  const acceptanceResult = await finalizeAcceptedDonation({
    match,
    donor_id: donor.id,
  });
  await responseTokenService.consumeTokensForMatch({
    match_id: match.id,
    donor_id: donor.id,
  });

  const context = acceptanceResult.context;
  if (context?.hospital_email) {
    await sendHospitalDonorAcceptanceEmail({
      to: context.hospital_email,
      hospitalName: context.hospital_name,
      donorName: context.donor_name,
      donorEmail: context.donor_email,
      donorPhone: context.donor_phone,
      bloodGroup: context.blood_group,
    });
  }

  await syncRequestStatusForMatch(updated);

  return {
    ok: true,
    status: 200,
    match: updated,
    donor: acceptanceResult.donor,
  };
}

async function rejectRequest({ user_id, match_id }) {
  const donor = await Donor.getDonorByUserId(user_id);

  if (!donor) {
    return { ok: false, status: 404, error: "Donor profile not found" };
  }

  const match = await Match.getMatchById(match_id);

  if (!match) {
    return { ok: false, status: 404, error: "Match not found" };
  }

  if (match.donor_id !== donor.id) {
    return { ok: false, status: 403, error: "Forbidden" };
  }

  if (!ACTIONABLE_MATCH_STATUSES.has(match.status)) {
    return { ok: false, status: 400, error: "Match already responded" };
  }

  const updated = await Match.updateMatchStatus(match_id, "declined", {
    response_channel: "email",
    responded_at: new Date(),
  });
  await responseTokenService.consumeTokensForMatch({
    match_id: match.id,
    donor_id: donor.id,
  });

  await syncRequestStatusForMatch(updated);

  return {
    ok: true,
    status: 200,
    match: updated,
  };
}

async function respondToRequestByToken({ token, action }) {
  const expiryResult = await responseTokenService.expirePendingResponses();
  if (!token && expiryResult.updated_match_count >= 0) {
    return { ok: false, status: 400, error: "Token is invalid, expired, or already used" };
  }

  if (!["accepted", "declined"].includes(action)) {
    return { ok: false, status: 400, error: "Invalid response action" };
  }

  const responseToken = await responseTokenService.verifyResponseToken(token);
  if (!responseToken) {
    return { ok: false, status: 400, error: "Token is invalid, expired, or already used" };
  }

  const match = await Match.getMatchById(responseToken.match_id);
  if (!match) {
    return { ok: false, status: 404, error: "Match not found" };
  }

  if (match.donor_id !== responseToken.donor_id) {
    return { ok: false, status: 403, error: "Token donor mismatch" };
  }

  if (!ACTIONABLE_MATCH_STATUSES.has(match.status)) {
    await responseTokenService.consumeTokensForMatch({
      match_id: match.id,
      donor_id: match.donor_id,
    });
    return { ok: false, status: 400, error: "Match already responded" };
  }

  const updated = await Match.updateMatchStatus(match.id, action, {
    response_channel: "email",
    responded_at: new Date(),
  });
  await responseTokenService.consumeResponseToken(responseToken.id);
  await responseTokenService.consumeTokensForMatch({
    match_id: match.id,
    donor_id: match.donor_id,
  });

  let donor = null;
  let context = null;

  if (action === "accepted") {
    const acceptanceResult = await finalizeAcceptedDonation({
      match,
      donor_id: match.donor_id,
    });
    donor = acceptanceResult.donor;
    context = acceptanceResult.context;

    if (context?.hospital_email) {
      await sendHospitalDonorAcceptanceEmail({
        to: context.hospital_email,
        hospitalName: context.hospital_name,
        donorName: context.donor_name,
        donorEmail: context.donor_email,
        donorPhone: context.donor_phone,
        bloodGroup: context.blood_group,
      });
    }
  }

  await syncRequestStatusForMatch(updated);

  return {
    ok: true,
    status: 200,
    action,
    match: updated,
    donor,
    hospital_notified: Boolean(context?.hospital_email),
  };
}

module.exports = {
  getDonorRequests,
  acceptRequest,
  rejectRequest,
  respondToRequestByToken,
};
