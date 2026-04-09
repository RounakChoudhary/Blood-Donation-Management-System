const apiService = require("../services/api.service");

async function matchDonorsForRequest(req, res) {
  try {
    const requestId = Number(req.params.requestId);
    if (!Number.isInteger(requestId) || requestId <= 0) {
      return res.status(400).json({ error: "Invalid requestId" });
    }

    const result = await apiService.matchDonorsForRequest({
      requestId,
      hospitalId: req.hospital.id,
    });

    if (!result.ok) {
      return res.status(result.status).json({ error: result.error });
    }

    return res.json({ donors: result.donors });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Server error" });
  }
}

async function listNotifications(req, res) {
  try {
    const notifications = await apiService.listNotifications({
      userId: req.user.id,
    });
    return res.json({ notifications });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Server error" });
  }
}

async function markNotificationAsRead(req, res) {
  try {
    const notificationId = Number(req.params.id);
    if (!Number.isInteger(notificationId) || notificationId <= 0) {
      return res.status(400).json({ error: "Invalid notification ID" });
    }

    const notification = await apiService.markNotificationAsRead({
      notificationId,
      userId: req.user.id,
    });

    if (!notification) {
      return res.status(404).json({ error: "Notification not found" });
    }

    return res.json({ notification });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Server error" });
  }
}

async function getRequestById(req, res) {
  try {
    const requestId = Number(req.params.id);
    if (!Number.isInteger(requestId) || requestId <= 0) {
      return res.status(400).json({ error: "Invalid request ID" });
    }

    const result = await apiService.getRequestById({
      requestId,
      hospitalId: req.hospital.id,
    });

    if (!result.ok) {
      return res.status(result.status).json({ error: result.error });
    }

    return res.json({ request: result.request });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Server error" });
  }
}

async function updateRequestStatus(req, res) {
  try {
    const requestId = Number(req.params.id);
    if (!Number.isInteger(requestId) || requestId <= 0) {
      return res.status(400).json({ error: "Invalid request ID" });
    }

    const { status } = req.body;
    const result = await apiService.updateRequestStatus({
      requestId,
      hospitalId: req.hospital.id,
      status,
    });

    if (!result.ok) {
      return res.status(result.status).json({ error: result.error });
    }

    return res.json({ request: result.request });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Server error" });
  }
}

async function getBloodBankInventory(req, res) {
  try {
    const result = await apiService.getBloodBankInventory({
      bloodBankId: req.bloodBank.id,
    });

    return res.json({ inventory: result.inventory });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Server error" });
  }
}

async function updateBloodBankInventory(req, res) {
  try {
    const { blood_group, units_available } = req.body;
    const result = await apiService.updateBloodBankInventory({
      bloodBankId: req.bloodBank.id,
      blood_group,
      units_available,
    });

    if (!result.ok) {
      return res.status(result.status).json({ error: result.error });
    }

    return res.json({ message: "Inventory updated successfully", inventory: result.inventory });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Server error" });
  }
}

module.exports = {
  matchDonorsForRequest,
  listNotifications,
  markNotificationAsRead,
  getRequestById,
  updateRequestStatus,
  getBloodBankInventory,
  updateBloodBankInventory,
};
