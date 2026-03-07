const WHATSAPP_API_BASE = process.env.WHATSAPP_API_BASE || "https://graph.facebook.com";
const WHATSAPP_API_VERSION = process.env.WHATSAPP_API_VERSION || "v23.0";
const WHATSAPP_PHONE_NUMBER_ID = process.env.WHATSAPP_PHONE_NUMBER_ID;
const WHATSAPP_ACCESS_TOKEN = process.env.WHATSAPP_ACCESS_TOKEN;
const APP_BASE_URL = process.env.APP_BASE_URL || "http://localhost:3000";

function ensureConfig() {
  if (!WHATSAPP_PHONE_NUMBER_ID || !WHATSAPP_ACCESS_TOKEN) {
    throw new Error("WhatsApp API config missing");
  }
}

function buildDonorActionLink(matchId) {
  return `${APP_BASE_URL}/donor-requests/${matchId}`;
}

async function sendEmergencyTemplate({
  to,
  templateName,
  languageCode = "en",
  bloodGroup,
  unitsRequired,
  distanceKm,
  matchId,
}) {
  ensureConfig();

  const url = `${WHATSAPP_API_BASE}/${WHATSAPP_API_VERSION}/${WHATSAPP_PHONE_NUMBER_ID}/messages`;

  const actionLink = buildDonorActionLink(matchId);

  const body = {
    messaging_product: "whatsapp",
    to,
    type: "template",
    template: {
      name: templateName,
      language: {
        code: languageCode,
      },
      components: [
        {
          type: "body",
          parameters: [
            { type: "text", text: String(bloodGroup) },
            { type: "text", text: String(unitsRequired) },
            { type: "text", text: String(distanceKm) },
          ],
        },
        {
          type: "button",
          sub_type: "url",
          index: "0",
          parameters: [
            { type: "text", text: String(matchId) },
          ],
        },
      ],
    },
  };

  const response = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${WHATSAPP_ACCESS_TOKEN}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  const data = await response.json();

  if (!response.ok) {
    return {
      ok: false,
      error: data?.error?.message || "WhatsApp send failed",
      raw: data,
    };
  }

  return {
    ok: true,
    provider_message_id: data?.messages?.[0]?.id || null,
    raw: data,
    action_link: actionLink,
  };
}

module.exports = {
  sendEmergencyTemplate,
};