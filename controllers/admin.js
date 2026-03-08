const Property = require("../models/Property");
const Advisor = require("../models/Advisor");
const AdvisorBankDetails = require("../models/AdvisorBankDetails");
const AdvisorLead = require("../models/AdvisorLead");
const DirectSeller = require("../models/DirectSeller");
const DirectSellerProperty = require("../models/DirectSellerProperty");
const DirectBuyer = require("../models/DirectBuyer");
const Commission = require("../models/Commission");
const Notification = require("../models/Notification");
const User = require("../models/User");
const bcrypt = require("bcryptjs");

// Helper to create notifications
const createNotification = async (recipient, onModel, message) => {
    await Notification.create({ recipient, onModel, message });
};

exports.getDashboardStats = async (req, res) => {
    try {
        // 1. Pending Counts (Aggregated)
        const [
            pendingProps,
            pendingAdvisorLeads,
            pendingDirectProps
        ] = await Promise.all([
            Property.countDocuments({ status: "pending" }),
            AdvisorLead.countDocuments({ status: "pending", leadType: "seller" }),
            DirectSellerProperty.countDocuments({ status: "pending" })
        ]);
        const pendingProperties = pendingProps + pendingAdvisorLeads + pendingDirectProps;

        // 2. Approved Counts (Internal)
        const [
            approvedProps,
            approvedDirectProps
        ] = await Promise.all([
            Property.countDocuments({ status: "approved" }),
            DirectSellerProperty.countDocuments({ status: "approved" })
        ]);
        const approvedProperties = approvedProps + approvedDirectProps;

        // 3. Live Counts (Public)
        const [
            liveProps,
            liveDirectProps
        ] = await Promise.all([
            Property.countDocuments({ status: "live" }),
            DirectSellerProperty.countDocuments({ status: "live" })
        ]);
        const liveProperties = liveProps + liveDirectProps;

        // 4. Total Properties (Unique Count)
        const [
            totalPropsCount,
            totalLeadsCount,
            totalDirectPropsCount
        ] = await Promise.all([
            Property.countDocuments(),
            AdvisorLead.countDocuments({ leadType: "seller" }),
            DirectSellerProperty.countDocuments()
        ]);
        // We need to avoid double counting AdvisorLeads that have a corresponding Property
        const advisorLeadsWithProperty = await Property.countDocuments({ advisorLeadId: { $ne: null } });
        const totalProperties = totalPropsCount + (totalLeadsCount - advisorLeadsWithProperty) + totalDirectPropsCount;

        const soldPropertiesCount = await Promise.all([
            AdvisorLead.countDocuments({ status: "sold" }),
            Property.countDocuments({ status: "sold" }),
            DirectSellerProperty.countDocuments({ status: "sold" })
        ]).then(counts => counts.reduce((sum, count) => sum + count, 0));

        const totalAdvisors = await Advisor.countDocuments();
        const pendingAdvisors = await Advisor.countDocuments({ isVerified: false });
        const approvedAdvisors = await Advisor.countDocuments({ isVerified: true });

        const totalAdvisorLeads = await AdvisorLead.countDocuments();
        // const pendingAdvisorLeads = await AdvisorLead.countDocuments({ status: "pending" });
        const approvedAdvisorLeads = await AdvisorLead.countDocuments({ status: "approved" });

        const totalDirectBuyers = await DirectBuyer.countDocuments();
        const totalDirectSellers = await DirectSeller.countDocuments();

        const totalCommissions = await Commission.countDocuments();
        const pendingCommissions = await Commission.countDocuments({ status: "pending" });
        const paidCommissions = await Commission.countDocuments({ status: "paid" });
        const totalCommissionAmount = await Commission.aggregate([
            { $group: { _id: null, total: { $sum: "$commissionAmount" } } }
        ]);
        const pendingCommissionAmount = await Commission.aggregate([
            { $match: { status: "pending" } },
            { $group: { _id: null, total: { $sum: "$commissionAmount" } } }
        ]);
        const paidCommissionAmount = await Commission.aggregate([
            { $match: { status: "paid" } },
            { $group: { _id: null, total: { $sum: "$commissionAmount" } } }
        ]);

        res.json({
            totalProperties,
            pendingProperties,
            approvedProperties,
            liveProperties,
            soldProperties: soldPropertiesCount,
            totalAdvisors,
            pendingAdvisors,
            approvedAdvisors,
            totalAdvisorLeads,
            totalDirectBuyers,
            totalDirectSellers,
            totalCommissions,
            pendingCommissions,
            paidCommissions,
            totalCommissionAmount: totalCommissionAmount[0]?.total || 0,
            pendingCommissionAmount: pendingCommissionAmount[0]?.total || 0,
            paidCommissionAmount: paidCommissionAmount[0]?.total || 0,
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Failed to fetch dashboard stats" });
    }
};

// Helper for Mixed Collection Pagination
const fetchMixedPaginatedProperties = async (statusFilter, page = 1, limit = 50) => {
    const skip = (page - 1) * limit;
    // 1. Fetch lightweight docs (ID + Date) from all collections
    const propFilter = statusFilter ? { status: statusFilter } : {};
    const advisorFilter = statusFilter ? { status: statusFilter, leadType: "seller" } : { leadType: "seller" };
    const directFilter = statusFilter ? { status: statusFilter } : {};

    const [
        props,
        leads,
        directs
    ] = await Promise.all([
        Property.find(propFilter).select("_id createdAt").lean(),
        AdvisorLead.find(advisorFilter).select("_id createdAt propertyDetails expectedPrice location city images status advisor").lean(),
        DirectSellerProperty.find(directFilter).select("_id createdAt").lean()
    ]);

    // 2. Normalize for sorting
    const combined = [
        ...props.map(p => ({ _id: p._id, createdAt: p.createdAt, type: 'property' })),
        ...leads.map(l => ({ _id: l._id, createdAt: l.createdAt, type: 'advisor_lead' })),
        ...directs.map(d => ({ _id: d._id, createdAt: d.createdAt, type: 'direct_seller' }))
    ];

    // 3. Sort
    combined.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    // 4. Slice
    const slice = combined.slice(skip, skip + limit);


    // 5. Fetch full details for the slice
    const propIds = slice.filter(i => i.type === 'property').map(i => i._id);
    const leadIds = slice.filter(i => i.type === 'advisor_lead').map(i => i._id);
    const directIds = slice.filter(i => i.type === 'direct_seller').map(i => i._id);

    const [
        fullProps,
        fullLeads,
        fullDirects
    ] = await Promise.all([
        Property.find({ _id: { $in: propIds } }).populate("createdBy", "fullName email mobile"),
        AdvisorLead.find({ _id: { $in: leadIds } }).populate("advisor", "fullName email mobile"),
        DirectSellerProperty.find({ _id: { $in: directIds } }).populate("seller").populate({ path: "seller", populate: { path: "user", select: "name email mobile" } })
    ]);

    // 6. Map back to combined sorted order
    const resultMap = {
        property: new Map(fullProps.map(p => [p._id.toString(), p])),
        advisor_lead: new Map(fullLeads.map(l => [l._id.toString(), l])),
        direct_seller: new Map(fullDirects.map(d => [d._id.toString(), d]))
    };


    const finalResults = slice.map(item => {
        const fullDoc = resultMap[item.type].get(item._id.toString());
        if (!fullDoc) return null; // Should not happen

        if (item.type === 'property') {
            return {
                ...fullDoc.toObject(),
                type: 'property',
                sourceCollection: 'Property',
                isLive: fullDoc.status === 'live'
            };
        } else if (item.type === 'advisor_lead') {
            return {
                _id: fullDoc._id,
                title: fullDoc.propertyDetails ? fullDoc.propertyDetails.substring(0, 50) + (fullDoc.propertyDetails.length > 50 ? "..." : "") : "Advisor Lead Property",
                location: fullDoc.location || fullDoc.city || "N/A",
                price: fullDoc.expectedPrice || 0,
                images: fullDoc.images || [],
                status: fullDoc.status,
                createdAt: fullDoc.createdAt,
                createdBy: fullDoc.advisor,
                description: fullDoc.propertyDetails,
                type: 'advisor_lead',
                sourceCollection: 'AdvisorLead',
                originalData: fullDoc.toObject(),
                isLive: fullDoc.status === 'live'
            };
        } else {
            return {
                _id: fullDoc._id,
                title: fullDoc.title,
                location: fullDoc.location,
                price: fullDoc.price,
                images: fullDoc.images || [],
                status: fullDoc.status,
                createdAt: fullDoc.createdAt,
                description: fullDoc.description,
                type: 'direct_seller',
                sourceCollection: 'DirectSellerProperty',
                createdBy: fullDoc.seller?.user || { fullName: "Direct Seller" },
                isLive: fullDoc.status === 'live'
            };
        }
    }).filter(i => i !== null);

    return finalResults;
};

exports.getPendingProperties = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 100; // Default limit 100 to prevent crash

        const properties = await fetchMixedPaginatedProperties("pending", page, limit);

        res.json(properties);
    } catch (error) {
        console.error("Get Pending Props Error:", error);
        res.status(500).json({ error: "Failed to fetch pending properties" });
    }
};

exports.getPropertyDetails = async (req, res) => {
    try {
        const { id } = req.params;
        if (!id.match(/^[0-9a-fA-F]{24}$/)) {
            return res.status(400).json({ message: "Invalid property ID format" });
        }

        // Try Property
        let property = await Property.findById(id).populate("createdBy", "fullName email mobile");
        let type = 'property';

        // Try AdvisorLead
        if (!property) {
            property = await AdvisorLead.findById(id).populate("advisor", "fullName email mobile");
            type = 'advisor_lead';
        }

        // Try DirectSellerProperty
        if (!property) {
            property = await DirectSellerProperty.findById(id).populate({
                path: "seller",
                populate: { path: "user", select: "name email mobile" }
            });
            type = 'direct_seller';
        }

        if (!property) {
            return res.status(404).json({ message: "Property not found" });
        }

        // Return standardized response if needed, or just the object with type
        let response = property.toObject();
        response.type = type;

        // Map fields for AdvisorLead for frontend consistency
        if (type === 'advisor_lead') {
            response.title = response.propertyDetails ? response.propertyDetails.substring(0, 50) : "Advisor Lead";
            response.price = response.expectedPrice;
            response.description = response.propertyDetails;
            response.createdBy = response.advisor; // Map advisor to createdBy
        }

        if (type === 'direct_seller') {
            response.createdBy = response.seller?.user; // Map direct seller user to createdBy
        }

        res.json(response);
    } catch (error) {
        console.error("Get Property Details Error:", error);
        res.status(500).json({ error: "Failed to fetch property details" });
    }
};

exports.approveProperty = async (req, res) => {
    try {
        const property = await Property.findByIdAndUpdate(
            req.params.id,
            { status: "approved", approvedByAdmin: true },
            { new: true }
        );
        res.json(property);
    } catch (error) {
        res.status(500).json({ error: "Failed to approve property" });
    }
};

exports.rejectProperty = async (req, res) => {
    try {
        const property = await Property.findByIdAndUpdate(
            req.params.id,
            { status: "rejected", approvedByAdmin: false },
            { new: true }
        );
        res.json(property);
    } catch (error) {
        res.status(500).json({ error: "Failed to reject property" });
    }
};

exports.updateProperty = async (req, res) => {
    try {
        const { id } = req.params;
        let updated;

        // 1. Try Property
        updated = await Property.findByIdAndUpdate(id, req.body, { new: true });

        // 2. Try AdvisorLead
        if (!updated) {
            // Map common fields to AdvisorLead schema
            const updateData = { ...req.body };
            if (updateData.price) updateData.expectedPrice = updateData.price;
            if (updateData.description) updateData.propertyDetails = updateData.description;
            // Add other mappings as necessary

            updated = await AdvisorLead.findByIdAndUpdate(id, updateData, { new: true });
        }

        // 3. Try DirectSellerProperty
        if (!updated) {
            updated = await DirectSellerProperty.findByIdAndUpdate(id, req.body, { new: true });
        }

        if (!updated) {
            return res.status(404).json({ error: "Property not found for update" });
        }

        res.json(updated);
    } catch (error) {
        console.error("Update Property Error:", error);
        res.status(500).json({ error: "Failed to update property" });
    }
};

exports.getAllProperties = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 100;

        // Pass null to fetch all statuses
        const properties = await fetchMixedPaginatedProperties(null, page, limit);

        res.json(properties);
    } catch (error) {
        console.error("Get All Properties Error:", error);
        res.status(500).json({ error: "Failed to fetch all properties" });
    }
};

exports.getApprovedProperties = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 100;

        const properties = await fetchMixedPaginatedProperties("approved", page, limit);

        res.json(properties);
    } catch (error) {
        console.error("Get Approved Properties Error:", error);
        res.status(500).json({ error: "Failed to fetch approved properties" });
    }
};

exports.getLiveProperties = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 100;

        const properties = await fetchMixedPaginatedProperties("live", page, limit);

        res.json(properties);
    } catch (error) {
        console.error("Get Live Properties Error:", error);
        res.status(500).json({ error: "Failed to fetch live properties" });
    }
};

exports.makeLive = async (req, res) => {
    try {
        const { id } = req.params;

        // Try Property
        let property = await Property.findByIdAndUpdate(id, { status: "live" }, { new: true });

        // Try AdvisorLead
        if (!property) {
            property = await AdvisorLead.findByIdAndUpdate(id, { status: "live" }, { new: true });
            if (property && property.leadType === "seller") {
                await Property.findOneAndUpdate({ advisorLeadId: id }, { status: "live" });
            }
        }

        // Try DirectSellerProperty
        if (!property) {
            property = await DirectSellerProperty.findByIdAndUpdate(id, { status: "live" }, { new: true });
        }

        if (!property) {
            return res.status(404).json({ message: "Property not found" });
        }

        res.json({ message: "Property is now LIVE!", property });
    } catch (error) {
        console.error("Make Live Error:", error);
        res.status(500).json({ error: "Failed to make property live" });
    }
};

exports.unpublishProperty = async (req, res) => {
    try {
        const property = await Property.findByIdAndUpdate(
            req.params.id,
            { status: "pending", approvedByAdmin: false },
            { new: true }
        );
        res.json({ message: "Property unpublished", property });
    } catch (error) {
        res.status(500).json({ error: "Failed to unpublish property" });
    }
};

exports.getAllAdvisors = async (req, res) => {
    try {
        const advisors = await Advisor.find().select("-password").sort({ createdAt: -1 });
        res.json(advisors);
    } catch (error) {
        res.status(500).json({ error: "Failed to fetch advisors" });
    }
};

exports.approveAdvisor = async (req, res) => {
    try {
        const { id } = req.params;
        const advisor = await Advisor.findByIdAndUpdate(
            id,
            { status: "approved", isApproved: true, adminRejectionReason: null },
            { new: true }
        );

        if (!advisor) {
            return res.status(404).json({ message: "Advisor not found" });
        }

        await createNotification(advisor._id, "Advisor", "Your advisor account has been approved. You can now log in.");

        res.json({ message: "Advisor approved successfully", advisor });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Failed to approve advisor" });
    }
};

exports.rejectAdvisor = async (req, res) => {
    try {
        const { id } = req.params;
        const { reason } = req.body;

        if (!reason) {
            return res.status(400).json({ message: "Rejection reason is required" });
        }

        const advisor = await Advisor.findByIdAndUpdate(
            id,
            { status: "rejected", isApproved: false, adminRejectionReason: reason },
            { new: true }
        );

        if (!advisor) {
            return res.status(404).json({ message: "Advisor not found" });
        }

        await createNotification(advisor._id, "Advisor", `Your advisor account has been rejected. Reason: ${reason}`);

        res.json({ message: "Advisor rejected successfully", advisor });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Failed to reject advisor" });
    }
};

exports.getAdvisorDetails = async (req, res) => {
    try {
        const { id } = req.params;
        const advisor = await Advisor.findById(id).select("-password");
        if (!advisor) {
            return res.status(404).json({ message: "Advisor not found" });
        }
        const bankDetails = await AdvisorBankDetails.findOne({ advisor: id });
        res.json({ advisor, bankDetails });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Failed to fetch advisor details" });
    }
};

exports.changeAdminPassword = async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;
        const adminUserId = req.user.id; // Assuming admin user ID is available from auth middleware

        if (!currentPassword || !newPassword) {
            return res.status(400).json({ message: "Current and new password required" });
        }

        const adminUser = await User.findById(adminUserId);
        if (!adminUser || adminUser.role !== "admin") {
            return res.status(403).json({ message: "Unauthorized" });
        }

        const isMatch = await bcrypt.compare(currentPassword, adminUser.password);
        if (!isMatch) {
            return res.status(400).json({ message: "Current password is incorrect" });
        }

        // Strong password validation
        const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
        if (!passwordRegex.test(newPassword)) {
            return res.status(400).json({
                message: "Password must be at least 8 characters with uppercase, lowercase, number, and special character"
            });
        }

        const hashedNewPassword = await bcrypt.hash(newPassword, 10);
        adminUser.password = hashedNewPassword;
        await adminUser.save();

        res.json({ message: "Admin password updated successfully" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Failed to change password" });
    }
};

// --- Advisor Leads Management ---
exports.getPendingAdvisorLeads = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 100;
        const skip = (page - 1) * limit;

        const leads = await AdvisorLead.find({ status: "pending" })
            .populate("advisor", "fullName email mobile")
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);
        res.json(leads);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Failed to fetch pending advisor leads" });
    }
};

exports.approveAdvisorLead = async (req, res) => {
    try {
        const { id } = req.params;
        const lead = await AdvisorLead.findByIdAndUpdate(
            id,
            { status: "approved" },
            { new: true }
        );

        if (!lead) {
            return res.status(404).json({ message: "Advisor lead not found" });
        }

        // Create or Update Property entry
        if (lead.leadType === "seller") {
            let property = await Property.findOne({ advisorLeadId: lead._id });

            if (property) {
                property.status = "approved";
                property.approvedByAdmin = true;
                await property.save();
            } else {
                await Property.create({
                    title: lead.propertyDetails.substring(0, 50) || "Property",
                    description: lead.propertyDetails,
                    location: lead.city || lead.location || "N/A",
                    price: lead.expectedPrice || 0,
                    images: lead.images,
                    createdBy: lead.advisor,
                    status: "approved",
                    approvedByAdmin: true,
                    advisorLeadId: lead._id
                });
            }
        }

        await createNotification(lead.advisor, "Advisor", `Your ${lead.leadType} lead (ID: ${lead._id}) has been approved.`);

        res.json({ message: "Advisor lead approved successfully", lead });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Failed to approve advisor lead" });
    }
};

exports.rejectAdvisorLead = async (req, res) => {
    try {
        const { id } = req.params;
        const { reason } = req.body;

        if (!reason) {
            return res.status(400).json({ message: "Rejection reason is required" });
        }

        const lead = await AdvisorLead.findByIdAndUpdate(
            id,
            { status: "rejected", adminRejectionReason: reason },
            { new: true }
        );

        if (!lead) {
            return res.status(404).json({ message: "Advisor lead not found" });
        }

        await createNotification(lead.advisor, "Advisor", `Your ${lead.leadType} lead (ID: ${lead._id}) has been rejected. Reason: ${reason}`);

        res.json({ message: "Advisor lead rejected successfully", lead });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Failed to reject advisor lead" });
    }
};

exports.getApprovedAdvisorLeads = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 100;
        const skip = (page - 1) * limit;

        const leads = await AdvisorLead.find({ status: "approved" })
            .populate("advisor", "fullName email mobile")
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);
        res.json(leads);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Failed to fetch approved advisor leads" });
    }
};

exports.getAllAdvisorLeads = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 100;
        const skip = (page - 1) * limit;

        const leads = await AdvisorLead.find() // Find ALL leads
            .populate("advisor", "fullName email mobile")
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);
        res.json(leads);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Failed to fetch all advisor leads" });
    }
};

exports.editAdvisorLead = async (req, res) => {
    try {
        const { id } = req.params;
        const lead = await AdvisorLead.findByIdAndUpdate(id, req.body, { new: true });
        if (!lead) {
            return res.status(404).json({ message: "Advisor lead not found" });
        }
        res.json({ message: "Advisor lead updated successfully", lead });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Failed to edit advisor lead" });
    }
};

exports.markAdvisorLeadAsSold = async (req, res) => {
    try {
        const { id } = req.params;
        const lead = await AdvisorLead.findByIdAndUpdate(
            id,
            { status: "sold" },
            { new: true }
        );

        if (!lead) {
            return res.status(404).json({ message: "Advisor lead not found" });
        }

        // Create commission entry
        const commissionPercentage = 2; // Example: 2% commission
        const commissionAmount = (lead.property?.price || 0) * (commissionPercentage / 100);

        await Commission.create({
            advisor: lead.advisor,
            property: lead.property, // Assuming property field is populated or available
            commissionPercentage,
            commissionAmount,
            status: "pending"
        });

        await createNotification(lead.advisor, "Advisor", `Your lead (ID: ${lead._id}) has been marked as sold. Commission is pending.`);

        res.json({ message: "Advisor lead marked as sold", lead });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Failed to mark advisor lead as sold" });
    }
};

// --- Direct Seller Properties Management ---
exports.getPendingDirectSellerProperties = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 100;
        const skip = (page - 1) * limit;

        const properties = await DirectSellerProperty.find({ status: "pending" })
            .populate("seller", "user") // Populate seller to get user info
            .populate({
                path: "seller",
                populate: {
                    path: "user",
                    select: "name email mobile"
                }
            })
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);
        res.json(properties);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Failed to fetch pending direct seller properties" });
    }
};

exports.approveDirectSellerProperty = async (req, res) => {
    try {
        const { id } = req.params;
        const property = await DirectSellerProperty.findByIdAndUpdate(
            id,
            { status: "approved" },
            { new: true }
        );

        if (!property) {
            return res.status(404).json({ message: "Direct seller property not found" });
        }

        // Optionally create a general Property entry from this if needed for public listing
        // await Property.create({ ...property.toJSON(), createdBy: property.seller, isDirectSellerProperty: true });

        // Notify direct seller (assuming seller has a User._id linked to DirectSeller)
        const directSeller = await DirectSeller.findById(property.seller).populate("user");
        if (directSeller && directSeller.user) {
            await createNotification(directSeller.user._id, "User", `Your property listing (ID: ${property._id}) has been approved.`);
        }

        res.json({ message: "Direct seller property approved successfully", property });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Failed to approve direct seller property" });
    }
};

exports.rejectDirectSellerProperty = async (req, res) => {
    try {
        const { id } = req.params;
        const { reason } = req.body;

        if (!reason) {
            return res.status(400).json({ message: "Rejection reason is required" });
        }

        const property = await DirectSellerProperty.findByIdAndUpdate(
            id,
            { status: "rejected", adminRejectionReason: reason },
            { new: true }
        );

        if (!property) {
            return res.status(404).json({ message: "Direct seller property not found" });
        }

        const directSeller = await DirectSeller.findById(property.seller).populate("user");
        if (directSeller && directSeller.user) {
            await createNotification(directSeller.user._id, "User", `Your property listing (ID: ${property._id}) has been rejected. Reason: ${reason}`);
        }

        res.json({ message: "Direct seller property rejected successfully", property });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Failed to reject direct seller property" });
    }
};

exports.getApprovedDirectSellerProperties = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 100;
        const skip = (page - 1) * limit;

        const properties = await DirectSellerProperty.find({ status: "approved" })
            .populate("seller", "user")
            .populate({
                path: "seller",
                populate: {
                    path: "user",
                    select: "name email mobile"
                }
            })
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);
        res.json(properties);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Failed to fetch approved direct seller properties" });
    }
};

exports.editDirectSellerProperty = async (req, res) => {
    try {
        const { id } = req.params;
        const property = await DirectSellerProperty.findByIdAndUpdate(id, req.body, { new: true });
        if (!property) {
            return res.status(404).json({ message: "Direct seller property not found" });
        }
        res.json({ message: "Direct seller property updated successfully", property });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Failed to edit direct seller property" });
    }
};

exports.markDirectSellerPropertyAsSold = async (req, res) => {
    try {
        const { id } = req.params;
        const property = await DirectSellerProperty.findByIdAndUpdate(
            id,
            { status: "sold" },
            { new: true }
        );

        if (!property) {
            return res.status(404).json({ message: "Direct seller property not found" });
        }

        // Company commission logic (no advisor involved)
        const companyCommissionPercentage = 3; // Example: 3% company commission
        const commissionAmount = (property.price || 0) * (companyCommissionPercentage / 100);

        // In a real scenario, this would create a company commission record, not an advisor commission.
        // For now, we'll just acknowledge the sale.

        const directSeller = await DirectSeller.findById(property.seller).populate("user");
        if (directSeller && directSeller.user) {
            await createNotification(directSeller.user._id, "User", `Your property (ID: ${property._id}) has been marked as sold. Company commission applied.`);
        }

        res.json({ message: "Direct seller property marked as sold", property });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Failed to mark direct seller property as sold" });
    }
};

// --- Commission Management ---
exports.getCommissions = async (req, res) => {
    try {
        const commissions = await Commission.find()
            .populate("advisor", "fullName email")
            .populate("property", "title")
            .sort({ createdAt: -1 });
        res.json(commissions);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Failed to fetch commissions" });
    }
};

exports.markCommissionAsPaid = async (req, res) => {
    try {
        const { id } = req.params;
        const commission = await Commission.findByIdAndUpdate(
            id,
            { status: "paid" },
            { new: true }
        );

        if (!commission) {
            return res.status(404).json({ message: "Commission not found" });
        }

        // Update linked Property status
        if (commission.property) {
            await Property.findByIdAndUpdate(commission.property, { commissionStatus: "paid" });
        }

        await createNotification(commission.advisor, "Advisor", `Commission (ID: ${commission._id}) has been marked as paid.`);

        res.json({ message: "Commission marked as paid", commission });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Failed to mark commission as paid" });
    }
};

// --- Direct Buyer Management ---
exports.getDirectBuyers = async (req, res) => {
    try {
        const buyers = await DirectBuyer.find()
            .populate("user", "name email mobile")
            .sort({ createdAt: -1 });
        res.json(buyers);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Failed to fetch direct buyers" });
    }
};

// --- Propery Sold & Commission Features ---

exports.markPropertyAsSold = async (req, res) => {
    try {
        const { id } = req.params;
        const { commissionAmount } = req.body;

        // 1. Update Property
        const property = await Property.findByIdAndUpdate(
            id,
            {
                status: "sold",
                commissionAmount: commissionAmount || 0,
                commissionStatus: "pending"
            },
            { new: true }
        );

        if (!property) {
            return res.status(404).json({ message: "Property not found" });
        }

        // 2. Update linked AdvisorLead (if exists)
        if (property.advisorLeadId) {
            await AdvisorLead.findByIdAndUpdate(
                property.advisorLeadId,
                { status: "sold" }
            );
        }

        // 3. Create Commission Record (if applicable and Advisor exists)
        if (property.createdBy && (commissionAmount > 0)) {
            await Commission.create({
                advisor: property.createdBy,
                property: property._id,
                commissionPercentage: 0,
                commissionAmount: commissionAmount,
                status: "pending",
                adminNotes: "Marked as sold by Admin"
            });

            // 4. Notify Advisor
            await createNotification(
                property.createdBy,
                "Advisor",
                `Your property "${property.title}" has been marked as SOLD! Commission: ₹${commissionAmount}`
            );
        }

        res.json({ message: "Property marked as sold", property });
    } catch (error) {
        console.error("Mark Sold Error:", error);
        res.status(500).json({ error: "Failed to mark property as sold" });
    }
};

exports.markPropertyCommissionPaid = async (req, res) => {
    try {
        const { id } = req.params; // Property ID

        const property = await Property.findByIdAndUpdate(
            id,
            { commissionStatus: "paid" },
            { new: true }
        );

        if (!property) return res.status(404).json({ message: "Property not found" });

        // Also update the Commission model if exists
        const commission = await Commission.findOneAndUpdate(
            { property: id },
            { status: "paid" },
            { new: true }
        );

        // Notify
        if (property.createdBy) {
            await createNotification(
                property.createdBy,
                "Advisor",
                `Commission for property "${property.title}" has been marked as PAID.`
            );
        }

        res.json({ message: "Property commission marked as paid", property, commission });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Failed to mark commission as paid" });
    }
};
