const hospitalAuthService = require("../services/hospitalAuth.service");

async function login(req, res) {
  try {
    const result = await hospitalAuthService.loginHospital(req.body);

    if (!result.ok) {
      return res.status(result.status).json({ error: result.error });
    }

    return res.status(result.status).json({
      token: result.token,
      hospital: result.hospital,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Server error" });
  }
}

module.exports = { login };