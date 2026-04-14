const express = require("express");
const router = express.Router();

const hospitalAuth = require("../middleware/hospitalAuth.middleware");
const { bloodRequestLimiter } = require("../middleware/rateLimit.middleware");
const {
  createRequest,
  getRequestById,
  listMyRequests,
  rematch,
} = require("../controllers/bloodRequest.controller");

router.post("/", hospitalAuth, bloodRequestLimiter, createRequest);
router.get("/mine", hospitalAuth, listMyRequests);
router.get("/:id", hospitalAuth, getRequestById);
router.post("/:id/match", hospitalAuth, bloodRequestLimiter, rematch);

module.exports = router;
