// Test script to verify Gemini service functionality
require('dotenv').config();

const geminiService = require('./services/geminiService');

console.log('🧪 Testing Gemini Service...\n');

async function testGeminiService() {
  try {
    // Test 1: Check if service is configured
    console.log('1️⃣ Checking Gemini service configuration...');
    console.log('   API Key configured:', geminiService.isConfigured ? '✅ Yes' : '❌ No');
    console.log('   Model:', geminiService.modelName || 'Not set');
    
    if (!geminiService.isConfigured) {
      console.log('\n⚠️  Gemini API key not configured. Testing fallback functionality...\n');
    }
    
    // Test 2: Test connection
    console.log('\n2️⃣ Testing connection...');
    const connectionTest = await geminiService.testConnection();
    console.log('   Connection result:', connectionTest.success ? '✅ Success' : '❌ Failed');
    if (!connectionTest.success) {
      console.log('   Message:', connectionTest.message);
    }
    
    // Test 3: Test color recommendations with mock data
    console.log('\n3️⃣ Testing color recommendations...');
    
    const mockFaceAnalysis = {
      colors: {
        skinTone: {
          primary: 'medium',
          hex: '#b7907b',
          rgb: { r: 183, g: 144, b: 123 }
        },
        hairColor: {
          primary: 'black',
          hex: '#2a2710',
          rgb: { r: 42, g: 39, b: 16 }
        },
        eyeColor: {
          primary: 'brown',
          hex: '#ae8a76',
          rgb: { r: 174, g: 138, b: 118 }
        },
        lipColor: {
          primary: 'natural',
          hex: '#e9bfa5',
          rgb: { r: 233, g: 191, b: 165 }
        }
      },
      facialFeatures: {
        faceShape: 'oval'
      }
    };
    
    const mockUserProfile = {
      gender: 'female'
    };
    
    console.log('   Generating recommendations for mock face analysis...');
    const startTime = Date.now();
    
    const recommendations = await geminiService.getColorRecommendations(
      mockFaceAnalysis, 
      mockUserProfile
    );
    
    const processingTime = Date.now() - startTime;
    
    console.log('   ✅ Recommendations generated successfully!');
    console.log('   ⏱️  Processing time:', processingTime + 'ms');
    console.log('   🎨 Number of outfits:', recommendations.recommendations?.length || 0);
    console.log('   🤖 AI Service:', geminiService.isConfigured ? 'Gemini AI' : 'Fallback');
    
    // Display first recommendation
    if (recommendations.recommendations && recommendations.recommendations.length > 0) {
      const firstOutfit = recommendations.recommendations[0];
      console.log('\n   👔 First outfit recommendation:');
      console.log('      Name:', firstOutfit.outfitName);
      console.log('      Shirt:', `${firstOutfit.shirt.color} (${firstOutfit.shirt.hex})`);
      console.log('      Pants:', `${firstOutfit.pants.color} (${firstOutfit.pants.hex})`);
      console.log('      Shoes:', `${firstOutfit.shoes.color} (${firstOutfit.shoes.hex})`);
      console.log('      Reason:', firstOutfit.overallReason);
    }
    
    // Display color palette
    if (recommendations.colorPalette) {
      console.log('\n   🎨 Color Palette:');
      console.log('      Best colors:', recommendations.colorPalette.bestColors?.slice(0, 3).join(', '));
      console.log('      Seasonal type:', recommendations.colorPalette.seasonalType);
    }
    
    // Display general advice
    if (recommendations.generalAdvice) {
      console.log('\n   💡 General Advice:');
      console.log('      ' + recommendations.generalAdvice.substring(0, 100) + '...');
    }
    
    console.log('\n✅ All tests completed successfully!');
    
    // Test 4: Performance test
    console.log('\n4️⃣ Performance test (3 consecutive requests)...');
    const performanceResults = [];
    
    for (let i = 0; i < 3; i++) {
      const start = Date.now();
      await geminiService.getColorRecommendations(mockFaceAnalysis, mockUserProfile);
      const time = Date.now() - start;
      performanceResults.push(time);
      console.log(`   Request ${i + 1}: ${time}ms`);
    }
    
    const avgTime = performanceResults.reduce((a, b) => a + b, 0) / performanceResults.length;
    console.log(`   📊 Average response time: ${Math.round(avgTime)}ms`);
    
  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    if (error.stack) {
      console.error('Stack trace:', error.stack);
    }
  }
}

// Configuration check
console.log('📋 Configuration Check:');
console.log('   GEMINI_API_KEY:', process.env.GEMINI_API_KEY ? 
  (process.env.GEMINI_API_KEY === 'your_gemini_api_key_here' ? '❌ Not configured' : '✅ Configured') : 
  '❌ Missing');
console.log('   GEMINI_MODEL:', process.env.GEMINI_MODEL || 'Using default');
console.log('');

// Run the test
testGeminiService();
