const pool = require("./db");

async function getNotificationsByUserId(user_id) {
  const { rows } = await pool.query(
    `
      SELECT
        id,
        user_id,
        message,
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
      RETURNING id, user_id, message, is_read, created_at
    `,
    [notificationId, userId]
  );

  return rows[0] || null;
}

module.exports = {
  getNotificationsByUserId,
  markNotificationRead,
};
