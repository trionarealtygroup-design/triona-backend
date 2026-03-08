const mongoose = require("mongoose");

const directBuyerSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
        unique: true
    },
    // Additional buyer-specific fields can be added here if needed
}, { timestamps: true });

module.exports = mongoose.model("DirectBuyer", directBuyerSchema);