const assert = require("node:assert/strict");

const { allowedDonorGroupsRBC } = require("../utils/bloodCompat");

function run() {
  assert.deepEqual(allowedDonorGroupsRBC("O-"), ["O-"]);

  assert.deepEqual(allowedDonorGroupsRBC("AB+"), [
    "AB+",
    "AB-",
    "A+",
    "A-",
    "B+",
    "B-",
    "O+",
    "O-",
  ]);

  assert.deepEqual(allowedDonorGroupsRBC("A+"), ["A+", "A-", "O+", "O-"]);

  assert.deepEqual(allowedDonorGroupsRBC("XX"), []);
}

module.exports = { run };
