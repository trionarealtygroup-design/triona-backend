const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
require("dotenv").config();
const dns = require('dns');
// Try to force Google DNS for resolution to fix querySrv ECONNREFUSED
try {
  dns.setServers(['8.8.8.8', '8.8.4.4']);
} catch (e) {
  console.error("Failed to set DNS servers:", e);
}

const adminRoutes = require("./routes/admin");
const directSellerRoutes = require("./routes/directSeller");
const advisorAuthRoutes = require("./routes/advisorAuth");
const leadRoutes = require("./routes/leads"); // Import the real leads route

const app = express();

//middlewares
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:3000'], // Allow both common React ports
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  credentials: true
}));
app.use(express.json({ limit: '50mb' })); // Increase limit for base64 images
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// routes
app.use("/api/auth", require("./routes/auth"));
app.use("/api/property", require("./routes/publicProperty"));
app.use("/api/advisor", advisorAuthRoutes); // Advisor login/register
app.use("/api/advisor", require("./routes/advisor")); // Advisor dashboard routes (protected)
app.use("/api/direct-seller", directSellerRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/leads", leadRoutes); // Use the imported leadRoutes
app.use("/api/contact", require("./routes/contact"));
app.use("/api/advisor-extra", require("./routes/advisorExtra"));
app.use("/api/admin-extra", require("./routes/adminExtra"));

// MongoDB connection
const MONGO_URL = process.env.MONGO_URL || "mongodb+srv://trionaAdmin:TRIONA123@cluster0.xaplyw5.mongodb.net/trionaDB?retryWrites=true&w=majority";

mongoose
  .connect(MONGO_URL, { family: 4 })
  .then(() => {
    console.log("MongDB connected successfully");
  })
  .catch((err) => {
    console.error("MongoDB connection error:", err);
  });

//test route
app.get("/", (req, res) => {
  res.send("TRIONA backend running");
});

//server start
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});