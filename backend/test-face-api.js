// Test script for Face Analysis API
const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');

const BASE_URL = 'http://localhost:3001/api';

// Test user credentials
const testUser = {
  email: 'test@example.com',
  password: 'Password123'
};

async function testFaceAnalysisAPI() {
  try {
    console.log('🧪 Testing Face Analysis API...\n');

    // Step 1: Login to get token
    console.log('1. Logging in...');
    const loginResponse = await axios.post(`${BASE_URL}/auth/login`, testUser);
    
    if (!loginResponse.data.success) {
      throw new Error('Login failed');
    }
    
    const token = loginResponse.data.token;
    console.log('✅ Login successful');
    console.log(`🔑 Token: ${token.substring(0, 20)}...`);
    console.log('');

    // Step 2: Test Face Analysis endpoint
    console.log('2. Testing Face Analysis endpoint...');
    const testResponse = await axios.get(`${BASE_URL}/face/test`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    console.log('✅ Face Analysis API is working');
    console.log('📋 Available endpoints:');
    Object.entries(testResponse.data.endpoints).forEach(([key, value]) => {
      console.log(`   - ${key}: ${value}`);
    });
    console.log('');

    // Step 3: Test file upload requirements
    console.log('3. Upload Requirements:');
    const requirements = testResponse.data.uploadRequirements;
    console.log(`   - Field name: ${requirements.fieldName}`);
    console.log(`   - Max size: ${requirements.maxSize}`);
    console.log(`   - Formats: ${requirements.allowedFormats.join(', ')}`);
    console.log(`   - Min dimensions: ${requirements.minDimensions}`);
    console.log('');

    // Step 4: Create a test image (if you want to test actual upload)
    console.log('4. Face Analysis API Test Summary:');
    console.log('✅ Authentication: Working');
    console.log('✅ Face Analysis endpoints: Available');
    console.log('✅ File upload configuration: Ready');
    console.log('');
    
    console.log('🎯 To test image upload:');
    console.log('1. Use Postman or similar tool');
    console.log('2. POST to http://localhost:3001/api/face/analyze');
    console.log('3. Add Authorization header with Bearer token');
    console.log('4. Upload image file with field name "faceImage"');
    console.log('');
    
    console.log('📖 See POSTMAN_TESTING_GUIDE.md for detailed instructions');

  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
  }
}

// Run the test
testFaceAnalysisAPI();
