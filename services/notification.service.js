const Notification = require("../models/notification.model");
const User = require("../models/user.model");
const { sendEmergencyTemplate } = require("./whatsapp.service");

const DEFAULT_TEMPLATE_NAME = process.env.WHATSAPP_EMERGENCY_TEMPLATE || "emergency_blood_request";

function toKm(distanceMeters) {
  return (Number(distanceMeters || 0) / 1000).toFixed(1);
}

async function sendWhatsAppForMatches(matches, request) {
  if (!matches || matches.length === 0) {
    return [];
  }

  const donorIds = matches.map((m) => m.donor_id);
  const donors = await User.getUsersByDonorIds(donorIds);

  const donorMap = new Map(donors.map((d) => [d.donor_id, d]));
  const results = [];

  for (const match of matches) {
    const donorUser = donorMap.get(match.donor_id);

    if (!donorUser) {
      results.push({
        match_id: match.id,
        ok: false,
        reason: "Donor user not found",
      });
      continue;
    }

    if (!donorUser.whatsapp_opt_in || !donorUser.whatsapp_phone) {
      await Notification.createNotification({
        match_id: match.id,
        channel: "whatsapp",
        template_name: DEFAULT_TEMPLATE_NAME,
        status: "failed",
        error_message: "User has not opted in to WhatsApp or phone missing",
        payload: { donor_id: match.donor_id },
      });

      results.push({
        match_id: match.id,
        ok: false,
        reason: "WhatsApp opt-in missing",
      });
      continue;
    }

    const sendResult = await sendEmergencyTemplate({
      to: donorUser.whatsapp_phone,
      templateName: DEFAULT_TEMPLATE_NAME,
      bloodGroup: request.blood_group,
      unitsRequired: request.units_required,
      distanceKm: toKm(match.distance_meters),
      matchId: match.id,
    });

    if (!sendResult.ok) {
      await Notification.createNotification({
        match_id: match.id,
        channel: "whatsapp",
        template_name: DEFAULT_TEMPLATE_NAME,
        status: "failed",
        error_message: sendResult.error,
        payload: sendResult.raw,
      });

      results.push({
        match_id: match.id,
        ok: false,
        reason: sendResult.error,
      });
      continue;
    }

    await Notification.createNotification({
      match_id: match.id,
      channel: "whatsapp",
      template_name: DEFAULT_TEMPLATE_NAME,
      provider_message_id: sendResult.provider_message_id,
      status: "sent",
      payload: sendResult.raw,
      sent_at: new Date(),
    });

    results.push({
      match_id: match.id,
      ok: true,
      provider_message_id: sendResult.provider_message_id,
    });
  }

  return results;
}

module.exports = {
  sendWhatsAppForMatches,
};