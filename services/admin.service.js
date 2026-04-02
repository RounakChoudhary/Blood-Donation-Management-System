const userModel = require("../models/user.model");
const donorModel = require("../models/donor.model");
const hospitalModel = require("../models/hospital.model");
const bloodBankModel = require("../models/bloodBank.model");
const bloodRequestModel = require("../models/bloodRequest.model");
const systemConfigModel = require("../models/systemConfig.model");
const auditService = require("./audit.service");

function _formatPaginatedResponse(result, limit, offset) {
  return {
    data: result.data,
    pagination: {
      totalCount: result.totalCount,
      currentPage: Math.floor(offset / limit) + 1,
      totalPages: Math.ceil(result.totalCount / limit) || 1
    }
  };
}

async function getAllUsers(limit = 50, offset = 0, search = "") {
  const result = await userModel.getAllUsers(limit, offset, search);
  return _formatPaginatedResponse(result, limit, offset);
}

async function getAllHospitals(limit = 50, offset = 0, search = "") {
  const result = await hospitalModel.getAllHospitals(limit, offset, search);
  return _formatPaginatedResponse(result, limit, offset);
}

async function getAllBloodBanks(limit = 50, offset = 0, search = "") {
  const result = await bloodBankModel.getAllBloodBanks(limit, offset, search);
  return _formatPaginatedResponse(result, limit, offset);
}

async function getAdminStats() {
  const [
    totalUsers,
    totalDonors,
    totalHospitals,
    totalBloodBanks,
    totalBloodRequests,
    requestsToday,
    fulfilledBloodRequests,
  ] = await Promise.all([
    userModel.countUsers(),
    donorModel.countDonors(),
    hospitalModel.countHospitals(),
    bloodBankModel.countBloodBanks(),
    bloodRequestModel.countBloodRequests(),
    bloodRequestModel.countBloodRequestsToday(),
    bloodRequestModel.countFulfilledBloodRequests(),
  ]);

  const fulfillmentRate = totalBloodRequests > 0
    ? Number(((fulfilledBloodRequests / totalBloodRequests) * 100).toFixed(1))
    : 0;

  return {
    users: totalUsers,
    donors: totalDonors,
    hospitals: totalHospitals,
    bloodBanks: totalBloodBanks,
    bloodRequests: totalBloodRequests,
    requestsToday,
    fulfillmentRate,
  };
}

async function getAllBloodRequests(limit = 50, offset = 0, search = "") {
  const result = await bloodRequestModel.getAllBloodRequests(limit, offset, search);
  return _formatPaginatedResponse(result, limit, offset);
}

async function updateUserRole(userId, role, actor = null) {
  const updated = await userModel.updateUserRole(userId, role);
  if (updated) {
    await auditService.logPrivilegedAction({
      actor,
      action: "user.role.update",
      entity: "user",
      metadata: { userId: Number(userId), role },
    });
  }

  return updated;
}

async function updateUserAccessStatus(userId, access_status, actor = null) {
  const updated = await userModel.updateUserAccessStatus({ userId, access_status });
  if (updated) {
    await auditService.logPrivilegedAction({
      actor,
      action: `user.${access_status}`,
      entity: "user",
      metadata: { userId: Number(userId), access_status },
    });
  }

  return updated;
}

async function getSystemConfig() {
  return await systemConfigModel.getSystemConfig();
}

async function updateSystemConfig(payload, actor = null) {
  const updated = await systemConfigModel.upsertSystemConfig(payload);
  if (updated) {
    await auditService.logPrivilegedAction({
      actor,
      action: "system_config.update",
      entity: "system_config",
      metadata: payload,
    });
  }

  return updated;
}

async function updateHospitalStatus(hospitalId, status, actor = null) {
  const updated = await hospitalModel.updateHospitalStatus(hospitalId, status);
  if (updated) {
    await auditService.logPrivilegedAction({
      actor,
      action: `hospital.${status}`,
      entity: "hospital",
      metadata: { hospitalId: Number(hospitalId), status },
    });
  }

  return updated;
}

async function updateBloodBankStatus(bloodBankId, status, actor = null) {
  const updated = await bloodBankModel.updateBloodBankStatus(bloodBankId, status);
  if (updated) {
    await auditService.logPrivilegedAction({
      actor,
      action: `blood_bank.${status}`,
      entity: "blood_bank",
      metadata: { bloodBankId: Number(bloodBankId), status },
    });
  }

  return updated;
}

async function deleteUser(id, actor = null) {
  const deleted = await userModel.deleteUser(id);
  if (deleted) {
    await auditService.logPrivilegedAction({
      actor,
      action: "user.delete",
      entity: "user",
      metadata: { userId: Number(id) },
    });
  }

  return deleted;
}

async function deleteHospital(id, actor = null) {
  const deleted = await hospitalModel.deleteHospital(id);
  if (deleted) {
    await auditService.logPrivilegedAction({
      actor,
      action: "hospital.delete",
      entity: "hospital",
      metadata: { hospitalId: Number(id) },
    });
  }

  return deleted;
}

async function deleteBloodBank(id, actor = null) {
  const deleted = await bloodBankModel.deleteBloodBank(id);
  if (deleted) {
    await auditService.logPrivilegedAction({
      actor,
      action: "blood_bank.delete",
      entity: "blood_bank",
      metadata: { bloodBankId: Number(id) },
    });
  }

  return deleted;
}

async function deleteBloodRequest(id, actor = null) {
  const deleted = await bloodRequestModel.deleteBloodRequest(id);
  if (deleted) {
    await auditService.logPrivilegedAction({
      actor,
      action: "blood_request.delete",
      entity: "blood_request",
      metadata: { bloodRequestId: Number(id) },
    });
  }

  return deleted;
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
  updateUserAccessStatus,
  deleteUser,
  deleteHospital,
  deleteBloodBank,
  deleteBloodRequest,
  getSystemConfig,
  updateSystemConfig,
};
