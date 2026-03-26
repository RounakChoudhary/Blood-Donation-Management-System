const userModel = require("../models/user.model");
const hospitalModel = require("../models/hospital.model");
const bloodBankModel = require("../models/bloodBank.model");
const bloodRequestModel = require("../models/bloodRequest.model");

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

async function getAdminStats() {
  const totalUsers = await userModel.countUsers();
  const totalHospitals = await hospitalModel.countHospitals();
  const totalBloodBanks = await bloodBankModel.countBloodBanks();
  const totalBloodRequests = await bloodRequestModel.countBloodRequests();
  
  return {
    users: totalUsers,
    hospitals: totalHospitals,
    bloodBanks: totalBloodBanks,
    bloodRequests: totalBloodRequests
  };
}

async function getAllBloodRequests(limit = 50, offset = 0) {
  return await bloodRequestModel.getAllBloodRequests(limit, offset);
}

async function updateUserRole(userId, role) {
  return await userModel.updateUserRole(userId, role);
}

async function deleteUser(id) {
  return await userModel.deleteUser(id);
}

async function deleteHospital(id) {
  return await hospitalModel.deleteHospital(id);
}

async function deleteBloodBank(id) {
  return await bloodBankModel.deleteBloodBank(id);
}

async function deleteBloodRequest(id) {
  return await bloodRequestModel.deleteBloodRequest(id);
}

module.exports = {
  getAllUsers,
  getAllHospitals,
  updateHospitalStatus,
  getAllBloodBanks,
  updateBloodBankStatus,
  getAdminStats,
  getAllBloodRequests,
  updateUserRole,
  deleteUser,
  deleteHospital,
  deleteBloodBank,
  deleteBloodRequest,
};
