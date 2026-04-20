const bloodCampService = require("../services/bloodCamp.service");

async function propose(req, res) {
  try {
    const result = await bloodCampService.proposeCamp(req.body);

    if (!result.ok) {
      return res.status(result.status).json({ error: result.error });
    }

    return res.status(result.status).json({
      message: result.assigned_blood_bank
        ? "Blood camp proposal submitted and matched with the nearest blood bank"
        : "Blood camp proposal submitted. No nearby verified blood bank could be assigned yet",
      camp: result.camp,
      assigned_blood_bank: result.assigned_blood_bank,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Server error" });
  }
}

async function review(req, res) {
  try {
    const { id } = req.params;
    const { status } = req.body; // should be 'approved' or 'rejected'

    const result = await bloodCampService.reviewCamp({
      camp_id: id,
      status,
    });

    if (!result.ok) {
      return res.status(result.status).json({ error: result.error });
    }

    return res.status(result.status).json({
      message: `Blood camp ${status} successfully`,
      camp: result.camp,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Server error" });
  }
}

async function searchNearby(req, res) {
  try {
    const { lon, lat, radius_meters, start_date, end_date } = req.query;

    const result = await bloodCampService.searchCamps({
      lon,
      lat,
      radius_meters,
      start_date,
      end_date,
    });

    if (!result.ok) {
      return res.status(result.status).json({ error: result.error });
    }

    return res.status(result.status).json({
      message: "Approved camps retrieved successfully",
      camps: result.camps,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Server error" });
  }
}

async function listMine(req, res) {
  try {
    const result = await bloodCampService.getOrganiserCampProposals({
      organiser_email: req.query.organiser_email,
    });

    if (!result.ok) {
      return res.status(result.status).json({ error: result.error });
    }

    return res.status(result.status).json({
      camps: result.camps,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Server error" });
  }
}

async function listAssignedForBloodBank(req, res) {
  try {
    const result = await bloodCampService.getAssignedCampProposals({
      blood_bank_id: req.bloodBank.id,
    });

    if (!result.ok) {
      return res.status(result.status).json({ error: result.error });
    }

    return res.status(result.status).json({
      camps: result.camps,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Server error" });
  }
}

async function reviewForBloodBank(req, res) {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const result = await bloodCampService.reviewCampByBloodBank({
      camp_id: id,
      blood_bank_id: req.bloodBank.id,
      status,
    });

    if (!result.ok) {
      return res.status(result.status).json({ error: result.error });
    }

    return res.status(result.status).json({
      message: `Camp proposal ${status} successfully`,
      camp: result.camp,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Server error" });
  }
}

module.exports = {
  propose,
  review,
  searchNearby,
  listMine,
  listAssignedForBloodBank,
  reviewForBloodBank,
};
