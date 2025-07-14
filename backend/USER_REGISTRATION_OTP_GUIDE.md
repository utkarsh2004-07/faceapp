# User Registration & OTP Verification Guide

## 📋 Overview

The Face App backend implements a secure OTP-based email verification system for user registration. This guide provides complete documentation for integrating the registration and verification flow.

## 🔄 Registration Flow

```
1. User Registration → 2. OTP Generation → 3. Email Sent → 4. OTP Verification → 5. Account Activated
```

---

## 🚀 Step 1: User Registration

### **Endpoint**
```
POST https://faceapp-ttwh.onrender.com/api/auth/register
```

### **Request Headers**
```
Content-Type: application/json
```

### **Request Body**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "MyPassword123",
  "gender": "male"
}
```

### **Field Validation Rules**

| Field | Type | Requirements | Options |
|-------|------|-------------|---------|
| `name` | String | 2-50 characters, required | Any valid name |
| `email` | String | Valid email format, unique, required | Must be unique in system |
| `password` | String | Min 6 chars, uppercase + lowercase + number | Example: `MyPass123` |
| `gender` | String | Required, predefined values | `male`, `female`, `other`, `prefer_not_to_say` |

### **Success Response (201)**
```json
{
  "success": true,
  "message": "User registered successfully. Please check your email for the verification OTP.",
  "user": {
    "id": "64f1234567890abcdef12345",
    "name": "John Doe",
    "email": "john@example.com",
    "isEmailVerified": false
  }
}
```

### **Error Responses**

#### Validation Error (400)
```json
{
  "success": false,
  "message": "Validation failed",
  "errors": [
    {
      "msg": "Password must contain at least one uppercase letter, one lowercase letter, and one number",
      "param": "password"
    }
  ]
}
```

#### User Already Exists (400)
```json
{
  "success": false,
  "message": "User already exists with this email"
}
```

#### Server Error (500)
```json
{
  "success": false,
  "message": "Server error during registration"
}
```

---

## 📧 Step 2: Email with OTP

After successful registration, the user receives an email containing:

- **Subject:** "Email Verification OTP - Augument App"
- **6-digit OTP code** (e.g., 123456)
- **15-minute expiration time**
- **Professional email template**

### **Email Template Preview**
```
Welcome to Augument App!
Verify your email address to get started

Your verification code is:
123456

This code will expire in 15 minutes
```

---

## ✅ Step 3: OTP Verification

### **Endpoint**
```
POST https://faceapp-ttwh.onrender.com/api/auth/verify-email-otp
```

### **Request Headers**
```
Content-Type: application/json
```

### **Request Body**
```json
{
  "email": "john@example.com",
  "otp": "123456"
}
```

### **Field Validation**

| Field | Type | Requirements |
|-------|------|-------------|
| `email` | String | Valid email format, required |
| `otp` | String | Exactly 6 digits, required |

### **Success Response (200)**
```json
{
  "success": true,
  "message": "Email verified successfully",
  "data": {
    "email": "john@example.com",
    "isEmailVerified": true,
    "message": "Your account is now active"
  }
}
```

### **Error Responses**

#### Missing Fields (400)
```json
{
  "success": false,
  "message": "Email and OTP are required"
}
```

#### Invalid/Expired OTP (400)
```json
{
  "success": false,
  "message": "Invalid or expired OTP"
}
```

#### Server Error (500)
```json
{
  "success": false,
  "message": "Error verifying email"
}
```

---

## 🔄 Step 4: Resend OTP (Optional)

### **Endpoint**
```
POST https://faceapp-ttwh.onrender.com/api/auth/resend-verification
```

### **Request Body**
```json
{
  "email": "john@example.com"
}
```

### **Success Response (200)**
```json
{
  "success": true,
  "message": "Verification OTP sent successfully"
}
```

### **Error Responses**

#### User Not Found (404)
```json
{
  "success": false,
  "message": "User not found"
}
```

#### Already Verified (400)
```json
{
  "success": false,
  "message": "Email is already verified"
}
```

---

## 🛡️ Security Features

### **OTP Security**
- **Format:** 6-digit numeric code (100,000 - 999,999)
- **Expiration:** 15 minutes from generation
- **Single-use:** Automatically cleared after verification
- **Secure storage:** Not included in default database queries

### **Rate Limiting**
- Registration attempts limited per IP address
- OTP verification attempts limited per IP address
- Resend OTP requests limited per IP address

### **Password Security**
- bcrypt hashing with cost factor 12
- Validation: uppercase + lowercase + number + min 6 characters
- Never returned in API responses

---

## 📱 Frontend Integration Examples

### **JavaScript/Fetch API**

#### Registration
```javascript
const registerUser = async (userData) => {
  try {
    const response = await fetch('https://faceapp-ttwh.onrender.com/api/auth/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(userData)
    });
    
    const result = await response.json();
    
    if (result.success) {
      console.log('Registration successful:', result.user);
      // Show OTP input form
      showOTPForm(userData.email);
    } else {
      console.error('Registration failed:', result.message);
      handleRegistrationError(result);
    }
  } catch (error) {
    console.error('Network error:', error);
  }
};

// Usage
registerUser({
  name: "John Doe",
  email: "john@example.com",
  password: "MyPassword123",
  gender: "male"
});
```

#### OTP Verification
```javascript
const verifyOTP = async (email, otp) => {
  try {
    const response = await fetch('https://faceapp-ttwh.onrender.com/api/auth/verify-email-otp', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, otp })
    });
    
    const result = await response.json();
    
    if (result.success) {
      console.log('Email verified successfully!');
      // Redirect to login or dashboard
      redirectToLogin();
    } else {
      console.error('OTP verification failed:', result.message);
      handleOTPError(result);
    }
  } catch (error) {
    console.error('Network error:', error);
  }
};

// Usage
verifyOTP("john@example.com", "123456");
```

#### Resend OTP
```javascript
const resendOTP = async (email) => {
  try {
    const response = await fetch('https://faceapp-ttwh.onrender.com/api/auth/resend-verification', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email })
    });
    
    const result = await response.json();
    
    if (result.success) {
      console.log('OTP resent successfully!');
      showSuccessMessage('New OTP sent to your email');
    } else {
      console.error('Resend failed:', result.message);
    }
  } catch (error) {
    console.error('Network error:', error);
  }
};

// Usage
resendOTP("john@example.com");
```

### **React/React Native Example**

```jsx
import React, { useState } from 'react';

const RegistrationForm = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    gender: 'male'
  });
  const [showOTPForm, setShowOTPForm] = useState(false);
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);

  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch('https://faceapp-ttwh.onrender.com/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      const result = await response.json();

      if (result.success) {
        setShowOTPForm(true);
        alert('Registration successful! Check your email for OTP.');
      } else {
        alert(`Registration failed: ${result.message}`);
      }
    } catch (error) {
      alert('Network error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch('https://faceapp-ttwh.onrender.com/api/auth/verify-email-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: formData.email, otp })
      });

      const result = await response.json();

      if (result.success) {
        alert('Email verified successfully! You can now login.');
        // Redirect to login page
      } else {
        alert(`Verification failed: ${result.message}`);
      }
    } catch (error) {
      alert('Network error occurred');
    } finally {
      setLoading(false);
    }
  };

  if (showOTPForm) {
    return (
      <form onSubmit={handleVerifyOTP}>
        <h2>Verify Your Email</h2>
        <p>Enter the 6-digit code sent to {formData.email}</p>
        <input
          type="text"
          placeholder="Enter OTP"
          value={otp}
          onChange={(e) => setOtp(e.target.value)}
          maxLength={6}
          required
        />
        <button type="submit" disabled={loading}>
          {loading ? 'Verifying...' : 'Verify OTP'}
        </button>
        <button type="button" onClick={() => resendOTP(formData.email)}>
          Resend OTP
        </button>
      </form>
    );
  }

  return (
    <form onSubmit={handleRegister}>
      <h2>Register</h2>
      <input
        type="text"
        placeholder="Full Name"
        value={formData.name}
        onChange={(e) => setFormData({...formData, name: e.target.value})}
        required
      />
      <input
        type="email"
        placeholder="Email"
        value={formData.email}
        onChange={(e) => setFormData({...formData, email: e.target.value})}
        required
      />
      <input
        type="password"
        placeholder="Password"
        value={formData.password}
        onChange={(e) => setFormData({...formData, password: e.target.value})}
        required
      />
      <select
        value={formData.gender}
        onChange={(e) => setFormData({...formData, gender: e.target.value})}
        required
      >
        <option value="male">Male</option>
        <option value="female">Female</option>
        <option value="other">Other</option>
        <option value="prefer_not_to_say">Prefer not to say</option>
      </select>
      <button type="submit" disabled={loading}>
        {loading ? 'Registering...' : 'Register'}
      </button>
    </form>
  );
};

export default RegistrationForm;
```

---

## 🔧 Backend Implementation Details

### **Database Schema**
```javascript
// User Model Fields
{
  name: String,                           // User's full name
  email: String,                          // Unique email address
  password: String,                       // bcrypt hashed password
  gender: String,                         // User's gender preference
  isEmailVerified: Boolean,               // Email verification status
  emailVerificationOTP: String,           // Current OTP (hidden from queries)
  emailVerificationOTPExpires: Date,      // OTP expiration timestamp
  lastLogin: Date,                        // Last login timestamp
  isActive: Boolean,                      // Account status
  createdAt: Date,                        // Account creation date
  updatedAt: Date                         // Last update date
}
```

### **OTP Generation Logic**
```javascript
// 6-digit OTP generation
const otp = Math.floor(100000 + Math.random() * 900000).toString();
const expires = Date.now() + 15 * 60 * 1000; // 15 minutes

// Stored in database as:
user.emailVerificationOTP = otp;
user.emailVerificationOTPExpires = expires;
```

### **Email Configuration**
- **Service:** Gmail SMTP
- **Security:** App-specific password
- **Template:** HTML with inline CSS
- **Delivery:** Immediate after registration

---

## 🚨 Error Handling & Troubleshooting

### **Common Issues**

#### 1. OTP Email Not Received
**Possible Causes:**
- Email in spam/junk folder
- Invalid email address
- Email service temporarily down

**Solutions:**
- Check spam folder
- Use resend OTP endpoint
- Verify email address spelling
- Wait a few minutes and try again

#### 2. OTP Expired Error
**Cause:** OTP older than 15 minutes

**Solution:**
- Request new OTP using resend endpoint
- Complete verification within 15 minutes

#### 3. Invalid OTP Error
**Possible Causes:**
- Typo in OTP entry
- Using old/expired OTP
- Case sensitivity (shouldn't happen with numbers)

**Solutions:**
- Double-check OTP digits
- Request new OTP if needed
- Ensure no extra spaces

#### 4. User Already Exists
**Cause:** Email already registered

**Solutions:**
- Use different email address
- Proceed to login if user forgot registration
- Use password reset if needed

### **HTTP Status Codes**

| Status | Meaning | When It Occurs |
|--------|---------|----------------|
| 200 | Success | OTP verified, resend successful |
| 201 | Created | User registered successfully |
| 400 | Bad Request | Validation errors, invalid OTP |
| 404 | Not Found | User not found for resend |
| 500 | Server Error | Database or email service issues |

---

## 📊 Testing & Validation

### **Manual Testing Checklist**

#### Registration Testing
- [ ] Valid registration with all required fields
- [ ] Registration with existing email (should fail)
- [ ] Registration with invalid email format (should fail)
- [ ] Registration with weak password (should fail)
- [ ] Registration with invalid gender (should fail)
- [ ] Registration with missing fields (should fail)

#### OTP Testing
- [ ] Valid OTP verification
- [ ] Invalid OTP verification (should fail)
- [ ] Expired OTP verification (should fail)
- [ ] OTP verification with wrong email (should fail)
- [ ] Multiple OTP verification attempts

#### Resend Testing
- [ ] Resend OTP for unverified user
- [ ] Resend OTP for verified user (should fail)
- [ ] Resend OTP for non-existent user (should fail)

### **API Testing with cURL**

#### Registration
```bash
curl -X POST https://faceapp-ttwh.onrender.com/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test User",
    "email": "test@example.com",
    "password": "TestPass123",
    "gender": "male"
  }'
```

#### OTP Verification
```bash
curl -X POST https://faceapp-ttwh.onrender.com/api/auth/verify-email-otp \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "otp": "123456"
  }'
```

#### Resend OTP
```bash
curl -X POST https://faceapp-ttwh.onrender.com/api/auth/resend-verification \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com"
  }'
```

---

## 🎯 Best Practices

### **Frontend Implementation**
1. **Input Validation:** Validate fields before sending requests
2. **User Feedback:** Show clear success/error messages
3. **Loading States:** Display loading indicators during API calls
4. **OTP Input:** Use numeric keypad on mobile devices
5. **Timer Display:** Show OTP expiration countdown
6. **Resend Logic:** Disable resend button for 60 seconds after sending

### **Security Considerations**
1. **HTTPS Only:** Always use HTTPS in production
2. **Input Sanitization:** Sanitize all user inputs
3. **Rate Limiting:** Respect API rate limits
4. **Error Handling:** Don't expose sensitive error details
5. **OTP Storage:** Never store OTP in frontend localStorage

### **User Experience**
1. **Clear Instructions:** Explain the verification process
2. **Email Guidance:** Mention checking spam folder
3. **Progress Indicators:** Show registration steps
4. **Mobile Optimization:** Ensure mobile-friendly forms
5. **Accessibility:** Support screen readers and keyboard navigation

---

## 📞 Support & Contact

For technical support or questions about the registration system:

- **API Documentation:** Check `COMPLETE_API_REFERENCE.md`
- **Backend Issues:** Review server logs and error responses
- **Email Issues:** Verify SMTP configuration
- **Rate Limiting:** Check `advancedRateLimit` middleware settings

---

**Last Updated:** December 2024
**API Version:** 1.0
**Backend URL:** https://faceapp-ttwh.onrender.com
```
