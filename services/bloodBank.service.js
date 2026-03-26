const bloodBankAuthService = require("./bloodBankAuth.service");

async function registerBloodBank(payload) {
  return bloodBankAuthService.registerBloodBank(payload);
}

module.exports = {
  registerBloodBank,
};
