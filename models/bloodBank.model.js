const pool = require("./db");

async function createBloodBank({
  name,
  license_number,
  address,
  lon,
  lat,
  contact_person,
  contact_phone,
  operating_hours = null,
  facilities = null,
}) {
  const query = `
    INSERT INTO blood_banks (
      name,
      license_number,
      address,
      location,
      contact_person,
      contact_phone,
      operating_hours,
      facilities,
      onboarding_status
    )
    VALUES (
      $1,
      $2,
      $3,
      ST_SetSRID(ST_MakePoint($4, $5), 4326)::geography,
      $6,
      $7,
      $8,
      $9,
      'pending'
    )
    RETURNING
      id,
      name,
      license_number,
      address,
      contact_person,
      contact_phone,
      operating_hours,
      facilities,
      onboarding_status,
      created_at
  `;

  const values = [
    name,
    license_number,
    address,
    lon,
    lat,
    contact_person,
    contact_phone,
    operating_hours,
    facilities,
  ];

  const { rows } = await pool.query(query, values);
  return rows[0];
}

async function getBloodBankById(id) {
  const { rows } = await pool.query(
    `
      SELECT
        id,
        name,
        license_number,
        address,
        contact_person,
        contact_phone,
        operating_hours,
        facilities,
        email,
        onboarding_status,
        verified_at,
        created_at
      FROM blood_banks
      WHERE id = $1
    `,
    [id]
  );
  return rows[0] || null;
}

async function getBloodBankByLicenseNumber(license_number) {
  const { rows } = await pool.query(
    `
      SELECT
        id,
        name,
        license_number,
        onboarding_status
      FROM blood_banks
      WHERE license_number = $1
    `,
    [license_number]
  );
  return rows[0] || null;
}

async function getAllBloodBanks(limit = 50, offset = 0, search = "") {
  let query;
  let values;

  if (search) {
    query = `
      SELECT
        id, name, license_number, address, contact_person, contact_phone, operating_hours, facilities, email, onboarding_status, verified_at, created_at,
        COUNT(*) OVER() AS total_count
      FROM blood_banks
      WHERE is_deleted = false
      AND (name ILIKE $3 OR email ILIKE $3 OR contact_phone ILIKE $3)
      ORDER BY created_at DESC
      LIMIT $1 OFFSET $2
    `;
    values = [limit, offset, `%${search}%`];
  } else {
    query = `
      SELECT
        id, name, license_number, address, contact_person, contact_phone, operating_hours, facilities, email, onboarding_status, verified_at, created_at,
        COUNT(*) OVER() AS total_count
      FROM blood_banks
      WHERE is_deleted = false
      ORDER BY created_at DESC
      LIMIT $1 OFFSET $2
    `;
    values = [limit, offset];
  }

  const { rows } = await pool.query(query, values);
  const totalCount = rows.length > 0 ? parseInt(rows[0].total_count, 10) : 0;
  const data = rows.map(({ total_count, ...bank }) => bank);

  return { data, totalCount };
}

async function updateBloodBankStatus(bloodBankId, status) {
  const { rows } = await pool.query(
    `
      UPDATE blood_banks
      SET 
        onboarding_status = $2, 
        verified_at = CASE WHEN $2 = 'verified' THEN NOW() ELSE verified_at END
      WHERE id = $1
      RETURNING id, name, license_number, onboarding_status, verified_at
    `,
    [bloodBankId, status]
  );
  return rows[0] || null;
}

async function countBloodBanks() {
  const { rows } = await pool.query('SELECT COUNT(*) FROM blood_banks WHERE is_deleted = false');
  return parseInt(rows[0].count);
}

async function deleteBloodBank(bloodBankId) {
  const { rows } = await pool.query(
    'UPDATE blood_banks SET is_deleted = true WHERE id = $1 AND is_deleted = false RETURNING id',
    [bloodBankId]
  );
  return rows[0] || null;
}

module.exports = {
  createBloodBank,
  getBloodBankById,
  getBloodBankByLicenseNumber,
  getAllBloodBanks,
  updateBloodBankStatus,
  countBloodBanks,
  deleteBloodBank,
};
