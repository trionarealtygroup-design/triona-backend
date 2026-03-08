try {
    const admin = require("./controllers/admin");
    console.log("Syntax check passed: admin.js loaded successfully");
} catch (e) {
    console.error("Syntax check failed:", e);
}
