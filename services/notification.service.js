const Notification = require("../models/notification.model");
const User = require("../models/user.model");
const { sendEmergencyEmail } = require("./email.service");

function toKm(distanceMeters) {
  return (Number(distanceMeters || 0) / 1000).toFixed(1);
}

async function sendEmailForMatches(matches, request) {
  if (!matches || matches.length === 0) {
    return [];
  }

  const donorIds = matches.map((m) => m.donor_id);
  const donors = await User.getUsersByDonorIds(donorIds);
  const donorMap = new Map(donors.map((d) => [d.donor_id, d]));

  const results = [];

  for (const match of matches) {
    const donorUser = donorMap.get(match.donor_id);

    if (!donorUser || !donorUser.email) {
      await Notification.createNotification({
        match_id: match.id,
        channel: "email",
        template_name: "emergency_blood_request_email",
        status: "failed",
        error_message: "User email missing",
        payload: { donor_id: match.donor_id },
      });

      results.push({
        match_id: match.id,
        ok: false,
        reason: "User email missing",
      });
      continue;
    }

    try {
      const sendResult = await sendEmergencyEmail({
        to: donorUser.email,
        bloodGroup: request.blood_group,
        unitsRequired: request.units_required,
        distanceKm: toKm(match.distance_meters),
        matchId: match.id,
      });

      await Notification.createNotification({
        match_id: match.id,
        channel: "email",
        template_name: "emergency_blood_request_email",
        provider_message_id: sendResult.messageId || null,
        status: "sent",
        payload: sendResult.raw,
        sent_at: new Date(),
      });

      results.push({
        match_id: match.id,
        ok: true,
        provider_message_id: sendResult.messageId || null,
      });
    } catch (err) {
      await Notification.createNotification({
        match_id: match.id,
        channel: "email",
        template_name: "emergency_blood_request_email",
        status: "failed",
        error_message: err.message,
        payload: { error: err.message },
      });

      results.push({
        match_id: match.id,
        ok: false,
        reason: err.message,
      });
    }
  }

  return results;
}

module.exports = {
  sendEmailForMatches,
};