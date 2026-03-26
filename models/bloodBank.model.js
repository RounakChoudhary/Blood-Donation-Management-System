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

async function getAllBloodBanks(limit = 50, offset = 0) {
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
      ORDER BY created_at DESC
      LIMIT $1 OFFSET $2
    `,
    [limit, offset]
  );
  return rows;
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
  const { rows } = await pool.query('SELECT COUNT(*) FROM blood_banks');
  return parseInt(rows[0].count);
}

module.exports = {
  createBloodBank,
  getBloodBankById,
  getBloodBankByLicenseNumber,
  getAllBloodBanks,
  updateBloodBankStatus,
  countBloodBanks,
};
