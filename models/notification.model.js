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
  provider_message_id,
  status,
  error_message,
  payload,
  sent_at,
}) {
  const updates = [];
  const values = [id];

  if (provider_message_id !== undefined) {
    values.push(provider_message_id);
    updates.push(`provider_message_id = $${values.length}`);
  }

  if (status !== undefined) {
    values.push(status);
    updates.push(`status = $${values.length}`);
  }

  if (error_message !== undefined) {
    values.push(error_message);
    updates.push(`error_message = $${values.length}`);
  }

  if (payload !== undefined) {
    values.push(payload);
    updates.push(`payload = $${values.length}`);
  }

  if (sent_at !== undefined) {
    values.push(sent_at);
    updates.push(`sent_at = $${values.length}`);
  }

  updates.push("updated_at = NOW()");

  const query = `
    UPDATE notifications
    SET ${updates.join(", ")}
    WHERE id = $1
    RETURNING *;
  `;

  const { rows } = await pool.query(query, values);

  return rows[0] || null;
}

async function getNotificationsByMatchId(match_id) {
  const { rows } = await pool.query(
    `
      SELECT *
      FROM notifications
      WHERE match_id = $1
      ORDER BY created_at DESC
    `,
    [match_id]
  );

  return rows;
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
  getNotificationsByMatchId,
};
