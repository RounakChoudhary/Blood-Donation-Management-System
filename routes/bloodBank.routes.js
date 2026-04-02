const express = require("express");
const router = express.Router();

const auth = require("../middleware/auth.middleware");
const hospitalAuth = require("../middleware/hospitalAuth.middleware");
const bloodBankController = require("../controllers/bloodBank.controller");

router.get("/nearby", auth, bloodBankController.getNearby);
router.post("/regular-requests", hospitalAuth, bloodBankController.createRegularRequest);

module.exports = router;
