// Test script to verify the Gemini prompt fix with actual face data
require('dotenv').config();

const geminiService = require('./services/geminiService');

console.log('🧪 Testing Gemini Prompt Fix...\n');

async function testGeminiPromptFix() {
  try {
    // Test with realistic face analysis data (like what would come from a real face)
    const mockFaceAnalysisWithData = {
      colors: {
        skinTone: {
          primary: 'medium',
          hex: '#d4a574',
          rgb: { r: 212, g: 165, b: 116 }
        },
        hairColor: {
          primary: 'brown',
          hex: '#4a3728',
          rgb: { r: 74, g: 55, b: 40 }
        },
        eyeColor: {
          primary: 'brown',
          hex: '#8b4513',
          rgb: { r: 139, g: 69, b: 19 }
        },
        lipColor: {
          primary: 'natural',
          hex: '#e6a085',
          rgb: { r: 230, g: 160, b: 133 }
        }
      },
      facialFeatures: {
        faceShape: 'oval'
      },
      confidence: 0.85
    };
    
    const mockUserProfile = {
      gender: 'female'
    };
    
    console.log('1️⃣ Testing with GOOD face analysis data...');
    console.log('   Face Data:');
    console.log('   - Skin Tone:', mockFaceAnalysisWithData.colors.skinTone.primary);
    console.log('   - Hair Color:', mockFaceAnalysisWithData.colors.hairColor.primary);
    console.log('   - Eye Color:', mockFaceAnalysisWithData.colors.eyeColor.primary);
    console.log('   - Face Shape:', mockFaceAnalysisWithData.facialFeatures.faceShape);
    console.log('   - Confidence:', mockFaceAnalysisWithData.confidence);
    
    const startTime = Date.now();
    
    const recommendations = await geminiService.getColorRecommendations(
      mockFaceAnalysisWithData, 
      mockUserProfile
    );
    
    const processingTime = Date.now() - startTime;
    
    console.log('\n   ✅ Recommendations generated successfully!');
    console.log('   ⏱️  Processing time:', processingTime + 'ms');
    console.log('   🎨 Number of outfits:', recommendations.recommendations?.length || 0);
    console.log('   🤖 AI Service:', geminiService.isConfigured ? 'Gemini AI' : 'Fallback');
    
    // Check if the advice mentions the specific face data
    if (recommendations.generalAdvice) {
      console.log('\n   💡 General Advice Check:');
      console.log('   Advice:', recommendations.generalAdvice);
      
      const mentionsSkinTone = recommendations.generalAdvice.toLowerCase().includes('medium');
      const mentionsHairColor = recommendations.generalAdvice.toLowerCase().includes('brown');
      
      console.log('   ✅ Mentions skin tone (medium):', mentionsSkinTone ? '✅' : '❌');
      console.log('   ✅ Mentions hair color (brown):', mentionsHairColor ? '✅' : '❌');
      
      if (mentionsSkinTone && mentionsHairColor) {
        console.log('   🎉 SUCCESS: AI is now using specific face analysis data!');
      } else {
        console.log('   ⚠️  AI may still be giving generic responses');
      }
    }
    
    // Display first outfit recommendation
    if (recommendations.recommendations && recommendations.recommendations.length > 0) {
      const firstOutfit = recommendations.recommendations[0];
      console.log('\n   👔 First outfit recommendation:');
      console.log('      Name:', firstOutfit.outfitName);
      console.log('      Shirt:', `${firstOutfit.shirt.color} (${firstOutfit.shirt.hex})`);
      console.log('      Pants:', `${firstOutfit.pants.color} (${firstOutfit.pants.hex})`);
      console.log('      Shoes:', `${firstOutfit.shoes.color} (${firstOutfit.shoes.hex})`);
      console.log('      Reason:', firstOutfit.overallReason);
      
      // Check if reasons mention specific features
      const shirtReason = firstOutfit.shirt.reason.toLowerCase();
      const overallReason = firstOutfit.overallReason.toLowerCase();
      
      const reasonMentionsFeatures = shirtReason.includes('medium') || shirtReason.includes('brown') ||
                                   overallReason.includes('medium') || overallReason.includes('brown');
      
      console.log('      ✅ Reasons reference face features:', reasonMentionsFeatures ? '✅' : '❌');
    }
    
    // Test 2: Compare with no face data
    console.log('\n2️⃣ Testing with NO face analysis data (for comparison)...');
    
    const mockFaceAnalysisNoData = {
      colors: {
        skinTone: { primary: 'unknown', hex: '#000000', rgb: { r: 0, g: 0, b: 0 } },
        hairColor: { primary: 'unknown', hex: '#000000', rgb: { r: 0, g: 0, b: 0 } },
        eyeColor: { primary: 'unknown', hex: '#000000', rgb: { r: 0, g: 0, b: 0 } },
        lipColor: { primary: 'unknown', hex: '#000000', rgb: { r: 0, g: 0, b: 0 } }
      },
      facialFeatures: { faceShape: 'unknown' },
      confidence: 0.0
    };
    
    const noDataRecommendations = await geminiService.getColorRecommendations(
      mockFaceAnalysisNoData, 
      mockUserProfile
    );
    
    console.log('   💡 General Advice (no data):');
    console.log('   ', noDataRecommendations.generalAdvice);
    
    // Compare the two responses
    console.log('\n3️⃣ Comparison Results:');
    const withDataAdvice = recommendations.generalAdvice || '';
    const noDataAdvice = noDataRecommendations.generalAdvice || '';
    
    const responsesAreDifferent = withDataAdvice !== noDataAdvice;
    console.log('   Different responses for different data:', responsesAreDifferent ? '✅' : '❌');
    
    if (responsesAreDifferent) {
      console.log('   🎉 SUCCESS: AI is now providing personalized responses based on face data!');
    } else {
      console.log('   ⚠️  AI responses are still too similar - may need further prompt refinement');
    }
    
    console.log('\n✅ Gemini prompt fix test completed!');
    
  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    if (error.stack) {
      console.error('Stack trace:', error.stack);
    }
  }
}

// Run the test
testGeminiPromptFix();
