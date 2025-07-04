const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, '../uploads');
const faceImagesDir = path.join(uploadsDir, 'face-images');

if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

if (!fs.existsSync(faceImagesDir)) {
  fs.mkdirSync(faceImagesDir, { recursive: true });
}

// Configure multer storage
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, faceImagesDir);
  },
  filename: function (req, file, cb) {
    // Generate unique filename
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const extension = path.extname(file.originalname);
    const filename = `face-${uniqueSuffix}${extension}`;
    cb(null, filename);
  }
});

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
    fileSize: 10 * 1024 * 1024, // 10MB limit
    files: 1 // Only one file at a time
  },
  fileFilter: fileFilter
});

// Middleware for single file upload
const uploadSingle = upload.single('faceImage');

// Enhanced upload middleware with error handling
const uploadMiddleware = (req, res, next) => {
  uploadSingle(req, res, function (err) {
    if (err instanceof multer.MulterError) {
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

    // Add file info to request
    req.fileInfo = {
      originalName: req.file.originalname,
      filename: req.file.filename,
      path: req.file.path,
      size: req.file.size,
      mimetype: req.file.mimetype
    };

    next();
  });
};

// Cleanup function to delete uploaded files
const cleanupFile = (filePath) => {
  try {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  } catch (error) {
    console.error('Error deleting file:', error);
  }
};

// Get file URL for serving
const getFileUrl = (filename) => {
  return `/uploads/face-images/${filename}`;
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
      // Validate image dimensions
      const validation = await validateImageDimensions(req.file.path);
      
      if (!validation.valid) {
        // Clean up uploaded file
        cleanupFile(req.file.path);
        
        return res.status(400).json({
          success: false,
          message: validation.message
        });
      }

      // Add validation info to request
      req.imageValidation = validation;
      next();
    } catch (error) {
      // Clean up uploaded file on error
      cleanupFile(req.file.path);
      
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
  validateImageDimensions,
  uploadsDir,
  faceImagesDir
};
