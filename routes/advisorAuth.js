const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const Advisor = require("../models/Advisor");

const router = express.Router();

router.post("/register", async (req, res) => {
  try {
    const { fullName, email, mobile, whatsapp, city, pincode, password, gender, age, brokerStatus, address, professionalPlan, referredByPhone } = req.body;

    // Look up referrer by phone number (new feature - non-blocking)
    let referredBy = undefined;
    if (referredByPhone) {
      try {
        const referrer = await Advisor.findOne({ mobile: referredByPhone });
        if (referrer) {
          referredBy = referredByPhone;
        }
      } catch (refErr) {
        console.error('Referral lookup error (non-blocking):', refErr);
      }
    }

    if (!fullName || !email || !mobile || !city || !password) {
      return res.status(400).json({ message: "Name, email, mobile, city and password are required" });
    }

    const existingAdvisor = await Advisor.findOne({ email });
    if (existingAdvisor) {
      return res.status(400).json({ message: "Advisor with this email already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const advisor = new Advisor({
      fullName,
      email,
      mobile,
      whatsapp: whatsapp || mobile,
      city,
      pincode,
      address,
      password: hashedPassword,
      gender,
      age: age ? parseInt(age) : undefined,
      brokerStatus: brokerStatus || "fresher",
      status: "approved",
      isApproved: true,
      professionalPlan: professionalPlan || "basic",
      isVerified: false,
      referredBy: referredBy
    });

    await advisor.save();

    res.status(201).json({
      message: "Registration successful! You can now login."
    });
  } catch (error) {
    console.error("Register error:", error);
    res.status(500).json({ message: "Server error during registration" });
  }
});

router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Email and password required" });
    }

    const advisor = await Advisor.findOne({ email });
    if (!advisor) {
      return res.status(404).json({ message: "Advisor not found" });
    }

    const isMatch = await bcrypt.compare(password, advisor.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    // Check approval status - Auto approved, so only check rejected
    if (advisor.status === "rejected") {
      return res.status(401).json({ message: `Your account was rejected. Reason: ${advisor.adminRejectionReason || "No reason provided."}` });
    }

    const token = jwt.sign(
      { id: advisor._id, role: "advisor", email: advisor.email },
      process.env.JWT_SECRET || "trionaSecret",
      { expiresIn: "7d" }
    );

    res.json({
      message: "Login successful",
      token: token,
      user: {
        id: advisor._id,
        fullName: advisor.fullName,
        role: "advisor",
        email: advisor.email,
        mobile: advisor.mobile,
        whatsapp: advisor.whatsapp,
        city: advisor.city,
        isVerified: advisor.isVerified || false,
        professionalPlan: advisor.professionalPlan || "basic"
      }
    });

  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
