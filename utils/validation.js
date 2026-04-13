// utils/validation.js
// Centralized input validation utilities for the BDMS backend.
// Provides reusable validators for common inputs like email, phone, password, etc.
// Helps prevent invalid data entry and improves security by enforcing formats early.

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const phoneRegex = /^\d{10,15}$/; // 10-15 digits, international friendly
const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[A-Za-z\d@$!%*?&]{8,}$/; // Min 8 chars, 1 upper, 1 lower, 1 number

function validateRequiredText(value, fieldName, minLength = 2) {
  if (!value || typeof value !== 'string') {
    return { isValid: false, error: `${fieldName} is required and must be a string` };
  }

  const trimmed = value.trim();
  if (trimmed.length < minLength) {
    return { isValid: false, error: `${fieldName} must be at least ${minLength} characters` };
  }

  return { isValid: true, value: trimmed };
}

function validateEmail(email) {
  if (!email || typeof email !== 'string') {
    return { isValid: false, error: 'Email is required and must be a string' };
  }
  const trimmed = email.trim();
  if (!emailRegex.test(trimmed)) {
    return { isValid: false, error: 'Invalid email format' };
  }
  return { isValid: true, value: trimmed };
}

function validatePhone(phone) {
  if (!phone || typeof phone !== 'string') {
    return { isValid: false, error: 'Phone is required and must be a string' };
  }
  const trimmed = phone.trim();
  if (!phoneRegex.test(trimmed)) {
    return { isValid: false, error: 'Phone must be 10-15 digits only' };
  }
  return { isValid: true, value: trimmed };
}

function validatePassword(password) {
  if (!password || typeof password !== 'string') {
    return { isValid: false, error: 'Password is required and must be a string' };
  }
  if (!passwordRegex.test(password)) {
    return { isValid: false, error: 'Password must be at least 8 characters with 1 uppercase, 1 lowercase, and 1 number' };
  }
  return { isValid: true, value: password };
}

function validateCoordinates(lat, lon) {
  const latNum = Number(lat);
  const lonNum = Number(lon);
  if (isNaN(latNum) || latNum < -90 || latNum > 90) {
    return { isValid: false, error: 'Latitude must be a number between -90 and 90' };
  }
  if (isNaN(lonNum) || lonNum < -180 || lonNum > 180) {
    return { isValid: false, error: 'Longitude must be a number between -180 and 180' };
  }
  return { isValid: true, lat: latNum, lon: lonNum };
}

function calculateAgeFromDate(dateValue) {
  const today = new Date();
  let age = today.getUTCFullYear() - dateValue.getUTCFullYear();
  const monthDiff = today.getUTCMonth() - dateValue.getUTCMonth();

  if (
    monthDiff < 0 ||
    (monthDiff === 0 && today.getUTCDate() < dateValue.getUTCDate())
  ) {
    age -= 1;
  }

  return age;
}

function validateDateOfBirth(dateOfBirth, minAge = 18, maxAge = 65) {
  if (!dateOfBirth || typeof dateOfBirth !== 'string') {
    return { isValid: false, error: 'date_of_birth is required and must be a string' };
  }

  const parsed = new Date(`${dateOfBirth}T00:00:00.000Z`);
  if (Number.isNaN(parsed.getTime())) {
    return { isValid: false, error: 'date_of_birth must be a valid date' };
  }

  const age = calculateAgeFromDate(parsed);
  if (age < minAge || age > maxAge) {
    return { isValid: false, error: `Age must be between ${minAge} and ${maxAge}` };
  }

  return {
    isValid: true,
    value: parsed.toISOString().slice(0, 10),
    age,
  };
}

function validateBloodGroup(bloodGroup) {
  const validGroups = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
  if (!bloodGroup || typeof bloodGroup !== 'string') {
    return { isValid: false, error: 'Blood group is required and must be a string' };
  }
  const normalized = bloodGroup.trim().toUpperCase();
  if (!validGroups.includes(normalized)) {
    return { isValid: false, error: 'Invalid blood group. Must be one of: A+, A-, B+, B-, AB+, AB-, O+, O-' };
  }
  return { isValid: true, value: normalized };
}

function validatePositiveInteger(value, fieldName) {
  const num = Number(value);
  if (!Number.isInteger(num) || num <= 0) {
    return { isValid: false, error: `${fieldName} must be a positive integer` };
  }
  return { isValid: true, value: num };
}

module.exports = {
  validateEmail,
  validatePhone,
  validatePassword,
  validateRequiredText,
  validateCoordinates,
  validateDateOfBirth,
  validateBloodGroup,
  validatePositiveInteger,
};
