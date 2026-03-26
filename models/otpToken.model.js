const pool = require("./db");

async function invalidateActiveTokens({ user_id, purpose }) {
  await pool.query(
    `
      UPDATE otp_tokens
      SET consumed_at = NOW()
      WHERE user_id = $1
        AND purpose = $2
        AND consumed_at IS NULL
        AND expires_at > NOW()
    `,
    [user_id, purpose]
  );
}

async function createOtpToken({ user_id, purpose, otp_hash, expires_at }) {
  const { rows } = await pool.query(
    `
      INSERT INTO otp_tokens (
        user_id,
        purpose,
        otp_hash,
        expires_at
      )
      VALUES ($1, $2, $3, $4)
      RETURNING *
    `,
    [user_id, purpose, otp_hash, expires_at]
  );

  return rows[0];
}

async function getLatestActiveToken({ user_id, purpose }) {
  const { rows } = await pool.query(
    `
      SELECT *
      FROM otp_tokens
      WHERE user_id = $1
        AND purpose = $2
        AND consumed_at IS NULL
        AND expires_at > NOW()
      ORDER BY created_at DESC
      LIMIT 1
    `,
    [user_id, purpose]
  );

  return rows[0] || null;
}

async function consumeOtpToken(id) {
  const { rows } = await pool.query(
    `
      UPDATE otp_tokens
      SET consumed_at = NOW()
      WHERE id = $1
        AND consumed_at IS NULL
      RETURNING *
    `,
    [id]
  );

  return rows[0] || null;
}

module.exports = {
  invalidateActiveTokens,
  createOtpToken,
  getLatestActiveToken,
  consumeOtpToken,
};
