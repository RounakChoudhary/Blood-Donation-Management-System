const bloodBankAuthService = require("../services/bloodBankAuth.service");

async function register(req, res) {
  try {
    const result = await bloodBankAuthService.registerBloodBank(req.body);

    if (!result.ok) {
      return res.status(result.status).json({ error: result.error });
    }

    return res.status(result.status).json({
      message: "Blood bank registration submitted for approval",
      bloodBank: result.bloodBank,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Server error" });
  }
}

async function setupAuth(req, res) {
  try {
    const result = await bloodBankAuthService.setupBloodBankAuth({
      blood_bank_id: req.params.id,
      email: req.body.email,
      password: req.body.password,
    });

    if (!result.ok) {
      return res.status(result.status).json({ error: result.error });
    }

    return res.status(result.status).json({
      message: "Blood bank auth configured successfully",
      bloodBank: result.bloodBank,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Server error" });
  }
}

async function login(req, res) {
  try {
    const result = await bloodBankAuthService.loginBloodBank(req.body);

    if (!result.ok) {
      return res.status(result.status).json({ error: result.error });
    }

    return res.status(result.status).json({
      token: result.token,
      bloodBank: result.bloodBank,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Server error" });
  }
}

module.exports = {
  register,
  setupAuth,
  login,
};
