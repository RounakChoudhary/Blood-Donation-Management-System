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
        last_attempt_at
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
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
}) {
  const { rows } = await pool.query(
    `
      UPDATE email_log
      SET
        notification_id = COALESCE($2, notification_id),
        provider_message_id = COALESCE($3, provider_message_id),
        status = COALESCE($4, status),
        error_message = COALESCE($5, error_message),
        payload = COALESCE($6, payload),
        sent_at = COALESCE($7, sent_at),
        attempt_count = COALESCE($8, attempt_count),
        last_attempt_at = COALESCE($9, last_attempt_at),
        updated_at = NOW()
      WHERE id = $1
      RETURNING *
    `,
    [
      id,
      notification_id,
      provider_message_id,
      status,
      error_message,
      payload,
      sent_at,
      attempt_count,
      last_attempt_at,
    ]
  );

  return rows[0] || null;
}

module.exports = {
  createEmailLog,
  updateEmailLogById,
};
