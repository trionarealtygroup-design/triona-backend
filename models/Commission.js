const mongoose = require("mongoose");

const commissionSchema = new mongoose.Schema({
    advisor: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Advisor",
        required: true
    },
    property: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Property", // Assuming this links to a general property model, or DirectSellerProperty/AdvisorLead if more specific
        required: true
    },
    commissionPercentage: {
        type: Number,
        required: true
    },
    commissionAmount: {
        type: Number,
        required: true
    },
    status: {
        type: String,
        enum: ["pending", "paid"],
        default: "pending"
    },
    adminNotes: {
        type: String
    }
}, { timestamps: true });

module.exports = mongoose.model("Commission", commissionSchema);