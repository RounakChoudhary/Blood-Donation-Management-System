const adminService = require("../services/admin.service");

// Basic validation helper
const isValidId = (id) => !isNaN(parseInt(id)) && parseInt(id) > 0;

async function getAllUsers(req, res) {
  try {
    const limit = parseInt(req.query.limit) || 50;
    const offset = parseInt(req.query.offset) || 0;
    const search = req.query.search || "";
    const usersData = await adminService.getAllUsers(limit, offset, search);
    return res.json(usersData);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Server Error" });
  }
}

async function getAllHospitals(req, res) {
  try {
    const limit = parseInt(req.query.limit) || 50;
    const offset = parseInt(req.query.offset) || 0;
    const search = req.query.search || "";
    const hospitalsData = await adminService.getAllHospitals(limit, offset, search);
    return res.json(hospitalsData);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Server Error" });
  }
}

async function approveHospital(req, res) {
  try {
    const { id } = req.params;
    if (!isValidId(id)) return res.status(400).json({ error: "Invalid hospital ID" });
    
    // Existing DB uses 'verified' instead of 'approved' to represent active status
    const hospital = await adminService.updateHospitalStatus(id, "verified", req.user);
    if (!hospital) return res.status(404).json({ error: "Hospital not found" });
    
    let message = "Hospital approved successfully";
    if (hospital?.provisioning?.credentials_emailed) {
      message += " and login details emailed.";
    }
    if (hospital?.provisioning?.warning) {
      message += ` (${hospital.provisioning.warning})`;
    }
    
    return res.json({ message, hospital });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Server Error" });
  }
}

async function rejectHospital(req, res) {
  try {
    const { id } = req.params;
    if (!isValidId(id)) return res.status(400).json({ error: "Invalid hospital ID" });
    
    const hospital = await adminService.updateHospitalStatus(id, "rejected", req.user);
    if (!hospital) return res.status(404).json({ error: "Hospital not found" });
    
    return res.json({ message: "Hospital rejected successfully", hospital });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Server Error" });
  }
}

async function getAllBloodBanks(req, res) {
  try {
    const limit = parseInt(req.query.limit) || 50;
    const offset = parseInt(req.query.offset) || 0;
    const search = req.query.search || "";
    const bloodBanksData = await adminService.getAllBloodBanks(limit, offset, search);
    return res.json(bloodBanksData);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Server Error" });
  }
}

async function verifyBloodBank(req, res) {
  try {
    const { id } = req.params;
    if (!isValidId(id)) return res.status(400).json({ error: "Invalid blood bank ID" });

    const bloodBank = await adminService.updateBloodBankStatus(id, "verified", req.user);
    if (!bloodBank) return res.status(404).json({ error: "Blood bank not found" });

    let message = "Blood bank verified successfully";
    if (bloodBank?.provisioning?.credentials_emailed) {
      message += " and login details emailed.";
    }
    if (bloodBank?.provisioning?.warning) {
      message += ` (${bloodBank.provisioning.warning})`;
    }

    return res.json({ message, bloodBank });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Server Error" });
  }
}

async function getAdminStats(req, res) {
  try {
    const stats = await adminService.getAdminStats();
    return res.json({ stats });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Server Error" });
  }
}

async function getAllBloodRequests(req, res) {
  try {
    const limit = parseInt(req.query.limit) || 50;
    const offset = parseInt(req.query.offset) || 0;
    const search = req.query.search || "";
    const bloodRequestsData = await adminService.getAllBloodRequests(limit, offset, search);
    return res.json(bloodRequestsData);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Server Error" });
  }
}

async function updateUserRole(req, res) {
  try {
    const { id } = req.params;
    const { role } = req.body;
    if (!isValidId(id)) return res.status(400).json({ error: "Invalid user ID" });
    if (!role || !["user", "admin"].includes(role)) {
      return res.status(400).json({ error: "Invalid or missing role parameter" });
    }

    const updatedUser = await adminService.updateUserRole(id, role, req.user);
    if (!updatedUser) return res.status(404).json({ error: "User not found" });

    return res.json({ message: "User role updated successfully", user: updatedUser });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Server Error" });
  }
}

async function updateUserStatus(req, res) {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!isValidId(id)) return res.status(400).json({ error: "Invalid user ID" });
    if (!status || !["active", "deactivated", "restricted"].includes(status)) {
      return res.status(400).json({ error: "Invalid or missing status parameter" });
    }

    const updatedUser = await adminService.updateUserAccessStatus(id, status, req.user);
    if (!updatedUser) return res.status(404).json({ error: "User not found" });

    return res.json({ message: "User status updated successfully", user: updatedUser });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Server Error" });
  }
}

async function deleteUser(req, res) {
  try {
    const { id } = req.params;
    if (!isValidId(id)) return res.status(400).json({ error: "Invalid user ID" });
    const result = await adminService.deleteUser(id, req.user);
    if (!result) return res.status(404).json({ error: "User not found or already deleted" });
    return res.json({ message: "Deleted successfully" });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Server Error" });
  }
}

async function deleteHospital(req, res) {
  try {
    const { id } = req.params;
    if (!isValidId(id)) return res.status(400).json({ error: "Invalid hospital ID" });
    const result = await adminService.deleteHospital(id, req.user);
    if (!result) return res.status(404).json({ error: "Hospital not found or already deleted" });
    return res.json({ message: "Deleted successfully" });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Server Error" });
  }
}

async function deleteBloodBank(req, res) {
  try {
    const { id } = req.params;
    if (!isValidId(id)) return res.status(400).json({ error: "Invalid blood bank ID" });
    const result = await adminService.deleteBloodBank(id, req.user);
    if (!result) return res.status(404).json({ error: "Blood bank not found or already deleted" });
    return res.json({ message: "Deleted successfully" });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Server Error" });
  }
}

async function deleteBloodRequest(req, res) {
  try {
    const { id } = req.params;
    if (!isValidId(id)) return res.status(400).json({ error: "Invalid blood request ID" });
    const result = await adminService.deleteBloodRequest(id, req.user);
    if (!result) return res.status(404).json({ error: "Blood request not found or already deleted" });
    return res.json({ message: "Deleted successfully" });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Server Error" });
  }
}

async function getSystemConfig(req, res) {
  try {
    const config = await adminService.getSystemConfig();
    return res.json({ config });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Server Error" });
  }
}

async function updateSystemConfig(req, res) {
  try {
    const payload = {
      matching_radius: req.body.matching_radius,
      cooldown_days: req.body.cooldown_days,
      max_donors_per_request: req.body.max_donors_per_request,
      sender_identity: req.body.sender_identity,
    };

    const config = await adminService.updateSystemConfig(payload, req.user);
    return res.json({ message: "System configuration updated successfully", config });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Server Error" });
  }
}

module.exports = {
  getAllUsers,
  getAllHospitals,
  approveHospital,
  rejectHospital,
  getAllBloodBanks,
  verifyBloodBank,
  getAdminStats,
  getAllBloodRequests,
  updateUserRole,
  updateUserStatus,
  deleteUser,
  deleteHospital,
  deleteBloodBank,
  deleteBloodRequest,
  getSystemConfig,
  updateSystemConfig,
};
