const pool = require("./db");

async function getSystemConfig() {
  const { rows } = await pool.query(
    `
      SELECT *
      FROM system_config
      ORDER BY id ASC
      LIMIT 1
    `
  );

  return rows[0] || null;
}

async function upsertSystemConfig({
  matching_radius,
  cooldown_days,
  max_donors_per_request,
  sender_identity,
}) {
  const existing = await getSystemConfig();

  if (!existing) {
    const { rows } = await pool.query(
      `
        INSERT INTO system_config (
          matching_radius,
          cooldown_days,
          max_donors_per_request,
          sender_identity
        )
        VALUES ($1, $2, $3, $4)
        RETURNING *
      `,
      [matching_radius, cooldown_days, max_donors_per_request, sender_identity]
    );

    return rows[0];
  }

  const { rows } = await pool.query(
    `
      UPDATE system_config
      SET
        matching_radius = COALESCE($2, matching_radius),
        cooldown_days = COALESCE($3, cooldown_days),
        max_donors_per_request = COALESCE($4, max_donors_per_request),
        sender_identity = COALESCE($5, sender_identity),
        updated_at = NOW()
      WHERE id = $1
      RETURNING *
    `,
    [
      existing.id,
      matching_radius,
      cooldown_days,
      max_donors_per_request,
      sender_identity,
    ]
  );

  return rows[0] || null;
}

module.exports = {
  getSystemConfig,
  upsertSystemConfig,
};
