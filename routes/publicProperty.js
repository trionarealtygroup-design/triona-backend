const express = require("express");
const Property = require("../models/Property");
const DirectSellerProperty = require("../models/DirectSellerProperty");
const upload = require("../middleware/upload"); // Import upload middleware

const router = express.Router();

/**
 * PUBLIC → View Approved Properties
 */
router.get(
  "/",
  async (req, res) => {
    try {
      // Fetch properties from both general Property model (for advisor leads) and DirectSellerProperty
      const advisorProperties = await Property.find({ status: "live" });
      const directSellerProperties = await DirectSellerProperty.find({ status: "live" });

      const allApprovedProperties = [...advisorProperties, ...directSellerProperties];
      res.json(allApprovedProperties);
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Error fetching properties" });
    }
  }
);

/**
 * PUBLIC → View Property Details
 */
router.get(
  "/:id",
  async (req, res) => {
    try {
      let property = await Property.findById(req.params.id).populate("createdBy", "fullName email mobile whatsapp");
      if (!property) {
        property = await DirectSellerProperty.findById(req.params.id).populate({
          path: "seller",
          populate: {
            path: "user",
            select: "name email mobile whatsapp"
          }
        });
      }

      if (!property) {
        return res.status(404).json({ message: "Property not found" });
      }
      res.json(property);
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Error fetching property details" });
    }
  }
);

module.exports = router;
