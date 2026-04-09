const express = require("express");
const router = express.Router();

const auth = require("../middleware/auth.middleware");
const bloodBankAuth = require("../middleware/bloodBankAuth.middleware");
const hospitalAuth = require("../middleware/hospitalAuth.middleware");
const bloodBankController = require("../controllers/bloodBank.controller");

router.get("/nearby", auth, bloodBankController.getNearby);
router.get("/dashboard", bloodBankAuth, bloodBankController.getDashboard);
router.post("/inventory/adjustments", bloodBankAuth, bloodBankController.adjustInventory);
router.post("/regular-requests", hospitalAuth, bloodBankController.createRegularRequest);

module.exports = router;
