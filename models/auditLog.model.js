const pool = require("./db");

async function createAuditLog({ actor, action, entity, metadata = null }) {
  const { rows } = await pool.query(
    `
      INSERT INTO audit_log (
        actor,
        action,
        entity,
        metadata
      )
      VALUES ($1, $2, $3, $4)
      RETURNING *
    `,
    [actor, action, entity, metadata]
  );

  return rows[0];
}

module.exports = {
  createAuditLog,
};
