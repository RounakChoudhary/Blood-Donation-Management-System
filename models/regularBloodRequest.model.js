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

async function getRegularBloodRequestsByHospitalId({
  hospital_id,
  limit = 50,
  offset = 0,
}) {
  const normalizedLimit = Number(limit);
  const normalizedOffset = Number(offset);

  const { rows } = await pool.query(
    `
      SELECT
        rr.*,
        COUNT(n.id)::INT AS total_notifications,
        COUNT(n.id) FILTER (WHERE n.status = 'sent')::INT AS sent_notifications,
        COUNT(n.id) FILTER (WHERE n.status = 'failed')::INT AS failed_notifications,
        COUNT(n.id) FILTER (WHERE n.status = 'pending')::INT AS pending_notifications,
        MAX(n.created_at) AS last_notified_at
      FROM regular_blood_requests rr
      LEFT JOIN regular_blood_request_notifications n
        ON n.regular_request_id = rr.id
      WHERE rr.hospital_id = $1
      GROUP BY rr.id
      ORDER BY rr.created_at DESC
      LIMIT $2 OFFSET $3
    `,
    [
      hospital_id,
      Number.isInteger(normalizedLimit) && normalizedLimit > 0 ? normalizedLimit : 50,
      Number.isInteger(normalizedOffset) && normalizedOffset >= 0 ? normalizedOffset : 0,
    ]
  );

  return rows;
}

async function getRegularBloodRequestByIdForHospital({
  request_id,
  hospital_id,
}) {
  const { rows } = await pool.query(
    `
      SELECT
        rr.*,
        COUNT(n.id)::INT AS total_notifications,
        COUNT(n.id) FILTER (WHERE n.status = 'sent')::INT AS sent_notifications,
        COUNT(n.id) FILTER (WHERE n.status = 'failed')::INT AS failed_notifications,
        COUNT(n.id) FILTER (WHERE n.status = 'pending')::INT AS pending_notifications,
        MAX(n.created_at) AS last_notified_at
      FROM regular_blood_requests rr
      LEFT JOIN regular_blood_request_notifications n
        ON n.regular_request_id = rr.id
      WHERE rr.id = $1
        AND rr.hospital_id = $2
      GROUP BY rr.id
      LIMIT 1
    `,
    [request_id, hospital_id]
  );

  return rows[0] || null;
}

async function getNotificationsByRegularRequestId(request_id) {
  const { rows } = await pool.query(
    `
      SELECT
        n.id,
        n.regular_request_id,
        n.blood_bank_id,
        bb.name AS blood_bank_name,
        bb.address AS blood_bank_address,
        bb.contact_phone,
        n.recipient_email,
        n.status,
        n.error_message,
        n.created_at
      FROM regular_blood_request_notifications n
      JOIN blood_banks bb
        ON bb.id = n.blood_bank_id
      WHERE n.regular_request_id = $1
      ORDER BY n.created_at DESC, n.id DESC
    `,
    [request_id]
  );

  return rows;
}

module.exports = {
  createRegularBloodRequest,
  updateRegularBloodRequestStatus,
  createRegularBloodRequestNotification,
  getRegularBloodRequestsByHospitalId,
  getRegularBloodRequestByIdForHospital,
  getNotificationsByRegularRequestId,
};
