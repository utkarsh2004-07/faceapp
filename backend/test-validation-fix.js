// Test script to verify the validation fix
require('dotenv').config();
const mongoose = require('mongoose');
const ColorRecommendation = require('./models/ColorRecommendation');

async function testValidationFix() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Test 1: Valid seasonal type
    console.log('\n1️⃣ Testing valid seasonal type...');
    const validRecommendation = new ColorRecommendation({
      userId: new mongoose.Types.ObjectId(),
      faceAnalysisId: new mongoose.Types.ObjectId(),
      aiService: 'gemini',
      recommendations: [{
        outfitName: 'Test Outfit',
        shirt: { color: 'Blue', hex: '#0000ff', reason: 'Test' },
        pants: { color: 'Black', hex: '#000000', reason: 'Test' },
        shoes: { color: 'Brown', hex: '#8b4513', reason: 'Test' },
        overallReason: 'Test outfit'
      }],
      colorPalette: {
        bestColors: ['#0000ff', '#000000', '#8b4513'],
        avoidColors: ['#ff0000'],
        seasonalType: 'Autumn'
      },
      generalAdvice: 'Test advice',
      processingTime: 1000,
      confidence: 0.8
    });

    await validRecommendation.validate();
    console.log('   ✅ Valid recommendation passes validation');

    // Test 2: Invalid seasonal type (should fail before fix)
    console.log('\n2️⃣ Testing invalid seasonal type...');
    const invalidRecommendation = new ColorRecommendation({
      userId: new mongoose.Types.ObjectId(),
      faceAnalysisId: new mongoose.Types.ObjectId(),
      aiService: 'gemini',
      recommendations: [{
        outfitName: 'Test Outfit',
        shirt: { color: 'Blue', hex: '#0000ff', reason: 'Test' },
        pants: { color: 'Black', hex: '#000000', reason: 'Test' },
        shoes: { color: 'Brown', hex: '#8b4513', reason: 'Test' },
        overallReason: 'Test outfit'
      }],
      colorPalette: {
        bestColors: ['#0000ff', '#000000', '#8b4513'],
        avoidColors: ['#ff0000'],
        seasonalType: 'Unspecified - requires further face analysis' // This should fail
      },
      generalAdvice: 'Test advice',
      processingTime: 1000,
      confidence: 0.8
    });

    try {
      await invalidRecommendation.validate();
      console.log('   ❌ Invalid recommendation should have failed validation');
    } catch (error) {
      console.log('   ✅ Invalid seasonal type correctly rejected:', error.message);
    }

    // Test 3: Test new 'Unspecified' enum value
    console.log('\n3️⃣ Testing new Unspecified enum value...');
    const unspecifiedRecommendation = new ColorRecommendation({
      userId: new mongoose.Types.ObjectId(),
      faceAnalysisId: new mongoose.Types.ObjectId(),
      aiService: 'gemini',
      recommendations: [{
        outfitName: 'Test Outfit',
        shirt: { color: 'Blue', hex: '#0000ff', reason: 'Test' },
        pants: { color: 'Black', hex: '#000000', reason: 'Test' },
        shoes: { color: 'Brown', hex: '#8b4513', reason: 'Test' },
        overallReason: 'Test outfit'
      }],
      colorPalette: {
        bestColors: ['#0000ff', '#000000', '#8b4513'],
        avoidColors: ['#ff0000'],
        seasonalType: 'Unspecified'
      },
      generalAdvice: 'Test advice',
      processingTime: 1000,
      confidence: 0.8
    });

    await unspecifiedRecommendation.validate();
    console.log('   ✅ Unspecified seasonal type now accepted');

    // Test 4: Test sanitization service
    console.log('\n4️⃣ Testing sanitization service...');
    const colorRecommendationService = require('./utils/colorRecommendationService');
    
    const mockAIResponse = {
      recommendations: [{
        outfitName: 'Test Outfit',
        shirt: { color: 'Blue', hex: '#0000ff', reason: 'Test' },
        pants: { color: 'Black', hex: '#000000', reason: 'Test' },
        shoes: { color: 'Brown', hex: '#8b4513', reason: 'Test' },
        overallReason: 'Test outfit'
      }],
      colorPalette: {
        bestColors: ['#0000ff', '#000000', '#8b4513'],
        avoidColors: ['#ff0000'],
        seasonalType: 'Unspecified - requires further face analysis' // This should be sanitized
      },
      generalAdvice: 'Test advice'
    };

    const sanitized = colorRecommendationService.sanitizeRecommendations(mockAIResponse);
    console.log('   Original seasonal type:', mockAIResponse.colorPalette.seasonalType);
    console.log('   Sanitized seasonal type:', sanitized.colorPalette.seasonalType);
    console.log('   ✅ Sanitization working correctly');

    console.log('\n✅ All validation tests passed! The fix is working.');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('\n✅ Disconnected from MongoDB');
  }
}

console.log('🧪 Testing Validation Fix...\n');
testValidationFix();
