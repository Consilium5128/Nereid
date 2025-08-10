// test-system.js - Test the Nereid AI Agent System
const axios = require('axios');

const BASE_URL = 'http://localhost:3000';

async function testSystem() {
    console.log('🌊 Testing Nereid AI Agent System...\n');

    try {
        // Test 1: Health Check
        console.log('1. Testing health check...');
        const healthResponse = await axios.get(`${BASE_URL}/health`);
        console.log('✅ Health check passed:', healthResponse.data);
        console.log('');

        // Test 2: Demo endpoint
        console.log('2. Testing demo endpoint...');
        const demoResponse = await axios.get(`${BASE_URL}/demo`);
        console.log('✅ Demo endpoint passed');
        console.log('User ID:', demoResponse.data.user);
        console.log('Risk Score:', demoResponse.data.saa.risk);
        console.log('AI Message:', demoResponse.data.dpga.message);
        console.log('');

        // Test 3: Create user
        console.log('3. Testing user creation...');
        const userData = {
            id: 'test-user-1',
            age: 28,
            job: 'developer',
            timezone: 'America/Los_Angeles',
            onboarding: {
                last_period_start: '2025-01-01',
                typical_cycle_length: 28,
                typical_period_length: 5
            },
            notification_pref: 'minimal'
        };
        
        const userResponse = await axios.post(`${BASE_URL}/api/users`, userData);
        console.log('✅ User created:', userResponse.data.user.id);
        console.log('');

        // Test 4: Send sensor data
        console.log('4. Testing sensor data...');
        const sensorData = {
            source: 'temp',
            payload: { celsius: 36.8 },
            timestamp: new Date().toISOString()
        };
        
        const sensorResponse = await axios.post(`${BASE_URL}/api/sensors/test-user-1`, sensorData);
        console.log('✅ Sensor data sent:', sensorResponse.data.reading.source);
        console.log('');

        // Test 5: Send user log
        console.log('5. Testing user log...');
        const logData = {
            log_date: new Date().toISOString().split('T')[0],
            mood: 'happy',
            flow: 'light',
            pain: 'none',
            nutrition: 'balanced'
        };
        
        const logResponse = await axios.post(`${BASE_URL}/api/logs/test-user-1`, logData);
        console.log('✅ User log sent:', logResponse.data.log.log_date);
        console.log('');

        // Test 6: Trigger AI analysis
        console.log('6. Testing AI analysis...');
        const analysisResponse = await axios.post(`${BASE_URL}/api/analyze/test-user-1`);
        console.log('✅ AI analysis completed');
        console.log('Risk Score:', analysisResponse.data.saa.risk);
        console.log('Uncertainty:', analysisResponse.data.saa.uncertainty);
        console.log('AI Message:', analysisResponse.data.dpga.message);
        console.log('');

        // Test 7: Get predictions
        console.log('7. Testing predictions...');
        const predictionsResponse = await axios.get(`${BASE_URL}/api/predictions/test-user-1`);
        console.log('✅ Predictions retrieved');
        console.log('Next Period:', predictionsResponse.data.next_period_start);
        console.log('Cycle Length:', predictionsResponse.data.average_cycle_length);
        console.log('Current Phase:', predictionsResponse.data.current_phase);
        console.log('');

        console.log('🎉 All tests passed! The Nereid AI Agent System is working correctly.');
        console.log('');
        console.log('Next steps:');
        console.log('1. Open Nerea/Nerea.xcodeproj in Xcode');
        console.log('2. Build and run the iOS app');
        console.log('3. Navigate to the AI Insights tab to see real-time analysis');
        console.log('');
        console.log('🌊 Welcome to Nereid!');

    } catch (error) {
        console.error('❌ Test failed:', error.message);
        if (error.response) {
            console.error('Response data:', error.response.data);
        }
        console.log('');
        console.log('Troubleshooting:');
        console.log('1. Make sure the backend server is running: npm start');
        console.log('2. Check that the database is set up: npm run setup-db');
        console.log('3. Verify the server is accessible at http://localhost:3000');
    }
}

// Run the test
testSystem();
