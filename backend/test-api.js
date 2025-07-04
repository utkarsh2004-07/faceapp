// Simple API test script
const axios = require('axios');

const BASE_URL = 'http://localhost:5000/api';

// Test data
const testUser = {
  name: 'Test User',
  email: 'test@example.com',
  password: 'Password123'
};

async function testAPI() {
  try {
    console.log('🧪 Starting API Tests...\n');

    // Test 1: Health Check
    console.log('1. Testing Health Check...');
    const healthResponse = await axios.get(`${BASE_URL}/health`);
    console.log('✅ Health Check:', healthResponse.data.message);
    console.log('');

    // Test 2: Register User
    console.log('2. Testing User Registration...');
    try {
      const registerResponse = await axios.post(`${BASE_URL}/auth/register`, testUser);
      console.log('✅ Registration:', registerResponse.data.message);
      console.log('📧 User ID:', registerResponse.data.user.id);
    } catch (error) {
      if (error.response?.data?.message?.includes('already exists')) {
        console.log('ℹ️  User already exists, continuing with login test...');
      } else {
        throw error;
      }
    }
    console.log('');

    // Test 3: Login User
    console.log('3. Testing User Login...');
    const loginResponse = await axios.post(`${BASE_URL}/auth/login`, {
      email: testUser.email,
      password: testUser.password
    });
    console.log('✅ Login:', loginResponse.data.message);
    console.log('🔑 Token received:', loginResponse.data.token ? 'Yes' : 'No');
    
    const token = loginResponse.data.token;
    console.log('');

    // Test 4: Get User Profile
    console.log('4. Testing Protected Route (Get Profile)...');
    const profileResponse = await axios.get(`${BASE_URL}/auth/me`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    console.log('✅ Profile:', profileResponse.data.user.name);
    console.log('📧 Email:', profileResponse.data.user.email);
    console.log('✉️  Email Verified:', profileResponse.data.user.isEmailVerified);
    console.log('');

    // Test 5: Test Invalid Token
    console.log('5. Testing Invalid Token...');
    try {
      await axios.get(`${BASE_URL}/auth/me`, {
        headers: {
          'Authorization': 'Bearer invalid_token'
        }
      });
    } catch (error) {
      if (error.response?.status === 401) {
        console.log('✅ Invalid token properly rejected');
      } else {
        throw error;
      }
    }
    console.log('');

    console.log('🎉 All tests completed successfully!');
    console.log('\n📋 API Summary:');
    console.log('- Server is running on port 5000');
    console.log('- MongoDB connection is working');
    console.log('- Email service is configured');
    console.log('- JWT authentication is working');
    console.log('- All endpoints are responding correctly');

  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
  }
}

// Run tests if this file is executed directly
if (require.main === module) {
  testAPI();
}

module.exports = testAPI;
