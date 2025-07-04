// Demo script to show OTP functionality without database dependency
const crypto = require('crypto');

// Simulate OTP generation (same as in User model)
function generateEmailVerificationOTP() {
  // Generate 6-digit OTP
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  const expires = Date.now() + 15 * 60 * 1000; // 15 minutes
  
  return { otp, expires };
}

// Simulate email template (same as in emailService)
function createOTPEmailHTML(userName, otp) {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="text-align: center; margin-bottom: 30px;">
        <h2 style="color: #333; margin-bottom: 10px;">Welcome to Augument App!</h2>
        <p style="color: #666; font-size: 16px;">Verify your email address to get started</p>
      </div>
      
      <div style="background: #f8f9fa; padding: 30px; border-radius: 10px; text-align: center; margin: 30px 0;">
        <p style="margin-bottom: 15px; font-size: 18px; color: #333;">Hi ${userName},</p>
        <p style="margin-bottom: 25px; color: #666;">Enter this verification code in the app:</p>
        
        <div style="background: white; padding: 20px; border-radius: 8px; border: 2px dashed #007bff; margin: 20px 0;">
          <span style="font-family: 'Courier New', monospace; font-size: 32px; font-weight: bold; color: #007bff; letter-spacing: 8px;">
            ${otp}
          </span>
        </div>
        
        <p style="color: #666; font-size: 14px; margin-top: 20px;">
          This code will expire in <strong>15 minutes</strong>
        </p>
      </div>

      <div style="background: #e3f2fd; padding: 20px; border-radius: 8px; margin: 30px 0;">
        <h3 style="color: #1976d2; margin-top: 0;">How to verify:</h3>
        <ol style="color: #333; line-height: 1.6;">
          <li>Open the Augument App</li>
          <li>Go to the email verification screen</li>
          <li>Enter the 6-digit code above</li>
          <li>Tap "Verify" to activate your account</li>
        </ol>
      </div>

      <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
      <p style="color: #666; font-size: 12px; text-align: center;">
        If you didn't create an account, please ignore this email.<br>
        This verification code is valid for 15 minutes only.
      </p>
    </div>
  `;
}

// Demo the OTP system
console.log('🧪 OTP System Demo\n');

// Step 1: User registers
const user = {
  name: 'John Doe',
  email: 'john@example.com'
};

console.log('1️⃣ User Registration:');
console.log(`   Name: ${user.name}`);
console.log(`   Email: ${user.email}`);

// Step 2: Generate OTP
const { otp, expires } = generateEmailVerificationOTP();
console.log('\n2️⃣ OTP Generated:');
console.log(`   OTP: ${otp}`);
console.log(`   Expires: ${new Date(expires).toLocaleString()}`);
console.log(`   Valid for: 15 minutes`);

// Step 3: Show email content
console.log('\n3️⃣ Email Content Preview:');
console.log('   Subject: Email Verification OTP - Augument App');
console.log('   (HTML content would be sent to user\'s email)');

// Step 4: Simulate verification
console.log('\n4️⃣ Verification Process:');
console.log('   User receives email with OTP');
console.log('   User enters OTP in app');
console.log('   App sends POST request to /api/auth/verify-email-otp');
console.log('   Request body: { "email": "john@example.com", "otp": "' + otp + '" }');

// Step 5: Show API endpoints
console.log('\n5️⃣ New API Endpoints Added:');
console.log('   POST /api/auth/verify-email-otp');
console.log('   Body: { email, otp }');
console.log('   Response: { success: true, message: "Email verified successfully" }');

console.log('\n✅ OTP System Implementation Complete!');
console.log('\n📝 Key Changes Made:');
console.log('   • Added OTP fields to User model (emailVerificationOTP, emailVerificationOTPExpires)');
console.log('   • Created generateEmailVerificationOTP() method');
console.log('   • Updated registration to use OTP instead of JWT tokens');
console.log('   • Modified email template to focus on OTP (no verification links)');
console.log('   • Added new /verify-email-otp endpoint');
console.log('   • Updated resend verification to use OTP');
console.log('   • OTP expires in 15 minutes (faster than 24-hour JWT tokens)');

console.log('\n🚀 Benefits:');
console.log('   • Faster verification (no need to click links)');
console.log('   • Better mobile experience');
console.log('   • Shorter expiry time (15 min vs 24 hours)');
console.log('   • Simpler user flow');
console.log('   • More secure (numeric codes are harder to phish)');

// Show sample email HTML (first 200 chars)
const emailHTML = createOTPEmailHTML(user.name, otp);
console.log('\n📧 Sample Email HTML (preview):');
console.log(emailHTML.substring(0, 200) + '...');
