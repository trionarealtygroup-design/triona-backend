const express = require("express");
const router = express.Router();
const advisorController = require("../controllers/advisorControllers");
const verifyToken = require("../middleware/verifyToken");
const checkRole = require("../middleware/checkRole");
const upload = require("../middleware/upload"); // Assuming upload middleware exists
const adminController = require("../controllers/admin");

// Admin Route to get ALL leads (used by AdminLeads.jsx)
router.get("/all", verifyToken, checkRole(["admin"]), adminController.getAllAdvisorLeads);

// Submit Sell Lead (Advisor)
// Using array('propertyImages', 5) if formData is used, or just parsing JSON in controller if base64
// The controller update will handle both, but let's assume JSON for now as per frontend analysis
router.post("/sell", verifyToken, checkRole(["advisor"]), advisorController.submitNewLead);

// Submit Buy Lead (Advisor)
router.post("/buy", verifyToken, checkRole(["advisor"]), advisorController.submitNewLead);

// Get my leads (Advisor)
router.get("/my", verifyToken, checkRole(["advisor"]), advisorController.getAdvisorLeads);

module.exports = router;
