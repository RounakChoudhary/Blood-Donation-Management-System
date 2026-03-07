const express = require("express");
const router = express.Router();

const {
  verifyWhatsAppWebhook,
  receiveWhatsAppWebhook,
} = require("../controllers/webhook.controller");

router.get("/whatsapp", verifyWhatsAppWebhook);
router.post("/whatsapp", receiveWhatsAppWebhook);

module.exports = router;