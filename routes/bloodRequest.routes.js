const express = require("express");
const router = express.Router();

const hospitalAuth = require("../middleware/hospitalAuth.middleware");
const {
  createRequest,
  getRequestById,
  listMyRequests,
  rematch,
} = require("../controllers/bloodRequest.controller");

router.post("/", hospitalAuth, createRequest);
router.get("/mine", hospitalAuth, listMyRequests);
router.get("/:id", hospitalAuth, getRequestById);
router.post("/:id/match", hospitalAuth, rematch);

module.exports = router;