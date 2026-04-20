const bloodBankAuthService = require("./bloodBankAuth.service");
const BloodBank = require("../models/bloodBank.model");
const BloodBankInventory = require("../models/bloodBankInventory.model");
const BloodCamp = require("../models/bloodCamp.model");
const Hospital = require("../models/hospital.model");
const { validateBloodGroup, validatePositiveInteger } = require("../utils/validation");

const BLOOD_GROUPS = ["A+", "A-", "B+", "B-", "O+", "O-", "AB+", "AB-"];
const LOW_STOCK_THRESHOLD = 5;

async function registerBloodBank(payload) {
  return bloodBankAuthService.registerBloodBank(payload);
}

function buildInventorySnapshot(rows = []) {
  const rowMap = new Map(
    rows.map((row) => [
      String(row.blood_group || "").toUpperCase(),
      {
        blood_group: String(row.blood_group || "").toUpperCase(),
        units_available: Number(row.units_available || 0),
        nearest_expiry: row.nearest_expiry || null,
      },
    ])
  );

  return BLOOD_GROUPS.map((bloodGroup) => {
    const existing = rowMap.get(bloodGroup);
    const unitsAvailable = Number(existing?.units_available || 0);

    return {
      blood_group: bloodGroup,
      units_available: unitsAvailable,
      nearest_expiry: existing?.nearest_expiry || null,
      critical: unitsAvailable < LOW_STOCK_THRESHOLD,
    };
  });
}

function normalizeAction(action) {
  const normalized = String(action || "").trim().toLowerCase();
  if (normalized === "add") return "add";
  if (normalized === "remove") return "remove";
  if (normalized === "expire") return "expire";
  return null;
}

function validateFutureOrTodayDate(value) {
  if (!value) {
    return { isValid: false, error: "expiry_date is required when adding stock" };
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return { isValid: false, error: "expiry_date must be a valid date" };
  }

  const normalized = parsed.toISOString().slice(0, 10);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  if (parsed < today) {
    return { isValid: false, error: "expiry_date cannot be in the past" };
  }

  return { isValid: true, value: normalized };
}

async function findNearbyBloodBanks({
  lon,
  lat,
  radius_meters = 10000,
  hospital_id = null,
}) {
  let resolvedLon = lon;
  let resolvedLat = lat;

  if ((resolvedLon === undefined || resolvedLat === undefined) && hospital_id !== null && hospital_id !== undefined) {
    const hospital = await Hospital.getHospitalById(Number(hospital_id));
    if (!hospital) {
      return { ok: false, status: 404, error: "Hospital not found" };
    }

    resolvedLon = hospital.lon;
    resolvedLat = hospital.lat;
  }

  if (
    resolvedLon === undefined ||
    resolvedLat === undefined ||
    Number.isNaN(Number(resolvedLon)) ||
    Number.isNaN(Number(resolvedLat))
  ) {
    return { ok: false, status: 400, error: "Valid lon and lat are required" };
  }

  const blood_banks = await BloodBank.findNearbyBloodBanks({
    lon: Number(resolvedLon),
    lat: Number(resolvedLat),
    radius_meters: Number(radius_meters) > 0 ? Number(radius_meters) : 10000,
  });

  return {
    ok: true,
    status: 200,
    blood_banks,
  };
}

async function getBloodBankDashboard({
  blood_bank_id,
  nearby_radius_meters = 10000,
  nearby_limit = 5,
}) {
  const normalizedId = Number(blood_bank_id);
  if (!Number.isInteger(normalizedId) || normalizedId <= 0) {
    return { ok: false, status: 400, error: "Invalid blood bank id" };
  }

  const bloodBank = await BloodBank.getBloodBankById(normalizedId);
  if (!bloodBank) {
    return { ok: false, status: 404, error: "Blood bank not found" };
  }

  const [inventoryRows, nearbyResult, campProposals] = await Promise.all([
    BloodBankInventory.getInventorySummaryByBloodBankId(normalizedId),
    findNearbyBloodBanks({
      lon: bloodBank.lon,
      lat: bloodBank.lat,
      radius_meters: nearby_radius_meters,
    }),
    BloodCamp.getAssignedCampProposalsByBloodBankId(normalizedId),
  ]);

  const inventory = buildInventorySnapshot(inventoryRows);
  const totalUnits = inventory.reduce((sum, item) => sum + item.units_available, 0);
  const lowStockGroups = inventory.filter((item) => item.critical).length;

  let nearby_banks = [];
  if (nearbyResult.ok) {
    const trimmedNearbyBanks = nearbyResult.blood_banks
      .filter((bank) => Number(bank.id) !== normalizedId)
      .slice(0, Number(nearby_limit) > 0 ? Number(nearby_limit) : 5);

    const nearbyIds = trimmedNearbyBanks.map((bank) => Number(bank.id));
    const nearbyInventoryRows = await BloodBankInventory.getInventorySummaryByBloodBankIds(nearbyIds);
    const nearbyInventoryMap = new Map();

    for (const row of nearbyInventoryRows) {
      const bankId = Number(row.blood_bank_id);
      const existing = nearbyInventoryMap.get(bankId) || [];
      existing.push(row);
      nearbyInventoryMap.set(bankId, existing);
    }

    nearby_banks = trimmedNearbyBanks.map((bank) => {
      const stockSummary = buildInventorySnapshot(nearbyInventoryMap.get(Number(bank.id)) || [])
        .filter((item) => item.units_available > 0)
        .slice(0, 3);

      return {
        id: bank.id,
        name: bank.name,
        address: bank.address,
        contact_person: bank.contact_person,
        contact_phone: bank.contact_phone,
        distance_meters: Number(bank.distance_meters || 0),
        stock_summary: stockSummary,
      };
    });
  }

  return {
    ok: true,
    status: 200,
    summary: {
      total_units: totalUnits,
      low_stock_groups: lowStockGroups,
      nearby_banks: nearby_banks.length,
      pending_camp_proposals: campProposals.filter((camp) => String(camp.approval_status || "").toLowerCase() === "pending").length,
    },
    blood_bank: {
      id: bloodBank.id,
      name: bloodBank.name,
      address: bloodBank.address,
      email: bloodBank.email,
      contact_person: bloodBank.contact_person,
      contact_phone: bloodBank.contact_phone,
      lon: Number(bloodBank.lon),
      lat: Number(bloodBank.lat),
    },
    inventory,
    nearby_banks,
    camp_proposals: campProposals,
  };
}

async function adjustInventory({
  blood_bank_id,
  blood_group,
  action,
  quantity,
  expiry_date,
}) {
  const normalizedId = Number(blood_bank_id);
  if (!Number.isInteger(normalizedId) || normalizedId <= 0) {
    return { ok: false, status: 400, error: "Invalid blood bank id" };
  }

  const bloodBank = await BloodBank.getBloodBankById(normalizedId);
  if (!bloodBank) {
    return { ok: false, status: 404, error: "Blood bank not found" };
  }

  const bloodGroupValidation = validateBloodGroup(blood_group);
  if (!bloodGroupValidation.isValid) {
    return { ok: false, status: 400, error: bloodGroupValidation.error };
  }

  const quantityValidation = validatePositiveInteger(quantity, "quantity");
  if (!quantityValidation.isValid) {
    return { ok: false, status: 400, error: quantityValidation.error };
  }

  const normalizedAction = normalizeAction(action);
  if (!normalizedAction) {
    return { ok: false, status: 400, error: "action must be add, remove, or expire" };
  }

  if (normalizedAction === "add") {
    const expiryValidation = validateFutureOrTodayDate(expiry_date);
    if (!expiryValidation.isValid) {
      return { ok: false, status: 400, error: expiryValidation.error };
    }

    await BloodBankInventory.addInventoryBatch({
      blood_bank_id: normalizedId,
      blood_group: bloodGroupValidation.value,
      units_available: quantityValidation.value,
      expiry_date: expiryValidation.value,
    });
  } else {
    const consumeResult = await BloodBankInventory.consumeInventoryUnits({
      blood_bank_id: normalizedId,
      blood_group: bloodGroupValidation.value,
      units: quantityValidation.value,
    });

    if (!consumeResult.ok) {
      return {
        ok: false,
        status: 409,
        error: `Only ${consumeResult.available_units} unit(s) available for ${bloodGroupValidation.value}`,
      };
    }
  }

  const inventoryRows = await BloodBankInventory.getInventorySummaryByBloodBankId(normalizedId);
  const inventory = buildInventorySnapshot(inventoryRows);

  const actionMessages = {
    add: "Inventory updated successfully",
    remove: "Units removed successfully",
    expire: "Expired units cleared successfully",
  };

  return {
    ok: true,
    status: 200,
    message: actionMessages[normalizedAction],
    inventory,
  };
}

module.exports = {
  registerBloodBank,
  findNearbyBloodBanks,
  getBloodBankDashboard,
  adjustInventory,
};
