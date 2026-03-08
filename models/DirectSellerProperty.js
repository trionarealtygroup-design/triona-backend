const mongoose = require("mongoose");

const directSellerPropertySchema = new mongoose.Schema({
    seller: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "DirectSeller",
        required: true
    },
    title: {
        type: String,
        required: true
    },
    description: {
        type: String,
        required: true
    },
    location: {
        type: String,
        required: true
    },
    price: {
        type: Number,
        required: true
    },
    images: {
        type: [String], // URLs to uploaded property images
        required: true
    },
    status: {
        type: String,
        enum: ["pending", "approved", "rejected", "sold"],
        default: "pending"
    },
    adminRejectionReason: {
        type: String
    }
}, { timestamps: true });

module.exports = mongoose.model("DirectSellerProperty", directSellerPropertySchema);