const pool = require("./db");

async function createCamp({
  name,
  date,
  time,
  venue_name,
  address,
  lon,
  lat,
  capacity = null,
  organiser_name,
  organiser_phone,
  organiser_email,
}) {
  const query = `
    INSERT INTO blood_camps (
      name,
      date,
      time,
      venue_name,
      address,
      location,
      capacity,
      organiser_name,
      organiser_phone,
      organiser_email,
      approval_status
    )
    VALUES (
      $1,
      $2,
      $3,
      $4,
      $5,
      ST_SetSRID(ST_MakePoint($6, $7), 4326)::geography,
      $8,
      $9,
      $10,
      $11,
      'pending'
    )
    RETURNING 
      id, name, date, time, venue_name, address, capacity, organiser_name, organiser_phone, organiser_email, approval_status, created_at
  `;

  const values = [
    name,
    date,
    time,
    venue_name,
    address,
    lon,
    lat,
    capacity,
    organiser_name,
    organiser_phone,
    organiser_email,
  ];

  const { rows } = await pool.query(query, values);
  return rows[0];
}

async function getCampById(id) {
  const { rows } = await pool.query(
    `SELECT * FROM blood_camps WHERE id = $1`,
    [id]
  );
  return rows[0] || null;
}

async function updateCampStatus(id, status) {
  const { rows } = await pool.query(
    `
      UPDATE blood_camps
      SET 
        approval_status = $2,
        reviewed_at = CASE
          WHEN $2 IN ('approved', 'rejected') THEN NOW()
          ELSE reviewed_at
        END,
        updated_at = NOW()
      WHERE id = $1
      RETURNING *
    `,
    [id, status]
  );
  return rows[0] || null;
}

async function assignCampToBloodBank(id, bloodBankId) {
  const { rows } = await pool.query(
    `
      UPDATE blood_camps
      SET
        assigned_blood_bank_id = $2,
        assigned_at = NOW(),
        updated_at = NOW()
      WHERE id = $1
      RETURNING *
    `,
    [id, bloodBankId]
  );
  return rows[0] || null;
}

async function getAssignedCampProposalsByBloodBankId(bloodBankId) {
  const { rows } = await pool.query(
    `
      SELECT
        bc.id,
        bc.name,
        bc.date,
        bc.time,
        bc.venue_name,
        bc.address,
        ST_X(bc.location::geometry) AS lon,
        ST_Y(bc.location::geometry) AS lat,
        bc.capacity,
        bc.organiser_name,
        bc.organiser_phone,
        bc.organiser_email,
        bc.approval_status,
        bc.assigned_at,
        bc.reviewed_at,
        bc.created_at,
        ROUND(
          ST_Distance(
            bc.location,
            bb.location
          )
        )::INT AS distance_meters
      FROM blood_camps bc
      INNER JOIN blood_banks bb
        ON bb.id = $1
      WHERE bc.assigned_blood_bank_id = $1
      ORDER BY
        CASE bc.approval_status
          WHEN 'pending' THEN 0
          WHEN 'approved' THEN 1
          WHEN 'rejected' THEN 2
          ELSE 3
        END,
        bc.created_at DESC
    `,
    [bloodBankId]
  );

  return rows;
}

async function getApprovedCampsWithinRadius(lon, lat, radius_meters, startDate = null, endDate = null) {
  let query = `
    SELECT 
      id,
      name,
      date,
      time,
      venue_name,
      address,
      capacity,
      organiser_name,
      ST_Distance(location, ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography) AS distance_meters
    FROM blood_camps
    WHERE 
      approval_status = 'approved'
      AND ST_DWithin(
        location,
        ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography,
        $3
      )
  `;

  const values = [lon, lat, radius_meters];
  let paramIndex = 4;

  if (startDate) {
    query += ` AND date >= $${paramIndex}`;
    values.push(startDate);
    paramIndex++;
  }

  if (endDate) {
    query += ` AND date <= $${paramIndex}`;
    values.push(endDate);
    paramIndex++;
  }

  query += ` ORDER BY distance_meters ASC`;

  const { rows } = await pool.query(query, values);
  return rows;
}

module.exports = {
  createCamp,
  getCampById,
  updateCampStatus,
  assignCampToBloodBank,
  getAssignedCampProposalsByBloodBankId,
  getApprovedCampsWithinRadius,
};
