const pool = require("./db");

async function createUser({
  full_name,
  email,
  password_hash,
  phone,
  lon = null,
  lat = null,
  role = "user",
}, dbClient = pool) {
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
      email_verified,
      is_active,
      access_status,
      failed_login_attempts,
      last_failed_login_at,
      locked_until,
      created_at,
      location_updated_at;
  `;

  const values = [full_name, email, password_hash, phone, role, lon, lat];
  const { rows } = await dbClient.query(query, values);
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
      email_verified,
      is_active,
      access_status,
      failed_login_attempts,
      last_failed_login_at,
      locked_until,
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
      email_verified,
      is_active,
      access_status,
      failed_login_attempts,
      last_failed_login_at,
      locked_until,
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
      email_verified,
      is_active,
      access_status,
      failed_login_attempts,
      last_failed_login_at,
      locked_until,
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
        access_status,
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
        access_status,
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

async function activateUser(userId) {
  const { rows } = await pool.query(
    `
      UPDATE users
      SET
        email_verified = TRUE,
        is_active = TRUE
      WHERE id = $1
        AND is_deleted = false
      RETURNING
        id,
        full_name,
        email,
        phone,
        role,
        email_verified,
        is_active,
        access_status,
        failed_login_attempts,
        last_failed_login_at,
        locked_until,
        created_at,
        location_updated_at
    `,
    [userId]
  );

  return rows[0] || null;
}

async function updateUserContactAndLocation({
  userId,
  phone = null,
  lon = undefined,
  lat = undefined,
}) {
  const shouldUpdateLocation = lon !== undefined && lat !== undefined;
  const query = `
    UPDATE users
    SET
      phone = COALESCE($1, phone),
      location = CASE
        WHEN $2::double precision IS NULL OR $3::double precision IS NULL THEN location
        ELSE ST_SetSRID(ST_MakePoint($2, $3), 4326)::geography
      END,
      location_updated_at = CASE
        WHEN $2::double precision IS NULL OR $3::double precision IS NULL THEN location_updated_at
        ELSE NOW()
      END
    WHERE id = $4
      AND is_deleted = false
      RETURNING
        id,
        full_name,
        email,
        phone,
        role,
        email_verified,
        is_active,
        access_status,
        failed_login_attempts,
      last_failed_login_at,
      locked_until,
      created_at,
      location_updated_at;
  `;

  const { rows } = await pool.query(query, [
    phone,
    shouldUpdateLocation ? lon : null,
    shouldUpdateLocation ? lat : null,
    userId,
  ]);

  return rows[0] || null;
}

async function recordFailedLoginAttempt(userId) {
  const { rows } = await pool.query(
    `
      UPDATE users
      SET
        failed_login_attempts = CASE
          WHEN last_failed_login_at IS NULL
            OR last_failed_login_at < NOW() - INTERVAL '15 minutes'
            THEN 1
          ELSE failed_login_attempts + 1
        END,
        last_failed_login_at = NOW(),
        locked_until = CASE
          WHEN (
            CASE
              WHEN last_failed_login_at IS NULL
                OR last_failed_login_at < NOW() - INTERVAL '15 minutes'
                THEN 1
              ELSE failed_login_attempts + 1
            END
          ) >= 5
            THEN NOW() + INTERVAL '15 minutes'
          ELSE locked_until
        END
      WHERE id = $1
        AND is_deleted = false
      RETURNING
        id,
        failed_login_attempts,
        last_failed_login_at,
        locked_until
    `,
    [userId]
  );

  return rows[0] || null;
}

async function resetLoginAttempts(userId) {
  const { rows } = await pool.query(
    `
      UPDATE users
      SET
        failed_login_attempts = 0,
        last_failed_login_at = NULL,
        locked_until = NULL
      WHERE id = $1
        AND is_deleted = false
      RETURNING id
    `,
    [userId]
  );

  return rows[0] || null;
}

async function updatePasswordById({ userId, password_hash }) {
  const { rows } = await pool.query(
    `
      UPDATE users
      SET password_hash = $2
      WHERE id = $1
        AND is_deleted = false
      RETURNING id
    `,
    [userId, password_hash]
  );

  return rows[0] || null;
}

async function updateUserAccessStatus({ userId, access_status }) {
  const isActive = access_status === "active";
  const { rows } = await pool.query(
    `
      UPDATE users
      SET
        access_status = $2,
        is_active = $3,
        locked_until = CASE
          WHEN $2 = 'restricted' THEN NOW() + INTERVAL '100 years'
          WHEN $2 = 'active' THEN NULL
          ELSE locked_until
        END
      WHERE id = $1
        AND is_deleted = false
      RETURNING
        id,
        full_name,
        email,
        phone,
        role,
        is_active,
        access_status
    `,
    [userId, access_status, isActive]
  );

  return rows[0] || null;
}

module.exports = {
  createUser,
  getUserByEmail,
  getUserByPhone,
  updateUserLocation,
  updateUserContactAndLocation,
  getUserById,
  getUsersByDonorIds,
  getAllUsers,
  countUsers,
  updateUserRole,
  deleteUser,
  activateUser,
  recordFailedLoginAttempt,
  resetLoginAttempts,
  updatePasswordById,
  updateUserAccessStatus,
};
