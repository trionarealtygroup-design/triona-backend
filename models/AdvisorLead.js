const mongoose = require("mongoose");

const advisorLeadSchema = new mongoose.Schema({
    advisor: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Advisor",
        required: true
    },
    leadType: {
        type: String,
        enum: ["seller", "buyer"], // "sell" maps to "seller", "buy" maps to "buyer" in controller
        required: true
    },

    // Seller Fields
    ownerName: {
        type: String,
        required: function () { return this.leadType === "seller"; }
    },
    ownerMobile: {
        type: String,
    },
    propertyDetails: {
        type: String, // Description
    },
    propertyType: {
        type: String
    },
    location: {
        type: String
    },
    expectedPrice: {
        type: Number
    },
    images: {
        type: [String], // URLs to uploaded property images
    },

    // Dynamic Fields (for plots, flats, etc.)
    plotAreaSize: String,
    plotFacing: String,
    plotType: String,
    flatBHK: String,
    flatFloor: String,
    totalFloors: String,
    carpetArea: String,
    houseBuiltUpArea: String,
    houseFloors: String,

    // Buyer Fields
    buyerName: {
        type: String,
        required: function () { return this.leadType === "buyer"; }
    },
    buyerEmail: {
        type: String
    },
    buyerContact: {
        type: String,
        required: function () { return this.leadType === "buyer"; }
    },
    buyerWhatsapp: {
        type: String
    },
    interestedPropertyType: {
        type: String
    },
    budgetRange: {
        type: String
    },
    preferredLocation: {
        type: String
    },
    notes: {
        type: String
    },

    status: {
        type: String,
        enum: ["pending", "approved", "rejected", "sold", "live"],
        default: "pending"
    },
    adminRejectionReason: {
        type: String
    }
}, { timestamps: true });

module.exports = mongoose.model("AdvisorLead", advisorLeadSchema);