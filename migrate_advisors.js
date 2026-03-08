const mongoose = require("mongoose");
const Advisor = require("./models/Advisor");
require("dotenv").config();

const MONGO_URL = "mongodb+srv://trionaAdmin:TRIONA123@cluster0.xaplyw5.mongodb.net/trionaDB?retryWrites=true&w=majority";

const migrateAdvisors = async () => {
    try {
        await mongoose.connect(MONGO_URL);
        console.log("Connected to DB");

        const result = await Advisor.updateMany(
            { status: "pending" },
            { $set: { status: "approved", isApproved: true } }
        );

        console.log(`Updated ${result.modifiedCount} pending advisors to approved.`);

        // Double check
        const pendingCount = await Advisor.countDocuments({ status: "pending" });
        console.log(`Remaining pending advisors: ${pendingCount}`);

        mongoose.disconnect();
    } catch (error) {
        console.error("Migration error:", error);
    }
};

migrateAdvisors();
