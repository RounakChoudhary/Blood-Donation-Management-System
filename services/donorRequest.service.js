const Match = require("../models/bloodRequestMatch.model");
const Donor = require("../models/donor.model");
const responseTokenService = require("./responseToken.service");
const { sendHospitalDonorAcceptanceEmail } = require("./email.service");

async function getDonorRequests(user_id) {
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

  if (match.status !== "pending") {
    return { ok: false, status: 400, error: "Match already responded" };
  }

  const updated = await Match.updateMatchStatus(match_id, "accepted");
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

  if (match.status !== "pending") {
    return { ok: false, status: 400, error: "Match already responded" };
  }

  const updated = await Match.updateMatchStatus(match_id, "declined");
  await responseTokenService.consumeTokensForMatch({
    match_id: match.id,
    donor_id: donor.id,
  });

  return {
    ok: true,
    status: 200,
    match: updated,
  };
}

async function respondToRequestByToken({ token, action }) {
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

  if (match.status !== "pending") {
    await responseTokenService.consumeTokensForMatch({
      match_id: match.id,
      donor_id: match.donor_id,
    });
    return { ok: false, status: 400, error: "Match already responded" };
  }

  const updated = await Match.updateMatchStatus(match.id, action);
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
