const express = require("express");
const router = express.Router();
const advisorController = require("../controllers/advisorControllers");
const verifyToken = require("../middleware/verifyToken");
const checkRole = require("../middleware/checkRole");
const upload = require("../middleware/upload");

// Get Advisor Dashboard Stats
router.get("/dashboard-stats", verifyToken, checkRole(["advisor"]), advisorController.getDashboardStats);

// Get Personal Details
router.get("/personal", verifyToken, checkRole(["advisor"]), advisorController.getPersonalDetails);

// Update Personal Details (except email)
router.put("/personal", verifyToken, checkRole(["advisor"]), advisorController.updatePersonalDetails);

// Get Bank Details
router.get("/bank", verifyToken, checkRole(["advisor"]), advisorController.getBankDetails);

// Update Bank Details
router.put("/bank", verifyToken, checkRole(["advisor"]), upload.single("passbookPhoto"), advisorController.updateBankDetails);

// Change Password
router.post("/change-password", verifyToken, checkRole(["advisor"]), advisorController.changePassword);

// Submit New Lead
router.post("/leads", verifyToken, checkRole(["advisor"]), upload.array("images", 4), advisorController.submitNewLead);

// Get Advisor's All Leads
router.get("/leads/all", verifyToken, checkRole(["advisor"]), advisorController.getAdvisorLeads);

// Get Advisor's Seller Leads
router.get("/leads/seller", verifyToken, checkRole(["advisor"]), advisorController.getAdvisorSellerLeads);

// Get Advisor's Buyer Leads
router.get("/leads/buyer", verifyToken, checkRole(["advisor"]), advisorController.getAdvisorBuyerLeads);

// Get Advisor Notifications
router.get("/notifications", verifyToken, checkRole(["advisor"]), advisorController.getAdvisorNotifications);

// Mark Notification as Read
router.post("/notifications/:id/read", verifyToken, checkRole(["advisor"]), advisorController.markNotificationAsRead);

// Get Advisor Commissions
router.get("/commissions", verifyToken, checkRole(["advisor"]), advisorController.getAdvisorCommissions);

module.exports = router;