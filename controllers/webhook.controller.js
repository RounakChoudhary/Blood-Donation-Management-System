const Notification = require("../models/notification.model");

const WEBHOOK_VERIFY_TOKEN = process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN;

function verifyWhatsAppWebhook(req, res) {
  const mode = req.query["hub.mode"];
  const token = req.query["hub.verify_token"];
  const challenge = req.query["hub.challenge"];

  if (mode === "subscribe" && token === WEBHOOK_VERIFY_TOKEN) {
    return res.status(200).send(challenge);
  }

  return res.sendStatus(403);
}

async function receiveWhatsAppWebhook(req, res) {
  try {
    const body = req.body;

    const entries = body?.entry || [];
    for (const entry of entries) {
      const changes = entry?.changes || [];

      for (const change of changes) {
        const value = change?.value;

        const statuses = value?.statuses || [];
        for (const statusItem of statuses) {
          const providerMessageId = statusItem?.id;
          const status = statusItem?.status;

          if (!providerMessageId || !status) continue;

          let mappedStatus = null;

          if (status === "sent") mappedStatus = "sent";
          else if (status === "delivered") mappedStatus = "delivered";
          else if (status === "read") mappedStatus = "read";
          else if (status === "failed") mappedStatus = "failed";

          if (!mappedStatus) continue;

          await Notification.updateNotificationByProviderMessageId({
            provider_message_id: providerMessageId,
            status: mappedStatus,
            error_message: statusItem?.errors
              ? JSON.stringify(statusItem.errors)
              : null,
            payload: statusItem,
          });
        }
      }
    }

    return res.sendStatus(200);
  } catch (err) {
    console.error(err);
    return res.sendStatus(500);
  }
}

module.exports = {
  verifyWhatsAppWebhook,
  receiveWhatsAppWebhook,
};