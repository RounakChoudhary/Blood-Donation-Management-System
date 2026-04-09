const pool = require("./db");

async function getIncomingRegularRequestsByBloodBankId(bloodBankId, limit = 8) {
  const normalizedLimit = Number(limit);

  const { rows } = await pool.query(
    `
      SELECT
        n.id AS notification_id,
        n.status AS notification_status,
        n.error_message,
        n.created_at AS notified_at,
        rr.id AS request_id,
        rr.blood_group,
        rr.units_required,
        rr.required_date,
        rr.notes,
        rr.status AS request_status,
        rr.created_at AS request_created_at,
        h.id AS hospital_id,
        h.name AS hospital_name,
        h.address AS hospital_address,
        ROUND(
          ST_Distance(
            h.location,
            bb.location
          )
        )::INT AS distance_meters
      FROM regular_blood_request_notifications n
      JOIN regular_blood_requests rr
        ON rr.id = n.regular_request_id
      JOIN hospitals h
        ON h.id = rr.hospital_id
      JOIN blood_banks bb
        ON bb.id = n.blood_bank_id
      WHERE n.blood_bank_id = $1
      ORDER BY rr.required_date ASC, n.created_at DESC
      LIMIT $2
    `,
    [bloodBankId, Number.isInteger(normalizedLimit) && normalizedLimit > 0 ? normalizedLimit : 8]
  );

  return rows;
}

module.exports = {
  getIncomingRegularRequestsByBloodBankId,
};
