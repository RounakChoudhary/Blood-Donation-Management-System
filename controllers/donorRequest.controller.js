const donorRequestService = require("../services/donorRequest.service");

async function listRequests(req, res) {
  try {
    const result = await donorRequestService.getDonorRequests(req.user.id);

    if (!result.ok) {
      return res.status(result.status).json({ error: result.error });
    }

    return res.json({
      requests: result.matches,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Server error" });
  }
}

async function accept(req, res) {
  try {
    const result = await donorRequestService.acceptRequest({
      user_id: req.user.id,
      match_id: req.params.matchId,
    });

    if (!result.ok) {
      return res.status(result.status).json({ error: result.error });
    }

    return res.json({
      message: "Request accepted",
      match: result.match,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
}

async function reject(req, res) {
  try {
    const result = await donorRequestService.rejectRequest({
      user_id: req.user.id,
      match_id: req.params.matchId,
    });

    if (!result.ok) {
      return res.status(result.status).json({ error: result.error });
    }

    return res.json({
      message: "Request declined",
      match: result.match,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
}

module.exports = {
  listRequests,
  accept,
  reject,
};