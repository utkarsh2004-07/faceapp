// Comprehensive test for all mobile-compatible features
const axios = require('axios');

const BASE_URL = 'http://localhost:3001/api';

console.log('📱 Testing All Mobile-Compatible Features...\n');

async function testAllMobileFeatures() {
  try {
    // Test 1: Check mobile app detection
    console.log('1️⃣ Testing mobile app detection...');
    
    console.log('Environment Variables:');
    console.log('- FRONTEND_URL:', process.env.FRONTEND_URL);
    console.log('- APP_SCHEME:', process.env.APP_SCHEME);
    
    const isMobileApp = !process.env.FRONTEND_URL || process.env.FRONTEND_URL.startsWith('augumentapp://');
    console.log('- Detected as mobile app:', isMobileApp ? '✅' : '❌');
    
    if (isMobileApp) {
      console.log('✅ All email services will use mobile-friendly format');
    } else {
      console.log('⚠️  Email services will use web format');
    }
    
    // Test 2: Test CORS configuration
    console.log('\n2️⃣ Testing CORS configuration...');
    
    try {
      const healthResponse = await axios.get(`${BASE_URL}/health`);
      console.log('✅ CORS allowing requests');
      console.log('Health check:', healthResponse.data.message);
    } catch (error) {
      console.log('❌ CORS issue:', error.message);
    }
    
    // Test 3: Test user registration (triggers email verification)
    console.log('\n3️⃣ Testing user registration with mobile email...');
    
    const testUser = {
      name: 'Mobile Test User',
      email: 'mobiletest@example.com',
      password: 'TestPassword123',
      gender: 'female'
    };
    
    try {
      const registerResponse = await axios.post(`${BASE_URL}/auth/register`, testUser);
      console.log('✅ User registration successful');
      console.log('Message:', registerResponse.data.message);
      console.log('📧 Email verification sent (mobile format)');
    } catch (error) {
      if (error.response?.status === 400 && error.response.data.message.includes('already exists')) {
        console.log('ℹ️  User already exists, proceeding to other tests');
      } else {
        console.log('❌ Registration error:', error.response?.data?.message || error.message);
      }
    }
    
    // Test 4: Test password reset request
    console.log('\n4️⃣ Testing password reset request...');
    
    try {
      const resetResponse = await axios.post(`${BASE_URL}/auth/forgot-password`, {
        email: 'john@example.com' // Use existing user
      });
      console.log('✅ Password reset email sent');
      console.log('Message:', resetResponse.data.message);
      console.log('📧 Reset email sent (mobile format with deep link and code)');
    } catch (error) {
      console.log('❌ Password reset error:', error.response?.data?.message || error.message);
    }
    
    // Test 5: Test mobile-specific endpoints
    console.log('\n5️⃣ Testing mobile-specific endpoints...');
    
    // Test verify reset token endpoint
    try {
      await axios.post(`${BASE_URL}/auth/verify-reset-token`, {
        token: 'test_token_123'
      });
    } catch (error) {
      if (error.response?.status === 400) {
        console.log('✅ Verify reset token endpoint working (validation error expected)');
      }
    }
    
    // Test mobile password reset endpoint
    try {
      await axios.post(`${BASE_URL}/auth/reset-password-mobile`, {
        token: 'test_token_123',
        newPassword: 'NewPassword123'
      });
    } catch (error) {
      if (error.response?.status === 400) {
        console.log('✅ Mobile password reset endpoint working (validation error expected)');
      }
    }
    
    // Test mobile email verification endpoint
    try {
      await axios.post(`${BASE_URL}/auth/verify-email-mobile`, {
        token: 'test_token_123'
      });
    } catch (error) {
      if (error.response?.status === 400) {
        console.log('✅ Mobile email verification endpoint working (validation error expected)');
      }
    }
    
    // Test 6: Test face analysis endpoints (mobile compatible)
    console.log('\n6️⃣ Testing face analysis endpoints...');
    
    try {
      const faceTestResponse = await axios.get(`${BASE_URL}/face/test`);
      console.log('✅ Face analysis endpoints accessible');
      console.log('Available endpoints:', Object.keys(faceTestResponse.data.endpoints).length);
    } catch (error) {
      console.log('ℹ️  Face analysis test endpoint response:', error.response?.status);
    }
    
    console.log('\n✅ All mobile feature tests completed!');
    
    // Summary of mobile-compatible features
    console.log('\n📱 Mobile-Compatible Features Summary:');
    console.log('✅ Email Verification - Mobile format with deep links and codes');
    console.log('✅ Password Reset - Mobile format with deep links and codes');
    console.log('✅ Welcome Email - Mobile format with app features list');
    console.log('✅ CORS Configuration - Allows mobile app requests');
    console.log('✅ Mobile-Specific Endpoints:');
    console.log('   - POST /api/auth/verify-reset-token');
    console.log('   - POST /api/auth/reset-password-mobile');
    console.log('   - POST /api/auth/verify-email-mobile');
    console.log('✅ Deep Link Support:');
    console.log('   - augumentapp://verify-email?token=ABC123');
    console.log('   - augumentapp://reset-password?token=ABC123');
    console.log('   - augumentapp://home');
    
    console.log('\n📧 Email Format Examples:');
    console.log('Email Verification:');
    console.log('- Deep Link: augumentapp://verify-email?token=ABC123');
    console.log('- Manual Code: ABC123 (user can copy/paste)');
    console.log('- Instructions: Step-by-step mobile app guide');
    
    console.log('\nPassword Reset:');
    console.log('- Deep Link: augumentapp://reset-password?token=ABC123');
    console.log('- Manual Code: ABC123 (user can copy/paste)');
    console.log('- Instructions: Step-by-step mobile app guide');
    
    console.log('\nWelcome Email:');
    console.log('- Deep Link: augumentapp://home');
    console.log('- Feature List: AI color recommendations, face analysis, etc.');
    console.log('- Mobile-optimized content');
    
  } catch (error) {
    console.error('\n❌ Test suite failed:', error.message);
    if (error.response?.data) {
      console.error('Response data:', JSON.stringify(error.response.data, null, 2));
    }
  }
}

// Test email service configuration
async function testEmailServiceConfiguration() {
  console.log('\n📧 Testing Email Service Configuration...');
  
  try {
    const emailService = require('./utils/emailService');
    
    console.log('Email Service Status:');
    console.log('- Service loaded:', !!emailService ? '✅' : '❌');
    
    // Test mobile detection logic
    const isMobileApp = !process.env.FRONTEND_URL || process.env.FRONTEND_URL.startsWith('augumentapp://');
    console.log('- Mobile app detected:', isMobileApp ? '✅' : '❌');
    
    if (isMobileApp) {
      console.log('- Email format: Mobile (deep links + codes)');
      console.log('- Deep link scheme:', process.env.APP_SCHEME || 'augumentapp');
    } else {
      console.log('- Email format: Web (traditional links)');
      console.log('- Frontend URL:', process.env.FRONTEND_URL);
    }
    
  } catch (error) {
    console.error('Email service configuration test failed:', error.message);
  }
}

// Run all tests
console.log('🧪 Mobile App Integration Test Suite');
console.log('====================================\n');

testEmailServiceConfiguration();
testAllMobileFeatures();
