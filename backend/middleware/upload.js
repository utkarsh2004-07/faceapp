const multer = require('multer');
const path = require('path');
const fs = require('fs');
const cloudinaryService = require('../utils/cloudinaryService');

// Use memory storage instead of disk storage - no temp files!
const storage = multer.memoryStorage();

// File filter to accept only images
const fileFilter = (req, file, cb) => {
  // Check file type
  const allowedTypes = /jpeg|jpg|png|gif|bmp|webp/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);

  if (mimetype && extname) {
    return cb(null, true);
  } else {
    cb(new Error('Only image files are allowed (jpeg, jpg, png, gif, bmp, webp)'));
  }
};

// Configure multer
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB limit (increased for testing)
    files: 1 // Only one file at a time
  },
  fileFilter: fileFilter
});

// Middleware for single file upload
const uploadSingle = upload.single('faceImage');

// Enhanced upload middleware with Cloudinary integration
const uploadMiddleware = (req, res, next) => {
  // Debug logging
  console.log('📝 Upload request received');
  console.log('Content-Type:', req.headers['content-type']);
  console.log('Request method:', req.method);

  uploadSingle(req, res, async function (err) {
    if (err instanceof multer.MulterError) {
      // Debug multer error
      console.log('❌ Multer Error:', err.code, err.message);
      console.log('Error details:', err);

      // Multer-specific errors
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({
          success: false,
          message: 'File too large. Maximum size is 10MB.'
        });
      }
      if (err.code === 'LIMIT_FILE_COUNT') {
        return res.status(400).json({
          success: false,
          message: 'Too many files. Only one file is allowed.'
        });
      }
      if (err.code === 'LIMIT_UNEXPECTED_FILE') {
        return res.status(400).json({
          success: false,
          message: 'Unexpected field name. Use "faceImage" as the field name.'
        });
      }
      return res.status(400).json({
        success: false,
        message: `Upload error: ${err.message}`
      });
    } else if (err) {
      // Other errors (like file type validation)
      return res.status(400).json({
        success: false,
        message: err.message
      });
    }

    // Check if file was uploaded
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded. Please select an image file.'
      });
    }

    try {
      // Check if Cloudinary is configured
      if (!cloudinaryService.isConfigured()) {
        return res.status(500).json({
          success: false,
          message: 'Image upload service not configured properly'
        });
      }

      // Validate file size and type (basic validation since file is in memory)
      const maxSize = 50 * 1024 * 1024; // 50MB
      if (req.file.size > maxSize) {
        return res.status(400).json({
          success: false,
          message: 'File too large. Maximum size is 50MB.'
        });
      }

      // Upload directly to Cloudinary from memory buffer
      const cloudinaryResult = await cloudinaryService.uploadImageFromBuffer(
        req.file.buffer,
        req.file.originalname,
        req.file.mimetype
      );

      // Add Cloudinary info to request (maintaining compatibility with existing code)
      req.file.cloudinary = cloudinaryResult;
      req.fileInfo = {
        originalName: req.file.originalname,
        filename: cloudinaryResult.publicId,
        path: cloudinaryResult.url, // Cloudinary URL instead of local path
        size: cloudinaryResult.fileSize,
        mimetype: req.file.mimetype,
        cloudinaryUrl: cloudinaryResult.url,
        cloudinaryPublicId: cloudinaryResult.publicId,
        autoDeleteDate: cloudinaryResult.autoDeleteDate
      };

      next();
    } catch (error) {
      console.error('Cloudinary upload error:', error);

      return res.status(500).json({
        success: false,
        message: 'Failed to upload image to cloud storage'
      });
    }
  });
};

// Cleanup function to delete temporary files
const cleanupFile = (filePath) => {
  try {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      console.log(`🗑️ Cleaned up temporary file: ${filePath}`);
    }
  } catch (error) {
    console.error('Error deleting temporary file:', error);
  }
};

// Get file URL - now returns Cloudinary URL directly
const getFileUrl = (cloudinaryUrl) => {
  return cloudinaryUrl;
};

// Delete image from Cloudinary
const deleteCloudinaryImage = async (publicId) => {
  try {
    if (publicId && cloudinaryService.isConfigured()) {
      await cloudinaryService.deleteImage(publicId);
    }
  } catch (error) {
    console.error('Error deleting Cloudinary image:', error);
  }
};

// Validate image dimensions
const validateImageDimensions = async (filePath) => {
  try {
    const sharp = require('sharp');
    const metadata = await sharp(filePath).metadata();
    
    // Minimum dimensions for face analysis
    const minWidth = 200;
    const minHeight = 200;
    
    if (metadata.width < minWidth || metadata.height < minHeight) {
      return {
        valid: false,
        message: `Image too small. Minimum dimensions: ${minWidth}x${minHeight}px`
      };
    }
    
    return {
      valid: true,
      dimensions: {
        width: metadata.width,
        height: metadata.height
      }
    };
  } catch (error) {
    return {
      valid: false,
      message: 'Invalid image file'
    };
  }
};

// Enhanced middleware with image validation
const uploadWithValidation = (req, res, next) => {
  uploadMiddleware(req, res, async (err) => {
    if (err) return;

    try {
      // For direct Cloudinary uploads from memory, we already have the image dimensions
      // from the upload result, so we can validate them directly
      const cloudinaryResult = req.file.cloudinary;

      // Minimum dimensions for face analysis
      const minWidth = 200;
      const minHeight = 200;

      if (cloudinaryResult.width < minWidth || cloudinaryResult.height < minHeight) {
        // Delete from Cloudinary since validation failed
        await deleteCloudinaryImage(cloudinaryResult.publicId);

        return res.status(400).json({
          success: false,
          message: `Image too small. Minimum dimensions: ${minWidth}x${minHeight}px`
        });
      }

      // Add validation info to request
      req.imageValidation = {
        valid: true,
        dimensions: {
          width: cloudinaryResult.width,
          height: cloudinaryResult.height
        }
      };

      console.log(`✅ Image validation passed: ${cloudinaryResult.width}x${cloudinaryResult.height}px`);
      next();
    } catch (error) {
      console.error('Error validating image:', error);

      // Clean up Cloudinary image on error
      if (req.file && req.file.cloudinary) {
        await deleteCloudinaryImage(req.file.cloudinary.publicId);
      }

      return res.status(500).json({
        success: false,
        message: 'Error validating image file'
      });
    }
  });
};

module.exports = {
  uploadMiddleware,
  uploadWithValidation,
  cleanupFile,
  getFileUrl,
  deleteCloudinaryImage,
  validateImageDimensions,
  cloudinaryService
};
