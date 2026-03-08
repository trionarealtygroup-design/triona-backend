const User = require("../models/User");
const Advisor = require("../models/Advisor");
const AdvisorBankDetails = require("../models/AdvisorBankDetails");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

// Register Buyer
const registerBuyer = async (req, res) => {
    try {
        const { name, email, password, mobile, whatsapp, city } = req.body;

        let user = await User.findOne({ email });
        if (user) {
            return res.status(400).json({ message: "User already exists" });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        user = await User.create({
            name,
            email,
            password: hashedPassword,
            mobile,
            whatsapp,
            city,
            role: "buyer",
        });

        res.status(201).json({
            message: "Buyer registered successfully",
            user: { id: user._id, name: user.name, email: user.email, role: user.role },
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
};

// Register Seller (Direct Seller)
const registerSeller = async (req, res) => {
    try {
        const { name, email, password, mobile, whatsapp, city } = req.body;

        let user = await User.findOne({ email });
        if (user) {
            return res.status(400).json({ message: "User already exists" });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        user = await User.create({
            name,
            email,
            password: hashedPassword,
            mobile,
            whatsapp,
            city,
            role: "seller",
        });

        res.status(201).json({
            message: "Seller registered successfully",
            user: { id: user._id, name: user.name, email: user.email, role: user.role },
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
};

// Register Advisor
        const registerAdvisor = async (req, res) => {
            try {
                const { fullName, email, password, mobile, whatsapp, city, address, bankName, accountNumber, ifscCode, branchAddress, panCard, aadhaarCard } = req.body;

                const profilePhotoPath = req.files['profilePhoto'] ? `/uploads/profiles/${req.files['profilePhoto'][0].filename}` : undefined;
                const passbookPhotoPath = req.files['passbookPhoto'] ? `/uploads/bank-details/${req.files['passbookPhoto'][0].filename}` : undefined;

        let user = await User.findOne({ email });
        if (user) {
            return res.status(400).json({ message: "Advisor with this email already exists" });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        // Create User entry
        user = await User.create({
            name: fullName,
            email,
            password: hashedPassword,
            mobile,
            whatsapp,
            city,
            role: "advisor",
        });

        // Create Advisor entry
        const advisor = await Advisor.create({
            fullName,
            email,
            mobile,
            whatsapp,
            city,
            address,
            password: hashedPassword, // Store hashed password here too for advisor specific login, if needed
            profilePhoto: profilePhotoPath,
            status: "pending",
            isApproved: false // Explicitly set to false for pending
        });

        // Create AdvisorBankDetails entry
        await AdvisorBankDetails.create({
            advisor: advisor._id,
            bankName,
            accountNumber,
            ifscCode,
            branchAddress,
            panCard,
            aadhaarCard,
            passbookPhoto: passbookPhotoPath
        });

        res.status(201).json({
            message: "Advisor registered successfully. Awaiting admin approval.",
            advisor: { id: advisor._id, fullName: advisor.fullName, email: advisor.email, status: advisor.status },
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
};

// Login User (for all roles including advisor)
const loginUser = async (req, res) => {
    try {
        const { email, password } = req.body;

        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ message: "Invalid credentials" });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: "Invalid credentials" });
        }

        // Special handling for advisors
        if (user.role === "advisor") {
            const advisor = await Advisor.findOne({ email: user.email });
            if (!advisor) {
                return res.status(400).json({ message: "Advisor profile not found" });
            }
            if (advisor.status === "pending") {
                return res.status(401).json({ message: "Your account is pending admin approval." });
            }
            if (advisor.status === "rejected") {
                return res.status(401).json({ message: `Your account was rejected. Reason: ${advisor.adminRejectionReason || "No reason provided."}` });
            }
        }

        const token = jwt.sign(
            { id: user._id, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: "1h" }
        );

        res.status(200).json({
            message: "Login successful",
            token,
            user: { id: user._id, name: user.name, email: user.email, role: user.role },
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
};

module.exports = {
    registerBuyer,
    registerSeller,
    registerAdvisor,
    loginUser,
};