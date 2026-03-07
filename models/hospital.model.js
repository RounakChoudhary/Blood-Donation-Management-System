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
    `,
    [email]
  );
  return rows[0] || null;
}

async function verifyHospital(hospitalId) {
  const { rows } = await pool.query(
    `
      UPDATE hospitals
      SET onboarding_status = 'verified', verified_at = NOW()
      WHERE id = $1
      RETURNING id, name, onboarding_status, verified_at
    `,
    [hospitalId]
  );
  return rows[0] || null;
}

async function setHospitalAuth({ hospitalId, email, password_hash }) {
  const { rows } = await pool.query(
    `
      UPDATE hospitals
      SET email = $1, password_hash = $2
      WHERE id = $3 AND onboarding_status = 'verified'
      RETURNING id, name, email, onboarding_status
    `,
    [email, password_hash, hospitalId]
  );
  return rows[0] || null;
}

module.exports = {
  createHospital,
  getHospitalById,
  getHospitalByEmail,
  verifyHospital,
  setHospitalAuth,
};