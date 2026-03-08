const express = require("express");
const router = express.Router();
const contactController = require("../controllers/contact");

// POST /api/contact
router.post("/", contactController.submitContact);

// GET /api/contact (Protected for admin - optional)
router.get("/", contactController.getAllContacts);

module.exports = router;
