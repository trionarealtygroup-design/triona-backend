const express = require("express");
const router = express.Router();
const Advisor = require("../models/Advisor");
const verifyToken = require("../middleware/verifyToken");
const checkRole = require("../middleware/checkRole");

// Get My Referrals - advisors who used this advisor's phone as referrer
router.get("/my-referrals", verifyToken, checkRole(["advisor"]), async (req, res) => {
    try {
        const advisor = await Advisor.findById(req.user.id);
        if (!advisor) {
            return res.status(200).json({ totalReferrals: 0, referrals: [] });
        }

        // Find all advisors who were referred by this advisor's mobile number
        const referrals = await Advisor.find({ referredBy: advisor.mobile })
            .select("fullName email mobile city isVerified createdAt professionalPlan")
            .sort({ createdAt: -1 });

        res.json({
            totalReferrals: referrals.length,
            referrals
        });
    } catch (error) {
        console.error("Error fetching referrals:", error);
        res.status(500).json({ message: "Server error", totalReferrals: 0, referrals: [] });
    }
});

module.exports = router;
