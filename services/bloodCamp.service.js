const BloodCamp = require("../models/bloodCamp.model");
const BloodBank = require("../models/bloodBank.model");
const { sendCampStatusEmail, sendCampReviewOutcomeEmail } = require("./email.service");

async function proposeCamp(payload) {
  const {
    name,
    date,
    time,
    venue_name,
    address,
    lon,
    lat,
    capacity,
    organiser_name,
    organiser_phone,
    organiser_email,
  } = payload;

  if (
    !name ||
    !date ||
    !time ||
    !venue_name ||
    !address ||
    !organiser_name ||
    !organiser_phone ||
    !organiser_email
  ) {
    return { ok: false, status: 400, error: "Missing required fields" };
  }

  if (
    lon === undefined ||
    lat === undefined ||
    Number.isNaN(Number(lon)) ||
    Number.isNaN(Number(lat))
  ) {
    return { ok: false, status: 400, error: "Valid lon and lat are required" };
  }

  const camp = await BloodCamp.createCamp({
    name,
    date,
    time,
    venue_name,
    address,
    lon: Number(lon),
    lat: Number(lat),
    capacity: capacity ? Number(capacity) : null,
    organiser_name,
    organiser_phone,
    organiser_email,
  });

  const nearbyBloodBanks = await BloodBank.findNearbyBloodBanks({
    lon: Number(lon),
    lat: Number(lat),
    radius_meters: 10000,
  });

  let assignedBloodBank = null;
  if (Array.isArray(nearbyBloodBanks) && nearbyBloodBanks.length > 0) {
    assignedBloodBank = nearbyBloodBanks[0];
    await BloodCamp.assignCampToBloodBank(camp.id, assignedBloodBank.id);
  }

  return {
    ok: true,
    status: 201,
    camp,
    assigned_blood_bank: assignedBloodBank
      ? {
          id: assignedBloodBank.id,
          name: assignedBloodBank.name,
          address: assignedBloodBank.address,
          contact_person: assignedBloodBank.contact_person,
          contact_phone: assignedBloodBank.contact_phone,
          email: assignedBloodBank.email,
        }
      : null,
  };
}

async function getOrganiserCampProposals({ organiser_email }) {
  const normalizedEmail = String(organiser_email || "").trim();

  if (!normalizedEmail) {
    return { ok: false, status: 400, error: "organiser_email is required" };
  }

  const camps = await BloodCamp.getCampProposalsByOrganiserEmail(normalizedEmail);

  return {
    ok: true,
    status: 200,
    camps,
  };
}

async function reviewCamp({ camp_id, status }) {
  if (!["approved", "rejected"].includes(status)) {
    return { ok: false, status: 400, error: "Invalid status. Must be 'approved' or 'rejected'" };
  }

  const camp = await BloodCamp.getCampById(camp_id);
  if (!camp) {
    return { ok: false, status: 404, error: "Camp not found" };
  }

  const updatedCamp = await BloodCamp.updateCampStatus(camp_id, status);

  try {
    // Notify the organiser asynchronously
    sendCampStatusEmail({
      to: updatedCamp.organiser_email,
      campName: updatedCamp.name,
      status: updatedCamp.approval_status,
    }).catch(err => console.error("Failed to send camp status email:", err));
  } catch (err) {
    console.error("Email setup error:", err);
  }

  return {
    ok: true,
    status: 200,
    camp: updatedCamp,
  };
}

async function searchCamps({ lon, lat, radius_meters = 10000, start_date, end_date }) {
  if (
    lon === undefined ||
    lat === undefined ||
    Number.isNaN(Number(lon)) ||
    Number.isNaN(Number(lat))
  ) {
    return { ok: false, status: 400, error: "Valid lon and lat are required to search nearby camps" };
  }

  const camps = await BloodCamp.getApprovedCampsWithinRadius(
    Number(lon),
    Number(lat),
    Number(radius_meters),
    start_date,
    end_date
  );

  return {
    ok: true,
    status: 200,
    camps,
  };
}

async function getAssignedCampProposals({ blood_bank_id }) {
  const normalizedId = Number(blood_bank_id);
  if (!Number.isInteger(normalizedId) || normalizedId <= 0) {
    return { ok: false, status: 400, error: "Invalid blood bank id" };
  }

  const bloodBank = await BloodBank.getBloodBankById(normalizedId);
  if (!bloodBank) {
    return { ok: false, status: 404, error: "Blood bank not found" };
  }

  const camps = await BloodCamp.getAssignedCampProposalsByBloodBankId(normalizedId);

  return {
    ok: true,
    status: 200,
    camps,
  };
}

async function reviewCampByBloodBank({ camp_id, blood_bank_id, status }) {
  const normalizedCampId = Number(camp_id);
  const normalizedBloodBankId = Number(blood_bank_id);
  const normalizedStatus = String(status || "").trim().toLowerCase();

  if (!Number.isInteger(normalizedCampId) || normalizedCampId <= 0) {
    return { ok: false, status: 400, error: "Invalid camp id" };
  }

  if (!Number.isInteger(normalizedBloodBankId) || normalizedBloodBankId <= 0) {
    return { ok: false, status: 400, error: "Invalid blood bank id" };
  }

  if (!["approved", "rejected"].includes(normalizedStatus)) {
    return { ok: false, status: 400, error: "Invalid status. Must be 'approved' or 'rejected'" };
  }

  const [camp, bloodBank] = await Promise.all([
    BloodCamp.getCampById(normalizedCampId),
    BloodBank.getBloodBankById(normalizedBloodBankId),
  ]);

  if (!camp) {
    return { ok: false, status: 404, error: "Camp not found" };
  }

  if (!bloodBank) {
    return { ok: false, status: 404, error: "Blood bank not found" };
  }

  if (Number(camp.assigned_blood_bank_id) !== normalizedBloodBankId) {
    return { ok: false, status: 403, error: "This camp proposal is not assigned to your blood bank" };
  }

  if (String(camp.approval_status || "").toLowerCase() !== "pending") {
    return { ok: false, status: 409, error: `Camp proposal already ${camp.approval_status}` };
  }

  const updatedCamp = await BloodCamp.updateCampStatus(normalizedCampId, normalizedStatus);

  try {
    sendCampReviewOutcomeEmail({
      to: updatedCamp.organiser_email,
      campName: updatedCamp.name,
      status: updatedCamp.approval_status,
      bloodBankName: bloodBank.name,
      bloodBankPhone: bloodBank.contact_phone,
      bloodBankEmail: bloodBank.email,
    }).catch((err) => console.error("Failed to send camp review outcome email:", err));
  } catch (err) {
    console.error("Camp review email setup error:", err);
  }

  return {
    ok: true,
    status: 200,
    camp: updatedCamp,
  };
}

module.exports = {
  proposeCamp,
  reviewCamp,
  searchCamps,
  getAssignedCampProposals,
  getOrganiserCampProposals,
  reviewCampByBloodBank,
};
