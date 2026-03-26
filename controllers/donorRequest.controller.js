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

async function acceptViaToken(req, res) {
  try {
    const result = await donorRequestService.respondToRequestByToken({
      token: req.query.token,
      action: "accepted",
    });

    if (!result.ok) {
      return res.status(result.status).json({ error: result.error });
    }

    return res.json({
      message: "Request accepted via secure email link",
      match: result.match,
      donor: result.donor,
      hospital_notified: result.hospital_notified,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
}

async function rejectViaToken(req, res) {
  try {
    const result = await donorRequestService.respondToRequestByToken({
      token: req.query.token,
      action: "declined",
    });

    if (!result.ok) {
      return res.status(result.status).json({ error: result.error });
    }

    return res.json({
      message: "Request declined via secure email link",
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
  acceptViaToken,
  rejectViaToken,
};
