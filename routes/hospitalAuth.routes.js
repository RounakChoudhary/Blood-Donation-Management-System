const express = require("express");
const router = express.Router();

const auth = require("../middleware/auth.middleware");
const requireRole = require("../middleware/requireRole");
const {
  register,
  listPending,
  verify,
  setupAuth,
  login,
} = require("../controllers/hospitalAuth.controller");

router.post("/register", register);
router.post("/login", login);
router.get("/pending", auth, requireRole("admin"), listPending);
router.post("/:id/verify", auth, requireRole("admin"), verify);
router.post("/:id/setup-auth", auth, requireRole("admin"), setupAuth);

module.exports = router;
