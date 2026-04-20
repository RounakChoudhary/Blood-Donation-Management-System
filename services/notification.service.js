const Notification = require("../models/notification.model");
const User = require("../models/user.model");
const EmailLog = require("../models/emailLog.model");
const Hospital = require("../models/hospital.model");
const BloodRequest = require("../models/bloodRequest.model");
const Match = require("../models/bloodRequestMatch.model");
const RegularBloodRequest = require("../models/regularBloodRequest.model");
const UserNotification = require("../models/userNotification.model");
const responseTokenService = require("./responseToken.service");
const { sendEmergencyEmail, sendRegularBloodRequestEmail } = require("./email.service");

const RETRY_DELAYS_MS = [5000, 25000, 125000];

function getAppBaseUrl() {
  const appBaseUrl = String(process.env.APP_BASE_URL || "").trim().replace(/\/$/, "");
  if (!appBaseUrl) {
    throw new Error("APP_BASE_URL is not set");
  }
  return appBaseUrl;
}

function toKm(distanceMeters) {
  return (Number(distanceMeters || 0) / 1000).toFixed(1);
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

async function buildResponseLinks(match) {
  const tokenResult = await responseTokenService.issueResponseToken({
    match_id: match.id,
    donor_id: match.donor_id,
  });

  const token = encodeURIComponent(tokenResult.rawToken);
  const appBaseUrl = getAppBaseUrl();
  return {
    acceptLink: `${appBaseUrl}/donor-requests/respond/accept?token=${token}`,
    declineLink: `${appBaseUrl}/donor-requests/respond/decline?token=${token}`,
  };
}

function getNextRetryDelayMs(attempt) {
  return RETRY_DELAYS_MS[attempt - 1] ?? null;
}

function buildDonorMatchMessage({ request, hospitalName, match }) {
  const distanceKm = toKm(match.distance_meters);
  return `${hospitalName || "A nearby hospital"} needs ${request.blood_group} blood. ${request.units_required} unit(s) requested, approximately ${distanceKm} km away.`;
}

async function deliverEmergencyMatchEmail({
  notification,
  emailLog,
  recipientEmail,
  donorId,
  request,
  match,
  hospitalName,
}) {
  const attempt = Number(emailLog.attempt_count || 0) + 1;
  const last_attempt_at = new Date();
  const { acceptLink, declineLink } = await buildResponseLinks(match);

  try {
    const sendResult = await sendEmergencyEmail({
      to: recipientEmail,
      bloodGroup: request.blood_group,
      unitsRequired: request.units_required,
      distanceKm: toKm(match.distance_meters),
      hospitalName: hospitalName || null,
      acceptLink,
      declineLink,
    });

    if (notification?.id) {
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
    }

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
      scheduled_retry: false,
    };
  } catch (err) {
    const nextRetryInMs = getNextRetryDelayMs(attempt);
    const status = nextRetryInMs ? "pending" : "failed";
    const retryPayload = buildRetryPayload({
      attempt,
      nextRetryInMs,
      error: err.message,
    });

    if (notification?.id) {
      await Notification.updateNotificationById({
        id: notification.id,
        status,
        error_message: err.message,
        payload: retryPayload,
      });
    }

    await EmailLog.updateEmailLogById({
      id: emailLog.id,
      status,
      error_message: err.message,
      payload: retryPayload,
      attempt_count: attempt,
      last_attempt_at,
      next_retry_at: buildNextRetryDate(nextRetryInMs),
    });

    return {
      ok: false,
      reason: err.message,
      attempts: attempt,
      scheduled_retry: Boolean(nextRetryInMs),
      donor_id: donorId,
    };
  }
}

async function processPendingEmailRetries({ limit = 25 } = {}) {
  const dueLogs = await EmailLog.getDuePendingEmailLogs(limit);
  if (!dueLogs.length) {
    return {
      ok: true,
      processed_count: 0,
      sent_count: 0,
      rescheduled_count: 0,
      failed_count: 0,
      results: [],
    };
  }

  const results = [];

  for (const emailLog of dueLogs) {
    try {
      const match = await Match.getMatchById(emailLog.match_id);
      if (!match) {
        await EmailLog.updateEmailLogById({
          id: emailLog.id,
          status: "failed",
          error_message: "Match not found for retry",
          next_retry_at: null,
        });
        if (emailLog.notification_id) {
          await Notification.updateNotificationById({
            id: emailLog.notification_id,
            status: "failed",
            error_message: "Match not found for retry",
          });
        }
        results.push({ email_log_id: emailLog.id, ok: false, reason: "Match not found for retry" });
        continue;
      }

      if (!["pending", "notified"].includes(match.status)) {
        await EmailLog.updateEmailLogById({
          id: emailLog.id,
          status: "failed",
          error_message: `Retry cancelled because match is ${match.status}`,
          next_retry_at: null,
        });
        if (emailLog.notification_id) {
          await Notification.updateNotificationById({
            id: emailLog.notification_id,
            status: "failed",
            error_message: `Retry cancelled because match is ${match.status}`,
          });
        }
        results.push({
          email_log_id: emailLog.id,
          ok: false,
          reason: `Retry cancelled because match is ${match.status}`,
        });
        continue;
      }

      const context = await Match.getMatchResponseContext(match.id);
      if (!context?.donor_email) {
        await EmailLog.updateEmailLogById({
          id: emailLog.id,
          status: "failed",
          error_message: "Recipient email missing for retry",
          next_retry_at: null,
        });
        if (emailLog.notification_id) {
          await Notification.updateNotificationById({
            id: emailLog.notification_id,
            status: "failed",
            error_message: "Recipient email missing for retry",
          });
        }
        results.push({ email_log_id: emailLog.id, ok: false, reason: "Recipient email missing for retry" });
        continue;
      }

      const request = await BloodRequest.getBloodRequestById(match.request_id);
      if (!request) {
        await EmailLog.updateEmailLogById({
          id: emailLog.id,
          status: "failed",
          error_message: "Blood request not found for retry",
          next_retry_at: null,
        });
        if (emailLog.notification_id) {
          await Notification.updateNotificationById({
            id: emailLog.notification_id,
            status: "failed",
            error_message: "Blood request not found for retry",
          });
        }
        results.push({ email_log_id: emailLog.id, ok: false, reason: "Blood request not found for retry" });
        continue;
      }

      const delivery = await deliverEmergencyMatchEmail({
        notification: { id: emailLog.notification_id },
        emailLog,
        recipientEmail: context.donor_email,
        donorId: context.donor_id,
        request,
        match,
        hospitalName: context.hospital_name,
      });

      results.push({
        email_log_id: emailLog.id,
        ok: delivery.ok,
        attempts: delivery.attempts,
        scheduled_retry: Boolean(delivery.scheduled_retry),
        provider_message_id: delivery.provider_message_id || null,
        reason: delivery.reason || null,
      });
    } catch (error) {
      results.push({
        email_log_id: emailLog.id,
        ok: false,
        reason: error.message,
      });
    }
  }

  return {
    ok: true,
    processed_count: dueLogs.length,
    sent_count: results.filter((item) => item.ok).length,
    rescheduled_count: results.filter((item) => item.scheduled_retry).length,
    failed_count: results.filter((item) => !item.ok && !item.scheduled_retry).length,
    results,
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
      if (donorUser?.user_id) {
        await UserNotification.createUserNotification({
          user_id: donorUser.user_id,
          message: buildDonorMatchMessage({
            request,
            hospitalName: hospital?.name || null,
            match,
          }),
          payload: {
            type: "emergency_blood_request",
            match_id: match.id,
            request_id: request.id,
            hospital_id: request.hospital_id,
            blood_group: request.blood_group,
          },
        });
      }

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

    await UserNotification.createUserNotification({
      user_id: donorUser.user_id,
      message: buildDonorMatchMessage({
        request,
        hospitalName: hospital?.name || null,
        match,
      }),
      payload: {
        type: "emergency_blood_request",
        match_id: match.id,
        request_id: request.id,
        hospital_id: request.hospital_id,
        blood_group: request.blood_group,
      },
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
      const delivery = await deliverEmergencyMatchEmail({
        notification,
        emailLog,
        recipientEmail: donorUser.email,
        donorId: match.donor_id,
        request,
        match,
        hospitalName: hospital?.name || null,
      });

      results.push({
        match_id: match.id,
        ok: delivery.ok,
        provider_message_id: delivery.provider_message_id || null,
        attempts: delivery.attempts,
        reason: delivery.reason || null,
        scheduled_retry: Boolean(delivery.scheduled_retry),
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
  processPendingEmailRetries,
  notifyBloodBanksForRegularRequest,
};
