const pool = require("./db");

async function getDonationRecordsByDonorId(donor_id) {
  const { rows } = await pool.query(
    `
      SELECT
        dr.id,
        dr.donor_id,
        dr.hospital_id,
        h.name AS hospital_name,
        dr.blood_group,
        dr.units,
        dr.donation_date,
        dr.created_at,
        dr.updated_at
      FROM donation_records dr
      JOIN hospitals h
        ON h.id = dr.hospital_id
      WHERE dr.donor_id = $1
      ORDER BY dr.donation_date DESC, dr.created_at DESC
    `,
    [donor_id]
  );

  return rows;
}

async function countDonationRecords() {
  const { rows } = await pool.query(
    `
      SELECT COUNT(*) AS count
      FROM donation_records
    `
  );
  return parseInt(rows[0].count, 10);
}

module.exports = {
  getDonationRecordsByDonorId,
  countDonationRecords,
};
