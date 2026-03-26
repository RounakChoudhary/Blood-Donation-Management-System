const express = require("express");
const router = express.Router();

const authMiddleware = require("../middleware/auth.middleware");
const adminMiddleware = require("../middleware/admin.middleware");
const adminController = require("../controllers/admin.controller");

// Apply auth and admin middleware to all routes in this file
router.use(authMiddleware);
router.use(adminMiddleware);

// Dashboard Stats
router.get("/stats", adminController.getAdminStats);

// Users
router.get("/users", adminController.getAllUsers);
router.patch("/users/:id/role", adminController.updateUserRole);

// Hospitals (RESTful PATCH for targeted status updates)
router.get("/hospitals", adminController.getAllHospitals);
router.patch("/hospitals/:id/approve", adminController.approveHospital);
router.patch("/hospitals/:id/reject", adminController.rejectHospital);

// Blood Banks
router.get("/blood-banks", adminController.getAllBloodBanks);
router.patch("/blood-banks/:id/verify", adminController.verifyBloodBank);

// Blood Requests
router.get("/blood-requests", adminController.getAllBloodRequests);

module.exports = router;
