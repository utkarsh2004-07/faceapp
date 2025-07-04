# 📱 Mobile App Integration Guide

## Overview

This guide explains how to integrate the backend API with mobile applications, specifically handling password reset functionality without traditional frontend URLs.

## Password Reset for Mobile Apps

### Problem
Mobile apps don't have traditional frontend URLs, so the standard web-based password reset flow doesn't work.

### Solution
We've implemented a mobile-friendly password reset system with multiple approaches:

## 🔧 Configuration

### Environment Variables

Add these to your `.env` file:

```env
# Mobile App Configuration
APP_SCHEME=augumentapp
FRONTEND_URL=augumentapp://reset-password
```

### Deep Link Setup

Configure your mobile app to handle deep links with the scheme `augumentapp://`

## 📧 Email Integration

The system automatically detects mobile app configuration and sends appropriate emails:

### Mobile App Email Format
- **Reset Code**: Clear, copyable token for manual entry
- **Deep Link**: `augumentapp://reset-password?token=ABC123`
- **Instructions**: Step-by-step mobile app instructions
- **Fallback**: Works on both mobile and desktop email clients

### Example Mobile Email Content
```html
Mobile App Instructions:
1. Copy the reset code: ABC123DEF456
2. Open the Augument App on your device
3. Go to "Forgot Password" and enter this reset code
4. Create your new password

Or tap this link if viewing on mobile:
[Open in App] → augumentapp://reset-password?token=ABC123DEF456
```

## 🔗 API Endpoints

### 1. Request Password Reset
```http
POST /api/auth/forgot-password
Content-Type: application/json

{
  "email": "user@example.com"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Password reset email sent"
}
```

### 2. Verify Reset Token (Optional)
```http
POST /api/auth/verify-reset-token
Content-Type: application/json

{
  "token": "abc123def456..."
}
```

**Response:**
```json
{
  "success": true,
  "message": "Reset token is valid",
  "data": {
    "email": "user@example.com",
    "tokenValid": true
  }
}
```

### 3. Reset Password (Mobile)
```http
POST /api/auth/reset-password-mobile
Content-Type: application/json

{
  "token": "abc123def456...",
  "newPassword": "NewSecurePassword123"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Password reset successful",
  "data": {
    "email": "user@example.com",
    "message": "You can now login with your new password"
  }
}
```

## 📱 Mobile App Implementation

### React Native Example

```javascript
// 1. Request password reset
const requestPasswordReset = async (email) => {
  try {
    const response = await fetch('http://your-api.com/api/auth/forgot-password', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email }),
    });
    
    const data = await response.json();
    
    if (data.success) {
      Alert.alert('Success', 'Check your email for reset instructions');
    }
  } catch (error) {
    Alert.alert('Error', 'Failed to send reset email');
  }
};

// 2. Verify reset token (optional)
const verifyResetToken = async (token) => {
  try {
    const response = await fetch('http://your-api.com/api/auth/verify-reset-token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ token }),
    });
    
    const data = await response.json();
    return data.success;
  } catch (error) {
    return false;
  }
};

// 3. Reset password
const resetPassword = async (token, newPassword) => {
  try {
    const response = await fetch('http://your-api.com/api/auth/reset-password-mobile', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ token, newPassword }),
    });
    
    const data = await response.json();
    
    if (data.success) {
      Alert.alert('Success', 'Password reset successful');
      // Navigate to login screen
    }
  } catch (error) {
    Alert.alert('Error', 'Failed to reset password');
  }
};
```

### Deep Link Handling

```javascript
import { Linking } from 'react-native';

// Handle deep links
const handleDeepLink = (url) => {
  if (url.startsWith('augumentapp://reset-password')) {
    const urlParams = new URLSearchParams(url.split('?')[1]);
    const token = urlParams.get('token');
    
    if (token) {
      // Navigate to password reset screen with token
      navigation.navigate('ResetPassword', { token });
    }
  }
};

// Set up deep link listener
useEffect(() => {
  const subscription = Linking.addEventListener('url', ({ url }) => {
    handleDeepLink(url);
  });
  
  return () => subscription?.remove();
}, []);
```

## 🔄 Complete Mobile Workflow

### User Experience Flow

1. **User taps "Forgot Password"** in mobile app
2. **User enters email address**
3. **App calls** `POST /api/auth/forgot-password`
4. **User receives email** with reset code and deep link
5. **Option A - Deep Link**: User taps link, app opens with token
6. **Option B - Manual**: User copies reset code from email
7. **User enters new password** in app
8. **App calls** `POST /api/auth/reset-password-mobile`
9. **Success**: User can login with new password

### Error Handling

```javascript
const handlePasswordReset = async (token, newPassword) => {
  try {
    const response = await resetPassword(token, newPassword);
    
    if (response.success) {
      showSuccess('Password reset successful');
      navigateToLogin();
    } else {
      showError(response.message);
    }
  } catch (error) {
    if (error.response?.status === 400) {
      showError('Invalid or expired reset token');
    } else {
      showError('Network error. Please try again.');
    }
  }
};
```

## 🔒 Security Features

### Token Security
- **Crypto-based tokens** (not JWT) for better mobile compatibility
- **SHA-256 hashing** for database storage
- **1-hour expiration** for security
- **One-time use** tokens

### Rate Limiting
- **Password reset requests**: Limited per IP
- **Token verification**: Rate limited
- **Password reset attempts**: Rate limited

## 🧪 Testing

Run the mobile password reset test:

```bash
node test-mobile-password-reset.js
```

This tests:
- Password reset email sending
- Token verification
- Password reset with token
- Validation errors
- Mobile app configuration

## 🔧 Troubleshooting

### Common Issues

1. **Deep links not working**
   - Verify `APP_SCHEME` in `.env`
   - Check mobile app deep link configuration
   - Test with `augumentapp://reset-password?token=test`

2. **Emails not mobile-friendly**
   - Check `FRONTEND_URL` starts with app scheme
   - Verify email service detects mobile configuration

3. **Token validation failing**
   - Ensure tokens are copied exactly from email
   - Check token hasn't expired (1 hour limit)
   - Verify crypto hashing is working

### Debug Mode

Enable debug logging:

```javascript
// In your mobile app
console.log('Reset token:', token);
console.log('API endpoint:', API_BASE_URL);
```

## 📚 Additional Resources

- [React Native Deep Linking](https://reactnative.dev/docs/linking)
- [Expo Linking](https://docs.expo.dev/guides/linking/)
- [Flutter Deep Links](https://docs.flutter.dev/development/ui/navigation/deep-linking)

## 🎯 Best Practices

1. **Always validate tokens** before allowing password reset
2. **Provide clear error messages** for expired/invalid tokens
3. **Implement retry logic** for network failures
4. **Cache tokens temporarily** for better UX
5. **Clear sensitive data** after successful reset
6. **Test on both iOS and Android** platforms
7. **Handle offline scenarios** gracefully
