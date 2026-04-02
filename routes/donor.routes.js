const express = require("express");
const router = express.Router();

const auth = require("../middleware/auth.middleware");
const {
  becomeVolunteer,
  getMyDonorProfile,
  updateAvailability,
  updateProfile,
  getDonationHistory,
} = require("../controllers/donor.controller");

router.post("/become-volunteer", auth, becomeVolunteer);
router.get("/me", auth, getMyDonorProfile);
router.patch("/availability", auth, updateAvailability);
router.patch("/profile", auth, updateProfile);
router.get("/history", auth, getDonationHistory);

module.exports = router;
