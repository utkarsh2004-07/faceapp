const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');

// Test configuration
const BASE_URL = 'http://localhost:3001/api';
let authToken = '';
let testUserId = '';
let testAnalysisId = '';
let testRecommendationId = '';

// Test user credentials
const testUser = {
  name: 'Color Test User',
  email: 'colortest@example.com',
  password: 'TestPassword123',
  gender: 'female'
};

console.log('🎨 Testing Color Recommendation System...\n');

async function runColorRecommendationTests() {
  try {
    // Step 1: Register test user
    console.log('1️⃣ Registering test user...');
    await registerUser();
    
    // Step 2: Login user
    console.log('2️⃣ Logging in user...');
    await loginUser();
    
    // Step 3: Test Gemini service connection
    console.log('3️⃣ Testing Gemini AI connection...');
    await testGeminiConnection();
    
    // Step 4: Upload and analyze face image
    console.log('4️⃣ Uploading and analyzing face image...');
    await uploadAndAnalyzeFace();
    
    // Step 5: Generate color recommendations
    console.log('5️⃣ Generating color recommendations...');
    await generateColorRecommendations();
    
    // Step 6: Test recommendation retrieval
    console.log('6️⃣ Testing recommendation retrieval...');
    await testRecommendationRetrieval();
    
    // Step 7: Test recommendation regeneration
    console.log('7️⃣ Testing recommendation regeneration...');
    await testRecommendationRegeneration();
    
    // Step 8: Test user feedback
    console.log('8️⃣ Testing user feedback...');
    await testUserFeedback();
    
    // Step 9: Test recommendation history
    console.log('9️⃣ Testing recommendation history...');
    await testRecommendationHistory();
    
    console.log('\n✅ All color recommendation tests completed successfully!');
    
  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    if (error.response?.data) {
      console.error('Response data:', JSON.stringify(error.response.data, null, 2));
    }
  }
}

async function registerUser() {
  try {
    const response = await axios.post(`${BASE_URL}/auth/register`, testUser);
    console.log('   ✅ User registered successfully');
    testUserId = response.data.data.user.id;
  } catch (error) {
    if (error.response?.status === 400 && error.response.data.message.includes('already exists')) {
      console.log('   ℹ️  User already exists, proceeding to login');
    } else {
      throw error;
    }
  }
}

async function loginUser() {
  const response = await axios.post(`${BASE_URL}/auth/login`, {
    email: testUser.email,
    password: testUser.password
  });
  
  authToken = response.data.data.token;
  testUserId = response.data.data.user.id;
  console.log('   ✅ User logged in successfully');
}

async function testGeminiConnection() {
  try {
    // This would be a direct test of the Gemini service
    const geminiService = require('./services/geminiService');
    const result = await geminiService.testConnection();
    
    if (result.success) {
      console.log('   ✅ Gemini AI connection successful');
    } else {
      console.log('   ⚠️  Gemini AI not configured, will use fallback recommendations');
    }
  } catch (error) {
    console.log('   ⚠️  Gemini AI test failed, will use fallback recommendations');
  }
}

async function uploadAndAnalyzeFace() {
  // Create a test image file (you can replace this with an actual image path)
  const testImagePath = path.join(__dirname, 'test-face.jpg');
  
  // Check if test image exists, if not create a placeholder
  if (!fs.existsSync(testImagePath)) {
    console.log('   ℹ️  No test image found, creating placeholder...');
    // For testing purposes, we'll skip the actual image upload
    // In a real scenario, you would have a test image
    console.log('   ⚠️  Please add a test image at:', testImagePath);
    
    // Mock analysis data for testing
    testAnalysisId = '507f1f77bcf86cd799439011'; // Mock ObjectId
    console.log('   ✅ Using mock analysis ID for testing');
    return;
  }
  
  const formData = new FormData();
  formData.append('faceImage', fs.createReadStream(testImagePath));
  
  const response = await axios.post(`${BASE_URL}/face/analyze`, formData, {
    headers: {
      ...formData.getHeaders(),
      'Authorization': `Bearer ${authToken}`
    }
  });
  
  testAnalysisId = response.data.data.analysisId;
  console.log('   ✅ Face analysis completed');
  console.log('   📊 Analysis results:', {
    faceDetected: response.data.data.faceDetected,
    confidence: response.data.data.confidence,
    skinTone: response.data.data.colors.skinTone.primary,
    hairColor: response.data.data.colors.hairColor.primary,
    faceShape: response.data.data.features.faceShape
  });
}

async function generateColorRecommendations() {
  const response = await axios.post(
    `${BASE_URL}/face/analysis/${testAnalysisId}/recommendations`,
    {
      preferences: {
        style: 'casual',
        occasion: 'everyday'
      }
    },
    {
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json'
      }
    }
  );
  
  testRecommendationId = response.data.data.recommendationId;
  console.log('   ✅ Color recommendations generated');
  console.log('   🎨 Recommendations summary:', {
    outfitCount: response.data.data.outfits.length,
    aiService: response.data.data.aiService,
    seasonalType: response.data.data.colorPalette.seasonalType,
    processingTime: response.data.data.processingTime + 'ms'
  });
  
  // Display first outfit recommendation
  if (response.data.data.outfits.length > 0) {
    const firstOutfit = response.data.data.outfits[0];
    console.log('   👔 First outfit recommendation:', {
      name: firstOutfit.outfitName,
      shirt: `${firstOutfit.shirt.color} (${firstOutfit.shirt.hex})`,
      pants: `${firstOutfit.pants.color} (${firstOutfit.pants.hex})`,
      shoes: `${firstOutfit.shoes.color} (${firstOutfit.shoes.hex})`
    });
  }
}

async function testRecommendationRetrieval() {
  const response = await axios.post(
    `${BASE_URL}/face/analysis/${testAnalysisId}/recommendations`,
    {},
    {
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json'
      }
    }
  );
  
  console.log('   ✅ Recommendations retrieved (cached)');
  console.log('   📋 Cached:', response.data.data.cached);
}

async function testRecommendationRegeneration() {
  const response = await axios.post(
    `${BASE_URL}/face/analysis/${testAnalysisId}/recommendations/regenerate`,
    {
      preferences: {
        style: 'formal',
        occasion: 'business'
      }
    },
    {
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json'
      }
    }
  );
  
  console.log('   ✅ Recommendations regenerated');
  console.log('   🔄 New recommendation ID:', response.data.data.recommendationId);
}

async function testUserFeedback() {
  const response = await axios.post(
    `${BASE_URL}/face/recommendations/${testRecommendationId}/feedback`,
    {
      rating: 5,
      feedback: 'Great color recommendations! Love the combinations.',
      favoriteOutfits: [0, 1] // First two outfits
    },
    {
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json'
      }
    }
  );
  
  console.log('   ✅ User feedback added');
  console.log('   ⭐ Rating:', response.data.data.userRating);
}

async function testRecommendationHistory() {
  const response = await axios.get(
    `${BASE_URL}/face/recommendations/history?limit=5`,
    {
      headers: {
        'Authorization': `Bearer ${authToken}`
      }
    }
  );
  
  console.log('   ✅ Recommendation history retrieved');
  console.log('   📚 History count:', response.data.data.count);
}

// Run the tests
runColorRecommendationTests();
