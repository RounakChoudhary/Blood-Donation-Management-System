const express = require("express");
const router = express.Router();
const bloodBankAuthController = require("../controllers/bloodBankAuth.controller");

router.post("/register", bloodBankAuthController.register);

module.exports = router;
