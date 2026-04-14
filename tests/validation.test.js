const assert = require("node:assert/strict");

const {
  validateEmail,
  validatePhone,
  validatePassword,
  validateRequiredText,
  validateCoordinates,
  validateDateOfBirth,
  validateBloodGroup,
  validatePositiveInteger,
} = require("../utils/validation");

function run() {
  const result = validateEmail("  donor@example.com ");
  assert.equal(result.isValid, true);
  assert.equal(result.value, "donor@example.com");
 
  {
    const result = validateEmail("invalid-email");
    assert.equal(result.isValid, false);
    assert.match(result.error, /invalid email format/i);
  }

  {
    const result = validatePhone("9876543210");
    assert.equal(result.isValid, true);
    assert.equal(result.value, "9876543210");
  }

  {
    const result = validatePhone("+91-9876543210");
    assert.equal(result.isValid, false);
  }

  assert.equal(validatePassword("Secure123").isValid, true);
  assert.equal(validatePassword("weakpass").isValid, false);
  assert.equal(validateRequiredText("  Donor Name  ", "full_name").isValid, true);
  assert.equal(validateRequiredText(" ", "address").isValid, false);

  {
    const result = validateCoordinates("28.6139", "77.2090");
    assert.equal(result.isValid, true);
    assert.equal(result.lat, 28.6139);
    assert.equal(result.lon, 77.209);
  }

  {
    const result = validateCoordinates("120", "77.2090");
    assert.equal(result.isValid, false);
    assert.match(result.error, /latitude/i);
  }

  {
    const result = validateBloodGroup(" ab+ ");
    assert.equal(result.isValid, true);
    assert.equal(result.value, "AB+");
  }

  {
    const result = validateBloodGroup("HH");
    assert.equal(result.isValid, false);
  }

  {
    const result = validateDateOfBirth("2000-01-15");
    assert.equal(result.isValid, true);
    assert.equal(result.value, "2000-01-15");
  }

  {
    const result = validateDateOfBirth("2012-01-15");
    assert.equal(result.isValid, false);
    assert.match(result.error, /age must be between/i);
  }

  assert.equal(validatePositiveInteger(5, "units").isValid, true);
  assert.equal(validatePositiveInteger("0", "units").isValid, false);
  assert.equal(validatePositiveInteger("2.5", "units").isValid, false);
}

module.exports = { run };
