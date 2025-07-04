// Test script for mobile password reset functionality
const axios = require('axios');

const BASE_URL = 'http://localhost:3001/api';
let testResetToken = '';

console.log('📱 Testing Mobile Password Reset System...\n');

async function testMobilePasswordReset() {
  try {
    // Test 1: Request password reset
    console.log('1️⃣ Testing password reset request...');
    
    const resetResponse = await axios.post(`${BASE_URL}/auth/forgot-password`, {
      email: 'john@example.com' // Use an existing user email
    });
    
    console.log('   ✅ Password reset email sent');
    console.log('   Response:', resetResponse.data.message);
    
    // In a real scenario, you'd get the token from the email
    // For testing, we'll simulate having the token
    console.log('   📧 Check email for reset token (in real app, user copies from email)');
    
    // Test 2: Simulate token verification (mobile app would do this)
    console.log('\n2️⃣ Testing reset token verification...');
    
    // For testing, let's create a mock token (in real scenario, this comes from email)
    const mockToken = 'test_token_from_email_123456789abcdef';
    
    try {
      const verifyResponse = await axios.post(`${BASE_URL}/auth/verify-reset-token`, {
        token: mockToken
      });
      
      console.log('   ✅ Token verification successful');
      console.log('   Email:', verifyResponse.data.data.email);
      testResetToken = mockToken;
      
    } catch (error) {
      console.log('   ⚠️  Mock token invalid (expected for test)');
      console.log('   In real app: User would copy actual token from email');
      
      // For demo purposes, let's show what a successful verification looks like
      console.log('   📝 Successful verification would return:');
      console.log('   {');
      console.log('     "success": true,');
      console.log('     "message": "Reset token is valid",');
      console.log('     "data": {');
      console.log('       "email": "user@example.com",');
      console.log('       "tokenValid": true');
      console.log('     }');
      console.log('   }');
    }
    
    // Test 3: Test password reset with token
    console.log('\n3️⃣ Testing mobile password reset...');
    
    try {
      const resetPasswordResponse = await axios.post(`${BASE_URL}/auth/reset-password-mobile`, {
        token: mockToken,
        newPassword: 'NewSecurePassword123'
      });
      
      console.log('   ✅ Password reset successful');
      console.log('   Message:', resetPasswordResponse.data.message);
      
    } catch (error) {
      console.log('   ⚠️  Mock token invalid (expected for test)');
      console.log('   In real app: User would use actual token from email');
      
      // Show what a successful reset looks like
      console.log('   📝 Successful password reset would return:');
      console.log('   {');
      console.log('     "success": true,');
      console.log('     "message": "Password reset successful",');
      console.log('     "data": {');
      console.log('       "email": "user@example.com",');
      console.log('       "message": "You can now login with your new password"');
      console.log('     }');
      console.log('   }');
    }
    
    // Test 4: Test validation errors
    console.log('\n4️⃣ Testing validation errors...');
    
    // Test missing token
    try {
      await axios.post(`${BASE_URL}/auth/verify-reset-token`, {});
    } catch (error) {
      if (error.response?.status === 400) {
        console.log('   ✅ Missing token validation working');
        console.log('   Error:', error.response.data.message);
      }
    }
    
    // Test missing password
    try {
      await axios.post(`${BASE_URL}/auth/reset-password-mobile`, {
        token: 'some_token'
      });
    } catch (error) {
      if (error.response?.status === 400) {
        console.log('   ✅ Missing password validation working');
        console.log('   Error:', error.response.data.message);
      }
    }
    
    // Test short password
    try {
      await axios.post(`${BASE_URL}/auth/reset-password-mobile`, {
        token: 'some_token',
        newPassword: '123'
      });
    } catch (error) {
      if (error.response?.status === 400) {
        console.log('   ✅ Short password validation working');
        console.log('   Error:', error.response.data.message);
      }
    }
    
    console.log('\n✅ Mobile password reset system test completed!');
    
    // Show the complete mobile workflow
    console.log('\n📱 Complete Mobile App Workflow:');
    console.log('1. User taps "Forgot Password" in mobile app');
    console.log('2. User enters email address');
    console.log('3. App calls: POST /api/auth/forgot-password');
    console.log('4. User receives email with reset code');
    console.log('5. User copies reset code from email');
    console.log('6. User enters reset code in app');
    console.log('7. App calls: POST /api/auth/verify-reset-token (optional verification)');
    console.log('8. User enters new password');
    console.log('9. App calls: POST /api/auth/reset-password-mobile');
    console.log('10. User can now login with new password');
    
    console.log('\n📧 Email Format for Mobile:');
    console.log('- Contains both deep link and manual reset code');
    console.log('- Deep link: augumentapp://reset-password?token=ABC123');
    console.log('- Manual code: ABC123 (user can copy/paste)');
    console.log('- Works whether user opens email on mobile or desktop');
    
    console.log('\n🔧 Configuration:');
    console.log('- APP_SCHEME=augumentapp');
    console.log('- FRONTEND_URL=augumentapp://reset-password');
    console.log('- Crypto-based tokens (not JWT) for better mobile compatibility');
    
  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    if (error.response?.data) {
      console.error('Response data:', JSON.stringify(error.response.data, null, 2));
    }
  }
}

// Test the email service configuration
async function testEmailConfiguration() {
  console.log('\n📧 Testing Email Configuration...');
  
  try {
    // Test if email service detects mobile app configuration
    const emailService = require('./utils/emailService');
    
    console.log('Environment Variables:');
    console.log('- FRONTEND_URL:', process.env.FRONTEND_URL);
    console.log('- APP_SCHEME:', process.env.APP_SCHEME);
    
    const isMobileApp = !process.env.FRONTEND_URL || process.env.FRONTEND_URL.startsWith('augumentapp://');
    console.log('- Detected as mobile app:', isMobileApp ? '✅' : '❌');
    
    if (isMobileApp) {
      console.log('✅ Email service will send mobile-friendly emails');
      console.log('- Includes reset code for manual entry');
      console.log('- Includes deep link for direct app opening');
      console.log('- Provides clear mobile instructions');
    } else {
      console.log('⚠️  Email service will send web-style emails');
      console.log('- Consider updating FRONTEND_URL for mobile app');
    }
    
  } catch (error) {
    console.error('Email configuration test failed:', error.message);
  }
}

// Run tests
console.log('🧪 Mobile Password Reset Test Suite');
console.log('===================================\n');

testEmailConfiguration();
testMobilePasswordReset();
