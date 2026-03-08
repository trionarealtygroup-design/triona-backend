const mongoose = require("mongoose");

const advisorSchema = new
    mongoose.Schema({
        fullName: {
            type: String,
            required: true
        },

        email: {
            type: String,
            required: true,
            unique: true
        },

        mobile: {
            type: String,
            required: true
        },

        whatsapp: {
            type: String
        },
        city: {
            type: String,
            required: true
        },

        pincode: {
            type: String
        },

        address: {
            type: String
        },

        password: {
            type: String,
            required: true
        },

        gender: {
            type: String,
            enum: ["male", "female", "other"]
        },

        age: {
            type: Number
        },

        brokerStatus: {
            type: String,
            enum: ["existing_broker", "fresher"],
            default: "fresher"
        },

        isApproved: {
            type: Boolean,
            default: true
        },
        profilePhoto: {
            type: String
        },
        status: {
            type: String,
            enum: ["pending", "approved", "rejected"],
            default: "approved"
        },
        adminRejectionReason: {
            type: String
        },
        professionalPlan: {
            type: String,
            enum: ["basic", "premium", "premium_plus"],
            default: "basic"
        },
        isVerified: {
            type: Boolean,
            default: false
        },
        referredBy: {
            type: String
        }

    }, { timestamps: true });

module.exports = mongoose.model("Advisor", advisorSchema);