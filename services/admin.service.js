const userModel = require("../models/user.model");
const hospitalModel = require("../models/hospital.model");
const bloodBankModel = require("../models/bloodBank.model");

async function getAllUsers(limit = 50, offset = 0) {
  return await userModel.getAllUsers(limit, offset);
}

async function getAllHospitals(limit = 50, offset = 0) {
  return await hospitalModel.getAllHospitals(limit, offset);
}

async function updateHospitalStatus(hospitalId, status) {
  return await hospitalModel.updateHospitalStatus(hospitalId, status);
}

async function getAllBloodBanks(limit = 50, offset = 0) {
  return await bloodBankModel.getAllBloodBanks(limit, offset);
}

async function updateBloodBankStatus(bloodBankId, status) {
  return await bloodBankModel.updateBloodBankStatus(bloodBankId, status);
}

module.exports = {
  getAllUsers,
  getAllHospitals,
  updateHospitalStatus,
  getAllBloodBanks,
  updateBloodBankStatus,
};
