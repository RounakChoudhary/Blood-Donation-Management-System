const pool = require("./db");

async function invalidateActiveTokens({ match_id, donor_id }) {
  await pool.query(
    `
      UPDATE response_tokens
      SET used = TRUE
      WHERE match_id = $1
        AND donor_id = $2
        AND used = FALSE
        AND expires_at > NOW()
    `,
    [match_id, donor_id]
  );
}

async function createResponseToken({ match_id, donor_id, token_hash, expires_at }) {
  const { rows } = await pool.query(
    `
      INSERT INTO response_tokens (
        match_id,
        donor_id,
        token_hash,
        expires_at
      )
      VALUES ($1, $2, $3, $4)
      RETURNING *
    `,
    [match_id, donor_id, token_hash, expires_at]
  );

  return rows[0];
}

async function getActiveTokenByHash(token_hash) {
  const { rows } = await pool.query(
    `
      SELECT *
      FROM response_tokens
      WHERE token_hash = $1
        AND used = FALSE
        AND expires_at > NOW()
      LIMIT 1
    `,
    [token_hash]
  );

  return rows[0] || null;
}

async function markTokenUsed(id) {
  const { rows } = await pool.query(
    `
      UPDATE response_tokens
      SET used = TRUE
      WHERE id = $1
        AND used = FALSE
      RETURNING *
    `,
    [id]
  );

  return rows[0] || null;
}

module.exports = {
  invalidateActiveTokens,
  createResponseToken,
  getActiveTokenByHash,
  markTokenUsed,
};
