// Debug script to check user authentication and face analysis ownership
require('dotenv').config();
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const User = require('./models/User');
const FaceAnalysis = require('./models/FaceAnalysis');

async function debugUserAuth() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Get the face analysis ID you're trying to access
    const faceAnalysisId = '68641f7fb40690fbea464013'; // Replace with your actual ID
    
    console.log('\n🔍 Debugging Face Analysis Access...');
    console.log('Face Analysis ID:', faceAnalysisId);

    // 1. Check if the face analysis exists
    const faceAnalysis = await FaceAnalysis.findById(faceAnalysisId);
    
    if (!faceAnalysis) {
      console.log('❌ Face analysis not found in database');
      return;
    }
    
    console.log('✅ Face analysis found');
    console.log('Face Analysis User ID:', faceAnalysis.userId);
    console.log('Face Analysis User ID Type:', typeof faceAnalysis.userId);
    console.log('Face Analysis User ID String:', faceAnalysis.userId.toString());

    // 2. Get the user who owns this face analysis
    const owner = await User.findById(faceAnalysis.userId);
    if (owner) {
      console.log('✅ Face analysis owner found:');
      console.log('  Name:', owner.name);
      console.log('  Email:', owner.email);
      console.log('  ID:', owner._id.toString());
    } else {
      console.log('❌ Face analysis owner not found');
    }

    // 3. List all users to see available users
    console.log('\n👥 All users in database:');
    const allUsers = await User.find({}).select('name email _id');
    allUsers.forEach((user, index) => {
      console.log(`  ${index + 1}. ${user.name} (${user.email}) - ID: ${user._id.toString()}`);
    });

    // 4. List all face analyses to see ownership
    console.log('\n📊 All face analyses:');
    const allAnalyses = await FaceAnalysis.find({}).select('_id userId originalFileName createdAt');
    allAnalyses.forEach((analysis, index) => {
      console.log(`  ${index + 1}. ID: ${analysis._id.toString()}`);
      console.log(`      User ID: ${analysis.userId.toString()}`);
      console.log(`      File: ${analysis.originalFileName}`);
      console.log(`      Created: ${analysis.createdAt}`);
      console.log('');
    });

    // 5. Test JWT token decoding (you'll need to provide your token)
    console.log('\n🔑 JWT Token Testing:');
    console.log('To test your JWT token, decode it manually:');
    console.log('1. Copy your JWT token');
    console.log('2. Go to https://jwt.io/');
    console.log('3. Paste your token to see the decoded payload');
    console.log('4. Check if the "id" field matches the face analysis userId');
    
    // Example of how to decode a token (you can uncomment and add your token)
    /*
    const yourToken = 'YOUR_JWT_TOKEN_HERE';
    try {
      const decoded = jwt.verify(yourToken, process.env.JWT_SECRET);
      console.log('✅ Token decoded successfully:');
      console.log('  User ID from token:', decoded.id);
      console.log('  Token type:', typeof decoded.id);
      console.log('  Matches face analysis?', decoded.id === faceAnalysis.userId.toString());
    } catch (error) {
      console.log('❌ Token decode error:', error.message);
    }
    */

  } catch (error) {
    console.error('❌ Debug error:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('\n✅ Disconnected from MongoDB');
  }
}

// Helper function to test a specific token
async function testToken(token) {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    
    console.log('\n🧪 Testing provided token...');
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log('✅ Token is valid');
    console.log('Decoded payload:', decoded);
    
    const user = await User.findById(decoded.id);
    if (user) {
      console.log('✅ User found:');
      console.log('  Name:', user.name);
      console.log('  Email:', user.email);
      console.log('  ID:', user._id.toString());
      console.log('  Active:', user.isActive);
    } else {
      console.log('❌ User not found for this token');
    }
    
  } catch (error) {
    console.log('❌ Token test error:', error.message);
  } finally {
    await mongoose.disconnect();
  }
}

// Run the debug
console.log('🐛 User Authentication Debug Tool');
console.log('================================\n');

// Check if a token was provided as command line argument
const args = process.argv.slice(2);
if (args.length > 0 && args[0].startsWith('eyJ')) {
  // Looks like a JWT token
  testToken(args[0]);
} else {
  debugUserAuth();
}

// Usage instructions
console.log('\n📝 Usage:');
console.log('  node debug-user-auth.js                    # General debug');
console.log('  node debug-user-auth.js YOUR_JWT_TOKEN     # Test specific token');
