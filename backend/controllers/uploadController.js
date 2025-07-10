const cloudinary = require('cloudinary').v2;
const crypto = require('crypto');

// @desc    Generate signed upload URL for direct Cloudinary upload
// @route   POST /api/upload/signature
// @access  Private
const generateUploadSignature = async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Generate unique public_id for the upload
    const timestamp = Math.round(Date.now() / 1000);
    const randomSuffix = Math.round(Math.random() * 1E9);
    const publicId = `face-${userId}-${timestamp}-${randomSuffix}`;
    
    // Calculate deletion date (5-6 days from now)
    const deletionDate = new Date();
    deletionDate.setDate(deletionDate.getDate() + (parseInt(process.env.CLOUDINARY_AUTO_DELETE_DAYS) || 5));
    
    // Upload parameters for Cloudinary signature (must match frontend exactly)
    const signatureParams = {
      allowed_formats: 'jpg,jpeg,png,gif,bmp,webp',
      context: `user_id=${userId}|original_upload=true|upload_date=${new Date().toISOString()}|auto_delete_date=${deletionDate.toISOString()}|source=direct-upload|compressed=true`,
      folder: process.env.CLOUDINARY_FOLDER || 'faceapp-uploads',
      public_id: publicId,
      tags: `face-analysis,auto-delete,user-${userId}`,
      timestamp: timestamp,
      transformation: 'q_auto:good,f_auto,w_1200,h_1200,c_limit'
    };

    // Generate signature for secure upload
    const signature = cloudinary.utils.api_sign_request(signatureParams, process.env.CLOUDINARY_API_SECRET);

    // Return upload configuration to frontend
    res.json({
      success: true,
      data: {
        signature,
        timestamp,
        publicId,
        cloudName: process.env.CLOUDINARY_CLOUD_NAME,
        apiKey: process.env.CLOUDINARY_API_KEY,
        uploadUrl: `https://api.cloudinary.com/v1_1/${process.env.CLOUDINARY_CLOUD_NAME}/image/upload`,
        // Exact parameters used for signature generation
        uploadParams: {
          ...signatureParams,
          signature,
          api_key: process.env.CLOUDINARY_API_KEY
        },
        // Frontend will need these for the upload (exact format)
        formData: {
          public_id: publicId,
          folder: signatureParams.folder,
          timestamp: timestamp,
          signature: signature,
          api_key: process.env.CLOUDINARY_API_KEY,
          transformation: signatureParams.transformation,
          tags: signatureParams.tags,
          context: signatureParams.context,
          allowed_formats: signatureParams.allowed_formats
        },
        autoDeleteDate: deletionDate
      }
    });

  } catch (error) {
    console.error('Error generating upload signature:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate upload signature',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

// @desc    Verify uploaded image and prepare for analysis
// @route   POST /api/upload/verify
// @access  Private
const verifyUpload = async (req, res) => {
  try {
    const { publicId, version, signature, timestamp } = req.body;
    const userId = req.user.id;

    // Validate required fields
    if (!publicId || !version || !signature || !timestamp) {
      return res.status(400).json({
        success: false,
        message: 'Missing required upload verification data'
      });
    }

    // Verify the upload signature to ensure it's legitimate
    const expectedSignature = cloudinary.utils.api_sign_request(
      { public_id: publicId, version: version, timestamp: timestamp },
      process.env.CLOUDINARY_API_SECRET
    );

    if (signature !== expectedSignature) {
      return res.status(400).json({
        success: false,
        message: 'Invalid upload signature'
      });
    }

    // Get image details from Cloudinary
    try {
      const imageDetails = await cloudinary.api.resource(publicId);
      
      // Validate image dimensions for face analysis
      const minWidth = 200;
      const minHeight = 200;
      
      if (imageDetails.width < minWidth || imageDetails.height < minHeight) {
        // Delete the uploaded image since it doesn't meet requirements
        await cloudinary.uploader.destroy(publicId);
        
        return res.status(400).json({
          success: false,
          message: `Image too small. Minimum dimensions: ${minWidth}x${minHeight}px`
        });
      }

      // Return verified upload details
      res.json({
        success: true,
        message: 'Upload verified successfully',
        data: {
          publicId: imageDetails.public_id,
          url: imageDetails.secure_url,
          width: imageDetails.width,
          height: imageDetails.height,
          format: imageDetails.format,
          bytes: imageDetails.bytes,
          createdAt: imageDetails.created_at,
          version: imageDetails.version,
          // Optimized URL for face analysis
          optimizedUrl: cloudinary.url(publicId, {
            quality: 'auto:good',
            fetch_format: 'auto',
            secure: true
          })
        }
      });

    } catch (cloudinaryError) {
      console.error('Error fetching image details:', cloudinaryError);
      return res.status(400).json({
        success: false,
        message: 'Failed to verify uploaded image'
      });
    }

  } catch (error) {
    console.error('Error verifying upload:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to verify upload',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

// @desc    Get upload configuration for frontend
// @route   GET /api/upload/config
// @access  Private
const getUploadConfig = async (req, res) => {
  try {
    res.json({
      success: true,
      data: {
        cloudName: process.env.CLOUDINARY_CLOUD_NAME,
        uploadUrl: `https://api.cloudinary.com/v1_1/${process.env.CLOUDINARY_CLOUD_NAME}/image/upload`,
        maxFileSize: 10485760, // 10MB
        allowedFormats: ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp'],
        minDimensions: { width: 200, height: 200 },
        compression: {
          quality: 'auto:good',
          maxWidth: 1200,
          maxHeight: 1200
        },
        autoDeleteDays: parseInt(process.env.CLOUDINARY_AUTO_DELETE_DAYS) || 5
      }
    });
  } catch (error) {
    console.error('Error getting upload config:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get upload configuration'
    });
  }
};

// @desc    Generate simple signature for mobile app
// @route   POST /api/upload/mobile-signature
// @access  Private
const generateMobileSignature = async (req, res) => {
  try {
    const userId = req.user.id;

    // Generate unique public_id for the upload
    const timestamp = Math.round(Date.now() / 1000);
    const randomSuffix = Math.round(Math.random() * 1E9);
    const publicId = `face-${userId}-${timestamp}-${randomSuffix}`;

    // Calculate deletion date (5-6 days from now)
    const deletionDate = new Date();
    deletionDate.setDate(deletionDate.getDate() + (parseInt(process.env.CLOUDINARY_AUTO_DELETE_DAYS) || 5));

    // Simple parameters for mobile signature (exact format expected by frontend)
    const params = {
      allowed_formats: 'jpg,jpeg,png,gif,bmp,webp',
      context: `user_id=${userId}|original_upload=true|upload_date=${new Date().toISOString()}|auto_delete_date=${deletionDate.toISOString()}|source=direct-upload|compressed=true`,
      folder: process.env.CLOUDINARY_FOLDER || 'faceapp-uploads',
      public_id: publicId,
      tags: `face-analysis,auto-delete,user-${userId}`,
      timestamp: timestamp,
      transformation: 'q_auto:good,f_auto,w_1200,h_1200,c_limit'
    };

    // Generate signature
    const signature = cloudinary.utils.api_sign_request(params, process.env.CLOUDINARY_API_SECRET);

    // Return simple response for mobile
    res.json({
      success: true,
      signature,
      timestamp,
      public_id: publicId,
      api_key: process.env.CLOUDINARY_API_KEY,
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      upload_url: `https://api.cloudinary.com/v1_1/${process.env.CLOUDINARY_CLOUD_NAME}/image/upload`,
      // All parameters needed for upload
      ...params
    });

  } catch (error) {
    console.error('Error generating mobile signature:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate upload signature',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

module.exports = {
  generateUploadSignature,
  verifyUpload,
  getUploadConfig,
  generateMobileSignature
};
