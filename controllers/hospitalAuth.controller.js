const hospitalAuthService = require("../services/hospitalAuth.service");

async function register(req, res) {
  try {
    const result = await hospitalAuthService.registerHospital(req.body);

    if (!result.ok) {
      return res.status(result.status).json({ error: result.error });
    }

    return res.status(result.status).json({
      message: "Hospital registered successfully",
      hospital: result.hospital,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Server error" });
  }
}

async function listPending(req, res) {
  try {
    const result = await hospitalAuthService.listPendingHospitals({
      limit: req.query.limit ?? 50,
      offset: req.query.offset ?? 0,
    });

    if (!result.ok) {
      return res.status(result.status).json({ error: result.error });
    }

    return res.status(result.status).json({ hospitals: result.hospitals });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Server error" });
  }
}

async function verify(req, res) {
  try {
    const result = await hospitalAuthService.verifyHospital({
      hospital_id: req.params.id,
    });

    if (!result.ok) {
      return res.status(result.status).json({ error: result.error });
    }

    return res.status(result.status).json({
      message: "Hospital verified successfully",
      hospital: result.hospital,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Server error" });
  }
}

async function setupAuth(req, res) {
  try {
    const result = await hospitalAuthService.setupHospitalAuth({
      hospital_id: req.params.id,
      email: req.body.email,
      password: req.body.password,
    });

    if (!result.ok) {
      return res.status(result.status).json({ error: result.error });
    }

    return res.status(result.status).json({
      message: "Hospital auth configured successfully",
      hospital: result.hospital,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Server error" });
  }
}

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

module.exports = {
  register,
  listPending,
  verify,
  setupAuth,
  login,
};
