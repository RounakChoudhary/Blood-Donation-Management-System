const pool = require("./db");

async function createRegularBloodRequest({
  hospital_id,
  blood_group,
  units_required,
  required_date,
  notes = null,
}) {
  const { rows } = await pool.query(
    `
      INSERT INTO regular_blood_requests (
        hospital_id,
        blood_group,
        units_required,
        required_date,
        notes
      )
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `,
    [hospital_id, blood_group, units_required, required_date, notes]
  );

  return rows[0];
}

async function updateRegularBloodRequestStatus({ request_id, status }) {
  const { rows } = await pool.query(
    `
      UPDATE regular_blood_requests
      SET
        status = $2,
        updated_at = NOW()
      WHERE id = $1
      RETURNING *
    `,
    [request_id, status]
  );

  return rows[0] || null;
}

async function createRegularBloodRequestNotification({
  regular_request_id,
  blood_bank_id,
  recipient_email = null,
  status = "pending",
  error_message = null,
}) {
  const { rows } = await pool.query(
    `
      INSERT INTO regular_blood_request_notifications (
        regular_request_id,
        blood_bank_id,
        recipient_email,
        status,
        error_message
      )
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `,
    [regular_request_id, blood_bank_id, recipient_email, status, error_message]
  );

  return rows[0];
}

module.exports = {
  createRegularBloodRequest,
  updateRegularBloodRequestStatus,
  createRegularBloodRequestNotification,
};
