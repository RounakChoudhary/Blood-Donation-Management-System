const pool = require("./db");

async function invalidateActiveTokens({ actor_type, user_or_hospital_id }) {
  await pool.query(
    `
      UPDATE password_reset_tokens
      SET used_at = NOW()
      WHERE actor_type = $1
        AND user_or_hospital_id = $2
        AND used_at IS NULL
        AND expires_at > NOW()
    `,
    [actor_type, user_or_hospital_id]
  );
}

async function createPasswordResetToken({
  actor_type,
  user_or_hospital_id,
  token_hash,
  expires_at,
}) {
  const { rows } = await pool.query(
    `
      INSERT INTO password_reset_tokens (
        actor_type,
        user_or_hospital_id,
        token_hash,
        expires_at
      )
      VALUES ($1, $2, $3, $4)
      RETURNING *
    `,
    [actor_type, user_or_hospital_id, token_hash, expires_at]
  );

  return rows[0];
}

async function getActiveTokenByHash(token_hash) {
  const { rows } = await pool.query(
    `
      SELECT *
      FROM password_reset_tokens
      WHERE token_hash = $1
        AND used_at IS NULL
        AND expires_at > NOW()
      LIMIT 1
    `,
    [token_hash]
  );

  return rows[0] || null;
}

async function consumePasswordResetToken(id) {
  const { rows } = await pool.query(
    `
      UPDATE password_reset_tokens
      SET used_at = NOW()
      WHERE id = $1
        AND used_at IS NULL
      RETURNING *
    `,
    [id]
  );

  return rows[0] || null;
}

module.exports = {
  invalidateActiveTokens,
  createPasswordResetToken,
  getActiveTokenByHash,
  consumePasswordResetToken,
};
