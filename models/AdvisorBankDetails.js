const mongoose = require("mongoose");

const advisorBankDetailsSchema = new mongoose.Schema({
    advisor: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Advisor",
        required: true,
        unique: true
    },
    bankName: {
        type: String,
        required: true
    },
    accountNumber: {
        type: String,
        required: true
    },
    ifscCode: {
        type: String,
        required: true
    },
    branchAddress: {
        type: String,
        required: true
    },
    panCard: {
        type: String,
        required: true
    },
    aadhaarCard: {
        type: String,
        required: true
    },
    passbookPhoto: {
        type: String // URL to uploaded photo
    }
}, { timestamps: true });

module.exports = mongoose.model("AdvisorBankDetails", advisorBankDetailsSchema);