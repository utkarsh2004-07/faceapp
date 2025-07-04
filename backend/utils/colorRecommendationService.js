const geminiService = require('../services/geminiService');
const ColorRecommendation = require('../models/ColorRecommendation');
const FaceAnalysis = require('../models/FaceAnalysis');
const mongoose = require('mongoose');

class ColorRecommendationService {
  
  /**
   * Generate color recommendations for a face analysis
   * @param {string} faceAnalysisId - Face analysis document ID
   * @param {string} userId - User ID
   * @param {Object} userProfile - User profile data (gender, preferences)
   * @returns {Promise<Object>} Color recommendations
   */
  async generateRecommendations(faceAnalysisId, userId, userProfile = {}) {
    const startTime = Date.now();
    
    try {
      console.log(`🎨 Generating color recommendations for face analysis ${faceAnalysisId}`);
      
      // Get face analysis data
      const faceAnalysis = await FaceAnalysis.findById(faceAnalysisId);
      if (!faceAnalysis) {
        throw new Error('Face analysis not found');
      }

      if (faceAnalysis.userId.toString() !== userId) {
        throw new Error('Unauthorized access to face analysis');
      }

      // Check if face was actually detected
      if (!faceAnalysis.faceDetected) {
        throw new Error('No face was detected in the uploaded image. Please upload a clear front-facing photo with good lighting for color analysis.');
      }
      
      // Check if recommendations already exist
      const existingRecommendation = await ColorRecommendation.findOne({
        faceAnalysisId,
        isActive: true
      });
      
      if (existingRecommendation) {
        console.log('📋 Returning existing color recommendations');
        return {
          success: true,
          data: existingRecommendation,
          cached: true,
          processingTime: Date.now() - startTime
        };
      }
      
      // Prepare face analysis data for AI
      const analysisData = this.prepareFaceAnalysisData(faceAnalysis);

      // Get recommendations from Gemini AI
      const aiRecommendations = await geminiService.getColorRecommendations(
        analysisData,
        userProfile
      );
      
      // Validate and sanitize AI recommendations before saving
      const sanitizedRecommendations = this.sanitizeRecommendations(aiRecommendations);

      // Create and save recommendation document
      const recommendation = new ColorRecommendation({
        userId,
        faceAnalysisId,
        aiService: geminiService.isConfigured ? 'gemini' : 'fallback',
        aiModel: geminiService.modelName || 'fallback',
        recommendations: sanitizedRecommendations.recommendations,
        colorPalette: sanitizedRecommendations.colorPalette,
        generalAdvice: sanitizedRecommendations.generalAdvice,
        processingTime: Date.now() - startTime,
        confidence: this.calculateConfidence(sanitizedRecommendations, faceAnalysis)
      });

      await recommendation.save();
      
      console.log(`✅ Color recommendations generated in ${Date.now() - startTime}ms`);
      
      return {
        success: true,
        data: recommendation,
        cached: false,
        processingTime: Date.now() - startTime
      };
      
    } catch (error) {
      console.error('❌ Error generating color recommendations:', error.message);
      throw error;
    }
  }
  
  /**
   * Regenerate recommendations (force new AI call)
   */
  async regenerateRecommendations(faceAnalysisId, userId, userProfile = {}) {
    try {
      // Deactivate existing recommendations
      await ColorRecommendation.updateMany(
        { faceAnalysisId, isActive: true },
        { isActive: false }
      );
      
      // Generate new recommendations
      return await this.generateRecommendations(faceAnalysisId, userId, userProfile);
      
    } catch (error) {
      console.error('❌ Error regenerating recommendations:', error.message);
      throw error;
    }
  }
  
  /**
   * Get user's recommendation history
   */
  async getUserRecommendationHistory(userId, limit = 10) {
    try {
      const recommendations = await ColorRecommendation.getUserHistory(userId, limit);
      
      return {
        success: true,
        data: recommendations,
        count: recommendations.length
      };
      
    } catch (error) {
      console.error('❌ Error getting user recommendation history:', error.message);
      throw error;
    }
  }
  
  /**
   * Add user feedback to recommendations
   */
  async addUserFeedback(recommendationId, userId, rating, feedback, favoriteIndexes = []) {
    try {
      const recommendation = await ColorRecommendation.findOne({
        _id: recommendationId,
        userId,
        isActive: true
      });
      
      if (!recommendation) {
        throw new Error('Recommendation not found');
      }
      
      await recommendation.addFeedback(rating, feedback, favoriteIndexes);
      
      console.log(`📝 User feedback added to recommendation ${recommendationId}`);
      
      return {
        success: true,
        data: recommendation
      };
      
    } catch (error) {
      console.error('❌ Error adding user feedback:', error.message);
      throw error;
    }
  }
  
  /**
   * Get recommendations by face analysis ID
   */
  async getRecommendationsByFaceAnalysis(faceAnalysisId, userId) {
    try {
      const recommendation = await ColorRecommendation.findOne({
        faceAnalysisId,
        userId,
        isActive: true
      }).populate('faceAnalysisId', 'colors facialFeatures createdAt');
      
      if (!recommendation) {
        return {
          success: false,
          message: 'No recommendations found for this face analysis'
        };
      }
      
      return {
        success: true,
        data: recommendation
      };
      
    } catch (error) {
      console.error('❌ Error getting recommendations by face analysis:', error.message);
      throw error;
    }
  }
  
  /**
   * Prepare face analysis data for AI consumption
   */
  prepareFaceAnalysisData(faceAnalysis) {
    return {
      colors: {
        skinTone: {
          primary: faceAnalysis.colors?.skinTone?.primary || 'unknown',
          hex: faceAnalysis.colors?.skinTone?.hex || '#000000',
          rgb: faceAnalysis.colors?.skinTone?.rgb || { r: 0, g: 0, b: 0 }
        },
        hairColor: {
          primary: faceAnalysis.colors?.hairColor?.primary || 'unknown',
          hex: faceAnalysis.colors?.hairColor?.hex || '#000000',
          rgb: faceAnalysis.colors?.hairColor?.rgb || { r: 0, g: 0, b: 0 }
        },
        eyeColor: {
          primary: faceAnalysis.colors?.eyeColor?.primary || 'unknown',
          hex: faceAnalysis.colors?.eyeColor?.hex || '#000000',
          rgb: faceAnalysis.colors?.eyeColor?.rgb || { r: 0, g: 0, b: 0 }
        },
        lipColor: {
          primary: faceAnalysis.colors?.lipColor?.primary || 'unknown',
          hex: faceAnalysis.colors?.lipColor?.hex || '#000000',
          rgb: faceAnalysis.colors?.lipColor?.rgb || { r: 0, g: 0, b: 0 }
        }
      },
      facialFeatures: {
        faceShape: faceAnalysis.facialFeatures?.faceShape || 'unknown',
        eyeShape: faceAnalysis.facialFeatures?.eyeShape || 'unknown',
        eyeDistance: faceAnalysis.facialFeatures?.eyeDistance || 'normal',
        eyebrowShape: faceAnalysis.facialFeatures?.eyebrowShape || 'unknown',
        noseShape: faceAnalysis.facialFeatures?.noseShape || 'unknown',
        lipShape: faceAnalysis.facialFeatures?.lipShape || 'unknown'
      },
      faceDimensions: {
        faceLength: faceAnalysis.faceDimensions?.faceLength || null,
        faceWidth: faceAnalysis.faceDimensions?.faceWidth || null,
        lengthToWidthRatio: faceAnalysis.faceDimensions?.lengthToWidthRatio || null,
        jawWidth: faceAnalysis.faceDimensions?.jawWidth || null,
        foreheadWidth: faceAnalysis.faceDimensions?.foreheadWidth || null,
        cheekboneWidth: faceAnalysis.faceDimensions?.cheekboneWidth || null,
        jawToForeheadRatio: faceAnalysis.faceDimensions?.jawToForeheadRatio || null,
        cheekboneToJawRatio: faceAnalysis.faceDimensions?.cheekboneToJawRatio || null
      },
      confidence: faceAnalysis.analysisMetadata?.confidence || 0.5
    };
  }
  
  /**
   * Sanitize AI recommendations to ensure they meet database schema requirements
   */
  sanitizeRecommendations(aiRecommendations) {
    const validSeasonalTypes = ['Spring', 'Summer', 'Autumn', 'Winter', 'Universal', 'Unspecified'];

    // Ensure we have the basic structure
    const sanitized = {
      recommendations: aiRecommendations.recommendations || [],
      colorPalette: aiRecommendations.colorPalette || {},
      generalAdvice: aiRecommendations.generalAdvice || 'Color recommendations based on your facial features.'
    };

    // Sanitize seasonal type
    if (sanitized.colorPalette.seasonalType) {
      const seasonalType = sanitized.colorPalette.seasonalType.toString().trim();

      // Find matching valid type (case insensitive)
      const matchedType = validSeasonalTypes.find(type =>
        type.toLowerCase() === seasonalType.toLowerCase()
      );

      if (matchedType) {
        sanitized.colorPalette.seasonalType = matchedType;
      } else {
        // Check for partial matches
        const lowerType = seasonalType.toLowerCase();
        if (lowerType.includes('spring')) sanitized.colorPalette.seasonalType = 'Spring';
        else if (lowerType.includes('summer')) sanitized.colorPalette.seasonalType = 'Summer';
        else if (lowerType.includes('autumn') || lowerType.includes('fall')) sanitized.colorPalette.seasonalType = 'Autumn';
        else if (lowerType.includes('winter')) sanitized.colorPalette.seasonalType = 'Winter';
        else if (lowerType.includes('unspecified') || lowerType.includes('unknown')) sanitized.colorPalette.seasonalType = 'Unspecified';
        else sanitized.colorPalette.seasonalType = 'Universal';
      }
    } else {
      sanitized.colorPalette.seasonalType = 'Universal';
    }

    // Ensure color arrays exist
    if (!sanitized.colorPalette.bestColors || !Array.isArray(sanitized.colorPalette.bestColors)) {
      sanitized.colorPalette.bestColors = ['#1e3a8a', '#36454f', '#8b4513'];
    }

    if (!sanitized.colorPalette.avoidColors || !Array.isArray(sanitized.colorPalette.avoidColors)) {
      sanitized.colorPalette.avoidColors = ['#ff0000', '#ffff00'];
    }

    // Validate hex colors
    sanitized.colorPalette.bestColors = sanitized.colorPalette.bestColors
      .map(color => this.validateHexColor(color))
      .filter(Boolean);

    sanitized.colorPalette.avoidColors = sanitized.colorPalette.avoidColors
      .map(color => this.validateHexColor(color))
      .filter(Boolean);

    // Ensure we have at least some colors
    if (sanitized.colorPalette.bestColors.length === 0) {
      sanitized.colorPalette.bestColors = ['#1e3a8a', '#36454f', '#8b4513'];
    }

    if (sanitized.colorPalette.avoidColors.length === 0) {
      sanitized.colorPalette.avoidColors = ['#ff0000', '#ffff00'];
    }

    return sanitized;
  }

  /**
   * Validate hex color format
   */
  validateHexColor(hex) {
    if (!hex || typeof hex !== 'string') return null;

    // Remove # if present and validate format
    const cleanHex = hex.replace('#', '');
    if (/^[0-9A-F]{6}$/i.test(cleanHex)) {
      return '#' + cleanHex.toLowerCase();
    }

    return null;
  }

  /**
   * Calculate confidence score for recommendations
   */
  calculateConfidence(aiRecommendations, faceAnalysis) {
    let confidence = 0.8; // Base confidence

    // Adjust based on face analysis quality
    if (faceAnalysis.analysisMetadata?.confidence) {
      confidence *= faceAnalysis.analysisMetadata.confidence;
    }

    // Adjust based on AI service used
    if (aiRecommendations.aiService === 'fallback') {
      confidence *= 0.7;
    }

    // Adjust based on face detection quality
    if (!faceAnalysis.faceDetected) {
      confidence *= 0.5;
    }

    return Math.max(0.1, Math.min(1.0, confidence));
  }
  
  /**
   * Get color statistics for analytics
   */
  async getColorStatistics(userId = null) {
    try {
      const matchStage = userId ? { userId: new mongoose.Types.ObjectId(userId) } : {};
      
      const stats = await ColorRecommendation.aggregate([
        { $match: { ...matchStage, isActive: true } },
        {
          $group: {
            _id: null,
            totalRecommendations: { $sum: 1 },
            avgRating: { $avg: '$userRating' },
            seasonalTypes: { $push: '$colorPalette.seasonalType' },
            aiServices: { $push: '$aiService' }
          }
        }
      ]);
      
      return {
        success: true,
        data: stats[0] || {
          totalRecommendations: 0,
          avgRating: 0,
          seasonalTypes: [],
          aiServices: []
        }
      };
      
    } catch (error) {
      console.error('❌ Error getting color statistics:', error.message);
      throw error;
    }
  }
}

module.exports = new ColorRecommendationService();
