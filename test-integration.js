// Integration Test Script for Frontend-Backend
// This script tests the updated service endpoints

import axios from 'axios';

const API_BASE_URL = 'http://localhost:3000/api';
let authToken = null;
let userId = null;

// Test results tracker
const results = {
    passed: [],
    failed: [],
};

// Helper to log results
function logTest(name, passed, error = null) {
    if (passed) {
        results.passed.push(name);
        console.log(`✅ ${name}`);
    } else {
        results.failed.push({ name, error });
        console.log(`❌ ${name}${error ? ': ' + error : ''}`);
    }
}

// Test 1: Register a new user
async function testRegister() {
    try {
        const timestamp = Date.now();
        const response = await axios.post(`${API_BASE_URL}/auth/register`, {
            email: `test${timestamp}@example.com`,
            password: 'Password123!',
            fullName: 'Integration Test User',
            ci: `CI${timestamp}`,
            phoneNumber: '1234567890',
            city: 'Bogotá',
        });

        authToken = response.data.access_token;
        userId = response.data.user.id;
        logTest('Auth: Register', response.status === 201);
    } catch (error) {
        logTest('Auth: Register', false, error.response?.data?.message || error.message);
    }
}

// Test 2: Login
async function testLogin() {
    try {
        const response = await axios.post(`${API_BASE_URL}/auth/login`, {
            email: 'test@example.com',
            password: 'Password123!',
        });

        logTest('Auth: Login', response.status === 200 || response.status === 201);
    } catch (error) {
        // Expected to fail if user doesn't exist, but endpoint should respond
        logTest('Auth: Login (endpoint accessible)', error.response?.status === 401 || error.response?.status === 404);
    }
}

// Test 3: Get Profile (uses /users/me)
async function testGetProfile() {
    try {
        const response = await axios.get(`${API_BASE_URL}/users/me`, {
            headers: { Authorization: `Bearer ${authToken}` },
        });

        logTest('Auth: Get Profile (/users/me)', response.status === 200 && response.data.email);
    } catch (error) {
        logTest('Auth: Get Profile', false, error.response?.data?.message || error.message);
    }
}

// Test 4: Update Profile (uses PATCH /users/me)
async function testUpdateProfile() {
    try {
        const response = await axios.patch(
            `${API_BASE_URL}/users/me`,
            {
                fullName: 'Updated Integration User',
            },
            {
                headers: { Authorization: `Bearer ${authToken}` },
            }
        );

        logTest('Auth: Update Profile (PATCH /users/me)', response.status === 200);
    } catch (error) {
        logTest('Auth: Update Profile', false, error.response?.data?.message || error.message);
    }
}

// Test 5: Search Players
async function testSearchPlayers() {
    try {
        const response = await axios.get(`${API_BASE_URL}/players/search?name=test`, {
            headers: { Authorization: `Bearer ${authToken}` },
        });

        logTest('Players: Search', response.status === 200);
    } catch (error) {
        logTest('Players: Search', false, error.response?.data?.message || error.message);
    }
}

// Test 6: Get Players by Team
async function testGetPlayersByTeam() {
    try {
        // Using a dummy UUID - should return 404 or empty array
        const response = await axios.get(`${API_BASE_URL}/players/team/123e4567-e89b-12d3-a456-426614174000`, {
            headers: { Authorization: `Bearer ${authToken}` },
        });

        logTest('Players: Get by Team (endpoint accessible)', response.status === 200 || response.status === 404);
    } catch (error) {
        logTest('Players: Get by Team (endpoint accessible)', error.response?.status === 404 || error.response?.status === 400);
    }
}

// Test 7: Get All Zones
async function testGetZones() {
    try {
        const response = await axios.get(`${API_BASE_URL}/zones`, {
            headers: { Authorization: `Bearer ${authToken}` },
        });

        logTest('Zones: Get All', response.status === 200);
    } catch (error) {
        logTest('Zones: Get All', false, error.response?.data?.message || error.message);
    }
}

// Test 8: Get Global Dominance
async function testGetGlobalDominance() {
    try {
        const response = await axios.get(`${API_BASE_URL}/zones/global-dominance`, {
            headers: { Authorization: `Bearer ${authToken}` },
        });

        logTest('Zones: Get Global Dominance', response.status === 200);
    } catch (error) {
        logTest('Zones: Get Global Dominance', false, error.response?.data?.message || error.message);
    }
}

// Test 9: Get Zone Challenges
async function testGetZoneChallenges() {
    try {
        const response = await axios.get(`${API_BASE_URL}/zones/challenges`, {
            headers: { Authorization: `Bearer ${authToken}` },
        });

        logTest('Zones: Get Challenges', response.status === 200);
    } catch (error) {
        logTest('Zones: Get Challenges', false, error.response?.data?.message || error.message);
    }
}

// Test 10: Get Zone Statistics
async function testGetZoneStatistics() {
    try {
        const response = await axios.get(`${API_BASE_URL}/zones/statistics`, {
            headers: { Authorization: `Bearer ${authToken}` },
        });

        logTest('Zones: Get Statistics', response.status === 200);
    } catch (error) {
        logTest('Zones: Get Statistics', false, error.response?.data?.message || error.message);
    }
}

// Main test runner
async function runTests() {
    console.log('🚀 Starting Integration Tests...\n');
    console.log('Testing Frontend-Backend Integration');
    console.log('=====================================\n');

    await testRegister();
    await testLogin();

    if (authToken) {
        await testGetProfile();
        await testUpdateProfile();
        await testSearchPlayers();
        await testGetPlayersByTeam();
        await testGetZones();
        await testGetGlobalDominance();
        await testGetZoneChallenges();
        await testGetZoneStatistics();
    } else {
        console.log('\n⚠️  Skipping authenticated tests - registration failed\n');
    }

    // Print summary
    console.log('\n=====================================');
    console.log('Test Summary');
    console.log('=====================================');
    console.log(`✅ Passed: ${results.passed.length}`);
    console.log(`❌ Failed: ${results.failed.length}`);

    if (results.failed.length > 0) {
        console.log('\nFailed Tests:');
        results.failed.forEach(({ name, error }) => {
            console.log(`  - ${name}: ${error}`);
        });
    }

    console.log('\n✨ Integration test complete!\n');
    process.exit(results.failed.length === 0 ? 0 : 1);
}

// Run tests
runTests().catch((error) => {
    console.error('❌ Test execution failed:', error);
    process.exit(1);
});
