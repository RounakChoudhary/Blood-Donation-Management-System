const bloodRequestService = require("../services/bloodRequest.service");
const BloodRequest = require("../models/bloodRequest.model");

async function createRequest(req, res) {
  try {
    const result = await bloodRequestService.createEmergencyRequest({
      hospital_id: req.hospital.id,
      ...req.body,
    });

    if (!result.ok) {
      return res.status(result.status).json({ error: result.error });
    }

    return res.status(result.status).json({
      message: "Blood request created successfully",
      request: result.request,
      initial_matches_count: result.initial_matches_count,
      matches: result.matches,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Server error" });
  }
}

async function getRequestById(req, res) {
  try {
    const request = await BloodRequest.getBloodRequestById(req.params.id);

    if (!request) {
      return res.status(404).json({ error: "Blood request not found" });
    }

    if (request.hospital_id !== req.hospital.id) {
      return res.status(403).json({ error: "Forbidden" });
    }

    return res.json({ request });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Server error" });
  }
}

async function listMyRequests(req, res) {
  try {
    const result = await bloodRequestService.listHospitalRequests({
      hospital_id: req.hospital.id,
      limit: req.query.limit ?? 50,
      offset: req.query.offset ?? 0,
    });

    return res.status(result.status).json({ requests: result.requests });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Server error" });
  }
}

async function rematch(req, res) {
  try {
    const request = await BloodRequest.getBloodRequestById(req.params.id);

    if (!request) {
      return res.status(404).json({ error: "Blood request not found" });
    }

    if (request.hospital_id !== req.hospital.id) {
      return res.status(403).json({ error: "Forbidden" });
    }

    const result = await bloodRequestService.rematchRequest({
      request_id: Number(req.params.id),
      radius_meters: req.body.radius_meters ?? request.search_radius_meters ?? 5000,
      limit: req.body.limit ?? 25,
    });

    if (!result.ok) {
      return res.status(result.status).json({ error: result.error });
    }

    return res.status(result.status).json(result);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Server error" });
  }
}

module.exports = {
  createRequest,
  getRequestById,
  listMyRequests,
  rematch,
};