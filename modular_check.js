console.log("Checking Advisor...");
try { require('./models/Advisor'); console.log("Advisor OK"); } catch (e) { console.error("Advisor Failed:", e); }

console.log("Checking Property...");
try { require('./models/Property'); console.log("Property OK"); } catch (e) { console.error("Property Failed:", e); }

console.log("Checking Admin Controller...");
try { require('./controllers/admin'); console.log("Admin OK"); } catch (e) { console.error("Admin Failed:", e); }
