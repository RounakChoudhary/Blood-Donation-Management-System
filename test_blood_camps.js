const assert = require("assert");

// Mock the database pool
const pool = require("./models/db");

pool.query = async (query, values) => {
  if (query.includes("INSERT INTO blood_camps")) {
    return {
      rows: [
        {
          id: 1,
          name: values[0],
          date: values[1],
          time: values[2],
          venue_name: values[3],
          address: values[4],
          capacity: values[7],
          organiser_name: values[8],
          organiser_phone: values[9],
          organiser_email: values[10],
          approval_status: "pending",
        }
      ]
    };
  }

  if (query.includes("SELECT * FROM blood_camps WHERE id = $1")) {
    if (values[0] === 1) {
      return { rows: [{ id: 1, name: "Test Camp", approval_status: "pending", organiser_email: "test@example.com" }] };
    }
    return { rows: [] };
  }

  if (query.includes("UPDATE blood_camps")) {
    return { rows: [{ id: values[0], approval_status: values[1], name: "Test Camp", organiser_email: "test@example.com" }] };
  }

  if (query.includes("SELECT") && query.includes("ST_DWithin")) {
    return {
      rows: [
        {
          id: 1,
          name: "Nearby Camp",
          distance_meters: 1500,
        }
      ]
    };
  }

  return { rows: [] };
};

// Import the controller
const bloodCampController = require("./controllers/bloodCamp.controller");

async function runTests() {
  console.log("Starting mock tests for Blood Camps...");

  // --- Test 1: Propose Camp ---
  const reqPropose = {
    body: {
      name: "Community Drive",
      date: "2024-12-01",
      time: "10:00 AM",
      venue_name: "Town Hall",
      address: "123 Main St",
      lon: 72.8777,
      lat: 19.0760,
      capacity: 50,
      organiser_name: "John Doe",
      organiser_phone: "9876543210",
      organiser_email: "john@example.com"
    }
  };

  const resPropose = {
    statusCode: null,
    jsonData: null,
    status(code) { this.statusCode = code; return this; },
    json(data) { this.jsonData = data; return this; }
  };

  await bloodCampController.propose(reqPropose, resPropose);
  assert.strictEqual(resPropose.statusCode, 201);
  assert.strictEqual(resPropose.jsonData.message, "Blood camp proposal submitted for review");
  assert.strictEqual(resPropose.jsonData.camp.approval_status, "pending");
  console.log(" Camp Proposal Flow works successfully.");

  // --- Test 2: Review Camp (Approve) ---
  const reqReview = {
    params: { id: 1 },
    body: { status: "approved" }
  };

  const resReview = {
    statusCode: null,
    jsonData: null,
    status(code) { this.statusCode = code; return this; },
    json(data) { this.jsonData = data; return this; }
  };

  await bloodCampController.review(reqReview, resReview);
  assert.strictEqual(resReview.statusCode, 200);
  assert.strictEqual(resReview.jsonData.message, "Blood camp approved successfully");
  assert.strictEqual(resReview.jsonData.camp.approval_status, "approved");
  console.log(" Admin Camp Approval works successfully.");

  // --- Test 3: Search Nearby Camps ---
  const reqSearch = {
    query: { lon: 72.87, lat: 19.07, radius_meters: 5000 }
  };

  const resSearch = {
    statusCode: null,
    jsonData: null,
    status(code) { this.statusCode = code; return this; },
    json(data) { this.jsonData = data; return this; }
  };

  await bloodCampController.searchNearby(reqSearch, resSearch);
  assert.strictEqual(resSearch.statusCode, 200);
  assert.strictEqual(resSearch.jsonData.camps[0].name, "Nearby Camp");
  console.log(" Donor Nearby Camp Discovery works successfully.");

  console.log("All tests passed!");
  process.exit(0);
}

runTests().catch(err => {
  console.error("Test execution failed:", err);
  process.exit(1);
});
