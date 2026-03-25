async function getAllUsers(req, res) {
  try {
    return res.status(501).json({ error: "Not Implemented" });
  } catch (error) {
    return res.status(500).json({ error: "Server Error" });
  }
}

async function getAllHospitals(req, res) {
  try {
    return res.status(501).json({ error: "Not Implemented" });
  } catch (error) {
    return res.status(500).json({ error: "Server Error" });
  }
}

async function verifyHospital(req, res) {
  try {
    return res.status(501).json({ error: "Not Implemented" });
  } catch (error) {
    return res.status(500).json({ error: "Server Error" });
  }
}

async function getAllBloodBanks(req, res) {
  try {
    return res.status(501).json({ error: "Not Implemented" });
  } catch (error) {
    return res.status(500).json({ error: "Server Error" });
  }
}

async function getAllBloodRequests(req, res) {
  try {
    return res.status(501).json({ error: "Not Implemented" });
  } catch (error) {
    return res.status(500).json({ error: "Server Error" });
  }
}

module.exports = {
  getAllUsers,
  getAllHospitals,
  verifyHospital,
  getAllBloodBanks,
  getAllBloodRequests,
};
