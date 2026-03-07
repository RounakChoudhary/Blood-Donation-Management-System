const Match = require("../models/bloodRequestMatch.model");
const Donor = require("../models/donor.model");

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

  return {
    ok: true,
    status: 200,
    match: updated,
  };
}

module.exports = {
  getDonorRequests,
  acceptRequest,
  rejectRequest,
};