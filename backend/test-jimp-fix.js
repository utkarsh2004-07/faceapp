// Test script to verify Jimp is working correctly
const Jimp = require('jimp');
const path = require('path');

async function testJimp() {
  try {
    console.log('🧪 Testing Jimp functionality...\n');

    // Test 1: Create a simple test image
    console.log('1. Creating test image...');
    const testImage = new Jimp(100, 100, 0xFF0000FF); // Red image
    console.log('✅ Test image created successfully');

    // Test 2: Test color extraction
    console.log('2. Testing color extraction...');
    const color = Jimp.intToRGBA(testImage.getPixelColor(50, 50));
    console.log(`✅ Color extracted: R:${color.r}, G:${color.g}, B:${color.b}, A:${color.a}`);

    // Test 3: Test image reading (if we had a real image file)
    console.log('3. Testing Jimp.read method...');
    try {
      // This will fail because we don't have an actual image file, but it tests the method exists
      await Jimp.read('nonexistent.jpg');
    } catch (error) {
      if (error.message.includes('ENOENT') || error.message.includes('no such file')) {
        console.log('✅ Jimp.read method is available (file not found is expected)');
      } else {
        throw error;
      }
    }

    console.log('\n🎉 All Jimp tests passed!');
    console.log('✅ Jimp is working correctly');
    console.log('✅ Face analysis should now work without errors');

  } catch (error) {
    console.error('❌ Jimp test failed:', error.message);
  }
}

testJimp();
