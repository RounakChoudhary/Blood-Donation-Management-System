const pool = require("./db");

async function addInventoryBatch({
  blood_bank_id,
  blood_group,
  units_available,
  expiry_date,
}) {
  const { rows } = await pool.query(
    `
      INSERT INTO blood_bank_inventory_batches (
        blood_bank_id,
        blood_group,
        units_available,
        expiry_date
      )
      VALUES ($1, $2, $3, $4)
      RETURNING *
    `,
    [blood_bank_id, blood_group, units_available, expiry_date]
  );

  return rows[0];
}

async function getInventorySummaryByBloodBankId(bloodBankId) {
  const { rows } = await pool.query(
    `
      SELECT
        blood_group,
        COALESCE(SUM(units_available), 0)::INT AS units_available,
        MIN(expiry_date) FILTER (WHERE units_available > 0) AS nearest_expiry
      FROM blood_bank_inventory_batches
      WHERE blood_bank_id = $1
        AND units_available > 0
      GROUP BY blood_group
      ORDER BY blood_group
    `,
    [bloodBankId]
  );

  return rows;
}

async function getInventorySummaryByBloodBankIds(bloodBankIds = []) {
  const normalizedIds = bloodBankIds
    .map((id) => Number(id))
    .filter((id) => Number.isInteger(id) && id > 0);

  if (normalizedIds.length === 0) {
    return [];
  }

  const { rows } = await pool.query(
    `
      SELECT
        blood_bank_id,
        blood_group,
        COALESCE(SUM(units_available), 0)::INT AS units_available,
        MIN(expiry_date) FILTER (WHERE units_available > 0) AS nearest_expiry
      FROM blood_bank_inventory_batches
      WHERE blood_bank_id = ANY($1::INT[])
        AND units_available > 0
      GROUP BY blood_bank_id, blood_group
      ORDER BY blood_bank_id, blood_group
    `,
    [normalizedIds]
  );

  return rows;
}

async function consumeInventoryUnits({
  blood_bank_id,
  blood_group,
  units,
}) {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const { rows } = await client.query(
      `
        SELECT
          id,
          units_available
        FROM blood_bank_inventory_batches
        WHERE blood_bank_id = $1
          AND blood_group = $2
          AND units_available > 0
        ORDER BY expiry_date ASC, created_at ASC, id ASC
        FOR UPDATE
      `,
      [blood_bank_id, blood_group]
    );

    const totalAvailable = rows.reduce(
      (sum, row) => sum + Number(row.units_available || 0),
      0
    );

    if (totalAvailable < units) {
      await client.query("ROLLBACK");
      return {
        ok: false,
        available_units: totalAvailable,
      };
    }

    let remaining = Number(units);
    const updatedBatchIds = [];

    for (const row of rows) {
      if (remaining <= 0) break;

      const batchUnits = Number(row.units_available || 0);
      const deduction = Math.min(batchUnits, remaining);

      await client.query(
        `
          UPDATE blood_bank_inventory_batches
          SET
            units_available = units_available - $2,
            updated_at = NOW()
          WHERE id = $1
        `,
        [row.id, deduction]
      );

      updatedBatchIds.push(row.id);
      remaining -= deduction;
    }

    await client.query("COMMIT");

    return {
      ok: true,
      updated_batch_ids: updatedBatchIds,
      remaining_units: totalAvailable - units,
    };
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
}

module.exports = {
  addInventoryBatch,
  getInventorySummaryByBloodBankId,
  getInventorySummaryByBloodBankIds,
  consumeInventoryUnits,
};
