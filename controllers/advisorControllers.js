const Advisor = require("../models/Advisor");
const AdvisorBankDetails = require("../models/AdvisorBankDetails");
const AdvisorLead = require("../models/AdvisorLead");
const Property = require("../models/Property");
const Commission = require("../models/Commission");
const Notification = require("../models/Notification");
const User = require("../models/User"); // Assuming User model is needed for password change
const bcrypt = require("bcryptjs");

// Helper to create notifications
const createNotification = async (recipient, onModel, message) => {
    await Notification.create({ recipient, onModel, message });
};

// Get Personal Details
exports.getPersonalDetails = async (req, res) => {
    try {
        const advisor = await Advisor.findById(req.user.id).select("-password");
        if (!advisor) {
            return res.status(200).json({});
        }
        res.json(advisor);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Error fetching personal details" });
    }
};

// Update Personal Details (except email)
exports.updatePersonalDetails = async (req, res) => {
    try {
        const { fullName, mobile, whatsapp, city, address, profilePhoto } = req.body; // Added profilePhoto
        const advisor = await Advisor.findByIdAndUpdate(
            req.user.id,
            { fullName, mobile, whatsapp, city, address, profilePhoto },
            { new: true }
        ).select("-password");
        res.json({ message: "Personal details updated", advisor });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Error updating personal details" });
    }
};

// Get Bank Details
exports.getBankDetails = async (req, res) => {
    try {
        const bankDetails = await AdvisorBankDetails.findOne({ advisor: req.user.id });
        if (!bankDetails) {
            return res.status(200).json({});
        }
        res.json(bankDetails);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Error fetching bank details" });
    }
};

// Update Bank Details
exports.updateBankDetails = async (req, res) => {
    try {
        const { bankName, accountNumber, ifscCode, branchAddress, panCard, aadhaarCard } = req.body;

        const updateData = {
            advisor: req.user.id,
            bankName,
            accountNumber,
            ifscCode,
            branchAddress,
            panCard,
            aadhaarCard
        };

        if (req.file) {
            updateData.passbookPhoto = req.file.path.replace(/\\/g, "/");
        }

        const bankDetails = await AdvisorBankDetails.findOneAndUpdate(
            { advisor: req.user.id },
            { $set: updateData },
            { new: true, upsert: true, setDefaultsOnInsert: true }
        );

        res.json({ message: "Bank details updated successfully", bankDetails });
    } catch (error) {
        console.error("Bank Update Error:", error);
        res.status(500).json({ message: "Error updating bank details" });
    }
};

// Change Password (for Advisor)
exports.changePassword = async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;
        const advisorId = req.user.id;

        if (!currentPassword || !newPassword) {
            return res.status(400).json({ message: "Current and new password required" });
        }

        const advisor = await Advisor.findById(advisorId);
        if (!advisor) {
            return res.status(404).json({ message: "Advisor not found" });
        }

        const isMatch = await bcrypt.compare(currentPassword, advisor.password);
        if (!isMatch) {
            return res.status(400).json({ message: "Current password is incorrect" });
        }

        const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
        if (!passwordRegex.test(newPassword)) {
            return res.status(400).json({
                message: "Password must be at least 8 characters long and contain uppercase, lowercase, number, and special character"
            });
        }

        const hashedPassword = await bcrypt.hash(newPassword, 10);
        advisor.password = hashedPassword;
        await advisor.save();

        // Also update the User model if the advisor is linked to a User entry for login consistency
        const user = await User.findOne({ email: advisor.email });
        if (user) {
            user.password = hashedPassword;
            await user.save();
        }

        res.json({ message: "Password changed successfully" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Failed to change password" });
    }
};

// Get Advisor Dashboard Stats
exports.getDashboardStats = async (req, res) => {
    try {
        const advisorId = req.user.id;

        const totalLeads = await AdvisorLead.countDocuments({ advisor: advisorId });
        const pendingLeads = await AdvisorLead.countDocuments({ advisor: advisorId, status: "pending" });
        const approvedLeads = await AdvisorLead.countDocuments({ advisor: advisorId, status: "approved" });
        const soldProperties = await AdvisorLead.countDocuments({ advisor: advisorId, status: "sold", leadType: "seller" });

        const commissionEarnedResult = await Commission.aggregate([
            { $match: { advisor: advisorId, status: "paid" } },
            { $group: { _id: null, total: { $sum: "$commissionAmount" } } }
        ]);
        const commissionPendingResult = await Commission.aggregate([
            { $match: { advisor: advisorId, status: "pending" } },
            { $group: { _id: null, total: { $sum: "$commissionAmount" } } }
        ]);

        const commissionEarned = commissionEarnedResult[0]?.total || 0;
        const commissionPending = commissionPendingResult[0]?.total || 0;

        res.json({
            totalLeads,
            pendingLeads,
            approvedLeads,
            soldProperties,
            commissionEarned,
            commissionPending,
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Failed to fetch advisor dashboard stats" });
    }
};

// Submit New Lead
// Submit New Lead
exports.submitNewLead = async (req, res) => {
    try {
        console.log("SubmitNewLead Body:", JSON.stringify(req.body, null, 2));
        const advisorId = req.user.id;

        // Determine lead type from URL if not in body
        let leadType = req.body.leadType;
        if (!leadType) {
            if (req.originalUrl.includes("/sell")) leadType = "sell";
            else if (req.originalUrl.includes("/buy")) leadType = "buy";
        }

        // Map to model enum
        if (leadType === "sell") leadType = "seller";
        if (leadType === "buy") leadType = "buyer";

        const {
            ownerName, ownerMobile, propertyType, location, expectedPrice, propertyDescription,
            buyerName, buyerEmail, buyerPhone, buyerWhatsapp, interestedPropertyType, budgetRange, preferredLocation, notes,
            // Dynamic fields
            plotAreaSize, plotFacing, plotType, flatBHK, flatFloor, totalFloors, carpetArea, houseBuiltUpArea, houseFloors
        } = req.body;

        // Handle images
        let imageUrls = [];
        if (req.files && req.files.length > 0) {
            imageUrls = req.files.map(file => file.path.replace(/\\/g, "/"));
        } else if (req.body.propertyImages && Array.isArray(req.body.propertyImages)) {
            // Assume base64 or URLs sent from frontend
            imageUrls = req.body.propertyImages;
        }

        const newLead = await AdvisorLead.create({
            advisor: advisorId,
            leadType,
            // Seller fields
            ownerName: leadType === "seller" ? ownerName : undefined,
            ownerMobile: leadType === "seller" ? ownerMobile : undefined,
            propertyDetails: leadType === "seller" ? propertyDescription : undefined,
            location: leadType === "seller" ? location : undefined,
            expectedPrice: leadType === "seller" ? expectedPrice : undefined,
            propertyType: leadType === "seller" ? propertyType : undefined,
            images: leadType === "seller" ? imageUrls : undefined,

            // Dynamic fields for seller
            plotAreaSize, plotFacing, plotType, flatBHK, flatFloor, totalFloors, carpetArea, houseBuiltUpArea, houseFloors,

            // Buyer fields
            buyerName: leadType === "buyer" ? buyerName : undefined,
            buyerEmail: leadType === "buyer" ? buyerEmail : undefined,
            buyerContact: leadType === "buyer" ? buyerPhone : undefined,
            buyerWhatsapp: leadType === "buyer" ? buyerWhatsapp : undefined,
            interestedPropertyType: leadType === "buyer" ? interestedPropertyType : undefined,
            budgetRange: leadType === "buyer" ? budgetRange : undefined,
            preferredLocation: leadType === "buyer" ? preferredLocation : undefined,
            notes: leadType === "buyer" ? notes : undefined,

            status: "pending",
        });

        // If it's a seller lead, create a Property so Admin can see it in Properties list
        if (leadType === "seller") {
            try {
                await Property.create({
                    title: `${propertyType || 'Property'} in ${location || 'India'}`,
                    description: propertyDescription || "No description provided",
                    price: expectedPrice || 0,
                    location: location || "Contact Advisor",
                    images: imageUrls,
                    createdBy: advisorId,
                    type: propertyType,
                    area: plotAreaSize || carpetArea || houseBuiltUpArea || "N/A",
                    status: "pending",
                    approvedByAdmin: false,
                    advisorLeadId: newLead._id
                });
            } catch (propError) {
                console.error("Failed to create property from lead:", propError);
            }
        }

        res.status(201).json({ message: "Lead submitted successfully, awaiting admin approval", lead: newLead });
    } catch (error) {
        console.error("Submit Lead Error:", error);
        res.status(500).json({ error: "Failed to submit new lead" });
    }
};

// Get Advisor's Leads
exports.getAdvisorLeads = async (req, res) => {
    try {
        const advisorId = req.user.id;
        const leads = await AdvisorLead.find({ advisor: advisorId }).sort({ createdAt: -1 });
        res.json(leads);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Failed to fetch advisor leads" });
    }
};

// Get Advisor's Seller Leads
exports.getAdvisorSellerLeads = async (req, res) => {
    try {
        const advisorId = req.user.id;
        const leads = await AdvisorLead.find({ advisor: advisorId, leadType: "seller" }).sort({ createdAt: -1 });
        res.json(leads);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Failed to fetch advisor seller leads" });
    }
};

// Get Advisor's Buyer Leads
exports.getAdvisorBuyerLeads = async (req, res) => {
    try {
        const advisorId = req.user.id;
        const leads = await AdvisorLead.find({ advisor: advisorId, leadType: "buyer" }).sort({ createdAt: -1 });
        res.json(leads);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Failed to fetch advisor buyer leads" });
    }
};

// Get Notifications for Advisor
exports.getAdvisorNotifications = async (req, res) => {
    try {
        const advisorId = req.user.id;
        const notifications = await Notification.find({ recipient: advisorId, onModel: "Advisor" }).sort({ createdAt: -1 });
        res.json(notifications);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Failed to fetch advisor notifications" });
    }
};

// Mark Notification as Read
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

// Get Advisor Commissions
exports.getAdvisorCommissions = async (req, res) => {
    try {
        const advisorId = req.user.id;
        const commissions = await Commission.find({ advisor: advisorId })
            .populate("property", "title location")
            .sort({ createdAt: -1 });
        res.json(commissions);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Failed to fetch advisor commissions" });
    }
};
