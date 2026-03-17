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

module.exports = {
  register,
};
