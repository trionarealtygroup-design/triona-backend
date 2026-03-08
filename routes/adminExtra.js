const express = require("express");
const router = express.Router();
const Advisor = require("../models/Advisor");
const verifyToken = require("../middleware/verifyToken");
const checkRole = require("../middleware/checkRole");

// Get Pending Verification Advisors (isVerified = false)
router.get("/advisors/pending-verification", verifyToken, checkRole(["admin"]), async (req, res) => {
    try {
        const advisors = await Advisor.find({ isVerified: { $ne: true } })
            .select("fullName email mobile city professionalPlan referredBy isVerified createdAt")
            .sort({ createdAt: -1 });
        res.json(advisors);
    } catch (error) {
        console.error("Error fetching pending advisors:", error);
        res.status(500).json({ message: "Server error" });
    }
});

// Get Verified Advisors (isVerified = true)
router.get("/advisors/verified", verifyToken, checkRole(["admin"]), async (req, res) => {
    try {
        const advisors = await Advisor.find({ isVerified: true })
            .select("fullName email mobile city professionalPlan referredBy isVerified createdAt")
            .sort({ createdAt: -1 });
        res.json(advisors);
    } catch (error) {
        console.error("Error fetching verified advisors:", error);
        res.status(500).json({ message: "Server error" });
    }
});

// Mark Advisor as Verified
router.post("/advisors/:id/verify", verifyToken, checkRole(["admin"]), async (req, res) => {
    try {
        const advisor = await Advisor.findById(req.params.id);
        if (!advisor) {
            return res.status(404).json({ message: "Advisor not found" });
        }

        advisor.isVerified = true;
        await advisor.save();

        res.json({ message: "Advisor marked as verified", advisor });
    } catch (error) {
        console.error("Error verifying advisor:", error);
        res.status(500).json({ message: "Server error" });
    }
});

// Export Advisors Data as XLSX
router.get("/export-advisors", verifyToken, checkRole(["admin"]), async (req, res) => {
    try {
        const XLSX = require("xlsx");

        const advisors = await Advisor.find()
            .select("fullName email mobile professionalPlan isVerified referredBy createdAt")
            .sort({ createdAt: -1 });

        const data = advisors.map(a => ({
            "Name": a.fullName,
            "Email": a.email,
            "Phone": a.mobile,
            "Plan": a.professionalPlan || "basic",
            "Is Verified": a.isVerified ? "Yes" : "No",
            "Referred By": a.referredBy || "N/A",
            "Registration Date": a.createdAt ? new Date(a.createdAt).toLocaleDateString() : "N/A"
        }));

        const worksheet = XLSX.utils.json_to_sheet(data);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Advisors");

        const buffer = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });

        res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
        res.setHeader("Content-Disposition", "attachment; filename=advisors_data.xlsx");
        res.send(buffer);
    } catch (error) {
        console.error("Error exporting advisors:", error);
        res.status(500).json({ message: "Server error during export" });
    }
});

// Get Advisor's Referrals (Admin)
router.get("/advisors/:id/referrals", verifyToken, checkRole(["admin"]), async (req, res) => {
    try {
        const { id } = req.params;
        const advisor = await Advisor.findById(id);
        if (!advisor) {
            return res.status(404).json({ message: "Advisor not found" });
        }

        const referrals = await Advisor.find({ referredBy: advisor.mobile })
            .select("fullName email mobile city isVerified createdAt professionalPlan")
            .sort({ createdAt: -1 });

        res.json({
            totalReferrals: referrals.length,
            referrals
        });
    } catch (error) {
        console.error("Error fetching advisor referrals:", error);
        res.status(500).json({ message: "Server error" });
    }
});

module.exports = router;
