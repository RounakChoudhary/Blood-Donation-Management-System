const { sendEmergencyEmail } = require("./email.service");
const User = require("../models/user.model");

function toKm(distanceMeters) {
  return (distanceMeters / 1000).toFixed(1);
}

async function sendEmailForMatches(matches, request) {
  const donorIds = matches.map((m) => m.donor_id);

  const donors = await User.getUsersByDonorIds(donorIds);

  const donorMap = new Map(donors.map((d) => [d.donor_id, d]));

  for (const match of matches) {
    const donor = donorMap.get(match.donor_id);

    if (!donor || !donor.email) continue;

    await sendEmergencyEmail({
      to: donor.email,
      bloodGroup: request.blood_group,
      unitsRequired: request.units_required,
      distanceKm: toKm(match.distance_meters),
      matchId: match.id,
    });
  }
}

module.exports = {
  sendEmailForMatches,
};