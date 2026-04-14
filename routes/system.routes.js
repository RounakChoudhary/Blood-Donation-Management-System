const express = require("express");

const router = express.Router();
const systemController = require("../controllers/system.controller");

router.get("/health", systemController.health);
router.get("/ready", systemController.readiness);

module.exports = router;
