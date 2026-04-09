const pool = require("./db");

async function getInventoryByHospitalId(hospital_id) {
  const { rows } = await pool.query(
    `
      SELECT
        id,
        hospital_id,
        blood_group,
        units_available,
        created_at,
        updated_at
      FROM blood_inventory
      WHERE hospital_id = $1
      ORDER BY blood_group
    `,
    [hospital_id]
  );

  return rows;
}

async function upsertInventory({ hospital_id, blood_group, units_available }) {
  const { rows } = await pool.query(
    `
      INSERT INTO blood_inventory (
        hospital_id,
        blood_group,
        units_available
      )
      VALUES ($1, $2, $3)
      ON CONFLICT (hospital_id, blood_group)
      DO UPDATE SET
        units_available = EXCLUDED.units_available,
        updated_at = NOW()
      RETURNING id, hospital_id, blood_group, units_available, created_at, updated_at
    `,
    [hospital_id, blood_group, units_available]
  );

  return rows[0];
}

module.exports = {
  getInventoryByHospitalId,
  upsertInventory,
};
