const pool = require("./db");

async function getPendingMatchesForDonor(donor_id) {
  const query = `
    SELECT
      m.id AS match_id,
      br.id AS request_id,
      br.blood_group,
      br.units_required,
      ROUND(m.distance_meters)::INT AS distance_meters,
      br.created_at
    FROM blood_request_matches m
    JOIN blood_requests br
      ON br.id = m.request_id
    WHERE
      m.donor_id = $1
      AND m.status = 'pending'
    ORDER BY br.created_at DESC
  `;

  const { rows } = await pool.query(query, [donor_id]);
  return rows;
}

async function getMatchById(match_id) {
  const { rows } = await pool.query(
    `
      SELECT *
      FROM blood_request_matches
      WHERE id = $1
    `,
    [match_id]
  );

  return rows[0] || null;
}

async function updateMatchStatus(match_id, status) {
  const { rows } = await pool.query(
    `
      UPDATE blood_request_matches
      SET status = $2
      WHERE id = $1
      RETURNING *
    `,
    [match_id, status]
  );

  return rows[0] || null;
}

module.exports = {
  getPendingMatchesForDonor,
  getMatchById,
  updateMatchStatus,
};