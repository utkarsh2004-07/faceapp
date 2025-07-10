const FaceAnalysis = require('../models/FaceAnalysis');
const ColorRecommendation = require('../models/ColorRecommendation');
const faceAnalysisService = require('../utils/faceAnalysisService');
const colorRecommendationService = require('../utils/colorRecommendationService');
const { cleanupFile, getFileUrl, deleteCloudinaryImage } = require('../middleware/upload');
const path = require('path');

// @desc    Upload and analyze face image
// @route   POST /api/face/analyze
// @access  Private
const analyzeFace = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No image file uploaded'
      });
    }

    const userId = req.user.id;
    const cloudinaryData = req.file.cloudinary;
    const imageUrl = req.fileInfo.cloudinaryUrl;
    const originalFileName = req.file.originalname;

    console.log(`🔍 Starting face analysis for user ${userId}`);
    console.log(`📁 File: ${originalFileName} (${cloudinaryData.fileSize} bytes)`);
    console.log(`☁️ Cloudinary URL: ${imageUrl}`);

    // Perform face analysis using Cloudinary URL
    const analysisResult = await faceAnalysisService.analyzeFace(imageUrl, originalFileName, cloudinaryData);

    // Save analysis to database with Cloudinary metadata
    const faceAnalysis = new FaceAnalysis({
      userId,
      imageUrl, // This is now the Cloudinary URL
      originalFileName: analysisResult.originalFileName,
      fileSize: analysisResult.fileSize,
      imageFormat: analysisResult.imageFormat,
      imageDimensions: analysisResult.imageDimensions,
      faceDetected: analysisResult.faceDetected,
      faceCount: analysisResult.faceCount,
      faceRegion: analysisResult.faceRegion,
      colors: analysisResult.colors,
      faceDimensions: analysisResult.faceDimensions,
      facialFeatures: analysisResult.facialFeatures,
      analysisMetadata: {
        ...analysisResult.analysisMetadata,
        cloudinaryPublicId: cloudinaryData.publicId,
        autoDeleteDate: cloudinaryData.autoDeleteDate,
        storageProvider: 'cloudinary'
      }
    });

    await faceAnalysis.save();

    console.log(`✅ Face analysis completed in ${analysisResult.analysisMetadata.processingTime}ms`);

    // Return comprehensive analysis results
    res.status(200).json({
      success: true,
      message: 'Face analysis completed successfully',
      data: {
        analysisId: faceAnalysis._id,
        imageUrl,
        faceDetected: analysisResult.faceDetected,
        processingTime: analysisResult.analysisMetadata.processingTime,
        confidence: analysisResult.analysisMetadata.confidence,
        
        // Color Analysis
        colors: {
          hairColor: analysisResult.colors.hairColor,
          skinTone: analysisResult.colors.skinTone,
          eyeColor: analysisResult.colors.eyeColor,
          lipColor: analysisResult.colors.lipColor
        },
        
        // Face Measurements
        dimensions: analysisResult.faceDimensions,
        
        // Facial Features
        features: analysisResult.facialFeatures,
        
        // Image Info
        imageInfo: {
          originalFileName: analysisResult.originalFileName,
          format: analysisResult.imageFormat,
          dimensions: analysisResult.imageDimensions,
          fileSize: analysisResult.fileSize
        },
        
        // Analysis Metadata
        metadata: {
          errors: analysisResult.analysisMetadata.errors,
          warnings: analysisResult.analysisMetadata.warnings,
          algorithm: analysisResult.analysisMetadata.algorithm
        }
      }
    });

  } catch (error) {
    console.error('Face analysis error:', error);

    // Clean up Cloudinary image on error
    if (req.file && req.file.cloudinary) {
      await deleteCloudinaryImage(req.file.cloudinary.publicId);
    }

    res.status(500).json({
      success: false,
      message: 'Error during face analysis',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

// @desc    Get user's face analysis history
// @route   GET /api/face/history
// @access  Private
const getFaceAnalysisHistory = async (req, res) => {
  try {
    const userId = req.user.id;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const analyses = await FaceAnalysis.find({ userId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .select('-featureCoordinates -analysisMetadata.errors'); // Exclude heavy data

    const total = await FaceAnalysis.countDocuments({ userId });

    res.status(200).json({
      success: true,
      data: {
        analyses,
        pagination: {
          current: page,
          pages: Math.ceil(total / limit),
          total,
          hasNext: page < Math.ceil(total / limit),
          hasPrev: page > 1
        }
      }
    });

  } catch (error) {
    console.error('Get history error:', error);
    res.status(500).json({
      success: false,
      message: 'Error retrieving face analysis history'
    });
  }
};

// @desc    Get specific face analysis
// @route   GET /api/face/analysis/:id
// @access  Private
const getFaceAnalysis = async (req, res) => {
  try {
    const analysisId = req.params.id;
    const userId = req.user.id;

    const analysis = await FaceAnalysis.findOne({
      _id: analysisId,
      userId
    });

    if (!analysis) {
      return res.status(404).json({
        success: false,
        message: 'Face analysis not found'
      });
    }

    res.status(200).json({
      success: true,
      data: analysis
    });

  } catch (error) {
    console.error('Get analysis error:', error);
    res.status(500).json({
      success: false,
      message: 'Error retrieving face analysis'
    });
  }
};

// @desc    Delete face analysis
// @route   DELETE /api/face/analysis/:id
// @access  Private
const deleteFaceAnalysis = async (req, res) => {
  try {
    const analysisId = req.params.id;
    const userId = req.user.id;

    const analysis = await FaceAnalysis.findOne({
      _id: analysisId,
      userId
    });

    if (!analysis) {
      return res.status(404).json({
        success: false,
        message: 'Face analysis not found'
      });
    }

    // Delete the image file
    const filename = path.basename(analysis.imageUrl);
    const filePath = path.join(__dirname, '../uploads/face-images', filename);
    cleanupFile(filePath);

    // Delete from database
    await FaceAnalysis.findByIdAndDelete(analysisId);

    res.status(200).json({
      success: true,
      message: 'Face analysis deleted successfully'
    });

  } catch (error) {
    console.error('Delete analysis error:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting face analysis'
    });
  }
};

// @desc    Get color palette from analysis
// @route   GET /api/face/analysis/:id/colors
// @access  Private
const getColorPalette = async (req, res) => {
  try {
    const analysisId = req.params.id;
    const userId = req.user.id;

    const analysis = await FaceAnalysis.findOne({
      _id: analysisId,
      userId
    });

    if (!analysis) {
      return res.status(404).json({
        success: false,
        message: 'Face analysis not found'
      });
    }

    const colorPalette = analysis.getColorPalette();

    res.status(200).json({
      success: true,
      data: {
        palette: colorPalette,
        recommendations: [
          'Colors that complement your skin tone',
          'Hair color suggestions',
          'Eye makeup recommendations',
          'Lip color suggestions'
        ]
      }
    });

  } catch (error) {
    console.error('Get color palette error:', error);
    res.status(500).json({
      success: false,
      message: 'Error retrieving color palette'
    });
  }
};

// @desc    Get face measurements
// @route   GET /api/face/analysis/:id/measurements
// @access  Private
const getFaceMeasurements = async (req, res) => {
  try {
    const analysisId = req.params.id;
    const userId = req.user.id;

    const analysis = await FaceAnalysis.findOne({
      _id: analysisId,
      userId
    });

    if (!analysis) {
      return res.status(404).json({
        success: false,
        message: 'Face analysis not found'
      });
    }

    const measurements = analysis.getMeasurements();

    res.status(200).json({
      success: true,
      data: {
        measurements,
        analysis: {
          faceShape: analysis.facialFeatures.faceShape,
          symmetry: 'Good', // Placeholder
          proportions: 'Balanced' // Placeholder
        }
      }
    });

  } catch (error) {
    console.error('Get measurements error:', error);
    res.status(500).json({
      success: false,
      message: 'Error retrieving face measurements'
    });
  }
};

// @desc    Get color recommendations for face analysis
// @route   POST /api/face/analysis/:id/recommendations
// @access  Private
const getColorRecommendations = async (req, res) => {
  try {
    const analysisId = req.params.id;
    const userId = req.user.id;
    const userProfile = {
      gender: req.user.gender || 'unspecified',
      preferences: req.body.preferences || {}
    };

    console.log(`🎨 Getting color recommendations for analysis ${analysisId}`);

    const result = await colorRecommendationService.generateRecommendations(
      analysisId,
      userId,
      userProfile
    );

    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: 'Failed to generate color recommendations'
      });
    }

    res.status(200).json({
      success: true,
      message: result.cached ? 'Retrieved existing recommendations' : 'Generated new recommendations',
      data: {
        recommendationId: result.data._id,
        faceAnalysisId: analysisId,
        aiService: result.data.aiService,
        processingTime: result.processingTime,
        cached: result.cached,

        // Outfit Recommendations
        outfits: result.data.recommendations,

        // Color Palette
        colorPalette: result.data.colorPalette,

        // General Advice
        advice: result.data.generalAdvice,

        // Metadata
        confidence: result.data.confidence,
        createdAt: result.data.createdAt
      }
    });

  } catch (error) {
    console.error('Get color recommendations error:', error);
    res.status(500).json({
      success: false,
      message: 'Error generating color recommendations',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

// @desc    Regenerate color recommendations
// @route   POST /api/face/analysis/:id/recommendations/regenerate
// @access  Private
const regenerateColorRecommendations = async (req, res) => {
  try {
    const analysisId = req.params.id;
    const userId = req.user.id;
    const userProfile = {
      gender: req.user.gender || 'unspecified',
      preferences: req.body.preferences || {}
    };

    console.log(`🔄 Regenerating color recommendations for analysis ${analysisId}`);

    const result = await colorRecommendationService.regenerateRecommendations(
      analysisId,
      userId,
      userProfile
    );

    res.status(200).json({
      success: true,
      message: 'Color recommendations regenerated successfully',
      data: {
        recommendationId: result.data._id,
        faceAnalysisId: analysisId,
        aiService: result.data.aiService,
        processingTime: result.processingTime,

        // Outfit Recommendations
        outfits: result.data.recommendations,

        // Color Palette
        colorPalette: result.data.colorPalette,

        // General Advice
        advice: result.data.generalAdvice,

        // Metadata
        confidence: result.data.confidence,
        createdAt: result.data.createdAt
      }
    });

  } catch (error) {
    console.error('Regenerate color recommendations error:', error);
    res.status(500).json({
      success: false,
      message: 'Error regenerating color recommendations',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

// @desc    Get user's color recommendation history
// @route   GET /api/face/recommendations/history
// @access  Private
const getColorRecommendationHistory = async (req, res) => {
  try {
    const userId = req.user.id;
    const limit = parseInt(req.query.limit) || 10;

    const result = await colorRecommendationService.getUserRecommendationHistory(userId, limit);

    res.status(200).json({
      success: true,
      data: {
        recommendations: result.data,
        count: result.count
      }
    });

  } catch (error) {
    console.error('Get recommendation history error:', error);
    res.status(500).json({
      success: false,
      message: 'Error retrieving recommendation history'
    });
  }
};

// @desc    Add user feedback to recommendations
// @route   POST /api/face/recommendations/:id/feedback
// @access  Private
const addRecommendationFeedback = async (req, res) => {
  try {
    const recommendationId = req.params.id;
    const userId = req.user.id;
    const { rating, feedback, favoriteOutfits } = req.body;

    // Validate input
    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({
        success: false,
        message: 'Rating must be between 1 and 5'
      });
    }

    const result = await colorRecommendationService.addUserFeedback(
      recommendationId,
      userId,
      rating,
      feedback,
      favoriteOutfits
    );

    res.status(200).json({
      success: true,
      message: 'Feedback added successfully',
      data: result.data
    });

  } catch (error) {
    console.error('Add feedback error:', error);
    res.status(500).json({
      success: false,
      message: 'Error adding feedback'
    });
  }
};

// @desc    Analyze face from direct Cloudinary upload
// @route   POST /api/face/analyze-direct
// @access  Private
const analyzeFaceFromDirectUpload = async (req, res) => {
  try {
    const { publicId, imageUrl, originalFileName, imageData } = req.body;
    const userId = req.user.id;

    // Validate required fields
    if (!publicId || !imageUrl || !originalFileName || !imageData) {
      return res.status(400).json({
        success: false,
        message: 'Missing required image data'
      });
    }

    console.log(`🔍 Starting face analysis for user ${userId} (Direct Upload)`);
    console.log(`☁️ Cloudinary URL: ${imageUrl}`);
    console.log(`📁 File: ${originalFileName} (${imageData.bytes} bytes)`);

    // Prepare cloudinary data for analysis
    const cloudinaryData = {
      publicId: publicId,
      url: imageUrl,
      fileSize: imageData.bytes,
      format: imageData.format,
      width: imageData.width,
      height: imageData.height,
      originalName: originalFileName
    };

    // Perform face analysis using Cloudinary URL
    const analysisResult = await faceAnalysisService.analyzeFace(imageUrl, originalFileName, cloudinaryData);

    // Calculate deletion date
    const deletionDate = new Date();
    deletionDate.setDate(deletionDate.getDate() + (parseInt(process.env.CLOUDINARY_AUTO_DELETE_DAYS) || 5));

    // Save analysis to database with Cloudinary metadata
    const faceAnalysis = new FaceAnalysis({
      userId,
      imageUrl, // This is the Cloudinary URL
      originalFileName: analysisResult.originalFileName,
      fileSize: analysisResult.fileSize,
      imageFormat: analysisResult.imageFormat,
      imageDimensions: analysisResult.imageDimensions,
      faceDetected: analysisResult.faceDetected,
      faceCount: analysisResult.faceCount,
      faceRegion: analysisResult.faceRegion,
      colors: analysisResult.colors,
      faceDimensions: analysisResult.faceDimensions,
      facialFeatures: analysisResult.facialFeatures,
      analysisMetadata: {
        ...analysisResult.analysisMetadata,
        cloudinaryPublicId: publicId,
        autoDeleteDate: deletionDate,
        storageProvider: 'cloudinary',
        uploadMethod: 'direct',
        compressed: true
      }
    });

    await faceAnalysis.save();

    console.log(`✅ Face analysis completed in ${analysisResult.analysisMetadata.processingTime}ms`);

    // Return analysis results
    res.status(201).json({
      success: true,
      message: 'Face analysis completed successfully',
      data: {
        _id: faceAnalysis._id,
        imageUrl: faceAnalysis.imageUrl,
        originalFileName: faceAnalysis.originalFileName,
        fileSize: faceAnalysis.fileSize,
        imageFormat: faceAnalysis.imageFormat,
        imageDimensions: faceAnalysis.imageDimensions,
        faceDetected: faceAnalysis.faceDetected,
        faceCount: faceAnalysis.faceCount,
        faceRegion: faceAnalysis.faceRegion,
        colors: faceAnalysis.colors,
        faceDimensions: faceAnalysis.faceDimensions,
        facialFeatures: faceAnalysis.facialFeatures,
        analysisMetadata: faceAnalysis.analysisMetadata,
        createdAt: faceAnalysis.createdAt
      }
    });

  } catch (error) {
    console.error('Face analysis error (direct upload):', error);

    // If there's an error, we should delete the Cloudinary image
    if (req.body.publicId) {
      try {
        await deleteCloudinaryImage(req.body.publicId);
      } catch (deleteError) {
        console.error('Error cleaning up Cloudinary image:', deleteError);
      }
    }

    res.status(500).json({
      success: false,
      message: 'Error during face analysis',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

// @desc    Analyze face from image URL (simplest method)
// @route   POST /api/face/analyze-url
// @access  Private
const analyzeFaceFromUrl = async (req, res) => {
  try {
    const { imageUrl } = req.body;
    const originalFileName = req.body.originalFileName || 'image.jpg';
    const userId = req.user.id;

    console.log(`🔍 Analyzing face from URL for user ${userId}`);
    console.log(`🌐 Image URL: ${imageUrl}`);

    // Extract public ID from Cloudinary URL if possible
    let publicId = 'unknown';
    try {
      // Check if it's a Cloudinary URL
      if (imageUrl.includes('cloudinary.com')) {
        const urlParts = imageUrl.split('/');
        const fileWithExt = urlParts[urlParts.length - 1];
        publicId = fileWithExt.split('.')[0];
      } else {
        // Generate a unique ID for non-Cloudinary URLs
        publicId = `face-${userId}-${Date.now()}-${Math.round(Math.random() * 1000000)}`;
      }
    } catch (error) {
      console.log('Could not extract public ID from URL');
      publicId = `face-${userId}-${Date.now()}`;
    }

    // Perform face analysis using the image URL
    const analysisResult = await faceAnalysisService.analyzeFace(imageUrl, originalFileName);

    // Calculate deletion date (5-6 days from now)
    const deletionDate = new Date();
    deletionDate.setDate(deletionDate.getDate() + (parseInt(process.env.CLOUDINARY_AUTO_DELETE_DAYS) || 5));

    // Ensure required fields have default values if not provided
    const safeAnalysisResult = {
      originalFileName: analysisResult.originalFileName || originalFileName,
      fileSize: analysisResult.fileSize || 0,
      imageFormat: analysisResult.imageFormat || 'jpg',
      imageDimensions: analysisResult.imageDimensions || { width: 0, height: 0 },
      faceDetected: analysisResult.faceDetected || false,
      faceCount: analysisResult.faceCount || 0,
      faceRegion: analysisResult.faceRegion || null,
      colors: analysisResult.colors || {},
      faceDimensions: analysisResult.faceDimensions || {},
      facialFeatures: analysisResult.facialFeatures || {},
      analysisMetadata: analysisResult.analysisMetadata || {
        processingTime: 0,
        confidence: 0,
        algorithm: 'custom-v1',
        errors: [],
        warnings: []
      }
    };

    // Save analysis to database
    const faceAnalysis = new FaceAnalysis({
      userId,
      imageUrl,
      originalFileName: safeAnalysisResult.originalFileName,
      fileSize: safeAnalysisResult.fileSize,
      imageFormat: safeAnalysisResult.imageFormat,
      imageDimensions: safeAnalysisResult.imageDimensions,
      faceDetected: safeAnalysisResult.faceDetected,
      faceCount: safeAnalysisResult.faceCount,
      faceRegion: safeAnalysisResult.faceRegion,
      colors: safeAnalysisResult.colors,
      faceDimensions: safeAnalysisResult.faceDimensions,
      facialFeatures: safeAnalysisResult.facialFeatures,
      analysisMetadata: {
        ...safeAnalysisResult.analysisMetadata,
        cloudinaryPublicId: publicId,
        autoDeleteDate: deletionDate,
        storageProvider: 'url-based',
        uploadMethod: 'url-only',
        compressed: true
      }
    });

    await faceAnalysis.save();

    console.log(`✅ Face analysis from URL completed in ${analysisResult.analysisMetadata.processingTime}ms`);

    // Return analysis results
    res.status(201).json({
      success: true,
      message: 'Face analysis completed successfully',
      data: {
        _id: faceAnalysis._id,
        imageUrl: faceAnalysis.imageUrl,
        originalFileName: faceAnalysis.originalFileName,
        faceDetected: faceAnalysis.faceDetected,
        colors: faceAnalysis.colors,
        faceDimensions: faceAnalysis.faceDimensions,
        facialFeatures: faceAnalysis.facialFeatures,
        analysisMetadata: faceAnalysis.analysisMetadata,
        createdAt: faceAnalysis.createdAt
      }
    });

  } catch (error) {
    console.error('Error in analyzeFaceFromUrl:', error);
    res.status(500).json({
      success: false,
      message: 'Face analysis failed',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

module.exports = {
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
};
