const pool = require("./db");

async function createUserNotification({
  user_id,
  message,
  payload = null,
}) {
  const { rows } = await pool.query(
    `
      INSERT INTO notifications (
        user_id,
        message,
        payload,
        is_read,
        status,
        channel
      )
      VALUES ($1, $2, $3, FALSE, 'sent', 'email')
      RETURNING id, user_id, message, is_read, created_at
    `,
    [user_id, message, payload]
  );

  return rows[0] || null;
}

async function getNotificationsByUserId(user_id) {
  const { rows } = await pool.query(
    `
      SELECT
        id,
        user_id,
        message,
        payload,
        is_read,
        created_at
      FROM notifications
      WHERE user_id = $1
      ORDER BY created_at DESC
    `,
    [user_id]
  );

  return rows;
}

async function markNotificationRead({ notificationId, userId }) {
  const { rows } = await pool.query(
    `
      UPDATE notifications
      SET is_read = TRUE
      WHERE id = $1
        AND user_id = $2
      RETURNING id, user_id, message, payload, is_read, created_at
    `,
    [notificationId, userId]
  );

  return rows[0] || null;
}

module.exports = {
  createUserNotification,
  getNotificationsByUserId,
  markNotificationRead,
};
