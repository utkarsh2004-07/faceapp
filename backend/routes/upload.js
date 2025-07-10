const express = require('express');
const { body, validationResult } = require('express-validator');
const { protect } = require('../middleware/auth');
const advancedRateLimit = require('../middleware/advancedRateLimit');
const {
  generateUploadSignature,
  verifyUpload,
  getUploadConfig,
  generateMobileSignature
} = require('../controllers/uploadController');

const router = express.Router();

// Apply authentication to all routes
router.use(protect);

// @route   GET /api/upload/config
// @desc    Get upload configuration for frontend
// @access  Private
router.get('/config', getUploadConfig);

// @route   POST /api/upload/signature
// @desc    Generate signed upload URL for direct Cloudinary upload
// @access  Private
router.post('/signature',
  advancedRateLimit.createLimiter('uploadSignature'),
  generateUploadSignature
);

// @route   POST /api/upload/mobile-signature
// @desc    Generate simple signature for mobile app
// @access  Private
router.post('/mobile-signature',
  advancedRateLimit.createLimiter('uploadSignature'),
  generateMobileSignature
);

// @route   POST /api/upload/verify
// @desc    Verify uploaded image and prepare for analysis
// @access  Private
router.post('/verify', [
  body('publicId').notEmpty().withMessage('Public ID is required'),
  body('version').notEmpty().withMessage('Version is required'),
  body('signature').notEmpty().withMessage('Signature is required'),
  body('timestamp').isNumeric().withMessage('Timestamp must be numeric')
], (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array()
    });
  }
  next();
}, verifyUpload);

// @route   GET /api/upload/info
// @desc    Get upload API information
// @access  Private
router.get('/info', (req, res) => {
  res.json({
    success: true,
    message: 'Direct Upload API Information',
    endpoints: {
      config: 'GET /api/upload/config - Get upload configuration',
      signature: 'POST /api/upload/signature - Generate signed upload URL',
      verify: 'POST /api/upload/verify - Verify uploaded image'
    },
    workflow: [
      '1. GET /api/upload/config - Get configuration',
      '2. POST /api/upload/signature - Get signed upload parameters',
      '3. Upload directly to Cloudinary using signed parameters',
      '4. POST /api/upload/verify - Verify the upload',
      '5. POST /api/face/analyze-direct - Analyze the uploaded image'
    ],
    features: {
      directUpload: 'Upload directly to Cloudinary from frontend',
      compression: 'Automatic image compression and optimization',
      autoDelete: 'Images automatically deleted after 5-6 days',
      validation: 'Server-side validation of uploaded images',
      security: 'Signed uploads for security'
    }
  });
});

module.exports = router;
