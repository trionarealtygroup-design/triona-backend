const express = require("express");
const router = express.Router();
const authControllers = require("../controllers/authControllers");
const verifyToken = require("../middleware/verifyToken");

// ================== REGISTER ROUTES ==================

// Register Buyer
router.post("/register/buyer", authControllers.registerBuyer);

// Register Seller
router.post("/register/seller", authControllers.registerSeller);

const upload = require("../middleware/upload");

// Register Advisor
router.post("/register/advisor", upload.fields([{ name: 'profilePhoto', maxCount: 1 }, { name: 'passbookPhoto', maxCount: 1 }]), authControllers.registerAdvisor);

// ================== LOGIN ROUTE ==================
router.post("/login", authControllers.loginUser);

// ================== PROTECTED ROUTE ==================
router.get("/me", verifyToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password");
    if (!user) return res.status(404).json({ message: "User not found" });

    res.status(200).json({ message: "User data fetched", user });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;