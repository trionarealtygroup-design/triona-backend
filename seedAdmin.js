const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const User = require("./models/User");

const MONGO_URL = "mongodb+srv://trionaAdmin:TRIONA123@cluster0.xaplyw5.mongodb.net/trionaDB?retryWrites=true&w=majority";

const seedAdmin = async () => {
    try {
        await mongoose.connect(MONGO_URL);
        console.log("Connected to DB");

        const existingAdmin = await User.findOne({ email: "Rohit@triona.com" });
        if (existingAdmin) {
            console.log("Admin already exists");
            process.exit();
        }

        const hashedPassword = await bcrypt.hash("Rohit123", 10);
        const admin = new User({
            name: "Super Admin",
            email: "admin@triona.com",
            password: hashedPassword,
            role: "admin",
            mobile: "0000000000"
        });

        await admin.save();
        console.log("Admin user created: Rohit@triona.com / Rohit123");
        process.exit();
    } catch (error) {
        console.error("Error seeding admin", error);
        process.exit(1);
    }
};

// seedAdmin();
