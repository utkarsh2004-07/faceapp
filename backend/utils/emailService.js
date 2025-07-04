const transporter = require('../config/email');

// Send email verification with OTP
const sendEmailVerification = async (user, verificationOTP) => {
  const mailOptions = {
    from: `"Augument App" <${process.env.EMAIL_USER}>`,
    to: user.email,
    subject: 'Email Verification OTP - Augument App',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h2 style="color: #333; margin-bottom: 10px;">Welcome to Augument App!</h2>
          <p style="color: #666; font-size: 16px;">Verify your email address to get started</p>
        </div>

        <div style="background: #f8f9fa; padding: 30px; border-radius: 10px; text-align: center; margin: 30px 0;">
          <p style="margin-bottom: 15px; font-size: 18px; color: #333;">Hi ${user.name},</p>
          <p style="margin-bottom: 25px; color: #666;">Enter this verification code in the app:</p>

          <div style="background: white; padding: 20px; border-radius: 8px; border: 2px dashed #007bff; margin: 20px 0;">
            <span style="font-family: 'Courier New', monospace; font-size: 32px; font-weight: bold; color: #007bff; letter-spacing: 8px;">
              ${verificationOTP}
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
    `
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`✅ Verification OTP sent to ${user.email}`);
    return true;
  } catch (error) {
    console.error('❌ Error sending verification OTP:', error);
    throw new Error('Failed to send verification OTP');
  }
};

// Send password reset email
const sendPasswordResetEmail = async (user, resetToken) => {
  // Check if it's a mobile app (no traditional frontend URL)
  const isMobileApp = !process.env.FRONTEND_URL || process.env.FRONTEND_URL.startsWith('augumentapp://');

  let resetUrl, instructions;

  if (isMobileApp) {
    // Mobile app deep link
    resetUrl = `${process.env.APP_SCHEME || 'augumentapp'}://reset-password?token=${resetToken}`;
    instructions = `
      <p><strong>Mobile App Instructions:</strong></p>
      <ol>
        <li>Copy the reset code below: <strong style="background: #f0f0f0; padding: 4px 8px; border-radius: 4px;">${resetToken}</strong></li>
        <li>Open the Augument App on your device</li>
        <li>Go to "Forgot Password" and enter this reset code</li>
        <li>Create your new password</li>
      </ol>
      <p>Or tap this link if you're viewing this email on your mobile device:</p>
      <div style="text-align: center; margin: 20px 0;">
        <a href="${resetUrl}"
           style="background-color: #dc3545; color: white; padding: 12px 30px;
                  text-decoration: none; border-radius: 5px; display: inline-block;">
          Open in App
        </a>
      </div>
    `;
  } else {
    // Web app traditional link
    resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;
    instructions = `
      <div style="text-align: center; margin: 30px 0;">
        <a href="${resetUrl}"
           style="background-color: #dc3545; color: white; padding: 12px 30px;
                  text-decoration: none; border-radius: 5px; display: inline-block;">
          Reset Password
        </a>
      </div>
      <p>Or copy and paste this link in your browser:</p>
      <p style="word-break: break-all; color: #666;">${resetUrl}</p>
    `;
  }

  const mailOptions = {
    from: `"Augument App" <${process.env.EMAIL_USER}>`,
    to: user.email,
    subject: 'Password Reset - Augument App',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">Password Reset Request</h2>
        <p>Hi ${user.name},</p>
        <p>You requested a password reset for your Augument App account.</p>

        ${instructions}

        <p><strong>Reset Code:</strong> <span style="background: #f8f9fa; padding: 8px 12px; border-radius: 4px; font-family: monospace; font-size: 16px; letter-spacing: 1px;">${resetToken}</span></p>

        <p>This reset code will expire in 1 hour.</p>
        <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
        <p style="color: #666; font-size: 12px;">
          If you didn't request this password reset, please ignore this email.
        </p>
      </div>
    `
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`✅ Password reset email sent to ${user.email} (${isMobileApp ? 'Mobile App' : 'Web App'} format)`);
    return true;
  } catch (error) {
    console.error('❌ Error sending password reset email:', error);
    throw new Error('Failed to send password reset email');
  }
};

// Send welcome email
const sendWelcomeEmail = async (user) => {
  // Check if it's a mobile app (no traditional frontend URL)
  const isMobileApp = !process.env.FRONTEND_URL || process.env.FRONTEND_URL.startsWith('augumentapp://');

  let appUrl, instructions;

  if (isMobileApp) {
    // Mobile app deep link
    appUrl = `${process.env.APP_SCHEME || 'augumentapp'}://home`;
    instructions = `
      <p>You can now enjoy all the features of Augument App on your mobile device.</p>
      <div style="text-align: center; margin: 30px 0;">
        <a href="${appUrl}"
           style="background-color: #28a745; color: white; padding: 12px 30px;
                  text-decoration: none; border-radius: 5px; display: inline-block;">
          Open App
        </a>
      </div>
      <p><strong>Features you can now access:</strong></p>
      <ul>
        <li>🎨 AI-powered color recommendations</li>
        <li>📸 Face analysis and styling</li>
        <li>👔 Personalized outfit suggestions</li>
        <li>💾 Save your favorite combinations</li>
      </ul>
    `;
  } else {
    // Web app traditional link
    appUrl = process.env.FRONTEND_URL || 'https://augumentapp.com';
    instructions = `
      <p>You can now enjoy all the features of Augument App.</p>
      <div style="text-align: center; margin: 30px 0;">
        <a href="${appUrl}"
           style="background-color: #28a745; color: white; padding: 12px 30px;
                  text-decoration: none; border-radius: 5px; display: inline-block;">
          Get Started
        </a>
      </div>
    `;
  }

  const mailOptions = {
    from: `"Augument App" <${process.env.EMAIL_USER}>`,
    to: user.email,
    subject: 'Welcome to Augument App!',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">Welcome to Augument App!</h2>
        <p>Hi ${user.name},</p>
        <p>Your email has been successfully verified! Welcome to our platform.</p>

        ${instructions}

        <p>Thank you for joining us!</p>
        <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
        <p style="color: #666; font-size: 12px;">
          Best regards,<br>
          The Augument App Team
        </p>
      </div>
    `
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`✅ Welcome email sent to ${user.email} (${isMobileApp ? 'Mobile App' : 'Web App'} format)`);
    return true;
  } catch (error) {
    console.error('❌ Error sending welcome email:', error);
    // Don't throw error for welcome email as it's not critical
    return false;
  }
};

module.exports = {
  sendEmailVerification,
  sendPasswordResetEmail,
  sendWelcomeEmail
};
