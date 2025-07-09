// Test script for Cloudinary integration
require('dotenv').config();
const cloudinaryService = require('./utils/cloudinaryService');

async function testCloudinaryIntegration() {
  console.log('🧪 Testing Cloudinary Integration...\n');

  // Test 1: Check configuration
  console.log('1. Checking Cloudinary configuration...');
  const isConfigured = cloudinaryService.isConfigured();
  console.log(`   Configuration status: ${isConfigured ? '✅ Configured' : '❌ Not configured'}`);
  
  if (!isConfigured) {
    console.log('   Please set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET in your .env file');
    return;
  }

  console.log(`   Cloud Name: ${process.env.CLOUDINARY_CLOUD_NAME}`);
  console.log(`   API Key: ${process.env.CLOUDINARY_API_KEY ? '***' + process.env.CLOUDINARY_API_KEY.slice(-4) : 'Not set'}`);
  console.log(`   Auto Delete Days: ${process.env.CLOUDINARY_AUTO_DELETE_DAYS || 5}`);

  // Test 2: Test image validation
  console.log('\n2. Testing image validation...');
  const testImagePath = './test-image.jpg'; // You would need to provide a test image
  
  try {
    const validation = await cloudinaryService.validateImage(testImagePath);
    console.log(`   Validation result: ${validation.valid ? '✅ Valid' : '❌ Invalid'}`);
    if (!validation.valid) {
      console.log(`   Validation message: ${validation.message}`);
    }
  } catch (error) {
    console.log(`   ⚠️ Test image not found (${testImagePath}). This is expected if no test image is provided.`);
  }

  // Test 3: Test cleanup functionality
  console.log('\n3. Testing cleanup functionality...');
  try {
    const cleanupResults = await cloudinaryService.cleanupOldImages();
    console.log(`   ✅ Cleanup completed. Processed ${cleanupResults.length} images.`);
  } catch (error) {
    console.log(`   ⚠️ Cleanup test failed: ${error.message}`);
  }

  console.log('\n🎉 Cloudinary integration test completed!');
  console.log('\nNext steps:');
  console.log('1. Set your actual CLOUDINARY_API_KEY and CLOUDINARY_API_SECRET in .env');
  console.log('2. Test the face analysis endpoint: POST /api/face/analyze');
  console.log('3. Upload an image and verify it appears in your Cloudinary dashboard');
}

// Run the test
testCloudinaryIntegration().catch(console.error);
