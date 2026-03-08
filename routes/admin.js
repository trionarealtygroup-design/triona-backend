const express = require("express");
const router = express.Router();
const adminController = require("../controllers/admin");
const verifyToken = require("../middleware/verifyToken");
const checkRole = require("../middleware/checkRole");

// Admin Dashboard Stats
router.get("/dashboard-stats", verifyToken, checkRole(["admin"]), adminController.getDashboardStats);

// --- Advisor Management ---
router.get("/advisors", verifyToken, checkRole(["admin"]), adminController.getAllAdvisors);
router.get("/advisors/:id", verifyToken, checkRole(["admin"]), adminController.getAdvisorDetails);
router.post("/advisors/:id/approve", verifyToken, checkRole(["admin"]), adminController.approveAdvisor);
router.post("/advisors/:id/reject", verifyToken, checkRole(["admin"]), adminController.rejectAdvisor);

// --- Property Management (Legacy - mainly for general properties) ---
router.get("/properties", verifyToken, checkRole(["admin"]), adminController.getAllProperties); // New Route for All
router.get("/properties/pending", verifyToken, checkRole(["admin"]), adminController.getPendingProperties);
router.get("/properties/approved", verifyToken, checkRole(["admin"]), adminController.getApprovedProperties);
router.get("/properties/live", verifyToken, checkRole(["admin"]), adminController.getLiveProperties);
router.get("/properties/:id", verifyToken, checkRole(["admin"]), adminController.getPropertyDetails); // New Route for Edit
router.post("/properties/:id/approve", verifyToken, checkRole(["admin"]), adminController.approveProperty);
router.post("/properties/:id/make-live", verifyToken, checkRole(["admin"]), adminController.makeLive);
router.post("/properties/:id/reject", verifyToken, checkRole(["admin"]), adminController.rejectProperty);
router.put("/properties/:id", verifyToken, checkRole(["admin"]), adminController.updateProperty);
router.get("/properties/approved", verifyToken, checkRole(["admin"]), adminController.getApprovedProperties);
router.post("/properties/:id/unpublish", verifyToken, checkRole(["admin"]), adminController.unpublishProperty);
router.put("/properties/:id/mark-sold", verifyToken, checkRole(["admin"]), adminController.markPropertyAsSold);
router.put("/properties/:id/mark-commission-paid", verifyToken, checkRole(["admin"]), adminController.markPropertyCommissionPaid);

// --- Admin Password Change ---
router.post("/change-password", verifyToken, checkRole(["admin"]), adminController.changeAdminPassword);

// --- Advisor Leads Management ---
router.get("/advisor-leads/pending", verifyToken, checkRole(["admin"]), adminController.getPendingAdvisorLeads);
router.post("/advisor-leads/:id/approve", verifyToken, checkRole(["admin"]), adminController.approveAdvisorLead);
router.post("/advisor-leads/:id/reject", verifyToken, checkRole(["admin"]), adminController.rejectAdvisorLead);
router.get("/advisor-leads/approved", verifyToken, checkRole(["admin"]), adminController.getApprovedAdvisorLeads);
router.put("/advisor-leads/:id", verifyToken, checkRole(["admin"]), adminController.editAdvisorLead);
router.post("/advisor-leads/:id/sold", verifyToken, checkRole(["admin"]), adminController.markAdvisorLeadAsSold);

// --- Direct Seller Properties Management ---
router.get("/direct-seller-properties/pending", verifyToken, checkRole(["admin"]), adminController.getPendingDirectSellerProperties);
router.post("/direct-seller-properties/:id/approve", verifyToken, checkRole(["admin"]), adminController.approveDirectSellerProperty);
router.post("/direct-seller-properties/:id/reject", verifyToken, checkRole(["admin"]), adminController.rejectDirectSellerProperty);
router.get("/direct-seller-properties/approved", verifyToken, checkRole(["admin"]), adminController.getApprovedDirectSellerProperties);
router.put("/direct-seller-properties/:id", verifyToken, checkRole(["admin"]), adminController.editDirectSellerProperty);
router.post("/direct-seller-properties/:id/sold", verifyToken, checkRole(["admin"]), adminController.markDirectSellerPropertyAsSold);

// --- Commission Management ---
router.get("/commissions", verifyToken, checkRole(["admin"]), adminController.getCommissions);
router.post("/commissions/:id/mark-paid", verifyToken, checkRole(["admin"]), adminController.markCommissionAsPaid);

// --- Direct Buyer Management ---
router.get("/direct-buyers", verifyToken, checkRole(["admin"]), adminController.getDirectBuyers);

module.exports = router;