const Notification = require("../models/notification.model");
const User = require("../models/user.model");
const EmailLog = require("../models/emailLog.model");
const Hospital = require("../models/hospital.model");
const Match = require("../models/bloodRequestMatch.model");
const RegularBloodRequest = require("../models/regularBloodRequest.model");
const responseTokenService = require("./responseToken.service");
const { sendEmergencyEmail, sendRegularBloodRequestEmail } = require("./email.service");

const RETRY_DELAYS_MS = [5000, 25000, 125000];

function toKm(distanceMeters) {
  return (Number(distanceMeters || 0) / 1000).toFixed(1);
}

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function buildRetryPayload({ attempt, nextRetryInMs = null, raw = null, error = null }) {
  return {
    attempt,
    next_retry_in_ms: nextRetryInMs,
    raw,
    error,
  };
}

function buildNextRetryDate(nextRetryInMs) {
  if (!nextRetryInMs) return null;
  return new Date(Date.now() + nextRetryInMs);
}

async function sendWithRetry({
  notification,
  emailLog,
  donorUser,
  request,
  match,
  hospital,
}) {
  const tokenResult = await responseTokenService.issueResponseToken({
    match_id: match.id,
    donor_id: match.donor_id,
  });

  const token = encodeURIComponent(tokenResult.rawToken);
  const acceptLink = `${process.env.APP_BASE_URL || "http://localhost:3000"}/donor-requests/respond/accept?token=${token}`;
  const declineLink = `${process.env.APP_BASE_URL || "http://localhost:3000"}/donor-requests/respond/decline?token=${token}`;

  let lastError = null;

  for (let attempt = 1; attempt <= RETRY_DELAYS_MS.length + 1; attempt += 1) {
    const last_attempt_at = new Date();

    try {
      const sendResult = await sendEmergencyEmail({
        to: donorUser.email,
        bloodGroup: request.blood_group,
        unitsRequired: request.units_required,
        distanceKm: toKm(match.distance_meters),
        hospitalName: hospital?.name || null,
        acceptLink,
        declineLink,
      });

      await Notification.updateNotificationById({
        id: notification.id,
        provider_message_id: sendResult.messageId || null,
        status: "sent",
        error_message: null,
        payload: buildRetryPayload({
          attempt,
          nextRetryInMs: null,
          raw: sendResult.raw,
        }),
        sent_at: new Date(),
      });

      await EmailLog.updateEmailLogById({
        id: emailLog.id,
        provider_message_id: sendResult.messageId || null,
        status: "sent",
        error_message: null,
        payload: buildRetryPayload({
          attempt,
          nextRetryInMs: null,
          raw: sendResult.raw,
        }),
        sent_at: new Date(),
        attempt_count: attempt,
        last_attempt_at,
        next_retry_at: null,
      });

      await Match.markMatchNotified(match.id);

      return {
        ok: true,
        provider_message_id: sendResult.messageId || null,
        attempts: attempt,
      };
    } catch (err) {
      lastError = err;
      const nextRetryInMs = RETRY_DELAYS_MS[attempt - 1] ?? null;
      const status = nextRetryInMs ? "pending" : "failed";
      const retryPayload = buildRetryPayload({
        attempt,
        nextRetryInMs,
        error: err.message,
      });

      await Notification.updateNotificationById({
        id: notification.id,
        status,
        error_message: err.message,
        payload: retryPayload,
      });

      await EmailLog.updateEmailLogById({
        id: emailLog.id,
        status,
        error_message: err.message,
        payload: retryPayload,
        attempt_count: attempt,
        last_attempt_at,
        next_retry_at: buildNextRetryDate(nextRetryInMs),
      });

      if (!nextRetryInMs) {
        break;
      }

      await delay(nextRetryInMs);
    }
  }

  return {
    ok: false,
    reason: lastError ? lastError.message : "Email delivery failed",
    attempts: RETRY_DELAYS_MS.length + 1,
  };
}

async function sendEmailForMatches(matches, request) {
  await responseTokenService.expirePendingResponses();

  if (!matches || matches.length === 0) {
    return [];
  }

  const donorIds = matches.map((m) => m.donor_id);
  const donors = await User.getUsersByDonorIds(donorIds);
  const donorMap = new Map(donors.map((d) => [d.donor_id, d]));
  const hospital = await Hospital.getHospitalById(request.hospital_id);

  const results = [];

  for (const match of matches) {
    const donorUser = donorMap.get(match.donor_id);

    if (!donorUser || !donorUser.email) {
      const notification = await Notification.createNotification({
        match_id: match.id,
        template_name: "emergency_blood_request_email",
        status: "failed",
        error_message: "User email missing",
        payload: { donor_id: match.donor_id },
      });

      await EmailLog.createEmailLog({
        notification_id: notification.id,
        match_id: match.id,
        recipient_email: donorUser?.email || "unknown",
        template_name: "emergency_blood_request_email",
        status: "failed",
        error_message: "User email missing",
        payload: { donor_id: match.donor_id },
        next_retry_at: null,
      });

      results.push({
        match_id: match.id,
        ok: false,
        reason: "User email missing",
      });
      continue;
    }

    const notification = await Notification.createNotification({
      match_id: match.id,
      template_name: "emergency_blood_request_email",
      status: "pending",
      payload: { donor_id: match.donor_id, recipient_email: donorUser.email },
    });

    const emailLog = await EmailLog.createEmailLog({
      notification_id: notification.id,
      match_id: match.id,
      recipient_email: donorUser.email,
      template_name: "emergency_blood_request_email",
      status: "pending",
      payload: { donor_id: match.donor_id },
      attempt_count: 0,
      next_retry_at: null,
    });

    try {
      const delivery = await sendWithRetry({
        notification,
        emailLog,
        donorUser,
        request,
        match,
        hospital,
      });

      results.push({
        match_id: match.id,
        ok: delivery.ok,
        provider_message_id: delivery.provider_message_id || null,
        attempts: delivery.attempts,
        reason: delivery.reason || null,
      });
    } catch (err) {
      await Notification.updateNotificationById({
        id: notification.id,
        status: "failed",
        error_message: err.message,
        payload: { error: err.message },
      });

      await EmailLog.updateEmailLogById({
        id: emailLog.id,
        status: "failed",
        error_message: err.message,
        payload: { error: err.message },
        attempt_count: emailLog.attempt_count || 0,
      });

      results.push({
        match_id: match.id,
        ok: false,
        reason: err.message,
        attempts: emailLog.attempt_count || 0,
      });
    }
  }

  return results;
}

async function notifyBloodBanksForEmergencyRequest({ request, bloodBanks = [] }) {
  if (!request || !Array.isArray(bloodBanks) || bloodBanks.length === 0) {
    return [];
  }

  const hospital = await Hospital.getHospitalById(request.hospital_id);
  const results = [];

  for (const bank of bloodBanks) {
    if (!bank.email) {
      results.push({
        blood_bank_id: bank.id,
        ok: false,
        reason: "Blood bank email missing",
      });
      continue;
    }

    try {
      const sendResult = await sendRegularBloodRequestEmail({
        to: bank.email,
        hospitalName: hospital?.name || "A nearby hospital",
        bloodGroup: request.blood_group,
        unitsRequired: request.units_required,
        requiredDate: new Date().toISOString().slice(0, 10),
        notes: request.notes || request.patient_name || null,
        subjectPrefix: "Emergency",
      });

      results.push({
        blood_bank_id: bank.id,
        ok: true,
        provider_message_id: sendResult.messageId || null,
      });
    } catch (err) {
      results.push({
        blood_bank_id: bank.id,
        ok: false,
        reason: err.message,
      });
    }
  }

  return results;
}

async function notifyBloodBanksForRegularRequest({ request, bloodBanks = [] }) {
  if (!request || !Array.isArray(bloodBanks) || bloodBanks.length === 0) {
    return [];
  }

  const hospital = await Hospital.getHospitalById(request.hospital_id);
  const results = [];

  for (const bank of bloodBanks) {
    if (!bank.email) {
      await RegularBloodRequest.createRegularBloodRequestNotification({
        regular_request_id: request.id,
        blood_bank_id: bank.id,
        recipient_email: null,
        status: "failed",
        error_message: "Blood bank email missing",
      });

      results.push({
        blood_bank_id: bank.id,
        ok: false,
        reason: "Blood bank email missing",
      });
      continue;
    }

    try {
      const sendResult = await sendRegularBloodRequestEmail({
        to: bank.email,
        hospitalName: hospital?.name || "A nearby hospital",
        bloodGroup: request.blood_group,
        unitsRequired: request.units_required,
        requiredDate: request.required_date,
        notes: request.notes || null,
        subjectPrefix: "Regular",
      });

      await RegularBloodRequest.createRegularBloodRequestNotification({
        regular_request_id: request.id,
        blood_bank_id: bank.id,
        recipient_email: bank.email,
        status: "sent",
      });

      results.push({
        blood_bank_id: bank.id,
        ok: true,
        provider_message_id: sendResult.messageId || null,
      });
    } catch (err) {
      await RegularBloodRequest.createRegularBloodRequestNotification({
        regular_request_id: request.id,
        blood_bank_id: bank.id,
        recipient_email: bank.email,
        status: "failed",
        error_message: err.message,
      });

      results.push({
        blood_bank_id: bank.id,
        ok: false,
        reason: err.message,
      });
    }
  }

  return results;
}

module.exports = {
  sendEmailForMatches,
  notifyBloodBanksForEmergencyRequest,
  notifyBloodBanksForRegularRequest,
};
