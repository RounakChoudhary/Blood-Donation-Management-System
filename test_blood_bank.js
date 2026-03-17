const assert = require("assert");

// Mock the database pool
const pool = require("./models/db");
pool.query = async (query, values) => {
  if (query.includes("SELECT") && query.includes("license_number")) {
    // Simulate no existing license
    return { rows: [] };
  }
  
  if (query.includes("INSERT INTO blood_banks")) {
    // Simulate successful insertion
    return {
      rows: [
        {
          id: 1,
          name: values[0],
          license_number: values[1],
          address: values[2],
          contact_person: values[5],
          contact_phone: values[6],
          operating_hours: values[7],
          facilities: values[8],
          onboarding_status: "pending",
          created_at: new Date().toISOString()
        }
      ]
    };
  }

  return { rows: [] };
};

// Import the controller
const bloodBankAuthController = require("./controllers/bloodBankAuth.controller");

async function runTests() {
  console.log("Starting mock tests for Blood Bank Registration...");

  const req = {
    body: {
      name: "City Blood Bank",
      license_number: "LIC-123456",
      address: "123 Main St",
      lon: 72.8777,
      lat: 19.0760,
      contact_person: "Dr. Smith",
      contact_phone: "9876543210",
      operating_hours: "24/7",
      facilities: "WBC, RBC separation"
    }
  };

  const res = {
    statusCode: null,
    jsonData: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(data) {
      this.jsonData = data;
      return this;
    }
  };

  await bloodBankAuthController.register(req, res);

  try {
    assert.strictEqual(res.statusCode, 201, "Status code should be 201 Created");
    assert.strictEqual(res.jsonData.message, "Blood bank registration submitted for approval");
    assert.strictEqual(res.jsonData.bloodBank.onboarding_status, "pending");
    assert.strictEqual(res.jsonData.bloodBank.name, "City Blood Bank");
    console.log("✅ Main registration flow works successfully.");
  } catch (err) {
    console.error("❌ Test failed:", err.message);
    process.exit(1);
  }

  // Test missing fields
  const reqInvalid = { body: { name: "Missing fields bank" } };
  const resInvalid = {
    statusCode: null,
    jsonData: null,
    status(code) { this.statusCode = code; return this; },
    json(data) { this.jsonData = data; return this; }
  };

  await bloodBankAuthController.register(reqInvalid, resInvalid);

  try {
    assert.strictEqual(resInvalid.statusCode, 400);
    assert.strictEqual(resInvalid.jsonData.error, "Missing required fields");
    console.log("✅ Missing required fields validation works.");
  } catch (err) {
    console.error("❌ Test failed:", err.message);
    process.exit(1);
  }

  console.log("All tests passed!");
  process.exit(0);
}

runTests();
