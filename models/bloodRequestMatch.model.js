const pool = require("./db");

async function getPendingMatchesForDonor(donor_id) {
  const query = `
    SELECT
      m.id AS match_id,
      br.id AS request_id,
      br.blood_group,
      br.units_required,
      ROUND(m.distance_meters)::INT AS distance_meters,
      h.id AS hospital_id,
      h.name AS hospital_name,
      ROUND(ST_Distance(du.location, h.location))::INT AS hospital_distance_meters,
      br.created_at
    FROM blood_request_matches m
    JOIN blood_requests br
      ON br.id = m.request_id
    JOIN hospitals h
      ON h.id = br.hospital_id
    JOIN donors d
      ON d.id = m.donor_id
    JOIN users du
      ON du.id = d.user_id
    WHERE
      m.donor_id = $1
      AND m.status IN ('pending', 'notified')
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

async function updateMatchStatus(match_id, status, options = {}) {
  const {
    response_channel = null,
    notified_at = undefined,
    responded_at = undefined,
  } = options;

  const { rows } = await pool.query(
    `
      UPDATE blood_request_matches
      SET
        status = $2,
        response_channel = COALESCE($3, response_channel),
        notified_at = COALESCE($4, notified_at),
        responded_at = COALESCE($5, responded_at)
      WHERE id = $1
      RETURNING *
    `,
    [match_id, status, response_channel, notified_at, responded_at]
  );

  return rows[0] || null;
}

async function markMatchNotified(match_id) {
  const { rows } = await pool.query(
    `
      UPDATE blood_request_matches
      SET
        status = 'notified',
        notified_at = COALESCE(notified_at, NOW())
      WHERE id = $1
        AND status IN ('pending', 'notified')
      RETURNING *
    `,
    [match_id]
  );

  return rows[0] || null;
}

async function markExpiredMatchesAsNoResponse(matchIds = []) {
  if (!Array.isArray(matchIds) || matchIds.length === 0) {
    return [];
  }

  const normalizedIds = matchIds
    .map((id) => Number(id))
    .filter((id) => Number.isInteger(id) && id > 0);

  if (normalizedIds.length === 0) {
    return [];
  }

  const { rows } = await pool.query(
    `
      UPDATE blood_request_matches
      SET
        status = 'no_response',
        responded_at = COALESCE(responded_at, NOW()),
        response_channel = COALESCE(response_channel, 'email')
      WHERE id = ANY($1::INT[])
        AND status IN ('pending', 'notified')
      RETURNING *
    `,
    [normalizedIds]
  );

  return rows;
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
        u.phone AS donor_phone,
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

async function getMatchesByRequestId(requestId) {
  const normalizedId = Number(requestId);
  if (!Number.isInteger(normalizedId) || normalizedId <= 0) {
    return [];
  }

  const { rows } = await pool.query(
    `
      SELECT
        m.id AS match_id,
        m.request_id,
        m.donor_id,
        m.distance_meters,
        m.status,
        m.created_at,
        d.blood_group AS donor_blood_group,
        d.availability_status AS donor_availability_status,
        u.full_name AS donor_name,
        u.phone AS donor_phone
      FROM blood_request_matches m
      JOIN donors d
        ON d.id = m.donor_id
      JOIN users u
        ON u.id = d.user_id
      WHERE m.request_id = $1
      ORDER BY m.created_at DESC
    `,
    [normalizedId]
  );

  return rows;
}

async function countMatchesByRequestId(requestId) {
  const normalizedId = Number(requestId);
  if (!Number.isInteger(normalizedId) || normalizedId <= 0) {
    return 0;
  }

  const { rows } = await pool.query(
    `
      SELECT COUNT(*)::INT AS count
      FROM blood_request_matches
      WHERE request_id = $1
    `,
    [normalizedId]
  );

  return rows[0]?.count ?? 0;
}

async function countAcceptedMatchesByRequestId(requestId) {
  const normalizedId = Number(requestId);
  if (!Number.isInteger(normalizedId) || normalizedId <= 0) {
    return 0;
  }

  const { rows } = await pool.query(
    `
      SELECT COUNT(*)::INT AS count
      FROM blood_request_matches
      WHERE request_id = $1
        AND status = 'accepted'
    `,
    [normalizedId]
  );

  return rows[0]?.count ?? 0;
}

module.exports = {
  getPendingMatchesForDonor,
  getMatchById,
  updateMatchStatus,
  markMatchNotified,
  markExpiredMatchesAsNoResponse,
  getMatchResponseContext,
  getResponseSummaryByRequestIds,
  getMatchesByRequestId,
  countMatchesByRequestId,
  countAcceptedMatchesByRequestId,
};
