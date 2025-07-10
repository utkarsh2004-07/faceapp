const express = require('express');
const { body, validationResult } = require('express-validator');
const {
  analyzeFace,
  analyzeFaceFromDirectUpload,
  analyzeFaceFromUrl,
  getFaceAnalysisHistory,
  getFaceAnalysis,
  deleteFaceAnalysis,
  getColorPalette,
  getFaceMeasurements,
  getColorRecommendations,
  regenerateColorRecommendations,
  getColorRecommendationHistory,
  addRecommendationFeedback
} = require('../controllers/faceAnalysisController');
const { protect } = require('../middleware/auth');
const { uploadWithValidation } = require('../middleware/upload');
const advancedRateLimit = require('../middleware/advancedRateLimit');

const router = express.Router();

// All routes require authentication
router.use(protect);

// @route   POST /api/face/analyze
// @desc    Upload and analyze face image (legacy method)
// @access  Private
router.post('/analyze',
  advancedRateLimit.createLimiter('faceAnalysis'),
  uploadWithValidation,
  analyzeFace
);

// @route   POST /api/face/analyze-direct
// @desc    Analyze face from direct Cloudinary upload
// @access  Private
router.post('/analyze-direct', [
  body('publicId').notEmpty().withMessage('Public ID is required'),
  body('imageUrl').isURL().withMessage('Valid image URL is required'),
  body('originalFileName').notEmpty().withMessage('Original filename is required'),
  body('imageData').isObject().withMessage('Image data is required'),
  body('imageData.width').isNumeric().withMessage('Image width is required'),
  body('imageData.height').isNumeric().withMessage('Image height is required'),
  body('imageData.bytes').isNumeric().withMessage('Image size is required'),
  body('imageData.format').notEmpty().withMessage('Image format is required')
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
}, advancedRateLimit.createLimiter('faceAnalysis'), analyzeFaceFromDirectUpload);

// @route   POST /api/face/analyze-url
// @desc    Analyze face from image URL (simplest method)
// @access  Private
router.post('/analyze-url', [
  body('imageUrl').isURL().withMessage('Valid image URL is required'),
  body('originalFileName').optional().isString().withMessage('Original filename must be a string')
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
}, advancedRateLimit.createLimiter('faceAnalysis'), analyzeFaceFromUrl);

// @route   GET /api/face/history
// @desc    Get user's face analysis history
// @access  Private
router.get('/history', getFaceAnalysisHistory);

// @route   GET /api/face/analysis/:id
// @desc    Get specific face analysis
// @access  Private
router.get('/analysis/:id', [
  body('id').isMongoId().withMessage('Invalid analysis ID')
], getFaceAnalysis);

// @route   DELETE /api/face/analysis/:id
// @desc    Delete face analysis
// @access  Private
router.delete('/analysis/:id', [
  body('id').isMongoId().withMessage('Invalid analysis ID')
], deleteFaceAnalysis);

// @route   GET /api/face/analysis/:id/colors
// @desc    Get color palette from analysis
// @access  Private
router.get('/analysis/:id/colors', [
  body('id').isMongoId().withMessage('Invalid analysis ID')
], getColorPalette);

// @route   GET /api/face/analysis/:id/measurements
// @desc    Get face measurements from analysis
// @access  Private
router.get('/analysis/:id/measurements', [
  body('id').isMongoId().withMessage('Invalid analysis ID')
], getFaceMeasurements);

// @route   POST /api/face/analysis/:id/recommendations
// @desc    Get color recommendations for face analysis
// @access  Private
router.post('/analysis/:id/recommendations',
  advancedRateLimit.createLimiter('colorRecommendations'),
  [body('id').isMongoId().withMessage('Invalid analysis ID')],
  getColorRecommendations
);

// @route   POST /api/face/analysis/:id/recommendations/regenerate
// @desc    Regenerate color recommendations
// @access  Private
router.post('/analysis/:id/recommendations/regenerate',
  advancedRateLimit.createLimiter('recommendationRegeneration'),
  [body('id').isMongoId().withMessage('Invalid analysis ID')],
  regenerateColorRecommendations
);

// @route   GET /api/face/recommendations/history
// @desc    Get user's color recommendation history
// @access  Private
router.get('/recommendations/history', getColorRecommendationHistory);

// @route   POST /api/face/recommendations/:id/feedback
// @desc    Add user feedback to recommendations
// @access  Private
router.post('/recommendations/:id/feedback', [
  body('id').isMongoId().withMessage('Invalid recommendation ID'),
  body('rating').isInt({ min: 1, max: 5 }).withMessage('Rating must be between 1 and 5'),
  body('feedback').optional().isLength({ max: 500 }).withMessage('Feedback must be less than 500 characters'),
  body('favoriteOutfits').optional().isArray().withMessage('Favorite outfits must be an array')
], addRecommendationFeedback);

// @route   GET /api/face/test
// @desc    Test endpoint for face analysis API
// @access  Private
router.get('/test', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Face Analysis API is working',
    user: {
      id: req.user.id,
      name: req.user.name,
      email: req.user.email
    },
    endpoints: {
      analyze: 'POST /api/face/analyze - Upload and analyze face image',
      history: 'GET /api/face/history - Get analysis history',
      getAnalysis: 'GET /api/face/analysis/:id - Get specific analysis',
      deleteAnalysis: 'DELETE /api/face/analysis/:id - Delete analysis',
      getColors: 'GET /api/face/analysis/:id/colors - Get color palette',
      getMeasurements: 'GET /api/face/analysis/:id/measurements - Get measurements',
      getRecommendations: 'POST /api/face/analysis/:id/recommendations - Get AI color recommendations',
      regenerateRecommendations: 'POST /api/face/analysis/:id/recommendations/regenerate - Regenerate recommendations',
      recommendationHistory: 'GET /api/face/recommendations/history - Get recommendation history',
      addFeedback: 'POST /api/face/recommendations/:id/feedback - Add user feedback'
    },
    uploadRequirements: {
      fieldName: 'faceImage',
      maxSize: '10MB',
      allowedFormats: ['jpeg', 'jpg', 'png', 'gif', 'bmp', 'webp'],
      minDimensions: '200x200px'
    }
  });
});

module.exports = router;
