const pool = require("./db");
const { allowedDonorGroupsRBC } = require("../utils/bloodCompat");

async function createBloodRequest({
  hospital_id,
  blood_group,
  units_required,
  lon,
  lat,
  search_radius_meters = 5000,
}) {
  const query = `
    INSERT INTO blood_requests (
      hospital_id,
      blood_group,
      units_required,
      location,
      search_radius_meters
    )
    VALUES (
      $1,
      $2,
      $3,
      ST_SetSRID(ST_MakePoint($4, $5), 4326)::geography,
      $6
    )
    RETURNING *;
  `;

  const values = [
    hospital_id,
    blood_group,
    units_required,
    lon,
    lat,
    search_radius_meters,
  ];

  const { rows } = await pool.query(query, values);
  return rows[0];
}

async function getBloodRequestById(id) {
  const { rows } = await pool.query(
    `SELECT * FROM blood_requests WHERE id = $1`,
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
      ORDER BY created_at DESC
      LIMIT $2 OFFSET $3
    `,
    [hospital_id, limit, offset]
  );
  return rows;
}

async function createMatches({
  request_id,
  radius_meters = 5000,
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

module.exports = {
  createBloodRequest,
  getBloodRequestById,
  getBloodRequestsByHospitalId,
  createMatches,
};