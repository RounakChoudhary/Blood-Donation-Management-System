const express = require("express");
const router = express.Router();

const authMiddleware = require("../middleware/auth.middleware");
const adminMiddleware = require("../middleware/admin.middleware");
const adminController = require("../controllers/admin.controller");

// Apply auth and admin middleware to all routes in this file
router.use(authMiddleware);
router.use(adminMiddleware);

// Users
router.get("/users", adminController.getAllUsers);

// Hospitals
router.get("/hospitals", adminController.getAllHospitals);
router.put("/hospitals/:id/verify", adminController.verifyHospital);

// Blood Banks
router.get("/blood-banks", adminController.getAllBloodBanks);

// Blood Requests
router.get("/blood-requests", adminController.getAllBloodRequests);

module.exports = router;
