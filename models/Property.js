// Property Model (DataBase Structure)
const mongoose = require("mongoose");

const propertySchema = new mongoose.Schema(
  {
    title: String,
    price: Number,
    location: String,
    description: String,

    // New fields
    area: String, // e.g., "1200 sqft"
    type: String, // e.g., "Apartment", "Villa"
    amenities: [String], // Array of strings e.g., ["Pool", "Gym"]
    images: [String], // Array of image URLs

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Advisor",
    },

    status: {
      type: String,
      enum: ["pending", "approved", "rejected", "sold", "live"],
      default: "pending",
    },

    approvedByAdmin: {
      type: Boolean,
      default: false
    },

    // Commission Fields
    commissionAmount: {
      type: Number,
      default: 0
    },
    commissionStatus: {
      type: String,
      enum: ["pending", "paid"],
      default: "pending"
    },

    // Link to Originating Lead (if any)
    advisorLeadId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "AdvisorLead"
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Property", propertySchema);
