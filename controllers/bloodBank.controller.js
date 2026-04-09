const bloodBankService = require("../services/bloodBank.service");
const regularBloodRequestService = require("../services/regularBloodRequest.service");

async function getNearby(req, res) {
  try {
    const result = await bloodBankService.findNearbyBloodBanks({
      lon: req.query.lon,
      lat: req.query.lat,
      radius_meters: req.query.radius_meters,
      hospital_id: req.query.hospital_id,
    });

    if (!result.ok) {
      return res.status(result.status).json({ error: result.error });
    }

    return res.status(result.status).json({
      blood_banks: result.blood_banks,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Server error" });
  }
}

async function getDashboard(req, res) {
  try {
    const result = await bloodBankService.getBloodBankDashboard({
      blood_bank_id: req.bloodBank.id,
      nearby_radius_meters: req.query.radius_meters,
      nearby_limit: req.query.nearby_limit,
      request_limit: req.query.request_limit,
    });

    if (!result.ok) {
      return res.status(result.status).json({ error: result.error });
    }

    return res.status(result.status).json({
      summary: result.summary,
      blood_bank: result.blood_bank,
      inventory: result.inventory,
      nearby_banks: result.nearby_banks,
      incoming_regular_requests: result.incoming_regular_requests,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Server error" });
  }
}

async function createRegularRequest(req, res) {
  try {
    const result = await regularBloodRequestService.createRegularRequest({
      hospital_id: req.hospital.id,
      ...req.body,
    });

    if (!result.ok) {
      return res.status(result.status).json({ error: result.error });
    }

    return res.status(result.status).json({
      message: "Regular blood request submitted successfully",
      request: result.request,
      notified_blood_banks_count: result.notified_blood_banks_count,
      notifications: result.notifications,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Server error" });
  }
}

async function adjustInventory(req, res) {
  try {
    const result = await bloodBankService.adjustInventory({
      blood_bank_id: req.bloodBank.id,
      ...req.body,
    });

    if (!result.ok) {
      return res.status(result.status).json({ error: result.error });
    }

    return res.status(result.status).json({
      message: result.message,
      inventory: result.inventory,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Server error" });
  }
}

module.exports = {
  getNearby,
  getDashboard,
  createRegularRequest,
  adjustInventory,
};
