const express = require("express");
const router = express.Router();

const auth = require("../middleware/auth.middleware");
const bloodBankAuth = require("../middleware/bloodBankAuth.middleware");
const bloodBankController = require("../controllers/bloodBank.controller");
const bloodCampController = require("../controllers/bloodCamp.controller");

router.get("/nearby", auth, bloodBankController.getNearby);
router.get("/dashboard", bloodBankAuth, bloodBankController.getDashboard);
router.post("/inventory/adjustments", bloodBankAuth, bloodBankController.adjustInventory);
router.get("/camp-proposals", bloodBankAuth, bloodCampController.listAssignedForBloodBank);
router.post("/camp-proposals/:id/review", bloodBankAuth, bloodCampController.reviewForBloodBank);

module.exports = router;
