const express = require("express");
const router = express.Router();

const auth = require("../middleware/auth.middleware");

const {
  listRequests,
  accept,
  reject,
  acceptViaToken,
  rejectViaToken,
} = require("../controllers/donorRequest.controller");

router.get("/respond/accept", acceptViaToken);
router.get("/respond/decline", rejectViaToken);
router.get("/", auth, listRequests);
router.post("/:matchId/accept", auth, accept);
router.post("/:matchId/reject", auth, reject);

module.exports = router;
