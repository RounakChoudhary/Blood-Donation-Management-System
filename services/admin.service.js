const userModel = require("../models/user.model");
const donorModel = require("../models/donor.model");
const hospitalModel = require("../models/hospital.model");
const bloodBankModel = require("../models/bloodBank.model");
const bloodRequestModel = require("../models/bloodRequest.model");
const systemConfigModel = require("../models/systemConfig.model");
const auditService = require("./audit.service");
const bcrypt = require("bcrypt");
const crypto = require("crypto");
const {
  sendHospitalVerificationEmail,
  sendBloodBankVerificationEmail,
} = require("./email.service");

const BCRYPT_ROUNDS = Number(process.env.BCRYPT_ROUNDS || 12);

function generateTemporaryPassword(length = 12) {
  const upper = "ABCDEFGHJKLMNPQRSTUVWXYZ";
  const lower = "abcdefghijkmnopqrstuvwxyz";
  const digits = "23456789";
  const symbols = "!@#$%^&*";
  const all = `${upper}${lower}${digits}${symbols}`;

  const required = [
    upper[crypto.randomInt(0, upper.length)],
    lower[crypto.randomInt(0, lower.length)],
    digits[crypto.randomInt(0, digits.length)],
    symbols[crypto.randomInt(0, symbols.length)],
  ];

  while (required.length < length) {
    required.push(all[crypto.randomInt(0, all.length)]);
  }

  for (let i = required.length - 1; i > 0; i -= 1) {
    const j = crypto.randomInt(0, i + 1);
    [required[i], required[j]] = [required[j], required[i]];
  }

  return required.join("");
}

async function provisionHospitalLoginAndNotify(hospitalId) {
  const hospital = await hospitalModel.getHospitalById(hospitalId);
  if (!hospital) return { warning: "Hospital not found for credential setup" };
  if (!hospital.email) return { warning: "Hospital has no email configured for credential delivery" };

  const authHospital = await hospitalModel.getHospitalByEmail(hospital.email);
  const alreadyConfigured = Boolean(authHospital?.password_hash);

  let tempPassword = null;
  if (!alreadyConfigured) {
    tempPassword = generateTemporaryPassword();
    const password_hash = await bcrypt.hash(tempPassword, BCRYPT_ROUNDS);
    await hospitalModel.setHospitalAuth({
      hospitalId: Number(hospitalId),
      email: hospital.email,
      password_hash,
    });
  }

  try {
    await sendHospitalVerificationEmail({
      to: hospital.email,
      hospitalName: hospital.name,
      tempPassword,
    });
    return {
      credentials_emailed: true,
      credentials_generated: !alreadyConfigured,
      already_configured: alreadyConfigured,
    };
  } catch (error) {
    return {
      warning: `Hospital verified, but email failed: ${error.message}`,
      credentials_generated: !alreadyConfigured,
      already_configured: alreadyConfigured,
    };
  }
}

async function provisionBloodBankLoginAndNotify(bloodBankId) {
  const bloodBank = await bloodBankModel.getBloodBankById(bloodBankId);
  if (!bloodBank) return { warning: "Blood bank not found for credential setup" };
  if (!bloodBank.email) return { warning: "Blood bank has no email configured for credential delivery" };

  const authBloodBank = await bloodBankModel.getBloodBankByEmail(bloodBank.email);
  const alreadyConfigured = Boolean(authBloodBank?.password_hash);

  let tempPassword = null;
  if (!alreadyConfigured) {
    tempPassword = generateTemporaryPassword();
    const password_hash = await bcrypt.hash(tempPassword, BCRYPT_ROUNDS);
    await bloodBankModel.setBloodBankAuth({
      bloodBankId: Number(bloodBankId),
      email: bloodBank.email,
      password_hash,
    });
  }

  try {
    await sendBloodBankVerificationEmail({
      to: bloodBank.email,
      bloodBankName: bloodBank.name,
      tempPassword,
    });
    return {
      credentials_emailed: true,
      credentials_generated: !alreadyConfigured,
      already_configured: alreadyConfigured,
    };
  } catch (error) {
    return {
      warning: `Blood bank verified, but email failed: ${error.message}`,
      credentials_generated: !alreadyConfigured,
      already_configured: alreadyConfigured,
    };
  }
}

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
  let provisioning = null;

  if (updated && status === "verified") {
    provisioning = await provisionHospitalLoginAndNotify(hospitalId);
  }

  if (updated) {
    await auditService.logPrivilegedAction({
      actor,
      action: `hospital.${status}`,
      entity: "hospital",
      metadata: { hospitalId: Number(hospitalId), status, provisioning },
    });
  }

  return updated ? { ...updated, provisioning } : null;
}

async function updateBloodBankStatus(bloodBankId, status, actor = null) {
  const updated = await bloodBankModel.updateBloodBankStatus(bloodBankId, status);
  let provisioning = null;

  if (updated && status === "verified") {
    provisioning = await provisionBloodBankLoginAndNotify(bloodBankId);
  }

  if (updated) {
    await auditService.logPrivilegedAction({
      actor,
      action: `blood_bank.${status}`,
      entity: "blood_bank",
      metadata: { bloodBankId: Number(bloodBankId), status, provisioning },
    });
  }

  return updated ? { ...updated, provisioning } : null;
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
