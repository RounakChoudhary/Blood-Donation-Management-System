const express = require("express");
const router = express.Router();

const auth = require("../middleware/auth.middleware");
const hospitalAuth = require("../middleware/hospitalAuth.middleware");
const bloodBankAuth = require("../middleware/bloodBankAuth.middleware");
const requireRole = require("../middleware/requireRole");
const apiController = require("../controllers/api.controller");
const adminController = require("../controllers/admin.controller");

router.post("/match-donors/:requestId", hospitalAuth, apiController.matchDonorsForRequest);

router.get("/notifications", auth, apiController.listNotifications);
router.patch("/notifications/:id/read", auth, apiController.markNotificationAsRead);

router.get("/requests/:id", hospitalAuth, apiController.getRequestById);
router.patch("/requests/:id/status", hospitalAuth, apiController.updateRequestStatus);

router.get("/bloodbank/inventory", bloodBankAuth, apiController.getBloodBankInventory);
router.post("/bloodbank/update", bloodBankAuth, apiController.updateBloodBankInventory);

router.get("/admin/reports", auth, requireRole("admin"), adminController.getReports);

module.exports = router;
