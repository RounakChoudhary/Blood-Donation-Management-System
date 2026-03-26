const adminService = require("../services/admin.service");

// Basic validation helper
const isValidId = (id) => !isNaN(parseInt(id)) && parseInt(id) > 0;

async function getAllUsers(req, res) {
  try {
    const limit = parseInt(req.query.limit) || 50;
    const offset = parseInt(req.query.offset) || 0;
    const users = await adminService.getAllUsers(limit, offset);
    return res.json({ users });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Server Error" });
  }
}

async function getAllHospitals(req, res) {
  try {
    const limit = parseInt(req.query.limit) || 50;
    const offset = parseInt(req.query.offset) || 0;
    const hospitals = await adminService.getAllHospitals(limit, offset);
    return res.json({ hospitals });
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
    const hospital = await adminService.updateHospitalStatus(id, "verified");
    if (!hospital) return res.status(404).json({ error: "Hospital not found" });
    
    return res.json({ message: "Hospital approved successfully", hospital });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Server Error" });
  }
}

async function rejectHospital(req, res) {
  try {
    const { id } = req.params;
    if (!isValidId(id)) return res.status(400).json({ error: "Invalid hospital ID" });
    
    const hospital = await adminService.updateHospitalStatus(id, "rejected");
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
    const bloodBanks = await adminService.getAllBloodBanks(limit, offset);
    return res.json({ bloodBanks });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Server Error" });
  }
}

async function verifyBloodBank(req, res) {
  try {
    const { id } = req.params;
    if (!isValidId(id)) return res.status(400).json({ error: "Invalid blood bank ID" });

    const bloodBank = await adminService.updateBloodBankStatus(id, "verified");
    if (!bloodBank) return res.status(404).json({ error: "Blood bank not found" });

    return res.json({ message: "Blood bank verified successfully", bloodBank });
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
    const bloodRequests = await adminService.getAllBloodRequests(limit, offset);
    return res.json({ bloodRequests });
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
    if (!role || !["user", "admin", "hospital", "blood_bank"].includes(role)) {
      return res.status(400).json({ error: "Invalid or missing role parameter" });
    }

    const updatedUser = await adminService.updateUserRole(id, role);
    if (!updatedUser) return res.status(404).json({ error: "User not found" });

    return res.json({ message: "User role updated successfully", user: updatedUser });
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
  updateUserRole
};
