const express = require("express");
const router = express.Router();

const auth = require("../middleware/auth.middleware");

const {
  listRequests,
  accept,
  reject,
} = require("../controllers/donorRequest.controller");

router.get("/", auth, listRequests);
router.post("/:matchId/accept", auth, accept);
router.post("/:matchId/reject", auth, reject);

module.exports = router;