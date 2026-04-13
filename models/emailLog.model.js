const pool = require("./db");

async function createEmailLog({
  notification_id = null,
  match_id,
  recipient_email,
  template_name = null,
  provider_message_id = null,
  status = "pending",
  error_message = null,
  payload = null,
  sent_at = null,
  attempt_count = 0,
  last_attempt_at = null,
  next_retry_at = null,
}) {
  const { rows } = await pool.query(
    `
      INSERT INTO email_log (
        notification_id,
        match_id,
        recipient_email,
        template_name,
        provider_message_id,
        status,
        error_message,
        payload,
        sent_at,
        attempt_count,
        last_attempt_at,
        next_retry_at
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      RETURNING *
    `,
    [
      notification_id,
      match_id,
      recipient_email,
      template_name,
      provider_message_id,
      status,
      error_message,
      payload,
      sent_at,
      attempt_count,
      last_attempt_at,
      next_retry_at,
    ]
  );

  return rows[0];
}

async function updateEmailLogById({
  id,
  notification_id,
  provider_message_id,
  status,
  error_message,
  payload,
  sent_at,
  attempt_count,
  last_attempt_at,
  next_retry_at,
}) {
  const updates = [];
  const values = [id];

  const pushUpdate = (column, value) => {
    if (value !== undefined) {
      values.push(value);
      updates.push(`${column} = $${values.length}`);
    }
  };

  pushUpdate("notification_id", notification_id);
  pushUpdate("provider_message_id", provider_message_id);
  pushUpdate("status", status);
  pushUpdate("error_message", error_message);
  pushUpdate("payload", payload);
  pushUpdate("sent_at", sent_at);
  pushUpdate("attempt_count", attempt_count);
  pushUpdate("last_attempt_at", last_attempt_at);
  pushUpdate("next_retry_at", next_retry_at);
  updates.push("updated_at = NOW()");

  const { rows } = await pool.query(
    `
      UPDATE email_log
      SET ${updates.join(", ")}
      WHERE id = $1
      RETURNING *
    `,
    values
  );

  return rows[0] || null;
}

async function getDuePendingEmailLogs(limit = 25) {
  const normalizedLimit = Number.isInteger(Number(limit)) && Number(limit) > 0 ? Number(limit) : 25;

  const { rows } = await pool.query(
    `
      SELECT
        el.*
      FROM email_log el
      WHERE el.status = 'pending'
        AND el.template_name = 'emergency_blood_request_email'
        AND (el.next_retry_at IS NULL OR el.next_retry_at <= NOW())
      ORDER BY COALESCE(el.next_retry_at, el.created_at) ASC, el.id ASC
      LIMIT $1
    `,
    [normalizedLimit]
  );

  return rows;
}

module.exports = {
  createEmailLog,
  updateEmailLogById,
  getDuePendingEmailLogs,
};
