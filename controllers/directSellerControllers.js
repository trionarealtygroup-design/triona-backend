const DirectSeller = require("../models/DirectSeller");
const DirectSellerProperty = require("../models/DirectSellerProperty");
const User = require("../models/User");
const Notification = require("../models/Notification");

// Helper to create notifications
const createNotification = async (recipient, onModel, message) => {
    await Notification.create({ recipient, onModel, message });
};

// Get Seller Dashboard Stats
exports.getDashboardStats = async (req, res) => {
    try {
        const userId = req.user.id;
        const directSeller = await DirectSeller.findOne({ user: userId });

        if (!directSeller) {
            return res.status(404).json({ message: "Direct Seller profile not found" });
        }

        const totalProperties = await DirectSellerProperty.countDocuments({ seller: directSeller._id });
        const pendingProperties = await DirectSellerProperty.countDocuments({ seller: directSeller._id, status: "pending" });
        const approvedProperties = await DirectSellerProperty.countDocuments({ seller: directSeller._id, status: "approved" });
        const rejectedProperties = await DirectSellerProperty.countDocuments({ seller: directSeller._id, status: "rejected" });
        const soldProperties = await DirectSellerProperty.countDocuments({ seller: directSeller._id, status: "sold" });

        res.json({
            totalProperties,
            pendingProperties,
            approvedProperties,
            rejectedProperties,
            soldProperties,
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Failed to fetch direct seller dashboard stats" });
    }
};

// Submit New Property for Direct Seller
exports.submitProperty = async (req, res) => {
    try {
        const userId = req.user.id;
        const { title, description, location, price } = req.body;
        const images = req.files ? req.files.map(file => `/uploads/properties/${file.filename}`) : [];

        const directSeller = await DirectSeller.findOne({ user: userId });
        if (!directSeller) {
            return res.status(404).json({ message: "Direct Seller profile not found" });
        }

        const newProperty = await DirectSellerProperty.create({
            seller: directSeller._id,
            title,
            description,
            location,
            price,
            images,
            status: "pending",
        });

        // Notify admin about new pending property (Admin notification mechanism needs to be generalized)
        // For now, we'll log it or assume admin polls for pending items.
        // await createNotification(adminUserId, "Admin", `New property submitted by direct seller: ${title}`);

        res.status(201).json({ message: "Property submitted successfully, awaiting admin approval", property: newProperty });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Failed to submit property" });
    }
};

// Get Direct Seller's Properties
exports.getSellerProperties = async (req, res) => {
    try {
        const userId = req.user.id;
        const directSeller = await DirectSeller.findOne({ user: userId });

        if (!directSeller) {
            return res.status(404).json({ message: "Direct Seller profile not found" });
        }

        const properties = await DirectSellerProperty.find({ seller: directSeller._id }).sort({ createdAt: -1 });
        res.json(properties);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Failed to fetch direct seller properties" });
    }
};

// Get Notifications for Direct Seller (User role)
exports.getSellerNotifications = async (req, res) => {
    try {
        const userId = req.user.id; // Direct sellers are essentially Users with role 'seller'
        const notifications = await Notification.find({ recipient: userId, onModel: "User" }).sort({ createdAt: -1 });
        res.json(notifications);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Failed to fetch seller notifications" });
    }
};

// Mark Notification as Read for Direct Seller (User role)
exports.markNotificationAsRead = async (req, res) => {
    try {
        const { id } = req.params;
        const notification = await Notification.findByIdAndUpdate(id, { read: true }, { new: true });
        if (!notification) {
            return res.status(404).json({ message: "Notification not found" });
        }
        res.json({ message: "Notification marked as read", notification });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Failed to mark notification as read" });
    }
};
