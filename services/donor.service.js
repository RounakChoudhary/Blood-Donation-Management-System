const Donor = require("../models/donor.model");
const User = require("../models/user.model");
const DonationRecord = require("../models/donationRecord.model");

const MIN_AGE = 18;
const MAX_AGE = 65;
const MIN_BMI = 18.5;
const MAX_BMI = 30;
const COOLDOWN_DAYS = 120;
const ALLOWED_BLOOD_GROUPS = new Set([
  "A+",
  "A-",
  "B+",
  "B-",
  "AB+",
  "AB-",
  "O+",
  "O-",
]);
const ALLOWED_AVAILABILITY = new Set(["available", "paused", "busy", "unavailable"]);

function validateAge(age) {
  const numAge = Number(age);
  if (age === undefined || age === null || Number.isNaN(numAge)) return "Age is required";
  if (numAge < MIN_AGE || numAge > MAX_AGE) {
    return `Age must be between ${MIN_AGE} and ${MAX_AGE}`;
  }
  return null;
}

function validateBMI(bmi) {
  const numBMI = Number(bmi);
  if (bmi === undefined || bmi === null || Number.isNaN(numBMI)) return "BMI is required";
  if (numBMI < MIN_BMI || numBMI > MAX_BMI) {
    return `BMI must be between ${MIN_BMI} and ${MAX_BMI}`;
  }
  return null;
}

function normalizeBloodGroup(blood_group) {
  if (typeof blood_group !== "string") return null;
  return blood_group.trim().toUpperCase();
}

function validateBloodGroup(blood_group) {
  const normalized = normalizeBloodGroup(blood_group);
  if (!normalized || !ALLOWED_BLOOD_GROUPS.has(normalized)) return "Invalid blood group";
  return null;
}

function normalizeDateInput(value) {
  if (!value) return null;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return null;
  return d.toISOString().slice(0, 10);
}

function isNonEmptyString(value) {
  return typeof value === "string" && value.trim().length > 0;
}

function calculateDeferredUntil(last_donation_date) {
  if (!last_donation_date) return null;
  const d = new Date(last_donation_date);
  d.setUTCDate(d.getUTCDate() + COOLDOWN_DAYS);
  return d.toISOString().slice(0, 10);
}

function getCooldownStatus(last_donation_date, deferred_until) {
  if (!last_donation_date || !deferred_until) {
    return {
      eligible_for_notifications: true,
      cooldown_active: false,
      days_remaining: 0,
    };
  }

  const ms = new Date(deferred_until).getTime() - Date.now();
  const daysRemaining = Math.max(0, Math.ceil(ms / 86400000));

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

function withCooldownStatus(donor) {
  return {
    ...donor,
    ...getCooldownStatus(donor.last_donation_date, donor.deferred_until),
  };
}

function mergeProfile(user, donor) {
  return withCooldownStatus({
    ...donor,
    full_name: user.full_name,
    email: user.email,
    phone: user.phone,
    role: user.role,
    email_verified: user.email_verified,
    is_active: user.is_active,
    location_updated_at: user.location_updated_at,
  });
}

async function becomeVolunteer({ user_id, blood_group, age, bmi, last_donated_date }) {
  const ageError = validateAge(age);
  if (ageError) return { ok: false, status: 400, error: ageError };

  const bmiError = validateBMI(bmi);
  if (bmiError) return { ok: false, status: 400, error: bmiError };

  const bloodGroupError = validateBloodGroup(blood_group);
  if (bloodGroupError) return { ok: false, status: 400, error: bloodGroupError };

  const existing = await Donor.getDonorByUserId(user_id);
  if (existing) return { ok: false, status: 409, error: "User already has a donor profile" };

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
    donor: withCooldownStatus(donor),
  };
}

async function getMyDonorProfile(user_id) {
  const donor = await Donor.getDonorByUserId(user_id);
  if (!donor) return { ok: false, status: 404, error: "Donor profile not found" };
  const user = await User.getUserById(user_id);
  if (!user) return { ok: false, status: 404, error: "User not found" };

  return {
    ok: true,
    status: 200,
    donor: mergeProfile(user, donor),
  };
}

async function setAvailability(user_id, availability_status) {
  if (!ALLOWED_AVAILABILITY.has(availability_status)) {
    return { ok: false, status: 400, error: "Invalid availability_status" };
  }

  const donor = await Donor.updateAvailabilityByUserId({
    user_id,
    availability_status,
  });

  if (!donor) return { ok: false, status: 404, error: "Donor profile not found" };
  const user = await User.getUserById(user_id);
  if (!user) return { ok: false, status: 404, error: "User not found" };

  return {
    ok: true,
    status: 200,
    donor: mergeProfile(user, donor),
  };
}

async function updateMyProfile(user_id, payload = {}) {
  if ("email" in payload) {
    return { ok: false, status: 400, error: "email cannot be changed after OTP verification" };
  }

  if ("blood_group" in payload) {
    return { ok: false, status: 400, error: "blood_group cannot be changed after OTP verification" };
  }

  const donor = await Donor.getDonorByUserId(user_id);
  if (!donor) {
    return { ok: false, status: 404, error: "Donor profile not found" };
  }

  const user = await User.getUserById(user_id);
  if (!user) {
    return { ok: false, status: 404, error: "User not found" };
  }

  const nextPhone = payload.phone ?? null;
  if (nextPhone !== null) {
    if (!isNonEmptyString(nextPhone)) {
      return { ok: false, status: 400, error: "phone must be a non-empty string" };
    }

    const existingPhoneUser = await User.getUserByPhone(nextPhone);
    if (existingPhoneUser && existingPhoneUser.id !== user_id) {
      return { ok: false, status: 409, error: "phone already registered" };
    }
  }

  const nextDob = payload.date_of_birth !== undefined
    ? normalizeDateInput(payload.date_of_birth)
    : null;
  if (payload.date_of_birth !== undefined && !nextDob) {
    return { ok: false, status: 400, error: "Invalid date_of_birth" };
  }

  if (payload.availability_status !== undefined && !ALLOWED_AVAILABILITY.has(payload.availability_status)) {
    return { ok: false, status: 400, error: "Invalid availability_status" };
  }

  if (
    (payload.lon !== undefined && payload.lat === undefined) ||
    (payload.lon === undefined && payload.lat !== undefined) ||
    (payload.lon !== undefined && Number.isNaN(Number(payload.lon))) ||
    (payload.lat !== undefined && Number.isNaN(Number(payload.lat)))
  ) {
    return { ok: false, status: 400, error: "Valid lon and lat are required together" };
  }

  const updatedUser = await User.updateUserContactAndLocation({
    userId: user_id,
    phone: nextPhone,
    lon: payload.lon !== undefined ? Number(payload.lon) : undefined,
    lat: payload.lat !== undefined ? Number(payload.lat) : undefined,
  });

  const updatedDonor = await Donor.updateProfileByUserId({
    user_id,
    date_of_birth: nextDob,
    address: payload.address ?? null,
    emergency_contact_name: payload.emergency_contact_name ?? null,
    emergency_contact_phone: payload.emergency_contact_phone ?? null,
    availability_status: payload.availability_status ?? null,
  });

  return {
    ok: true,
    status: 200,
    donor: mergeProfile(updatedUser || user, updatedDonor || donor),
  };
}

async function getDonationHistory(user_id) {
  const donor = await Donor.getDonorByUserId(user_id);
  if (!donor) {
    return { ok: false, status: 404, error: "Donor profile not found" };
  }

  const donation_records = await DonationRecord.getDonationRecordsByDonorId(donor.id);

  return {
    ok: true,
    status: 200,
    donation_records,
  };
}

module.exports = {
  becomeVolunteer,
  getMyDonorProfile,
  setAvailability,
  updateMyProfile,
  getDonationHistory,
};
