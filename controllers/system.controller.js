const healthService = require("../services/health.service");

async function health(req, res) {
  const result = healthService.getLiveness();
  return res.status(200).json(result);
}

async function readiness(req, res) {
  const result = await healthService.getReadiness();
  return res.status(result.ok ? 200 : 503).json(result);
}

module.exports = {
  health,
  readiness,
};
