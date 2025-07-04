// Debug script to check face analysis data quality
require('dotenv').config();
const mongoose = require('mongoose');
const FaceAnalysis = require('./models/FaceAnalysis');

async function debugFaceAnalysisData() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Get the specific face analysis you're using
    const faceAnalysisId = '6866669e313f4c098a019116'; // Your analysis ID
    
    console.log('\n🔍 Checking Face Analysis Data...');
    console.log('Face Analysis ID:', faceAnalysisId);

    const faceAnalysis = await FaceAnalysis.findById(faceAnalysisId);
    
    if (!faceAnalysis) {
      console.log('❌ Face analysis not found');
      return;
    }
    
    console.log('\n📊 Face Analysis Details:');
    console.log('User ID:', faceAnalysis.userId.toString());
    console.log('Original File:', faceAnalysis.originalFileName);
    console.log('Face Detected:', faceAnalysis.faceDetected);
    console.log('Face Count:', faceAnalysis.faceCount);
    console.log('Created:', faceAnalysis.createdAt);
    
    console.log('\n🎨 Color Analysis:');
    if (faceAnalysis.colors) {
      console.log('Skin Tone:');
      console.log('  Primary:', faceAnalysis.colors.skinTone?.primary || 'Not detected');
      console.log('  Hex:', faceAnalysis.colors.skinTone?.hex || 'Not available');
      console.log('  RGB:', faceAnalysis.colors.skinTone?.rgb || 'Not available');
      
      console.log('Hair Color:');
      console.log('  Primary:', faceAnalysis.colors.hairColor?.primary || 'Not detected');
      console.log('  Hex:', faceAnalysis.colors.hairColor?.hex || 'Not available');
      console.log('  RGB:', faceAnalysis.colors.hairColor?.rgb || 'Not available');
      
      console.log('Eye Color:');
      console.log('  Primary:', faceAnalysis.colors.eyeColor?.primary || 'Not detected');
      console.log('  Hex:', faceAnalysis.colors.eyeColor?.hex || 'Not available');
      console.log('  RGB:', faceAnalysis.colors.eyeColor?.rgb || 'Not available');
      
      console.log('Lip Color:');
      console.log('  Primary:', faceAnalysis.colors.lipColor?.primary || 'Not detected');
      console.log('  Hex:', faceAnalysis.colors.lipColor?.hex || 'Not available');
      console.log('  RGB:', faceAnalysis.colors.lipColor?.rgb || 'Not available');
    } else {
      console.log('❌ No color analysis data found');
    }
    
    console.log('\n👤 Facial Features:');
    if (faceAnalysis.facialFeatures) {
      console.log('Face Shape:', faceAnalysis.facialFeatures.faceShape || 'Not determined');
      console.log('Eye Shape:', faceAnalysis.facialFeatures.eyeShape || 'Not determined');
      console.log('Eye Distance:', faceAnalysis.facialFeatures.eyeDistance || 'Not determined');
      console.log('Eyebrow Shape:', faceAnalysis.facialFeatures.eyebrowShape || 'Not determined');
      console.log('Nose Shape:', faceAnalysis.facialFeatures.noseShape || 'Not determined');
      console.log('Lip Shape:', faceAnalysis.facialFeatures.lipShape || 'Not determined');
    } else {
      console.log('❌ No facial features data found');
    }
    
    console.log('\n📈 Analysis Metadata:');
    if (faceAnalysis.analysisMetadata) {
      console.log('Processing Time:', faceAnalysis.analysisMetadata.processingTime + 'ms');
      console.log('Confidence:', faceAnalysis.analysisMetadata.confidence);
      console.log('Algorithm:', faceAnalysis.analysisMetadata.algorithm);
      console.log('Errors:', faceAnalysis.analysisMetadata.errors?.length || 0);
      console.log('Warnings:', faceAnalysis.analysisMetadata.warnings?.length || 0);
      
      if (faceAnalysis.analysisMetadata.errors?.length > 0) {
        console.log('Error Details:', faceAnalysis.analysisMetadata.errors);
      }
      
      if (faceAnalysis.analysisMetadata.warnings?.length > 0) {
        console.log('Warning Details:', faceAnalysis.analysisMetadata.warnings);
      }
    } else {
      console.log('❌ No analysis metadata found');
    }
    
    // Test the data preparation function
    console.log('\n🔧 Testing Data Preparation:');
    const colorRecommendationService = require('./utils/colorRecommendationService');
    const preparedData = colorRecommendationService.prepareFaceAnalysisData(faceAnalysis);
    
    console.log('Prepared Data for AI:');
    console.log('  Skin Tone:', preparedData.colors.skinTone.primary, preparedData.colors.skinTone.hex);
    console.log('  Hair Color:', preparedData.colors.hairColor.primary, preparedData.colors.hairColor.hex);
    console.log('  Eye Color:', preparedData.colors.eyeColor.primary, preparedData.colors.eyeColor.hex);
    console.log('  Lip Color:', preparedData.colors.lipColor.primary, preparedData.colors.lipColor.hex);
    console.log('  Face Shape:', preparedData.facialFeatures.faceShape);
    console.log('  Confidence:', preparedData.confidence);
    
    // Check data quality
    console.log('\n✅ Data Quality Assessment:');
    const hasValidSkinTone = preparedData.colors.skinTone.primary !== 'unknown';
    const hasValidHairColor = preparedData.colors.hairColor.primary !== 'unknown';
    const hasValidEyeColor = preparedData.colors.eyeColor.primary !== 'unknown';
    const hasValidFaceShape = preparedData.facialFeatures.faceShape !== 'unknown';
    
    console.log('Valid Skin Tone:', hasValidSkinTone ? '✅' : '❌');
    console.log('Valid Hair Color:', hasValidHairColor ? '✅' : '❌');
    console.log('Valid Eye Color:', hasValidEyeColor ? '✅' : '❌');
    console.log('Valid Face Shape:', hasValidFaceShape ? '✅' : '❌');
    
    const dataQuality = [hasValidSkinTone, hasValidHairColor, hasValidEyeColor, hasValidFaceShape]
      .filter(Boolean).length;
    
    console.log(`Overall Data Quality: ${dataQuality}/4 features detected`);
    
    if (dataQuality === 0) {
      console.log('⚠️  No valid face analysis data - this explains why Gemini says "no face analysis data was provided"');
      console.log('💡 Recommendation: Re-upload the face image or check face detection algorithm');
    } else if (dataQuality < 3) {
      console.log('⚠️  Limited face analysis data - may result in generic recommendations');
    } else {
      console.log('✅ Good face analysis data quality');
    }

  } catch (error) {
    console.error('❌ Debug error:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('\n✅ Disconnected from MongoDB');
  }
}

console.log('🔍 Face Analysis Data Debug Tool');
console.log('=================================\n');
debugFaceAnalysisData();
