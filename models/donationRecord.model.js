const pool = require("./db");

async function createDonationRecord({
  donor_id,
  hospital_id,
  blood_group,
  units = 1,
  donation_date = null,
}) {
  const { rows } = await pool.query(
    `
      INSERT INTO donation_records (
        donor_id,
        hospital_id,
        blood_group,
        units,
        donation_date
      )
      VALUES ($1, $2, $3, $4, COALESCE($5::date, CURRENT_DATE))
      RETURNING
        id,
        donor_id,
        hospital_id,
        blood_group,
        units,
        donation_date,
        created_at,
        updated_at
    `,
    [donor_id, hospital_id, blood_group, units, donation_date]
  );

  return rows[0] || null;
}

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

async function getDonationReportSummary() {
  const { rows } = await pool.query(
    `
      SELECT
        COUNT(*)::INT AS total_records,
        COALESCE(SUM(units), 0)::INT AS total_units,
        COUNT(DISTINCT donor_id)::INT AS unique_donors,
        COUNT(DISTINCT hospital_id)::INT AS unique_hospitals,
        MAX(donation_date) AS latest_donation_date
      FROM donation_records
    `
  );

  return rows[0] || {
    total_records: 0,
    total_units: 0,
    unique_donors: 0,
    unique_hospitals: 0,
    latest_donation_date: null,
  };
}

async function getDonationReportByBloodGroup() {
  const { rows } = await pool.query(
    `
      SELECT
        blood_group,
        COUNT(*)::INT AS donation_count,
        COALESCE(SUM(units), 0)::INT AS total_units
      FROM donation_records
      GROUP BY blood_group
      ORDER BY blood_group ASC
    `
  );

  return rows;
}

module.exports = {
  createDonationRecord,
  getDonationRecordsByDonorId,
  countDonationRecords,
  getDonationReportSummary,
  getDonationReportByBloodGroup,
};
