const express = require('express');
const { body } = require('express-validator');
const {
  register,
  login,
  getMe,
  logout,
  verifyEmail,
  verifyEmailOTP,
  verifyEmailMobile,
  resendVerification,
  forgotPassword,
  resetPassword,
  verifyResetToken,
  resetPasswordMobile
} = require('../controllers/authController');
const { protect } = require('../middleware/auth');
const advancedRateLimit = require('../middleware/advancedRateLimit');

const router = express.Router();

// Validation rules
const registerValidation = [
  body('name')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Name must be between 2 and 50 characters'),
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email'),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Password must contain at least one uppercase letter, one lowercase letter, and one number'),
  body('gender')
    .isIn(['male', 'female', 'other', 'prefer_not_to_say'])
    .withMessage('Gender must be one of: male, female, other, prefer_not_to_say')
];

const loginValidation = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email'),
  body('password')
    .notEmpty()
    .withMessage('Password is required')
];

const emailValidation = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email')
];

const passwordResetValidation = [
  body('token')
    .notEmpty()
    .withMessage('Reset token is required'),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Password must contain at least one uppercase letter, one lowercase letter, and one number')
];

// Public routes with rate limiting
router.post('/register',
  advancedRateLimit.createLimiter('register'),
  registerValidation,
  register
);
router.post('/login',
  advancedRateLimit.createSlidingWindowLimiter('login'),
  loginValidation,
  login
);
router.post('/verify-email',
  advancedRateLimit.createLimiter('auth'),
  verifyEmail
);
router.post('/resend-verification',
  advancedRateLimit.createLimiter('auth'),
  emailValidation,
  resendVerification
);
router.post('/forgot-password',
  advancedRateLimit.createLimiter('auth'),
  emailValidation,
  forgotPassword
);
router.post('/reset-password',
  advancedRateLimit.createLimiter('auth'),
  passwordResetValidation,
  resetPassword
);

// Mobile-specific routes
router.post('/verify-reset-token',
  advancedRateLimit.createLimiter('auth'),
  [body('token').notEmpty().withMessage('Reset token is required')],
  verifyResetToken
);

router.post('/reset-password-mobile',
  advancedRateLimit.createLimiter('auth'),
  [
    body('token').notEmpty().withMessage('Reset token is required'),
    body('newPassword').isLength({ min: 6 }).withMessage('Password must be at least 6 characters')
  ],
  resetPasswordMobile
);

router.post('/verify-email-otp',
  advancedRateLimit.createLimiter('auth'),
  [
    body('email').isEmail().withMessage('Valid email is required'),
    body('otp').isLength({ min: 6, max: 6 }).withMessage('OTP must be 6 digits')
  ],
  verifyEmailOTP
);

router.post('/verify-email-mobile',
  advancedRateLimit.createLimiter('auth'),
  [body('token').notEmpty().withMessage('Verification token is required')],
  verifyEmailMobile
);

// Protected routes
router.get('/me', protect, getMe);
router.post('/logout', protect, logout);

// Update profile route
router.put('/update-profile', protect, [
  body('name')
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Name must be between 2 and 50 characters'),
  body('email')
    .optional()
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email')
], async (req, res) => {
  try {
    const { name, email } = req.body;
    const user = await require('../models/User').findById(req.user.id);

    if (name) user.name = name;
    if (email && email !== user.email) {
      // Check if email already exists
      const existingUser = await require('../models/User').findOne({ email });
      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: 'Email already in use'
        });
      }
      user.email = email;
      user.isEmailVerified = false; // Require re-verification for new email
    }

    await user.save();

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        isEmailVerified: user.isEmailVerified,
        lastLogin: user.lastLogin,
        createdAt: user.createdAt
      }
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during profile update'
    });
  }
});

// Change password route
router.put('/change-password', protect, [
  body('currentPassword')
    .notEmpty()
    .withMessage('Current password is required'),
  body('newPassword')
    .isLength({ min: 6 })
    .withMessage('New password must be at least 6 characters long')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('New password must contain at least one uppercase letter, one lowercase letter, and one number')
], async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = await require('../models/User').findById(req.user.id).select('+password');

    // Check current password
    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return res.status(400).json({
        success: false,
        message: 'Current password is incorrect'
      });
    }

    // Update password
    user.password = newPassword;
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Password changed successfully'
    });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during password change'
    });
  }
});

module.exports = router;
