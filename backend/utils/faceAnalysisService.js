const sharp = require('sharp');
const Jimp = require('jimp');
const path = require('path');
const fs = require('fs').promises;

class FaceAnalysisService {
  constructor() {
    this.colorNames = {
      // Hair colors
      hair: {
        black: { min: [0, 0, 0], max: [50, 50, 50] },
        brown: { min: [51, 25, 0], max: [120, 80, 40] },
        blonde: { min: [180, 150, 80], max: [255, 220, 150] },
        red: { min: [120, 40, 20], max: [200, 100, 60] },
        gray: { min: [100, 100, 100], max: [180, 180, 180] },
        white: { min: [200, 200, 200], max: [255, 255, 255] }
      },
      // Skin tones
      skin: {
        fair: { min: [220, 180, 140], max: [255, 220, 180] },
        light: { min: [200, 160, 120], max: [240, 200, 160] },
        medium: { min: [160, 120, 80], max: [220, 170, 130] },
        olive: { min: [140, 120, 80], max: [180, 150, 110] },
        tan: { min: [120, 90, 60], max: [170, 130, 90] },
        dark: { min: [80, 60, 40], max: [140, 110, 80] },
        deep: { min: [40, 30, 20], max: [100, 80, 60] }
      },
      // Eye colors
      eyes: {
        blue: { min: [100, 150, 200], max: [150, 200, 255] },
        green: { min: [80, 120, 80], max: [120, 180, 120] },
        brown: { min: [60, 40, 20], max: [120, 80, 50] },
        hazel: { min: [100, 80, 40], max: [140, 120, 80] },
        gray: { min: [120, 120, 120], max: [180, 180, 180] },
        amber: { min: [180, 120, 40], max: [220, 160, 80] }
      },
      // Lip colors
      lips: {
        pink: { min: [200, 120, 140], max: [255, 180, 200] },
        red: { min: [180, 80, 80], max: [255, 140, 140] },
        coral: { min: [220, 140, 120], max: [255, 180, 160] },
        nude: { min: [180, 140, 120], max: [220, 180, 160] },
        berry: { min: [120, 60, 80], max: [180, 120, 140] }
      }
    };
  }

  // Main analysis function - now works with both local paths and URLs
  async analyzeFace(imageSource, originalFileName, cloudinaryData = null) {
    const startTime = Date.now();
    const analysis = {
      originalFileName,
      fileSize: 0,
      imageFormat: '',
      imageDimensions: { width: 0, height: 0 },
      faceDetected: false,
      faceCount: 0,
      colors: {},
      faceDimensions: {},
      facialFeatures: {},
      analysisMetadata: {
        processingTime: 0,
        confidence: 0,
        algorithm: 'custom-v1',
        errors: [],
        warnings: []
      }
    };

    try {
      let image;

      // If we have Cloudinary data, use it directly to avoid re-processing
      if (cloudinaryData) {
        analysis.imageFormat = cloudinaryData.format;
        analysis.imageDimensions = {
          width: cloudinaryData.width,
          height: cloudinaryData.height
        };
        analysis.fileSize = cloudinaryData.fileSize;

        // Load image from Cloudinary URL
        image = await Jimp.read(imageSource);
      } else {
        // Fallback to local file processing
        const metadata = await sharp(imageSource).metadata();
        analysis.imageFormat = metadata.format;
        analysis.imageDimensions = {
          width: metadata.width,
          height: metadata.height
        };

        // Get file size
        const stats = await fs.stat(imageSource);
        analysis.fileSize = stats.size;

        // Load image with Jimp for analysis
        image = await Jimp.read(imageSource);
      }
      
      // Perform face detection (simplified approach)
      const faceRegion = await this.detectFace(image);
      
      if (faceRegion) {
        analysis.faceDetected = true;
        analysis.faceCount = 1;
        analysis.faceRegion = faceRegion;

        // Extract face region for detailed analysis
        const faceImage = image.clone().crop(
          faceRegion.x, 
          faceRegion.y, 
          faceRegion.width, 
          faceRegion.height
        );

        // Analyze colors
        analysis.colors = await this.analyzeColors(faceImage, image);
        
        // Analyze face dimensions
        analysis.faceDimensions = await this.analyzeFaceDimensions(faceRegion);
        
        // Analyze facial features
        analysis.facialFeatures = await this.analyzeFacialFeatures(faceRegion, analysis.faceDimensions);
        
        // Calculate confidence based on analysis quality
        analysis.analysisMetadata.confidence = this.calculateConfidence(analysis);
      } else {
        analysis.analysisMetadata.warnings.push('No face detected in image');
      }

    } catch (error) {
      analysis.analysisMetadata.errors.push(error.message);
    }

    analysis.analysisMetadata.processingTime = Date.now() - startTime;
    return analysis;
  }

  // Simplified face detection using skin tone detection
  async detectFace(image) {
    try {
      const width = image.getWidth();
      const height = image.getHeight();
      
      // Scan for skin-colored regions
      const skinRegions = [];
      const scanStep = 10; // Skip pixels for performance
      
      for (let y = 0; y < height; y += scanStep) {
        for (let x = 0; x < width; x += scanStep) {
          const color = Jimp.intToRGBA(image.getPixelColor(x, y));
          if (this.isSkinColor(color)) {
            skinRegions.push({ x, y });
          }
        }
      }

      if (skinRegions.length < 50) return null; // Not enough skin pixels

      // Find bounding box of skin regions
      const minX = Math.min(...skinRegions.map(p => p.x));
      const maxX = Math.max(...skinRegions.map(p => p.x));
      const minY = Math.min(...skinRegions.map(p => p.y));
      const maxY = Math.max(...skinRegions.map(p => p.y));

      // Estimate face region (assuming face is roughly in center of skin region)
      const faceWidth = (maxX - minX) * 1.2;
      const faceHeight = (maxY - minY) * 1.4;
      const centerX = (minX + maxX) / 2;
      const centerY = (minY + maxY) / 2;

      return {
        x: Math.max(0, Math.round(centerX - faceWidth / 2)),
        y: Math.max(0, Math.round(centerY - faceHeight / 2)),
        width: Math.min(width, Math.round(faceWidth)),
        height: Math.min(height, Math.round(faceHeight))
      };
    } catch (error) {
      return null;
    }
  }

  // Check if a color is likely skin tone
  isSkinColor(color) {
    const { r, g, b } = color;
    
    // Basic skin tone detection algorithm
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    
    // Skin tone characteristics
    const isInRange = r > 95 && g > 40 && b > 20 && 
                     max - min > 15 && 
                     Math.abs(r - g) > 15 && 
                     r > g && r > b;
    
    return isInRange;
  }

  // Analyze colors in the face
  async analyzeColors(faceImage, fullImage) {
    const colors = {
      hairColor: await this.analyzeHairColor(fullImage),
      skinTone: await this.analyzeSkinTone(faceImage),
      eyeColor: await this.analyzeEyeColor(faceImage),
      lipColor: await this.analyzeLipColor(faceImage)
    };

    return colors;
  }

  // Analyze hair color (top portion of image)
  async analyzeHairColor(image) {
    const width = image.getWidth();
    const height = image.getHeight();
    
    // Sample from top 30% of image
    const hairRegion = image.clone().crop(0, 0, width, Math.round(height * 0.3));
    const dominantColor = this.getDominantColor(hairRegion);
    
    return {
      primary: this.classifyColor(dominantColor, 'hair'),
      hex: this.rgbToHex(dominantColor),
      rgb: dominantColor,
      confidence: 0.7
    };
  }

  // Analyze skin tone
  async analyzeSkinTone(faceImage) {
    // Sample from cheek area (middle regions)
    const width = faceImage.getWidth();
    const height = faceImage.getHeight();
    
    const cheekRegion = faceImage.clone().crop(
      Math.round(width * 0.2), 
      Math.round(height * 0.3),
      Math.round(width * 0.6), 
      Math.round(height * 0.4)
    );
    
    const dominantColor = this.getDominantColor(cheekRegion);
    
    return {
      primary: this.classifyColor(dominantColor, 'skin'),
      hex: this.rgbToHex(dominantColor),
      rgb: dominantColor,
      confidence: 0.8
    };
  }

  // Analyze eye color
  async analyzeEyeColor(faceImage) {
    // Sample from eye region (upper middle area)
    const width = faceImage.getWidth();
    const height = faceImage.getHeight();
    
    const eyeRegion = faceImage.clone().crop(
      Math.round(width * 0.25), 
      Math.round(height * 0.25),
      Math.round(width * 0.5), 
      Math.round(height * 0.2)
    );
    
    const dominantColor = this.getDominantColor(eyeRegion);
    
    return {
      primary: this.classifyColor(dominantColor, 'eyes'),
      hex: this.rgbToHex(dominantColor),
      rgb: dominantColor,
      confidence: 0.6
    };
  }

  // Analyze lip color
  async analyzeLipColor(faceImage) {
    // Sample from lip region (lower middle area)
    const width = faceImage.getWidth();
    const height = faceImage.getHeight();
    
    const lipRegion = faceImage.clone().crop(
      Math.round(width * 0.35), 
      Math.round(height * 0.65),
      Math.round(width * 0.3), 
      Math.round(height * 0.15)
    );
    
    const dominantColor = this.getDominantColor(lipRegion);
    
    return {
      primary: this.classifyColor(dominantColor, 'lips'),
      hex: this.rgbToHex(dominantColor),
      rgb: dominantColor,
      confidence: 0.6
    };
  }

  // Get dominant color from image region
  getDominantColor(image) {
    const width = image.getWidth();
    const height = image.getHeight();
    
    let totalR = 0, totalG = 0, totalB = 0;
    let pixelCount = 0;
    
    // Sample every 5th pixel for performance
    for (let y = 0; y < height; y += 5) {
      for (let x = 0; x < width; x += 5) {
        const color = Jimp.intToRGBA(image.getPixelColor(x, y));
        totalR += color.r;
        totalG += color.g;
        totalB += color.b;
        pixelCount++;
      }
    }
    
    return {
      r: Math.round(totalR / pixelCount),
      g: Math.round(totalG / pixelCount),
      b: Math.round(totalB / pixelCount)
    };
  }

  // Classify color into named categories
  classifyColor(rgb, type) {
    const colors = this.colorNames[type];
    
    for (const [colorName, range] of Object.entries(colors)) {
      if (rgb.r >= range.min[0] && rgb.r <= range.max[0] &&
          rgb.g >= range.min[1] && rgb.g <= range.max[1] &&
          rgb.b >= range.min[2] && rgb.b <= range.max[2]) {
        return colorName;
      }
    }
    
    return 'unknown';
  }

  // Convert RGB to hex
  rgbToHex(rgb) {
    return `#${((1 << 24) + (rgb.r << 16) + (rgb.g << 8) + rgb.b).toString(16).slice(1)}`;
  }

  // Analyze face dimensions
  async analyzeFaceDimensions(faceRegion) {
    const faceLength = faceRegion.height;
    const faceWidth = faceRegion.width;
    
    return {
      faceLength,
      faceWidth,
      jawWidth: Math.round(faceWidth * 0.8),
      foreheadWidth: Math.round(faceWidth * 0.9),
      cheekboneWidth: Math.round(faceWidth * 0.95),
      lengthToWidthRatio: faceLength / faceWidth,
      jawToForeheadRatio: 0.89, // Estimated
      cheekboneToJawRatio: 1.19 // Estimated
    };
  }

  // Analyze facial features
  async analyzeFacialFeatures(faceRegion, dimensions) {
    const ratio = dimensions.lengthToWidthRatio;
    
    let faceShape = 'unknown';
    if (ratio > 1.5) faceShape = 'oblong';
    else if (ratio < 1.1) faceShape = 'round';
    else if (ratio >= 1.1 && ratio <= 1.3) faceShape = 'oval';
    else if (ratio > 1.3 && ratio <= 1.5) faceShape = 'square';
    
    return {
      faceShape,
      eyeShape: 'almond', // Default estimation
      eyeDistance: 'normal',
      eyebrowShape: 'arched',
      noseShape: 'straight',
      lipShape: 'full'
    };
  }

  // Calculate overall confidence score
  calculateConfidence(analysis) {
    let confidence = 0;
    
    if (analysis.faceDetected) confidence += 0.3;
    if (analysis.colors.skinTone) confidence += 0.2;
    if (analysis.colors.hairColor) confidence += 0.2;
    if (analysis.faceDimensions.faceLength > 0) confidence += 0.2;
    if (analysis.facialFeatures.faceShape !== 'unknown') confidence += 0.1;
    
    return Math.min(confidence, 1.0);
  }
}

module.exports = new FaceAnalysisService();
