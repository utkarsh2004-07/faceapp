const cloudinary = require('cloudinary').v2;
const fs = require('fs');
const path = require('path');

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true
});

class CloudinaryService {
  constructor() {
    this.folder = process.env.CLOUDINARY_FOLDER || 'faceapp-uploads';
    this.autoDeleteDays = parseInt(process.env.CLOUDINARY_AUTO_DELETE_DAYS) || 5;

    // Compression and optimization settings
    this.compressionSettings = {
      // Standard compression for face analysis
      standard: {
        quality: 'auto:good',
        fetch_format: 'auto',
        width: 1200,
        height: 1200,
        crop: 'limit'
      },
      // High compression for thumbnails
      thumbnail: {
        quality: 'auto:low',
        fetch_format: 'auto',
        width: 300,
        height: 300,
        crop: 'fill',
        gravity: 'face'
      },
      // Minimal compression for analysis
      analysis: {
        quality: 'auto:best',
        fetch_format: 'auto',
        width: 800,
        height: 800,
        crop: 'limit'
      }
    };

    // Validate configuration
    if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
      console.warn('⚠️ Cloudinary configuration incomplete. Please check your environment variables.');
    }
  }

  /**
   * Upload an image to Cloudinary from memory buffer (no temp files)
   * @param {Buffer} buffer - Image buffer from memory
   * @param {string} originalName - Original filename
   * @param {string} mimetype - File mimetype
   * @returns {Promise<Object>} Upload result with URL and public_id
   */
  async uploadImageFromBuffer(buffer, originalName, mimetype) {
    try {
      // Generate unique filename
      const timestamp = Date.now();
      const randomSuffix = Math.round(Math.random() * 1E9);
      const extension = path.extname(originalName);
      const publicId = `face-${timestamp}-${randomSuffix}`;

      // Calculate deletion date
      const deletionDate = new Date();
      deletionDate.setDate(deletionDate.getDate() + this.autoDeleteDays);

      const uploadOptions = {
        folder: this.folder,
        public_id: publicId,
        resource_type: 'image',
        overwrite: false,
        unique_filename: true,
        use_filename: false,
        // Add tags for easier management
        tags: ['face-analysis', 'auto-delete'],
        // Add context for metadata
        context: {
          original_name: originalName,
          upload_date: new Date().toISOString(),
          auto_delete_date: deletionDate.toISOString(),
          source: 'face-analysis-app',
          upload_method: 'direct-memory'
        },
        // Optimize for face analysis with compression
        transformation: [this.compressionSettings.standard]
      };

      console.log(`📤 Uploading image to Cloudinary from memory: ${originalName}`);

      // Upload from buffer using upload_stream
      const result = await new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          uploadOptions,
          (error, result) => {
            if (error) {
              reject(error);
            } else {
              resolve(result);
            }
          }
        );

        // Write buffer to stream
        uploadStream.end(buffer);
      });

      // Schedule automatic deletion
      await this.scheduleAutoDeletion(result.public_id, deletionDate);

      console.log(`✅ Image uploaded successfully from memory: ${result.secure_url}`);

      return {
        url: result.secure_url,
        publicId: result.public_id,
        originalName: originalName,
        fileSize: result.bytes,
        format: result.format,
        width: result.width,
        height: result.height,
        createdAt: result.created_at,
        autoDeleteDate: deletionDate
      };

    } catch (error) {
      console.error('❌ Cloudinary upload from buffer error:', error);
      throw new Error(`Failed to upload image to Cloudinary: ${error.message}`);
    }
  }

  /**
   * Upload an image to Cloudinary with automatic deletion (legacy method)
   * @param {string} filePath - Local file path
   * @param {string} originalName - Original filename
   * @returns {Promise<Object>} Upload result with URL and public_id
   */
  async uploadImage(filePath, originalName) {
    try {
      // Generate unique filename
      const timestamp = Date.now();
      const randomSuffix = Math.round(Math.random() * 1E9);
      const extension = path.extname(originalName);
      const publicId = `face-${timestamp}-${randomSuffix}`;

      // Calculate deletion date
      const deletionDate = new Date();
      deletionDate.setDate(deletionDate.getDate() + this.autoDeleteDays);

      const uploadOptions = {
        folder: this.folder,
        public_id: publicId,
        resource_type: 'image',
        overwrite: false,
        unique_filename: true,
        use_filename: false,
        // Add tags for easier management
        tags: ['face-analysis', 'auto-delete'],
        // Add context for metadata
        context: {
          original_name: originalName,
          upload_date: new Date().toISOString(),
          auto_delete_date: deletionDate.toISOString(),
          source: 'face-analysis-app'
        },
        // Optimize for face analysis with compression
        transformation: [this.compressionSettings.standard]
      };

      console.log(`📤 Uploading image to Cloudinary: ${originalName}`);
      const result = await cloudinary.uploader.upload(filePath, uploadOptions);

      // Schedule automatic deletion
      await this.scheduleAutoDeletion(result.public_id, deletionDate);

      console.log(`✅ Image uploaded successfully: ${result.secure_url}`);
      
      return {
        url: result.secure_url,
        publicId: result.public_id,
        originalName: originalName,
        fileSize: result.bytes,
        format: result.format,
        width: result.width,
        height: result.height,
        createdAt: result.created_at,
        autoDeleteDate: deletionDate
      };

    } catch (error) {
      console.error('❌ Cloudinary upload error:', error);
      throw new Error(`Failed to upload image to Cloudinary: ${error.message}`);
    }
  }

  /**
   * Delete an image from Cloudinary
   * @param {string} publicId - Cloudinary public ID
   * @returns {Promise<Object>} Deletion result
   */
  async deleteImage(publicId) {
    try {
      console.log(`🗑️ Deleting image from Cloudinary: ${publicId}`);
      const result = await cloudinary.uploader.destroy(publicId);
      
      if (result.result === 'ok') {
        console.log(`✅ Image deleted successfully: ${publicId}`);
      } else {
        console.warn(`⚠️ Image deletion result: ${result.result} for ${publicId}`);
      }
      
      return result;
    } catch (error) {
      console.error('❌ Cloudinary deletion error:', error);
      throw new Error(`Failed to delete image from Cloudinary: ${error.message}`);
    }
  }

  /**
   * Schedule automatic deletion of an image
   * @param {string} publicId - Cloudinary public ID
   * @param {Date} deleteDate - When to delete the image
   */
  async scheduleAutoDeletion(publicId, deleteDate) {
    try {
      // In a production environment, you would use a job queue like Bull or Agenda
      // For now, we'll use a simple setTimeout for demonstration
      const timeUntilDeletion = deleteDate.getTime() - Date.now();
      
      if (timeUntilDeletion > 0) {
        console.log(`⏰ Scheduled auto-deletion for ${publicId} in ${Math.round(timeUntilDeletion / (1000 * 60 * 60 * 24))} days`);
        
        // Note: In production, use a persistent job queue instead of setTimeout
        // setTimeout(() => {
        //   this.deleteImage(publicId).catch(console.error);
        // }, timeUntilDeletion);
      }
    } catch (error) {
      console.error('❌ Error scheduling auto-deletion:', error);
    }
  }

  /**
   * Get optimized URL for different use cases
   * @param {string} publicId - Cloudinary public ID
   * @param {string} type - Type of optimization (standard, thumbnail, analysis)
   * @param {Object} customOptions - Custom transformation options
   * @returns {string} Optimized URL
   */
  getOptimizedUrl(publicId, type = 'standard', customOptions = {}) {
    let transformations;

    if (this.compressionSettings[type]) {
      transformations = { ...this.compressionSettings[type], ...customOptions };
    } else {
      transformations = { ...this.compressionSettings.standard, ...customOptions };
    }

    return cloudinary.url(publicId, {
      transformation: transformations,
      secure: true
    });
  }

  /**
   * Get multiple optimized URLs for different use cases
   * @param {string} publicId - Cloudinary public ID
   * @returns {Object} Object with different optimized URLs
   */
  getMultipleOptimizedUrls(publicId) {
    return {
      original: cloudinary.url(publicId, { secure: true }),
      standard: this.getOptimizedUrl(publicId, 'standard'),
      thumbnail: this.getOptimizedUrl(publicId, 'thumbnail'),
      analysis: this.getOptimizedUrl(publicId, 'analysis'),
      // Additional variants
      webp: this.getOptimizedUrl(publicId, 'standard', { fetch_format: 'webp' }),
      avif: this.getOptimizedUrl(publicId, 'standard', { fetch_format: 'avif' })
    };
  }

  /**
   * Get image metadata from Cloudinary
   * @param {string} publicId - Cloudinary public ID
   * @returns {Promise<Object>} Image metadata
   */
  async getImageMetadata(publicId) {
    try {
      const result = await cloudinary.api.resource(publicId);
      return {
        url: result.secure_url,
        publicId: result.public_id,
        format: result.format,
        width: result.width,
        height: result.height,
        fileSize: result.bytes,
        createdAt: result.created_at,
        tags: result.tags,
        context: result.context
      };
    } catch (error) {
      console.error('❌ Error getting image metadata:', error);
      throw new Error(`Failed to get image metadata: ${error.message}`);
    }
  }

  /**
   * Clean up old images (manual cleanup for images past deletion date)
   * @returns {Promise<Array>} Array of deletion results
   */
  async cleanupOldImages() {
    try {
      console.log('🧹 Starting cleanup of old images...');
      
      // Get all images in the folder with auto-delete tag
      const searchResult = await cloudinary.search
        .expression(`folder:${this.folder} AND tags:auto-delete`)
        .with_field('context')
        .max_results(100)
        .execute();

      const deletionPromises = [];
      const currentDate = new Date();

      for (const resource of searchResult.resources) {
        if (resource.context && resource.context.auto_delete_date) {
          const deleteDate = new Date(resource.context.auto_delete_date);
          
          if (currentDate >= deleteDate) {
            console.log(`🗑️ Deleting expired image: ${resource.public_id}`);
            deletionPromises.push(this.deleteImage(resource.public_id));
          }
        }
      }

      const results = await Promise.allSettled(deletionPromises);
      console.log(`✅ Cleanup completed. Processed ${results.length} images.`);
      
      return results;
    } catch (error) {
      console.error('❌ Error during cleanup:', error);
      throw new Error(`Failed to cleanup old images: ${error.message}`);
    }
  }

  /**
   * Validate image file before upload
   * @param {string} filePath - Local file path
   * @returns {Promise<Object>} Validation result
   */
  async validateImage(filePath) {
    try {
      // Check if file exists
      if (!fs.existsSync(filePath)) {
        return { valid: false, message: 'File does not exist' };
      }

      // Get file stats
      const stats = fs.statSync(filePath);
      const maxSize = 10 * 1024 * 1024; // 10MB

      if (stats.size > maxSize) {
        return { valid: false, message: 'File too large. Maximum size is 10MB.' };
      }

      // Check file extension
      const allowedExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp'];
      const extension = path.extname(filePath).toLowerCase();
      
      if (!allowedExtensions.includes(extension)) {
        return { valid: false, message: 'Invalid file type. Only image files are allowed.' };
      }

      return { valid: true };
    } catch (error) {
      return { valid: false, message: `Validation error: ${error.message}` };
    }
  }

  /**
   * Check Cloudinary configuration
   * @returns {boolean} True if properly configured
   */
  isConfigured() {
    return !!(process.env.CLOUDINARY_CLOUD_NAME && 
              process.env.CLOUDINARY_API_KEY && 
              process.env.CLOUDINARY_API_SECRET);
  }
}

module.exports = new CloudinaryService();
