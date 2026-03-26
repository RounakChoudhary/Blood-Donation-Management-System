const pool = require("./db");

async function createHospital({ name, phone, address = null, lon, lat }) {
  const query = `
    INSERT INTO hospitals (name, phone, address, location, onboarding_status)
    VALUES (
      $1,
      $2,
      $3,
      ST_SetSRID(ST_MakePoint($4, $5), 4326)::geography,
      'pending'
    )
    RETURNING id, name, phone, address, onboarding_status, created_at
  `;
  const values = [name, phone, address, lon, lat];
  const { rows } = await pool.query(query, values);
  return rows[0];
}

async function getHospitalById(id) {
  const { rows } = await pool.query(
    `
      SELECT
        id,
        name,
        phone,
        address,
        email,
        onboarding_status,
        verified_at,
        created_at
      FROM hospitals
      WHERE id = $1
        AND is_deleted = false
    `,
    [id]
  );
  return rows[0] || null;
}

async function getHospitalByEmail(email) {
  const { rows } = await pool.query(
    `
      SELECT
        id,
        name,
        phone,
        address,
        email,
        password_hash,
        onboarding_status,
        verified_at,
        created_at
      FROM hospitals
      WHERE email = $1
        AND is_deleted = false
    `,
    [email]
  );
  return rows[0] || null;
}

async function getHospitalByPhone(phone) {
  const { rows } = await pool.query(
    `
      SELECT
        id,
        name,
        phone,
        address,
        email,
        onboarding_status,
        verified_at,
        created_at
      FROM hospitals
      WHERE phone = $1
        AND is_deleted = false
    `,
    [phone]
  );
  return rows[0] || null;
}

async function getHospitalsByStatus(status, limit = 50, offset = 0) {
  const { rows } = await pool.query(
    `
      SELECT
        id,
        name,
        phone,
        address,
        email,
        onboarding_status,
        verified_at,
        created_at
      FROM hospitals
      WHERE onboarding_status = $1
        AND is_deleted = false
      ORDER BY created_at DESC
      LIMIT $2 OFFSET $3
    `,
    [status, limit, offset]
  );
  return rows;
}

async function updateHospitalStatus(hospitalId, status) {
  const { rows } = await pool.query(
    `
      UPDATE hospitals
      SET 
        onboarding_status = $2, 
        verified_at = CASE WHEN $2 = 'verified' THEN NOW() ELSE verified_at END
      WHERE id = $1
        AND is_deleted = false
      RETURNING id, name, onboarding_status, verified_at
    `,
    [hospitalId, status]
  );
  return rows[0] || null;
}

async function setHospitalAuth({ hospitalId, email, password_hash }) {
  const { rows } = await pool.query(
    `
      UPDATE hospitals
      SET email = $1, password_hash = $2
      WHERE id = $3
        AND onboarding_status = 'verified'
        AND is_deleted = false
      RETURNING id, name, email, onboarding_status
    `,
    [email, password_hash, hospitalId]
  );
  return rows[0] || null;
}

async function getAllHospitals(limit = 50, offset = 0, search = "") {
  let query;
  let values;

  if (search) {
    query = `
      SELECT
        id, name, phone, address, email, onboarding_status, verified_at, created_at,
        COUNT(*) OVER() AS total_count
      FROM hospitals
      WHERE is_deleted = false
      AND (name ILIKE $3 OR email ILIKE $3 OR phone ILIKE $3)
      ORDER BY created_at DESC
      LIMIT $1 OFFSET $2
    `;
    values = [limit, offset, `%${search}%`];
  } else {
    query = `
      SELECT
        id, name, phone, address, email, onboarding_status, verified_at, created_at,
        COUNT(*) OVER() AS total_count
      FROM hospitals
      WHERE is_deleted = false
      ORDER BY created_at DESC
      LIMIT $1 OFFSET $2
    `;
    values = [limit, offset];
  }

  const { rows } = await pool.query(query, values);
  const totalCount = rows.length > 0 ? parseInt(rows[0].total_count, 10) : 0;
  const data = rows.map(({ total_count, ...hospital }) => hospital);

  return { data, totalCount };
}

async function countHospitals() {
  const { rows } = await pool.query('SELECT COUNT(*) FROM hospitals WHERE is_deleted = false');
  return parseInt(rows[0].count);
}

async function deleteHospital(hospitalId) {
  const { rows } = await pool.query(
    'UPDATE hospitals SET is_deleted = true WHERE id = $1 AND is_deleted = false RETURNING id',
    [hospitalId]
  );
  return rows[0] || null;
}

module.exports = {
  createHospital,
  getHospitalById,
  getHospitalByEmail,
  getHospitalByPhone,
  getHospitalsByStatus,
  updateHospitalStatus,
  setHospitalAuth,
  getAllHospitals,
  countHospitals,
  deleteHospital,
};
