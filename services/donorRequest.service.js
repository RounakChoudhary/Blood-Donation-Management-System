const Match = require("../models/bloodRequestMatch.model");
const Donor = require("../models/donor.model");
const responseTokenService = require("./responseToken.service");
const BloodRequest = require("../models/bloodRequest.model");
const { sendHospitalDonorAcceptanceEmail } = require("./email.service");
const ACTIONABLE_MATCH_STATUSES = new Set(["pending", "notified"]);

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
  await Donor.updateAvailabilityByDonorId({
    donor_id: donor.id,
    availability_status: "unavailable",
  });
  await responseTokenService.consumeTokensForMatch({
    match_id: match.id,
    donor_id: donor.id,
  });

  const context = await Match.getMatchResponseContext(match_id);
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
    donor = await Donor.updateAvailabilityByDonorId({
      donor_id: match.donor_id,
      availability_status: "unavailable",
    });
    context = await Match.getMatchResponseContext(match.id);

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
