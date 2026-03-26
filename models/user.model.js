const pool = require("./db");

async function createUser({
  full_name,
  email,
  password_hash,
  phone,
  lon = null,
  lat = null,
  role = "user",
}) {
  const query = `
    INSERT INTO users (
      full_name,
      email,
      password_hash,
      phone,
      role,
      location,
      location_updated_at
    )
    VALUES (
      $1,
      $2,
      $3,
      $4,
      $5,
      CASE
        WHEN $6::double precision IS NULL OR $7::double precision IS NULL THEN NULL
        ELSE ST_SetSRID(
          ST_MakePoint($6::double precision, $7::double precision),
          4326
        )::geography
      END,
      CASE
        WHEN $6::double precision IS NULL OR $7::double precision IS NULL THEN NULL
        ELSE NOW()
      END
    )
    RETURNING
      id,
      full_name,
      email,
      phone,
      role,
      created_at,
      location_updated_at;
  `;

  const values = [full_name, email, password_hash, phone, role, lon, lat];
  const { rows } = await pool.query(query, values);
  return rows[0];
}

async function getUserByEmail(email) {
  const query = `
    SELECT
      id,
      full_name,
      email,
      phone,
      password_hash,
      role,
      created_at,
      location_updated_at
    FROM users
    WHERE email = $1 AND is_deleted = false
  `;
  const { rows } = await pool.query(query, [email]);
  return rows[0] || null;
}

async function getUserByPhone(phone) {
  const query = `
    SELECT
      id,
      full_name,
      email,
      phone,
      password_hash,
      role,
      created_at,
      location_updated_at
    FROM users
    WHERE phone = $1 AND is_deleted = false
  `;
  const { rows } = await pool.query(query, [phone]);
  return rows[0] || null;
}

async function updateUserLocation({ userId, lon, lat }) {
  const query = `
    UPDATE users
    SET
      location = ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography,
      location_updated_at = NOW()
    WHERE id = $3
    RETURNING
      id,
      full_name,
      email,
      phone,
      role,
      created_at,
      location_updated_at;
  `;

  const { rows } = await pool.query(query, [lon, lat, userId]);
  return rows[0] || null;
}

async function getUserById(id) {
  const query = `
    SELECT
      id,
      full_name,
      email,
      phone,
      role,
      created_at,
      location_updated_at
    FROM users
    WHERE id = $1 AND is_deleted = false
  `;
  const { rows } = await pool.query(query, [id]);
  return rows[0] || null;
}

async function getUsersByDonorIds(donorIds) {
  if (!donorIds || donorIds.length === 0) return [];

  const query = `
    SELECT
      d.id AS donor_id,
      u.id AS user_id,
      u.full_name,
      u.email,
      u.phone
    FROM donors d
    JOIN users u ON u.id = d.user_id
    WHERE d.id = ANY($1::int[]) AND u.is_deleted = false
  `;

  const { rows } = await pool.query(query, [donorIds]);
  return rows;
}

async function getAllUsers(limit = 50, offset = 0, search = "") {
  let query;
  let values;

  if (search) {
    query = `
      SELECT
        id, full_name, email, phone, role, created_at, location_updated_at,
        COUNT(*) OVER() AS total_count
      FROM users
      WHERE is_deleted = false
      AND (full_name ILIKE $3 OR email ILIKE $3 OR phone ILIKE $3)
      ORDER BY created_at DESC
      LIMIT $1 OFFSET $2
    `;
    values = [limit, offset, `%${search}%`];
  } else {
    query = `
      SELECT
        id, full_name, email, phone, role, created_at, location_updated_at,
        COUNT(*) OVER() AS total_count
      FROM users
      WHERE is_deleted = false
      ORDER BY created_at DESC
      LIMIT $1 OFFSET $2
    `;
    values = [limit, offset];
  }

  const { rows } = await pool.query(query, values);
  const totalCount = rows.length > 0 ? parseInt(rows[0].total_count, 10) : 0;
  const data = rows.map(({ total_count, ...user }) => user);

  return { data, totalCount };
}

async function countUsers() {
  const { rows } = await pool.query('SELECT COUNT(*) FROM users WHERE is_deleted = false');
  return parseInt(rows[0].count);
}

async function updateUserRole(userId, role) {
  const { rows } = await pool.query(
    'UPDATE users SET role = $1 WHERE id = $2 AND is_deleted = false RETURNING id, full_name, email, role',
    [role, userId]
  );
  return rows[0] || null;
}

async function deleteUser(userId) {
  const { rows } = await pool.query(
    'UPDATE users SET is_deleted = true WHERE id = $1 AND is_deleted = false RETURNING id',
    [userId]
  );
  return rows[0] || null;
}

module.exports = {
  createUser,
  getUserByEmail,
  getUserByPhone,
  updateUserLocation,
  getUserById,
  getUsersByDonorIds,
  getAllUsers,
  countUsers,
  updateUserRole,
  deleteUser,
};
