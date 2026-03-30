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

async function getMatchResponseContext(match_id) {
  const { rows } = await pool.query(
    `
      SELECT
        m.id AS match_id,
        m.status AS match_status,
        m.donor_id,
        d.user_id AS donor_user_id,
        u.full_name AS donor_name,
        u.email AS donor_email,
        br.id AS request_id,
        br.blood_group,
        br.units_required,
        h.id AS hospital_id,
        h.name AS hospital_name,
        h.email AS hospital_email
      FROM blood_request_matches m
      JOIN donors d
        ON d.id = m.donor_id
      JOIN users u
        ON u.id = d.user_id
      JOIN blood_requests br
        ON br.id = m.request_id
      JOIN hospitals h
        ON h.id = br.hospital_id
      WHERE m.id = $1
      LIMIT 1
    `,
    [match_id]
  );

  return rows[0] || null;
}

async function getResponseSummaryByRequestIds(requestIds = []) {
  if (!Array.isArray(requestIds) || requestIds.length === 0) {
    return [];
  }

  const normalizedIds = requestIds
    .map((id) => Number(id))
    .filter((id) => Number.isInteger(id) && id > 0);

  if (normalizedIds.length === 0) {
    return [];
  }

  const { rows } = await pool.query(
    `
      SELECT
        request_id,
        COUNT(*)::INT AS total_count,
        COUNT(*) FILTER (WHERE status = 'pending')::INT AS pending_count,
        COUNT(*) FILTER (WHERE status = 'notified')::INT AS notified_count,
        COUNT(*) FILTER (WHERE status = 'accepted')::INT AS accepted_count,
        COUNT(*) FILTER (WHERE status = 'declined')::INT AS declined_count,
        COUNT(*) FILTER (WHERE status = 'no_response')::INT AS no_response_count
      FROM blood_request_matches
      WHERE request_id = ANY($1::INT[])
      GROUP BY request_id
    `,
    [normalizedIds]
  );

  return rows;
}

module.exports = {
  getPendingMatchesForDonor,
  getMatchById,
  updateMatchStatus,
  getMatchResponseContext,
  getResponseSummaryByRequestIds,
};
