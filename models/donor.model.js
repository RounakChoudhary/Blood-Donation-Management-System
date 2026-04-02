const pool = require("./db");

async function createDonor({
  user_id,
  blood_group,
  last_donation_date = null,
  deferred_until = null,
  availability_status = "available",
  date_of_birth = null,
  address = null,
  emergency_contact_name = null,
  emergency_contact_phone = null,
}) {
  const query = `
    INSERT INTO donors (
      user_id,
      blood_group,
      last_donation_date,
      deferred_until,
      availability_status,
      date_of_birth,
      address,
      emergency_contact_name,
      emergency_contact_phone
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
    RETURNING
      id,
      user_id,
      blood_group,
      last_donation_date,
      deferred_until,
      availability_status,
      date_of_birth,
      address,
      emergency_contact_name,
      emergency_contact_phone,
      created_at,
      updated_at;
  `;

  const values = [
    user_id,
    blood_group,
    last_donation_date,
    deferred_until,
    availability_status,
    date_of_birth,
    address,
    emergency_contact_name,
    emergency_contact_phone,
  ];

  const { rows } = await pool.query(query, values);
  return rows[0];
}

async function getDonorByUserId(user_id) {
  const query = `
    SELECT
      id,
      user_id,
      blood_group,
      last_donation_date,
      deferred_until,
      availability_status,
      date_of_birth,
      address,
      emergency_contact_name,
      emergency_contact_phone,
      created_at,
      updated_at
    FROM donors
    WHERE user_id = $1
  `;

  const { rows } = await pool.query(query, [user_id]);
  return rows[0] || null;
}

async function getDonorById(id) {
  const query = `
    SELECT
      id,
      user_id,
      blood_group,
      last_donation_date,
      deferred_until,
      availability_status,
      date_of_birth,
      address,
      emergency_contact_name,
      emergency_contact_phone,
      created_at,
      updated_at
    FROM donors
    WHERE id = $1
  `;

  const { rows } = await pool.query(query, [id]);
  return rows[0] || null;
}

async function updateAvailabilityByUserId({ user_id, availability_status }) {
  const query = `
    UPDATE donors
    SET
      availability_status = $1,
      updated_at = NOW()
    WHERE user_id = $2
    RETURNING
      id,
      user_id,
      blood_group,
      last_donation_date,
      deferred_until,
      availability_status,
      date_of_birth,
      address,
      emergency_contact_name,
      emergency_contact_phone,
      created_at,
      updated_at;
  `;

  const { rows } = await pool.query(query, [availability_status, user_id]);
  return rows[0] || null;
}

async function updateAvailabilityByDonorId({ donor_id, availability_status }) {
  const query = `
    UPDATE donors
    SET
      availability_status = $1,
      updated_at = NOW()
    WHERE id = $2
    RETURNING
      id,
      user_id,
      blood_group,
      last_donation_date,
      deferred_until,
      availability_status,
      date_of_birth,
      address,
      emergency_contact_name,
      emergency_contact_phone,
      created_at,
      updated_at;
  `;

  const { rows } = await pool.query(query, [availability_status, donor_id]);
  return rows[0] || null;
}

async function markDonated({ donor_id, donation_date = null, cooldown_days = 120 }) {
  const query = `
    UPDATE donors
    SET
      last_donation_date = COALESCE($2::date, CURRENT_DATE),
      deferred_until = (COALESCE($2::date, CURRENT_DATE) + ($3 || ' days')::interval)::date,
      updated_at = NOW()
    WHERE id = $1
    RETURNING
      id,
      user_id,
      blood_group,
      last_donation_date,
      deferred_until,
      availability_status,
      date_of_birth,
      address,
      emergency_contact_name,
      emergency_contact_phone,
      created_at,
      updated_at;
  `;

  const { rows } = await pool.query(query, [donor_id, donation_date, String(cooldown_days)]);
  return rows[0] || null;
}

async function updateProfileByUserId({
  user_id,
  date_of_birth = null,
  address = null,
  emergency_contact_name = null,
  emergency_contact_phone = null,
  availability_status = null,
}) {
  const query = `
    UPDATE donors
    SET
      date_of_birth = COALESCE($1, date_of_birth),
      address = COALESCE($2, address),
      emergency_contact_name = COALESCE($3, emergency_contact_name),
      emergency_contact_phone = COALESCE($4, emergency_contact_phone),
      availability_status = COALESCE($5, availability_status),
      updated_at = NOW()
    WHERE user_id = $6
    RETURNING
      id,
      user_id,
      blood_group,
      last_donation_date,
      deferred_until,
      availability_status,
      date_of_birth,
      address,
      emergency_contact_name,
      emergency_contact_phone,
      created_at,
      updated_at;
  `;

  const { rows } = await pool.query(query, [
    date_of_birth,
    address,
    emergency_contact_name,
    emergency_contact_phone,
    availability_status,
    user_id,
  ]);

  return rows[0] || null;
}

async function countDonors() {
  const { rows } = await pool.query("SELECT COUNT(*) AS count FROM donors");
  return parseInt(rows[0].count, 10);
}

module.exports = {
  createDonor,
  getDonorById,
  getDonorByUserId,
  updateAvailabilityByUserId,
  updateAvailabilityByDonorId,
  markDonated,
  updateProfileByUserId,
  countDonors,
};
