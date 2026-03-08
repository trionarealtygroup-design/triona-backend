const axios = require('axios');

const API_URL = 'http://localhost:5000/api';
let advisorToken = '';
let advisorId = '';
let propertyId = '';

const runTests = async () => {
    console.log("Starting Backend Verification...");

    // 1. Register Advisor
    console.log("\n1. Testing Advisor Registration...");
    const timestamp = Date.now();
    const advisorData = {
        fullName: `Test Advisor ${timestamp}`,
        email: `advisor${timestamp}@test.com`,
        mobile: `9${timestamp.toString().substring(0, 9)}`,
        password: 'Password123!',
        confirmPassword: 'Password123!', // Depending on backend validation
        city: 'Test City',
        whatsapp: `9${timestamp.toString().substring(0, 9)}`
    };

    try {
        const regRes = await axios.post(`${API_URL}/advisor/register`, advisorData);
        console.log("   ✅ Registration successful:", regRes.status);
    } catch (error) {
        console.error("   ❌ Registration failed:", error.response ? error.response.data : error.message);
    }

    // 2. Login Advisor
    console.log("\n2. Testing Advisor Login...");
    try {
        const loginRes = await axios.post(`${API_URL}/advisor/login`, {
            email: advisorData.email,
            password: advisorData.password
        });
        if (loginRes.data.token) {
            advisorToken = loginRes.data.token;
            advisorId = loginRes.data.user.id;
            console.log("   ✅ Login successful. Token received.");
        } else {
            console.error("   ❌ Login failed: No token received.");
        }
    } catch (error) {
        console.error("   ❌ Login failed:", error.response ? error.response.data : error.message);
        return; // Stop if login fails
    }

    // 3. Submit Sell Lead
    console.log("\n3. Testing Sell Lead Submission...");
    const sellLeadData = {
        leadType: 'sell',
        ownerName: 'Test Owner',
        ownerMobile: '9876543210',
        propertyType: 'House',
        location: 'Test Location',
        expectedPrice: 5000000,
        propertyDescription: 'A beautiful test house',
        propertyImages: ['https://placehold.co/600x400', 'https://placehold.co/600x400'], // Mock images
        plotAreaSize: '1200 sqft'
    };

    try {
        const sellRes = await axios.post(`${API_URL}/leads/sell`, sellLeadData, {
            headers: { Authorization: `Bearer ${advisorToken}` }
        });
        console.log("   ✅ Sell Lead Submission successful:", sellRes.status);
    } catch (error) {
        console.error("   ❌ Sell Lead Submission failed:", error.response ? error.response.data : error.message);
    }

    // 4. Submit Buy Lead
    console.log("\n4. Testing Buy Lead Submission...");
    const buyLeadData = {
        leadType: 'buy',
        buyerName: 'Test Buyer',
        buyerEmail: 'buyer@test.com',
        buyerPhone: '9876543210',
        interestedPropertyType: 'Flat',
        budgetRange: '50L-1Cr',
        preferredLocation: 'Test Location'
    };

    try {
        const buyRes = await axios.post(`${API_URL}/leads/buy`, buyLeadData, {
            headers: { Authorization: `Bearer ${advisorToken}` }
        });
        console.log("   ✅ Buy Lead Submission successful:", buyRes.status);
    } catch (error) {
        console.error("   ❌ Buy Lead Submission failed:", error.response ? error.response.data : error.message);
    }

    // 5. Check Admin Property Details (Invalid ID)
    console.log("\n5. Testing Admin Property Details (Invalid ID)...");
    try {
        await axios.get(`${API_URL}/admin/properties/invalid-id-123`, {
            headers: { Authorization: `Bearer ${advisorToken}` } // Assuming admin uses same token structure or this route is protected
        });
        console.error("   ❌ Should have failed but succeeded.");
    } catch (error) {
        if (error.response && error.response.status === 400) {
            console.log("   ✅ Correctly returned 400 for invalid ID.");
        } else {
            console.error("   ❌ Unexpected error:", error.response ? error.status : error.message);
        }
    }

    console.log("\nVerification Complete.");
};

runTests();
