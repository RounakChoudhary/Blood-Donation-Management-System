const express = require("express");
const router = express.Router();
const bloodCampController = require("../controllers/bloodCamp.controller");
const auth = require("../middleware/auth.middleware");
const requireRole = require("../middleware/requireRole");

// Public (Organisers): Propose a new blood donation camp
router.post("/", bloodCampController.propose);
router.get("/mine", bloodCampController.listMine);

// Admin Only: Approve or reject a camp proposal
router.post("/:id/review", auth, requireRole("admin"), bloodCampController.review);

// Public (Donors/Users): Search for approved camps in a radius
router.get("/nearby", bloodCampController.searchNearby);

module.exports = router;
