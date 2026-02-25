const pool = require("./db");

async function createUser({
  full_name,
  email,
  password_hash,
  phone,
  lon = null,
  lat = null,
  role = "donor" // NEW
}) {
  const query = `
    INSERT INTO users (full_name, email, password_hash, phone, role, location, location_updated_at)
    VALUES (
      $1, $2, $3, $4, $5,
      CASE
        WHEN $6 IS NULL OR $7 IS NULL THEN NULL
        ELSE ST_SetSRID(ST_MakePoint($6, $7), 4326)::geography
      END,
      CASE
        WHEN $6 IS NULL OR $7 IS NULL THEN NULL
        ELSE NOW()
      END
    )
    RETURNING id, full_name, email, phone, role, created_at, location_updated_at;
  `;
  const values = [full_name, email, password_hash, phone, role, lon, lat];
  const { rows } = await pool.query(query, values);
  return rows[0];
}

async function getUserByEmail(email) {
  const query = `
    SELECT id, full_name, email, phone, password_hash, role, created_at, location_updated_at
    FROM users
    WHERE email = $1
  `;
  const { rows } = await pool.query(query, [email]);
  return rows[0] || null;
}

async function updateUserLocation({ userId, lon, lat }) {
  const query = `
    UPDATE users
    SET location = ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography,
        location_updated_at = NOW()
    WHERE id = $3
    RETURNING id, full_name, phone, role, location_updated_at;
  `;
  const { rows } = await pool.query(query, [lon, lat, userId]);
  return rows[0] || null;
}

async function getUserById(id) {
  const query = `
    SELECT id, full_name, email, phone, role, created_at, location_updated_at
    FROM users
    WHERE id = $1
  `;
  const { rows } = await pool.query(query, [id]);
  return rows[0] || null;
}

module.exports = { createUser, getUserByEmail, updateUserLocation, getUserById };