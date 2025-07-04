const mongoose = require('mongoose');

const faceAnalysisSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  imageUrl: {
    type: String,
    required: true
  },
  originalFileName: {
    type: String,
    required: true
  },
  fileSize: {
    type: Number,
    required: true
  },
  imageFormat: {
    type: String,
    required: true
  },
  imageDimensions: {
    width: { type: Number, required: true },
    height: { type: Number, required: true }
  },
  
  // Face Detection Results
  faceDetected: {
    type: Boolean,
    default: false
  },
  faceCount: {
    type: Number,
    default: 0
  },
  faceRegion: {
    x: Number,
    y: Number,
    width: Number,
    height: Number
  },
  
  // Color Analysis
  colors: {
    hairColor: {
      primary: { type: String },
      secondary: { type: String },
      hex: { type: String },
      rgb: {
        r: Number,
        g: Number,
        b: Number
      },
      confidence: { type: Number, min: 0, max: 1 }
    },
    skinTone: {
      primary: { type: String },
      undertone: { type: String },
      hex: { type: String },
      rgb: {
        r: Number,
        g: Number,
        b: Number
      },
      confidence: { type: Number, min: 0, max: 1 }
    },
    eyeColor: {
      primary: { type: String },
      secondary: { type: String },
      hex: { type: String },
      rgb: {
        r: Number,
        g: Number,
        b: Number
      },
      confidence: { type: Number, min: 0, max: 1 }
    },
    lipColor: {
      primary: { type: String },
      naturalTone: { type: String },
      hex: { type: String },
      rgb: {
        r: Number,
        g: Number,
        b: Number
      },
      confidence: { type: Number, min: 0, max: 1 }
    }
  },
  
  // Face Dimensions and Measurements
  faceDimensions: {
    faceLength: { type: Number }, // pixels
    faceWidth: { type: Number }, // pixels
    jawWidth: { type: Number },
    foreheadWidth: { type: Number },
    cheekboneWidth: { type: Number },
    
    // Ratios for face shape analysis
    lengthToWidthRatio: { type: Number },
    jawToForeheadRatio: { type: Number },
    cheekboneToJawRatio: { type: Number }
  },
  
  // Facial Features
  facialFeatures: {
    faceShape: {
      type: String,
      enum: ['oval', 'round', 'square', 'heart', 'diamond', 'oblong', 'triangle', 'unknown']
    },
    eyeShape: {
      type: String,
      enum: ['almond', 'round', 'hooded', 'monolid', 'upturned', 'downturned', 'unknown']
    },
    eyeDistance: {
      type: String,
      enum: ['close-set', 'wide-set', 'normal', 'unknown']
    },
    eyebrowShape: {
      type: String,
      enum: ['arched', 'straight', 'rounded', 'angular', 'unknown']
    },
    noseShape: {
      type: String,
      enum: ['straight', 'roman', 'button', 'hawk', 'snub', 'unknown']
    },
    lipShape: {
      type: String,
      enum: ['full', 'thin', 'heart', 'wide', 'small', 'unknown']
    }
  },
  
  // Feature Coordinates (for detailed analysis)
  featureCoordinates: {
    leftEye: {
      center: { x: Number, y: Number },
      corners: {
        inner: { x: Number, y: Number },
        outer: { x: Number, y: Number }
      }
    },
    rightEye: {
      center: { x: Number, y: Number },
      corners: {
        inner: { x: Number, y: Number },
        outer: { x: Number, y: Number }
      }
    },
    nose: {
      tip: { x: Number, y: Number },
      bridge: { x: Number, y: Number },
      nostrils: {
        left: { x: Number, y: Number },
        right: { x: Number, y: Number }
      }
    },
    mouth: {
      center: { x: Number, y: Number },
      corners: {
        left: { x: Number, y: Number },
        right: { x: Number, y: Number }
      },
      cupidsBow: { x: Number, y: Number }
    },
    jawline: [
      { x: Number, y: Number }
    ],
    hairline: [
      { x: Number, y: Number }
    ]
  },
  
  // Analysis Metadata
  analysisMetadata: {
    processingTime: { type: Number }, // milliseconds
    confidence: { type: Number, min: 0, max: 1 },
    algorithm: { type: String, default: 'custom-v1' },
    errors: [String],
    warnings: [String]
  },
  
  // Beauty and Style Analysis
  beautyAnalysis: {
    symmetryScore: { type: Number, min: 0, max: 1 },
    goldenRatioScore: { type: Number, min: 0, max: 1 },
    overallScore: { type: Number, min: 0, max: 1 },
    recommendations: [String]
  }
}, {
  timestamps: true
});

// Index for efficient queries
faceAnalysisSchema.index({ userId: 1, createdAt: -1 });
faceAnalysisSchema.index({ 'colors.hairColor.primary': 1 });
faceAnalysisSchema.index({ 'colors.skinTone.primary': 1 });
faceAnalysisSchema.index({ 'facialFeatures.faceShape': 1 });

// Virtual for face analysis summary
faceAnalysisSchema.virtual('summary').get(function() {
  return {
    faceDetected: this.faceDetected,
    faceShape: this.facialFeatures?.faceShape || 'unknown',
    hairColor: this.colors?.hairColor?.primary || 'unknown',
    skinTone: this.colors?.skinTone?.primary || 'unknown',
    eyeColor: this.colors?.eyeColor?.primary || 'unknown',
    confidence: this.analysisMetadata?.confidence || 0
  };
});

// Method to get color palette
faceAnalysisSchema.methods.getColorPalette = function() {
  return {
    hair: {
      color: this.colors?.hairColor?.primary,
      hex: this.colors?.hairColor?.hex,
      rgb: this.colors?.hairColor?.rgb
    },
    skin: {
      tone: this.colors?.skinTone?.primary,
      hex: this.colors?.skinTone?.hex,
      rgb: this.colors?.skinTone?.rgb
    },
    eyes: {
      color: this.colors?.eyeColor?.primary,
      hex: this.colors?.eyeColor?.hex,
      rgb: this.colors?.eyeColor?.rgb
    },
    lips: {
      color: this.colors?.lipColor?.primary,
      hex: this.colors?.lipColor?.hex,
      rgb: this.colors?.lipColor?.rgb
    }
  };
};

// Method to get feature measurements
faceAnalysisSchema.methods.getMeasurements = function() {
  return {
    dimensions: this.faceDimensions,
    features: this.facialFeatures,
    coordinates: this.featureCoordinates
  };
};

module.exports = mongoose.model('FaceAnalysis', faceAnalysisSchema);
