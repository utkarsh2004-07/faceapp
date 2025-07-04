const mongoose = require('mongoose');

const outfitRecommendationSchema = new mongoose.Schema({
  outfitName: {
    type: String,
    required: true
  },
  shirt: {
    color: { type: String, required: true },
    hex: { type: String, required: true },
    reason: { type: String, required: true }
  },
  pants: {
    color: { type: String, required: true },
    hex: { type: String, required: true },
    reason: { type: String, required: true }
  },
  shoes: {
    color: { type: String, required: true },
    hex: { type: String, required: true },
    reason: { type: String, required: true }
  },
  overallReason: {
    type: String,
    required: true
  }
}, { _id: false });

const colorPaletteSchema = new mongoose.Schema({
  bestColors: [{
    type: String,
    validate: {
      validator: function(v) {
        return /^#[0-9A-F]{6}$/i.test(v);
      },
      message: 'Color must be a valid hex code'
    }
  }],
  avoidColors: [{
    type: String,
    validate: {
      validator: function(v) {
        return /^#[0-9A-F]{6}$/i.test(v);
      },
      message: 'Color must be a valid hex code'
    }
  }],
  seasonalType: {
    type: String,
    enum: ['Spring', 'Summer', 'Autumn', 'Winter', 'Universal', 'Unspecified'],
    default: 'Universal'
  }
}, { _id: false });

const colorRecommendationSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  faceAnalysisId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'FaceAnalysis',
    required: true
  },
  
  // AI Service Information
  aiService: {
    type: String,
    enum: ['gemini', 'fallback'],
    default: 'gemini'
  },
  aiModel: {
    type: String,
    default: 'gemini-1.5-flash'
  },
  
  // Recommendation Data
  recommendations: [outfitRecommendationSchema],
  
  colorPalette: colorPaletteSchema,
  
  generalAdvice: {
    type: String,
    required: true
  },
  
  // User Feedback
  userRating: {
    type: Number,
    min: 1,
    max: 5
  },
  userFeedback: {
    type: String,
    maxlength: 500
  },
  favoriteOutfits: [{
    type: Number, // Index of the outfit in recommendations array
    min: 0
  }],
  
  // Processing Metadata
  processingTime: {
    type: Number, // milliseconds
    required: true
  },
  confidence: {
    type: Number,
    min: 0,
    max: 1,
    default: 0.8
  },
  
  // Status
  isActive: {
    type: Boolean,
    default: true
  },
  
  // Version for recommendation algorithm updates
  version: {
    type: String,
    default: '1.0'
  }
}, {
  timestamps: true
});

// Indexes for efficient queries
colorRecommendationSchema.index({ userId: 1, createdAt: -1 });
colorRecommendationSchema.index({ faceAnalysisId: 1 });
colorRecommendationSchema.index({ userId: 1, isActive: 1 });
colorRecommendationSchema.index({ 'colorPalette.seasonalType': 1 });
colorRecommendationSchema.index({ userRating: 1 });

// Virtual for recommendation summary
colorRecommendationSchema.virtual('summary').get(function() {
  return {
    id: this._id,
    outfitCount: this.recommendations.length,
    seasonalType: this.colorPalette?.seasonalType || 'Universal',
    userRating: this.userRating,
    aiService: this.aiService,
    createdAt: this.createdAt
  };
});

// Method to get favorite outfits
colorRecommendationSchema.methods.getFavoriteOutfits = function() {
  return this.favoriteOutfits.map(index => this.recommendations[index]).filter(Boolean);
};

// Method to add user feedback
colorRecommendationSchema.methods.addFeedback = function(rating, feedback, favoriteIndexes = []) {
  this.userRating = rating;
  this.userFeedback = feedback;
  this.favoriteOutfits = favoriteIndexes;
  return this.save();
};

// Static method to get user's recommendation history
colorRecommendationSchema.statics.getUserHistory = function(userId, limit = 10) {
  return this.find({ userId, isActive: true })
    .populate('faceAnalysisId', 'colors facialFeatures createdAt')
    .sort({ createdAt: -1 })
    .limit(limit);
};

// Static method to get recommendations by face analysis
colorRecommendationSchema.statics.getByFaceAnalysis = function(faceAnalysisId) {
  return this.findOne({ faceAnalysisId, isActive: true })
    .populate('userId', 'name email')
    .populate('faceAnalysisId', 'colors facialFeatures');
};

// Pre-save middleware to validate recommendations
colorRecommendationSchema.pre('save', function(next) {
  // Ensure we have at least one recommendation
  if (!this.recommendations || this.recommendations.length === 0) {
    return next(new Error('At least one outfit recommendation is required'));
  }
  
  // Validate favorite outfit indexes
  if (this.favoriteOutfits) {
    this.favoriteOutfits = this.favoriteOutfits.filter(index => 
      index >= 0 && index < this.recommendations.length
    );
  }
  
  next();
});

// Post-save middleware for logging
colorRecommendationSchema.post('save', function(doc) {
  console.log(`✅ Color recommendation saved for user ${doc.userId} with ${doc.recommendations.length} outfits`);
});

module.exports = mongoose.model('ColorRecommendation', colorRecommendationSchema);
