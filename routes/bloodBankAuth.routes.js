const express = require("express");
const router = express.Router();

const auth = require("../middleware/auth.middleware");
const requireRole = require("../middleware/requireRole");
const bloodBankAuthController = require("../controllers/bloodBankAuth.controller");
const bloodBankRoutes = require("./bloodBank.routes");

router.post("/register", bloodBankAuthController.register);
router.post("/login", bloodBankAuthController.login);
router.post("/:id/setup-auth", auth, requireRole("admin"), bloodBankAuthController.setupAuth);

router.use("/", bloodBankRoutes);

module.exports = router;
