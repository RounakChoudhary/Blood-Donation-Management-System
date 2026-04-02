const express = require("express");
const router = express.Router();
const bloodBankAuthController = require("../controllers/bloodBankAuth.controller");
const bloodBankRoutes = require("./bloodBank.routes");

router.post("/register", bloodBankAuthController.register);
router.use("/", bloodBankRoutes);

module.exports = router;
