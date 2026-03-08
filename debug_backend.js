const axios = require('axios');

const API_URL = 'http://localhost:5000/api';

const runTests = async () => {
    console.log("Starting Debug Verification...");

    const timestamp = Date.now();
    const advisorData = {
        fullName: `Debug Advisor ${timestamp}`,
        email: `debug${timestamp}@test.com`,
        mobile: `9${timestamp.toString().substring(0, 9)}`,
        password: 'Password123!',
        confirmPassword: 'Password123!',
        city: 'Test City',
        whatsapp: `9${timestamp.toString().substring(0, 9)}`
    };

    console.log("Registering with:", advisorData);

    try {
        const regRes = await axios.post(`${API_URL}/advisor/register`, advisorData);
        console.log("✅ Registration successful:", regRes.status, regRes.data);
    } catch (error) {
        console.error("❌ Registration failed:");
        if (error.response) {
            console.error("   Status:", error.response.status);
            console.error("   Data:", JSON.stringify(error.response.data, null, 2));
        } else {
            console.error("   Message:", error.message);
        }
        return; // Stop if registration fails (or continue to login if assuming pre-reg)
    }

    // Login for token
    let token = '';
    try {
        const loginRes = await axios.post(`${API_URL}/advisor/login`, {
            email: advisorData.email,
            password: advisorData.password
        });
        token = loginRes.data.token;
        console.log("✅ Login successful");
    } catch (error) {
        console.error("❌ Login failed:", error.message);
        return;
    }

    // Test Sell Lead
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

    console.log("Submitting Sell Lead:", JSON.stringify(sellLeadData, null, 2));

    try {
        const sellRes = await axios.post(`${API_URL}/leads/sell`, sellLeadData, {
            headers: { Authorization: `Bearer ${token}` }
        });
        console.log("✅ Sell Lead Submission successful:", sellRes.status);
    } catch (error) {
        console.error("❌ Sell Lead Submission failed:");
        if (error.response) {
            console.error("   Status:", error.response.status);
            console.error("   Data:", JSON.stringify(error.response.data, null, 2));
        } else {
            console.error("   Message:", error.message);
        }
    }
};

runTests();
