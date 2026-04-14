const pool = require("../models/db");

async function getReadiness() {
  const startedAt = Date.now();

  try {
    await pool.query("SELECT 1");

    return {
      ok: true,
      status: "ready",
      database: "up",
      response_time_ms: Date.now() - startedAt,
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    return {
      ok: false,
      status: "not_ready",
      database: "down",
      response_time_ms: Date.now() - startedAt,
      timestamp: new Date().toISOString(),
      error: error.message,
    };
  }
}

function getLiveness() {
  return {
    ok: true,
    status: "healthy",
    uptime_seconds: Math.round(process.uptime()),
    timestamp: new Date().toISOString(),
  };
}

module.exports = {
  getReadiness,
  getLiveness,
};
