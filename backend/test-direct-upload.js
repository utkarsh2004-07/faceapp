// Test script for direct upload functionality
require('dotenv').config();
const axios = require('axios');

const BASE_URL = 'http://localhost:3001';

// Test user credentials (you'll need to create a test user first)
const TEST_USER = {
  email: 'test@example.com',
  password: 'TestPassword123'
};

let authToken = null;

async function authenticateUser() {
  try {
    console.log('🔐 Authenticating test user...');
    
    const response = await axios.post(`${BASE_URL}/api/auth/login`, TEST_USER);
    
    if (response.data.success) {
      authToken = response.data.token;
      console.log('✅ Authentication successful');
      return true;
    } else {
      console.log('❌ Authentication failed:', response.data.message);
      return false;
    }
  } catch (error) {
    console.log('❌ Authentication error:', error.response?.data?.message || error.message);
    return false;
  }
}

async function testUploadConfig() {
  try {
    console.log('\n📋 Testing upload configuration...');
    
    const response = await axios.get(`${BASE_URL}/api/upload/config`, {
      headers: {
        'Authorization': `Bearer ${authToken}`
      }
    });
    
    if (response.data.success) {
      console.log('✅ Upload config retrieved successfully');
      console.log('   Cloud Name:', response.data.data.cloudName);
      console.log('   Max File Size:', response.data.data.maxFileSize, 'bytes');
      console.log('   Allowed Formats:', response.data.data.allowedFormats.join(', '));
      console.log('   Auto Delete Days:', response.data.data.autoDeleteDays);
      return response.data.data;
    } else {
      console.log('❌ Failed to get upload config:', response.data.message);
      return null;
    }
  } catch (error) {
    console.log('❌ Upload config error:', error.response?.data?.message || error.message);
    return null;
  }
}

async function testUploadSignature() {
  try {
    console.log('\n🔑 Testing upload signature generation...');
    
    const response = await axios.post(`${BASE_URL}/api/upload/signature`, {}, {
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (response.data.success) {
      console.log('✅ Upload signature generated successfully');
      console.log('   Public ID:', response.data.data.publicId);
      console.log('   Upload URL:', response.data.data.uploadUrl);
      console.log('   Auto Delete Date:', response.data.data.autoDeleteDate);
      console.log('   Signature length:', response.data.data.signature.length, 'characters');
      return response.data.data;
    } else {
      console.log('❌ Failed to generate upload signature:', response.data.message);
      return null;
    }
  } catch (error) {
    console.log('❌ Upload signature error:', error.response?.data?.message || error.message);
    return null;
  }
}

async function testUploadInfo() {
  try {
    console.log('\n📖 Testing upload info endpoint...');
    
    const response = await axios.get(`${BASE_URL}/api/upload/info`, {
      headers: {
        'Authorization': `Bearer ${authToken}`
      }
    });
    
    if (response.data.success) {
      console.log('✅ Upload info retrieved successfully');
      console.log('   Available endpoints:');
      Object.entries(response.data.endpoints).forEach(([key, value]) => {
        console.log(`     ${key}: ${value}`);
      });
      console.log('   Workflow steps:');
      response.data.workflow.forEach((step, index) => {
        console.log(`     ${index + 1}. ${step}`);
      });
      return response.data;
    } else {
      console.log('❌ Failed to get upload info:', response.data.message);
      return null;
    }
  } catch (error) {
    console.log('❌ Upload info error:', error.response?.data?.message || error.message);
    return null;
  }
}

async function testFaceAnalysisInfo() {
  try {
    console.log('\n🔍 Testing face analysis info endpoint...');
    
    const response = await axios.get(`${BASE_URL}/api/face/info`, {
      headers: {
        'Authorization': `Bearer ${authToken}`
      }
    });
    
    if (response.data.success) {
      console.log('✅ Face analysis info retrieved successfully');
      console.log('   Available endpoints:');
      Object.entries(response.data.endpoints).forEach(([key, value]) => {
        console.log(`     ${key}: ${value}`);
      });
      return response.data;
    } else {
      console.log('❌ Failed to get face analysis info:', response.data.message);
      return null;
    }
  } catch (error) {
    console.log('❌ Face analysis info error:', error.response?.data?.message || error.message);
    return null;
  }
}

async function testCloudinaryConfiguration() {
  try {
    console.log('\n☁️ Testing Cloudinary configuration...');
    
    const cloudinaryService = require('./utils/cloudinaryService');
    
    const isConfigured = cloudinaryService.isConfigured();
    console.log(`   Configuration status: ${isConfigured ? '✅ Configured' : '❌ Not configured'}`);
    
    if (isConfigured) {
      console.log(`   Cloud Name: ${process.env.CLOUDINARY_CLOUD_NAME}`);
      console.log(`   API Key: ${process.env.CLOUDINARY_API_KEY ? '***' + process.env.CLOUDINARY_API_KEY.slice(-4) : 'Not set'}`);
      console.log(`   Auto Delete Days: ${process.env.CLOUDINARY_AUTO_DELETE_DAYS || 5}`);
    }
    
    return isConfigured;
  } catch (error) {
    console.log('❌ Cloudinary configuration error:', error.message);
    return false;
  }
}

async function runAllTests() {
  console.log('🧪 Testing Direct Upload Implementation...\n');
  
  // Test 1: Cloudinary Configuration
  const cloudinaryConfigured = await testCloudinaryConfiguration();
  if (!cloudinaryConfigured) {
    console.log('\n❌ Cloudinary not properly configured. Please check your .env file.');
    return;
  }
  
  // Test 2: User Authentication
  const authenticated = await authenticateUser();
  if (!authenticated) {
    console.log('\n❌ Authentication failed. Please create a test user first.');
    console.log('   You can create a user by calling: POST /api/auth/register');
    console.log('   With body: { "name": "Test User", "email": "test@example.com", "password": "testpassword123" }');
    return;
  }
  
  // Test 3: Upload Configuration
  const uploadConfig = await testUploadConfig();
  
  // Test 4: Upload Signature
  const uploadSignature = await testUploadSignature();
  
  // Test 5: Upload Info
  const uploadInfo = await testUploadInfo();
  
  // Test 6: Face Analysis Info
  const faceAnalysisInfo = await testFaceAnalysisInfo();
  
  console.log('\n🎉 Direct Upload Implementation Test Completed!');
  console.log('\n📋 Summary:');
  console.log(`   Cloudinary Configuration: ${cloudinaryConfigured ? '✅' : '❌'}`);
  console.log(`   User Authentication: ${authenticated ? '✅' : '❌'}`);
  console.log(`   Upload Config: ${uploadConfig ? '✅' : '❌'}`);
  console.log(`   Upload Signature: ${uploadSignature ? '✅' : '❌'}`);
  console.log(`   Upload Info: ${uploadInfo ? '✅' : '❌'}`);
  console.log(`   Face Analysis Info: ${faceAnalysisInfo ? '✅' : '❌'}`);
  
  if (uploadSignature) {
    console.log('\n🚀 Ready for frontend integration!');
    console.log('   Next steps:');
    console.log('   1. Use the upload signature to upload images directly to Cloudinary');
    console.log('   2. Call POST /api/face/analyze-direct with the upload result');
    console.log('   3. Check the comprehensive documentation in CLOUDINARY_INTEGRATION_GUIDE.md');
  }
}

// Run the tests
runAllTests().catch(console.error);
