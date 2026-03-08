const mongoose = require("mongoose");
const Property = require("./models/Property");
const AdvisorLead = require("./models/AdvisorLead");
const DirectSellerProperty = require("./models/DirectSellerProperty");
// Removed supertest
// Actually simpler to just use my existing models to seed some test data if needed, or just query current state. user says "Ensure... appear correctly".
// I'll create a script that connects to DB, checks for existence of pending items, and then mocks the controller logic to see output.

require("dotenv").config();
const dns = require('dns');
try { dns.setServers(['8.8.8.8', '8.8.4.4']); } catch (e) { }

const adminController = require("./controllers/admin");

// Mock Express Response
const mockRes = () => {
    const res = {};
    res.json = (data) => {
        console.log("Response JSON length:", Array.isArray(data) ? data.length : 'Object');
        if (Array.isArray(data) && data.length > 0) {
            console.log("First item sample:", JSON.stringify(data[0], null, 2));
        } else {
            console.log("Data:", JSON.stringify(data, null, 2));
        }
        return res;
    };
    res.status = (code) => {
        console.log("Response Status:", code);
        return res;
    };
    return res;
};

// Mock Express Request
const mockReq = (query = {}) => ({
    query,
    params: {}
});

const verify = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URL, { family: 4 });
        console.log("DB Connected");

        console.log("\n--- Testing getAllProperties ---");
        await adminController.getAllProperties(mockReq(), mockRes());

        console.log("\n--- Testing getPendingProperties ---");
        await adminController.getPendingProperties(mockReq(), mockRes());

        console.log("\n--- Testing getAllAdvisorLeads ---");
        await adminController.getAllAdvisorLeads(mockReq(), mockRes());

    } catch (error) {
        console.error("Verification Error:", error);
    } finally {
        await mongoose.disconnect();
    }
};

verify();
