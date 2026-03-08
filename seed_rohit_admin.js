const mongoose = require("mongoose");
const User = require("./models/User");
const bcrypt = require("bcryptjs");
require("dotenv").config();

const MONGO_URL = "mongodb+srv://trionaAdmin:TRIONA123@cluster0.xaplyw5.mongodb.net/trionaDB?retryWrites=true&w=majority";

const seedAdmin = async () => {
    try {
        await mongoose.connect(MONGO_URL);
        console.log("Connected to DB");

        const email = "Rohit@triona.com";
        const password = "Rohit123";
        const hashedPassword = await bcrypt.hash(password, 10);

        // Check if exists
        let admin = await User.findOne({ email });

        if (admin) {
            console.log("Admin exists, updating password and role...");
            admin.password = hashedPassword;
            admin.role = "admin";
            await admin.save();
        } else {
            console.log("Creating new admin user...");
            admin = new User({
                email,
                password: hashedPassword,
                role: "admin",
                name: "Rohit Admin",
                mobile: "0000000000"
            });
            await admin.save();
        }

        console.log("Admin seeded successfully:");
        console.log(admin);

        mongoose.disconnect();
    } catch (error) {
        console.error("Error seeding admin:", error);
    }
};

seedAdmin();
