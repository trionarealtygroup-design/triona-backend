const mongoose = require("mongoose");
const Property = require("./models/Property");
const AdvisorLead = require("./models/AdvisorLead");
const DirectSellerProperty = require("./models/DirectSellerProperty");
const Commission = require("./models/Commission"); // Added Commission model
require("dotenv").config();

// MOCK RESPONSE OBJECT
const res = {
    json: (data) => console.log("JSON OUTPUT:", JSON.stringify(data, null, 2)),
    status: (code) => ({ json: (data) => console.log(`STATUS ${code}:`, data) }),
    send: (data) => console.log("SEND:", data)
};

// MOCK REQUEST OBJECT
const req = {
    user: { id: "admin_id" },
    params: {},
    body: {}
};

async function runVerification() {
    try {
        await mongoose.connect(process.env.MONGO_URL || "mongodb+srv://trionaAdmin:TRIONA123@cluster0.xaplyw5.mongodb.net/trionaDB?retryWrites=true&w=majority");
        console.log("Connected to DB");

        console.log("\n--- CURRENT COUNTS IN DB ---");
        const propCount = await Property.countDocuments();
        const pendingProp = await Property.countDocuments({ status: 'pending' });
        const leadCount = await AdvisorLead.countDocuments({ leadType: 'seller', status: 'pending' });
        const directCount = await DirectSellerProperty.countDocuments({ status: 'pending' });

        console.log(`Property (Total): ${propCount}`);
        console.log(`Property (Pending): ${pendingProp}`);
        console.log(`AdvisorLead (Seller, Pending): ${leadCount}`);
        console.log(`DirectSellerProperty (Pending): ${directCount}`);


        // IMPORT CONTROLLER
        const adminController = require("./controllers/admin");

        console.log("\n--- TESTING getDashboardStats ---");
        await adminController.getDashboardStats(req, res);

        console.log("\n--- TESTING getPendingProperties ---");
        await adminController.getPendingProperties(req, res);

    } catch (error) {
        console.error("Error:", error);
    } finally {
        await mongoose.disconnect();
    }
}

runVerification();
