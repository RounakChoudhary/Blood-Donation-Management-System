const Donor = require("../models/donor.model");

const MIN_AGE = 18;
const MAX_AGE = 65;
const MIN_BMI = 18.5;
const MAX_BMI = 30;
const DEFAULT_COOLDOWN_DAYS = 120;

function validateAge(age) {
  if (age === undefined || age === null || Number.isNaN(Number(age))) {
    return "Age is required";
  }

  const numAge = Number(age);

  if (numAge < MIN_AGE || numAge > MAX_AGE) {
    return `Age must be between ${MIN_AGE} and ${MAX_AGE}`;
  }

  return null;
}

function validateBMI(bmi) {
  if (bmi === undefined || bmi === null || Number.isNaN(Number(bmi))) {
    return "BMI is required";
  }

  const numBMI = Number(bmi);

  if (numBMI < MIN_BMI || numBMI > MAX_BMI) {
    return `BMI must be between ${MIN_BMI} and ${MAX_BMI}`;
  }

  return null;
}

function normalizeBloodGroup(blood_group) {
  if (!blood_group || typeof blood_group !== "string") {
    return null;
  }

  return blood_group.trim().toUpperCase();
}

function validateBloodGroup(blood_group) {
  const allowed = new Set([
    "A+",
    "A-",
    "B+",
    "B-",
    "AB+",
    "AB-",
    "O+",
    "O-",
  ]);

  const normalized = normalizeBloodGroup(blood_group);

  if (!normalized || !allowed.has(normalized)) {
    return "Invalid blood group";
  }

  return null;
}

function normalizeDateInput(value) {
  if (!value) return null;

  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return null;

  return d.toISOString().slice(0, 10);
}

function addDays(dateStr, days) {
  const d = new Date(dateStr);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

function calculateDeferredUntil(last_donation_date) {
  if (!last_donation_date) return null;
  return addDays(last_donation_date, DEFAULT_COOLDOWN_DAYS);
}

function getCooldownStatus(last_donation_date, deferred_until) {
  if (!last_donation_date || !deferred_until) {
    return {
      eligible_for_notifications: true,
      cooldown_active: false,
      days_remaining: 0,
    };
  }

  const today = new Date();
  const deferred = new Date(deferred_until);

  const ms = deferred.getTime() - today.getTime();
  const daysRemaining = Math.max(0, Math.ceil(ms / (1000 * 60 * 60 * 24)));

  if (daysRemaining > 0) {
    return {
      eligible_for_notifications: false,
      cooldown_active: true,
      days_remaining: daysRemaining,
    };
  }

  return {
    eligible_for_notifications: true,
    cooldown_active: false,
    days_remaining: 0,
  };
}

async function becomeVolunteer({ user_id, blood_group, age, bmi, last_donated_date }) {
  const ageError = validateAge(age);
  if (ageError) {
    return { ok: false, status: 400, error: ageError };
  }

  const bmiError = validateBMI(bmi);
  if (bmiError) {
    return { ok: false, status: 400, error: bmiError };
  }

  const bloodGroupError = validateBloodGroup(blood_group);
  if (bloodGroupError) {
    return { ok: false, status: 400, error: bloodGroupError };
  }

  const existing = await Donor.getDonorByUserId(user_id);
  if (existing) {
    return { ok: false, status: 409, error: "User already has a donor profile" };
  }

  const normalizedDonationDate = normalizeDateInput(last_donated_date);
  if (last_donated_date && !normalizedDonationDate) {
    return { ok: false, status: 400, error: "Invalid last_donated_date" };
  }

  const deferred_until = calculateDeferredUntil(normalizedDonationDate);

  const donor = await Donor.createDonor({
    user_id,
    blood_group: normalizeBloodGroup(blood_group),
    last_donation_date: normalizedDonationDate,
    deferred_until,
  });

  return {
    ok: true,
    status: 201,
    donor: {
      ...donor,
      ...getCooldownStatus(donor.last_donation_date, donor.deferred_until),
    },
  };
}

async function getMyDonorProfile(user_id) {
  const donor = await Donor.getDonorByUserId(user_id);
  if (!donor) {
    return { ok: false, status: 404, error: "Donor profile not found" };
  }

  return {
    ok: true,
    status: 200,
    donor: {
      ...donor,
      ...getCooldownStatus(donor.last_donation_date, donor.deferred_until),
    },
  };
}

async function setAvailability(user_id, availability_status) {
  const allowed = new Set(["available", "paused", "busy"]);

  if (!allowed.has(availability_status)) {
    return { ok: false, status: 400, error: "Invalid availability_status" };
  }

  const donor = await Donor.updateAvailabilityByUserId({
    user_id,
    availability_status,
  });

  if (!donor) {
    return { ok: false, status: 404, error: "Donor profile not found" };
  }

  return {
    ok: true,
    status: 200,
    donor: {
      ...donor,
      ...getCooldownStatus(donor.last_donation_date, donor.deferred_until),
    },
  };
}

module.exports = {
  becomeVolunteer,
  getMyDonorProfile,
  setAvailability,
  getCooldownStatus,
};