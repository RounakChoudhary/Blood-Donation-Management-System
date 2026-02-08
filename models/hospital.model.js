const pool = require("./db");

/**
 * Create a hospital record (admin-side onboarding).
 * Hospital does not self-register.
 */
async function createHospital({
  name,
  phone,
  address = null,
  lon,
  lat,
}) {
  const query = `
    INSERT INTO hospitals (name, phone, address, location, onboarding_status)
    VALUES ($1, $2, $3, ST_MakePoint($4, $5)::geography, 'pending')
    RETURNING id, name, phone, address, onboarding_status, created_at
  `;
  const values = [name, phone, address, lon, lat];
  const { rows } = await pool.query(query, values);
  return rows[0];
}

async function getHospitalById(id) {
  const { rows } = await pool.query(
    `SELECT id, name, phone, address, onboarding_status, verified_at, created_at
     FROM hospitals
     WHERE id = $1`,
    [id]
  );
  return rows[0] || null;
}

/**
 * List hospitals with optional filter by status.
 * status can be: pending | verified | rejected
 */
async function listHospitals({ status = null, limit = 50, offset = 0 } = {}) {
  if (status) {
    const { rows } = await pool.query(
      `SELECT id, name, phone, address, onboarding_status, verified_at, created_at
       FROM hospitals
       WHERE onboarding_status = $1
       ORDER BY created_at DESC
       LIMIT $2 OFFSET $3`,
      [status, limit, offset]
    );
    return rows;
  }

  const { rows } = await pool.query(
    `SELECT id, name, phone, address, onboarding_status, verified_at, created_at
     FROM hospitals
     ORDER BY created_at DESC
     LIMIT $1 OFFSET $2`,
    [limit, offset]
  );
  return rows;
}

/**
 * Mark hospital as verified after physical verification.
 */
async function verifyHospital(hospitalId) {
  const { rows } = await pool.query(
    `UPDATE hospitals
     SET onboarding_status = 'verified',
         verified_at = NOW()
     WHERE id = $1
     RETURNING id, name, onboarding_status, verified_at`,
    [hospitalId]
  );
  return rows[0] || null;
}

/**
 * Optional: Admin creates login credentials for the hospital after verification.
 * You should pass password_hash (bcrypt hash), NOT raw password.
 */
async function setHospitalAuth({ hospitalId, email, password_hash }) {
  const { rows } = await pool.query(
    `UPDATE hospitals
     SET email = $1,
         password_hash = $2
     WHERE id = $3
       AND onboarding_status = 'verified'
     RETURNING id, name, email, onboarding_status`,
    [email, password_hash, hospitalId]
  );
  return rows[0] || null;
}

/**
 * Update basic hospital details (address/phone/name/location).
 * Useful if verification team corrects details.
 */
async function updateHospitalDetails({
  hospitalId,
  name,
  phone,
  address,
  lon,
  lat,
}) {
  const query = `
    UPDATE hospitals
    SET name = COALESCE($1, name),
        phone = COALESCE($2, phone),
        address = COALESCE($3, address),
        location = CASE
          WHEN $4 IS NULL OR $5 IS NULL THEN location
          ELSE ST_MakePoint($4, $5)::geography
        END
    WHERE id = $6
    RETURNING id, name, phone, address, onboarding_status
  `;
  const values = [name ?? null, phone ?? null, address ?? null, lon ?? null, lat ?? null, hospitalId];
  const { rows } = await pool.query(query, values);
  return rows[0] || null;
}

module.exports = {
  createHospital,
  getHospitalById,
  listHospitals,
  verifyHospital,
  setHospitalAuth,
  updateHospitalDetails,
};
