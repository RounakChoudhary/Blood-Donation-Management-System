const pool = require("./db");

async function createNotification({
  match_id,
  channel = "email",
  template_name = null,
  provider_message_id = null,
  status = "pending",
  error_message = null,
  payload = null,
  sent_at = null,
}) {
  const query = `
    INSERT INTO notifications (
      match_id,
      channel,
      template_name,
      provider_message_id,
      status,
      error_message,
      payload,
      sent_at
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
    RETURNING *;
  `;

  const values = [
    match_id,
    channel,
    template_name,
    provider_message_id,
    status,
    error_message,
    payload,
    sent_at,
  ];

  const { rows } = await pool.query(query, values);
  return rows[0];
}

async function updateNotificationById({
  id,
  provider_message_id = null,
  status = null,
  error_message = null,
  payload = null,
  sent_at = null,
}) {
  const query = `
    UPDATE notifications
    SET
      provider_message_id = COALESCE($2, provider_message_id),
      status = COALESCE($3, status),
      error_message = COALESCE($4, error_message),
      payload = COALESCE($5, payload),
      sent_at = COALESCE($6, sent_at),
      updated_at = NOW()
    WHERE id = $1
    RETURNING *;
  `;

  const { rows } = await pool.query(query, [
    id,
    provider_message_id,
    status,
    error_message,
    payload,
    sent_at,
  ]);

  return rows[0] || null;
}

async function updateNotificationByProviderMessageId({
  provider_message_id,
  status,
  error_message = null,
  payload = null,
}) {
  const query = `
    UPDATE notifications
    SET
      status = COALESCE($2, status),
      error_message = COALESCE($3, error_message),
      payload = COALESCE($4, payload),
      updated_at = NOW()
    WHERE provider_message_id = $1
    RETURNING *;
  `;

  const { rows } = await pool.query(query, [
    provider_message_id,
    status,
    error_message,
    payload,
  ]);

  return rows[0] || null;
}

async function getNotificationByProviderMessageId(provider_message_id) {
  const { rows } = await pool.query(
    `
      SELECT *
      FROM notifications
      WHERE provider_message_id = $1
      LIMIT 1
    `,
    [provider_message_id]
  );

  return rows[0] || null;
}

module.exports = {
  createNotification,
  updateNotificationById,
  updateNotificationByProviderMessageId,
  getNotificationByProviderMessageId,
};
