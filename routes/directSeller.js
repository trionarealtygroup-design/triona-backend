const express = require("express");
const router = express.Router();
const directSellerController = require("../controllers/directSellerControllers");
const verifyToken = require("../middleware/verifyToken");
const checkRole = require("../middleware/checkRole");

// Get Direct Seller Dashboard Stats
router.get("/dashboard-stats", verifyToken, checkRole(["seller"]), directSellerController.getDashboardStats);

const upload = require("../middleware/upload");

// Submit New Property
router.post("/properties", verifyToken, checkRole(["seller"]), upload.array('images', 10), directSellerController.submitProperty);

// Get Direct Seller's Properties
router.get("/properties/all", verifyToken, checkRole(["seller"]), directSellerController.getSellerProperties);

// Get Direct Seller Notifications
router.get("/notifications", verifyToken, checkRole(["seller"]), directSellerController.getSellerNotifications);

// Mark Notification as Read for Direct Seller
router.post("/notifications/:id/read", verifyToken, checkRole(["seller"]), directSellerController.markNotificationAsRead);

module.exports = router;