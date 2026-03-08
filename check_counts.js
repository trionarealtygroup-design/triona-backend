const mongoose = require("mongoose");
const Property = require("./models/Property");
const AdvisorLead = require("./models/AdvisorLead");
const DirectSellerProperty = require("./models/DirectSellerProperty");
require("dotenv").config();
const dns = require('dns');
try { dns.setServers(['8.8.8.8', '8.8.4.4']); } catch (e) { }

const check = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URL, { family: 4 });
        console.log("DB Connected");

        const pendingProps = await Property.countDocuments({ status: "pending" });
        const approvedProps = await Property.countDocuments({ status: "approved" });
        console.log(`Property: Pending=${pendingProps}, Approved=${approvedProps}`);

        const pendingLeads = await AdvisorLead.countDocuments({ status: "pending" });
        const approvedLeads = await AdvisorLead.countDocuments({ status: "approved" });
        const totalLeads = await AdvisorLead.countDocuments({});
        console.log(`AdvisorLead: Pending=${pendingLeads}, Approved=${approvedLeads}, Total=${totalLeads}`);

        const pendingDirect = await DirectSellerProperty.countDocuments({ status: "pending" });
        console.log(`DirectSellerProperty: Pending=${pendingDirect}`);

    } catch (error) {
        console.error("Error:", error);
    } finally {
        await mongoose.disconnect();
    }
};

check();
