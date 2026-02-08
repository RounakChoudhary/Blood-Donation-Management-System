const pool = require("./db");

async function createDonor({ user_id, blood_group }) {
  const query = `
    INSERT INTO donors (user_id, blood_group)
    VALUES ($1, $2)
    RETURNING id, user_id, blood_group, last_donation_date, deferred_until;
  `;
  const { rows } = await pool.query(query, [user_id, blood_group]);
  return rows[0];
}

async function getDonorByUserId(user_id) {
  const { rows } = await pool.query(
    `SELECT id, user_id, blood_group, last_donation_date, deferred_until
     FROM donors
     WHERE user_id = $1`,
    [user_id]
  );
  return rows[0] || null;
}

async function markDonated({ donor_id, donation_date = null, cooldown_months = 4 }) {
  const query = `
    UPDATE donors
    SET last_donation_date = COALESCE($2::date, CURRENT_DATE),
        deferred_until = (COALESCE($2::date, CURRENT_DATE) + ($3 || ' months')::interval)::date
    WHERE id = $1
    RETURNING id, user_id, blood_group, last_donation_date, deferred_until;
  `;
  const { rows } = await pool.query(query, [donor_id, donation_date, String(cooldown_months)]);
  return rows[0] || null;
}

module.exports = { createDonor, getDonorByUserId, markDonated };