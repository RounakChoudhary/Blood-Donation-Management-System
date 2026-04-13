const pool = require("./db");
const { allowedDonorGroupsRBC } = require("../utils/bloodCompat");

async function createBloodRequest({
  hospital_id,
  blood_group,
  units_required,
  lon,
  lat,
  urgency_level = null,
  patient_name = null,
  notes = null,
  search_radius_meters = 3000,
}) {
  const query = `
    INSERT INTO blood_requests (
      hospital_id,
      blood_group,
      units_required,
      location,
      urgency_level,
      patient_name,
      notes,
      search_radius_meters
    )
    VALUES (
      $1,
      $2,
      $3,
      ST_SetSRID(ST_MakePoint($4, $5), 4326)::geography,
      $6,
      $7,
      $8,
      $9
    )
    RETURNING *;
  `;

  const values = [
    hospital_id,
    blood_group,
    units_required,
    lon,
    lat,
    urgency_level,
    patient_name,
    notes,
    search_radius_meters,
  ];

  const { rows } = await pool.query(query, values);
  return rows[0];
}

async function getBloodRequestById(id) {
  const { rows } = await pool.query(
    `
      SELECT *
      FROM blood_requests
      WHERE id = $1
        AND is_deleted = false
    `,
    [id]
  );
  return rows[0] || null;
}

async function getBloodRequestsByHospitalId(hospital_id, limit = 50, offset = 0) {
  const { rows } = await pool.query(
    `
      SELECT *
      FROM blood_requests
      WHERE hospital_id = $1
        AND is_deleted = false
      ORDER BY created_at DESC
      LIMIT $2 OFFSET $3
    `,
    [hospital_id, limit, offset]
  );
  return rows;
}

async function createMatches({
  request_id,
  radius_meters = 3000,
  limit = 50,
}) {
  const req = await pool.query(
    `SELECT blood_group FROM blood_requests WHERE id = $1`,
    [request_id]
  );
  if (req.rows.length === 0) return [];

  const recipientGroup = req.rows[0].blood_group;
  const allowed = allowedDonorGroupsRBC(recipientGroup);
  if (allowed.length === 0) return [];

  const query = `
    WITH candidates AS (
      SELECT
        br.id AS request_id,
        d.id AS donor_id,
        ROUND(ST_Distance(u.location, br.location))::INT AS distance_meters
      FROM blood_requests br
      JOIN donors d
        ON d.blood_group = ANY($2::blood_group_enum[])
      JOIN users u
        ON u.id = d.user_id
      WHERE br.id = $1
        AND u.location IS NOT NULL
        AND ST_DWithin(u.location, br.location, $3)
        AND (d.deferred_until IS NULL OR d.deferred_until <= CURRENT_DATE)
        AND COALESCE(d.availability_status, 'available') = 'available'
        AND NOT EXISTS (
          SELECT 1
          FROM blood_request_matches m
          WHERE m.request_id = br.id AND m.donor_id = d.id
        )
      ORDER BY distance_meters ASC
      LIMIT $4
    )
    INSERT INTO blood_request_matches (request_id, donor_id, distance_meters, status)
    SELECT request_id, donor_id, distance_meters, 'pending'
    FROM candidates
    ON CONFLICT (request_id, donor_id) DO NOTHING
    RETURNING *;
  `;

  const { rows } = await pool.query(query, [request_id, allowed, radius_meters, limit]);
  return rows;
}

async function findDonorsWithinFixedRadius({
  requestId,
  radiusMeters = 10000,
  limit = 50,
}) {
  const req = await pool.query(
    `SELECT blood_group, ST_X(location::geometry) AS req_lon, ST_Y(location::geometry) AS req_lat
     FROM blood_requests
     WHERE id = $1
       AND is_deleted = false`,
    [requestId]
  );

  if (req.rows.length === 0) {
    return [];
  }

  const { blood_group: recipientGroup, req_lon: requestLon, req_lat: requestLat } = req.rows[0];
  const allowed = allowedDonorGroupsRBC(recipientGroup);
  if (allowed.length === 0) return [];

  const query = `
    SELECT
      d.id AS donor_id,
      u.id AS user_id,
      u.full_name,
      u.email,
      u.phone,
      d.blood_group,
      d.last_donation_date,
      d.deferred_until,
      COALESCE(d.availability_status, 'available') AS availability_status,
      d.address,
      d.emergency_contact_name,
      d.emergency_contact_phone,
      ST_X(u.location::geometry) AS lon,
      ST_Y(u.location::geometry) AS lat,
      ROUND(
        6371000 * acos(
          LEAST(
            1,
            cos(radians($2)) * cos(radians(ST_Y(u.location::geometry)))
            * cos(radians(ST_X(u.location::geometry)) - radians($1))
            + sin(radians($2)) * sin(radians(ST_Y(u.location::geometry)))
          )
        )
      )::INT AS distance_meters
    FROM donors d
    JOIN users u
      ON u.id = d.user_id
    WHERE d.blood_group = ANY($3::blood_group_enum[])
      AND u.location IS NOT NULL
      AND ST_DWithin(
        u.location,
        ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography,
        $4
      )
      AND (d.deferred_until IS NULL OR d.deferred_until <= CURRENT_DATE)
      AND COALESCE(d.availability_status, 'available') = 'available'
    ORDER BY distance_meters ASC
    LIMIT $5;
  `;

  const values = [requestLon, requestLat, allowed, radiusMeters, limit];
  const { rows } = await pool.query(query, values);
  return rows;
}

async function listRequestsEligibleForAutoExpansion({
  interval_minutes = 5,
  limit = 50,
}) {
  const query = `
    SELECT br.*
    FROM blood_requests br
    WHERE
      br.is_deleted = false
      AND br.status IN ('pending', 'matching', 'active')
      AND
      br.search_radius_meters < 9000
      AND br.last_radius_expanded_at <= NOW() - ($1 || ' minutes')::interval
      AND NOT EXISTS (
        SELECT 1
        FROM blood_request_matches m
        WHERE m.request_id = br.id
          AND m.status = 'accepted'
      )
    ORDER BY br.last_radius_expanded_at ASC
    LIMIT $2
  `;

  const { rows } = await pool.query(query, [Number(interval_minutes), Number(limit)]);
  return rows;
}

async function getActiveBloodRequestByHospitalAndGroup({ hospital_id, blood_group }) {
  const { rows } = await pool.query(
    `
      SELECT *
      FROM blood_requests
      WHERE hospital_id = $1
        AND blood_group = $2
        AND is_deleted = false
        AND status IN ('pending', 'matching', 'active')
      ORDER BY created_at DESC
      LIMIT 1
    `,
    [hospital_id, blood_group]
  );

  return rows[0] || null;
}

async function updateSearchRadius({
  request_id,
  new_radius_meters,
}) {
  const query = `
    UPDATE blood_requests
    SET
      search_radius_meters = $2,
      last_radius_expanded_at = NOW()
    WHERE id = $1
      AND is_deleted = false
      AND search_radius_meters < $2
    RETURNING *
  `;

  const { rows } = await pool.query(query, [
    Number(request_id),
    Number(new_radius_meters),
  ]);
  return rows[0] || null;
}

async function getAllBloodRequests(limit = 50, offset = 0, search = "") {
  let query;
  let values;

  if (search) {
    query = `
      SELECT *, COUNT(*) OVER() AS total_count
      FROM blood_requests
      WHERE is_deleted = false
      AND (blood_group::text ILIKE $3 OR status ILIKE $3)
      ORDER BY created_at DESC
      LIMIT $1 OFFSET $2
    `;
    values = [limit, offset, `%${search}%`];
  } else {
    query = `
      SELECT *, COUNT(*) OVER() AS total_count
      FROM blood_requests
      WHERE is_deleted = false
      ORDER BY created_at DESC
      LIMIT $1 OFFSET $2
    `;
    values = [limit, offset];
  }

  const { rows } = await pool.query(query, values);
  const totalCount = rows.length > 0 ? parseInt(rows[0].total_count, 10) : 0;
  const data = rows.map(({ total_count, ...request }) => request);

  return { data, totalCount };
}

async function countBloodRequests() {
  const { rows } = await pool.query('SELECT COUNT(*) FROM blood_requests WHERE is_deleted = false');
  return parseInt(rows[0].count);
}

async function countBloodRequestsToday() {
  const { rows } = await pool.query(
    `
      SELECT COUNT(*) AS count
      FROM blood_requests
      WHERE is_deleted = false
        AND created_at >= CURRENT_DATE
        AND created_at < CURRENT_DATE + INTERVAL '1 day'
    `
  );
  return parseInt(rows[0].count, 10);
}

async function countFulfilledBloodRequests() {
  const { rows } = await pool.query(
    `
      SELECT COUNT(*) AS count
      FROM blood_requests
      WHERE is_deleted = false
        AND status = 'fulfilled'
    `
  );
  return parseInt(rows[0].count, 10);
}

async function getEmergencyRequestReportSummary() {
  const { rows } = await pool.query(
    `
      SELECT
        COUNT(*)::INT AS total_requests,
        COUNT(*) FILTER (WHERE status = 'fulfilled')::INT AS fulfilled_requests,
        COUNT(*) FILTER (WHERE status = 'cancelled')::INT AS cancelled_requests,
        COUNT(*) FILTER (WHERE status IN ('pending', 'matching', 'active'))::INT AS open_requests,
        COALESCE(SUM(units_required), 0)::INT AS total_units_requested
      FROM blood_requests
      WHERE is_deleted = false
    `
  );

  return rows[0] || {
    total_requests: 0,
    fulfilled_requests: 0,
    cancelled_requests: 0,
    open_requests: 0,
    total_units_requested: 0,
  };
}

async function getBloodRequestStatusBreakdown() {
  const { rows } = await pool.query(
    `
      SELECT
        status,
        COUNT(*)::INT AS request_count
      FROM blood_requests
      WHERE is_deleted = false
      GROUP BY status
      ORDER BY status ASC
    `
  );

  return rows;
}

async function deleteBloodRequest(requestId) {
  const { rows } = await pool.query(
    'UPDATE blood_requests SET is_deleted = true WHERE id = $1 AND is_deleted = false RETURNING id',
    [requestId]
  );
  return rows[0] || null;
}

async function updateBloodRequestStatus({ request_id, status }) {
  const { rows } = await pool.query(
    `
      UPDATE blood_requests
      SET status = $2
      WHERE id = $1
        AND is_deleted = false
      RETURNING *
    `,
    [request_id, status]
  );

  return rows[0] || null;
}

async function transitionBloodRequestStatus({
  request_id,
  from_statuses,
  to_status,
}) {
  const allowedFromStatuses = Array.isArray(from_statuses) ? from_statuses : [from_statuses];

  const { rows } = await pool.query(
    `
      UPDATE blood_requests
      SET status = $3
      WHERE id = $1
        AND is_deleted = false
        AND status = ANY($2::varchar[])
      RETURNING *
    `,
    [request_id, allowedFromStatuses, to_status]
  );

  return rows[0] || null;
}

module.exports = {
  createBloodRequest,
  getBloodRequestById,
  getBloodRequestsByHospitalId,
  createMatches,
  findDonorsWithinFixedRadius,
  listRequestsEligibleForAutoExpansion,
  getActiveBloodRequestByHospitalAndGroup,
  updateSearchRadius,
  getAllBloodRequests,
  countBloodRequests,
  countBloodRequestsToday,
  countFulfilledBloodRequests,
  getEmergencyRequestReportSummary,
  getBloodRequestStatusBreakdown,
  deleteBloodRequest,
  updateBloodRequestStatus,
  transitionBloodRequestStatus,
};
