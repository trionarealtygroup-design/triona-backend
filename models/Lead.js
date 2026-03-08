const mongoose = require("mongoose");

const leadSchema = new mongoose.Schema(
  {
    leadType: {
      type: String,
      enum: ["sell", "buy"],
      required: true
    },
    
    // Common fields
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Advisor",
      required: true
    },
    
    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending"
    },

    // SELL LEAD FIELDS
    ownerName: String,
    ownerMobile: String,
    propertyType: {
      type: String,
      enum: ["Plot", "Flat", "House", "Commercial", "Land", "Bungalow", "Villa"]
    },
    location: String,
    expectedPrice: Number,
    propertyDescription: String,
    propertyImages: [String], // Max 5 images
    
    // Dynamic fields based on property type
    // For Plot
    plotAreaSize: String,
    plotFacing: String,
    plotType: String,
    
    // For Flat
    flatBHK: String,
    flatFloor: String,
    totalFloors: String,
    carpetArea: String,
    
    // For House
    houseBuiltUpArea: String,
    houseFloors: String,

    // BUY LEAD FIELDS
    buyerName: String,
    buyerEmail: String,
    buyerPhone: String,
    buyerWhatsapp: String,
    interestedPropertyType: String,
    budgetRange: String,
    preferredLocation: String,
    notes: String
  },
  { timestamps: true }
);

module.exports = mongoose.model("Lead", leadSchema);
