const axios = require('axios');

const BASE_URL = 'http://localhost:3001/api/auth';

// Test data
const testUser = {
  name: 'Test User',
  email: 'test@example.com',
  password: 'password123',
  gender: 'male'
};

async function testOTPSystem() {
  console.log('🧪 Testing OTP-based Email Verification System\n');

  try {
    // Step 1: Register a new user
    console.log('1️⃣ Registering new user...');
    const registerResponse = await axios.post(`${BASE_URL}/register`, testUser);
    
    if (registerResponse.data.success) {
      console.log('✅ Registration successful');
      console.log('📧 Check your email for the OTP');
      console.log('Message:', registerResponse.data.message);
    } else {
      console.log('❌ Registration failed:', registerResponse.data.message);
      return;
    }

    // Step 2: Simulate OTP verification (you'll need to get the OTP from email)
    console.log('\n2️⃣ To verify email with OTP:');
    console.log('- Check the email sent to:', testUser.email);
    console.log('- Copy the 6-digit OTP from the email');
    console.log('- Use the following endpoint to verify:');
    console.log(`POST ${BASE_URL}/verify-email-otp`);
    console.log('Body: { "email": "' + testUser.email + '", "otp": "123456" }');

    // Step 3: Test resend OTP
    console.log('\n3️⃣ Testing resend OTP...');
    const resendResponse = await axios.post(`${BASE_URL}/resend-verification`, {
      email: testUser.email
    });
    
    if (resendResponse.data.success) {
      console.log('✅ OTP resent successfully');
      console.log('Message:', resendResponse.data.message);
    } else {
      console.log('❌ Resend failed:', resendResponse.data.message);
    }

    console.log('\n📝 Manual Testing Steps:');
    console.log('1. Check your email for the OTP');
    console.log('2. Use Postman or curl to test the OTP verification endpoint');
    console.log('3. Example curl command:');
    console.log(`curl -X POST ${BASE_URL}/verify-email-otp \\`);
    console.log(`  -H "Content-Type: application/json" \\`);
    console.log(`  -d '{"email":"${testUser.email}","otp":"YOUR_OTP_HERE"}'`);

  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
  }
}

// Run the test
testOTPSystem();
