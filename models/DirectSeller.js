const mongoose = require("mongoose");

const directSellerSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
        unique: true
    },
    // Additional seller-specific fields can be added here if needed
}, { timestamps: true });

module.exports = mongoose.model("DirectSeller", directSellerSchema);