const mongoose = require("mongoose");
const User = require("./models/User");
require("dotenv").config();

// Use the same connection string as server.js
const MONGO_URL = "mongodb+srv://trionaAdmin:TRIONA123@cluster0.xaplyw5.mongodb.net/trionaDB?retryWrites=true&w=majority";

mongoose.connect(MONGO_URL)
    .then(async () => {
        console.log("Connected to DB");

        const adminUser = await User.findOne({ email: "Rohit@triona.com" });
        if (adminUser) {
            console.log("Admin User FOUND:");
            console.log(JSON.stringify(adminUser.toJSON(), null, 2));
        } else {
            console.log("Admin User 'Rohit@triona.com' NOT FOUND");
        }

        // Also check if any user has role 'admin'
        const anyAdmin = await User.findOne({ role: "admin" });
        if (anyAdmin) {
            console.log("Some Admin User Found:");
            console.log(JSON.stringify(anyAdmin.toJSON(), null, 2));
        }

        mongoose.disconnect();
    })
    .catch(err => {
        console.error("DB Error:", err);
    });
