// MongoDB Indexing Script for Performance Optimization
require('dotenv').config();
const mongoose = require('mongoose');

// Import models to ensure schemas are registered
const User = require('../models/User');
const FaceAnalysis = require('../models/FaceAnalysis');
const ColorRecommendation = require('../models/ColorRecommendation');

async function createOptimizedIndexes() {
  try {
    console.log('🚀 Starting MongoDB Index Creation...\n');
    
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    const db = mongoose.connection.db;

    // ==================== USER COLLECTION INDEXES ====================
    console.log('📊 Creating User Collection Indexes...');
    
    const userCollection = db.collection('users');
    
    // Primary indexes for authentication and user lookup
    await userCollection.createIndex({ email: 1 }, { unique: true, background: true });
    await userCollection.createIndex({ isEmailVerified: 1 }, { background: true });
    await userCollection.createIndex({ createdAt: -1 }, { background: true });
    await userCollection.createIndex({ lastLogin: -1 }, { background: true });
    
    // Compound indexes for common queries
    await userCollection.createIndex({ email: 1, isEmailVerified: 1 }, { background: true });
    await userCollection.createIndex({ isEmailVerified: 1, createdAt: -1 }, { background: true });
    
    // Sparse indexes for optional fields
    await userCollection.createIndex({ resetPasswordToken: 1 }, { sparse: true, background: true });
    await userCollection.createIndex({ emailVerificationToken: 1 }, { sparse: true, background: true });
    
    console.log('✅ User indexes created');

    // ==================== FACE ANALYSIS COLLECTION INDEXES ====================
    console.log('📊 Creating Face Analysis Collection Indexes...');
    
    const faceAnalysisCollection = db.collection('faceanalyses');
    
    // Primary indexes for user queries
    await faceAnalysisCollection.createIndex({ userId: 1 }, { background: true });
    await faceAnalysisCollection.createIndex({ createdAt: -1 }, { background: true });
    await faceAnalysisCollection.createIndex({ userId: 1, createdAt: -1 }, { background: true });
    
    // Face detection and analysis indexes
    await faceAnalysisCollection.createIndex({ faceDetected: 1 }, { background: true });
    await faceAnalysisCollection.createIndex({ faceCount: 1 }, { background: true });
    await faceAnalysisCollection.createIndex({ userId: 1, faceDetected: 1 }, { background: true });
    
    // Color analysis indexes
    await faceAnalysisCollection.createIndex({ 'colors.hairColor.primary': 1 }, { background: true });
    await faceAnalysisCollection.createIndex({ 'colors.skinTone.primary': 1 }, { background: true });
    await faceAnalysisCollection.createIndex({ 'colors.eyeColor.primary': 1 }, { background: true });
    await faceAnalysisCollection.createIndex({ 'colors.lipColor.primary': 1 }, { background: true });
    
    // Facial features indexes
    await faceAnalysisCollection.createIndex({ 'facialFeatures.faceShape': 1 }, { background: true });
    await faceAnalysisCollection.createIndex({ 'facialFeatures.eyeShape': 1 }, { background: true });
    await faceAnalysisCollection.createIndex({ 'facialFeatures.eyeDistance': 1 }, { background: true });
    
    // Image metadata indexes
    await faceAnalysisCollection.createIndex({ imageFormat: 1 }, { background: true });
    await faceAnalysisCollection.createIndex({ fileSize: 1 }, { background: true });
    await faceAnalysisCollection.createIndex({ 'imageDimensions.width': 1, 'imageDimensions.height': 1 }, { background: true });
    
    // Analysis metadata indexes
    await faceAnalysisCollection.createIndex({ 'analysisMetadata.confidence': -1 }, { background: true });
    await faceAnalysisCollection.createIndex({ 'analysisMetadata.processingTime': 1 }, { background: true });
    await faceAnalysisCollection.createIndex({ 'analysisMetadata.cloudinaryPublicId': 1 }, { sparse: true, background: true });
    await faceAnalysisCollection.createIndex({ 'analysisMetadata.storageProvider': 1 }, { background: true });
    
    // Compound indexes for complex queries
    await faceAnalysisCollection.createIndex({ 
      userId: 1, 
      'colors.hairColor.primary': 1, 
      'colors.skinTone.primary': 1 
    }, { background: true });
    
    await faceAnalysisCollection.createIndex({ 
      userId: 1, 
      'facialFeatures.faceShape': 1, 
      createdAt: -1 
    }, { background: true });
    
    await faceAnalysisCollection.createIndex({ 
      faceDetected: 1, 
      'analysisMetadata.confidence': -1, 
      createdAt: -1 
    }, { background: true });
    
    console.log('✅ Face Analysis indexes created');

    // ==================== COLOR RECOMMENDATION COLLECTION INDEXES ====================
    console.log('📊 Creating Color Recommendation Collection Indexes...');
    
    const colorRecommendationCollection = db.collection('colorrecommendations');
    
    // Primary indexes
    await colorRecommendationCollection.createIndex({ userId: 1 }, { background: true });
    await colorRecommendationCollection.createIndex({ faceAnalysisId: 1 }, { background: true });
    await colorRecommendationCollection.createIndex({ createdAt: -1 }, { background: true });
    
    // User-specific queries
    await colorRecommendationCollection.createIndex({ userId: 1, createdAt: -1 }, { background: true });
    await colorRecommendationCollection.createIndex({ userId: 1, isActive: 1 }, { background: true });
    
    // AI service tracking
    await colorRecommendationCollection.createIndex({ aiService: 1 }, { background: true });
    await colorRecommendationCollection.createIndex({ aiModel: 1 }, { background: true });
    await colorRecommendationCollection.createIndex({ aiService: 1, createdAt: -1 }, { background: true });
    
    // Color palette indexes
    await colorRecommendationCollection.createIndex({ 'colorPalette.seasonalType': 1 }, { background: true });
    await colorRecommendationCollection.createIndex({ 'colorPalette.dominantColors': 1 }, { background: true });
    
    // User feedback indexes
    await colorRecommendationCollection.createIndex({ userRating: 1 }, { background: true });
    await colorRecommendationCollection.createIndex({ userRating: -1, createdAt: -1 }, { background: true });
    await colorRecommendationCollection.createIndex({ favoriteOutfits: 1 }, { sparse: true, background: true });
    
    // Compound indexes for analytics
    await colorRecommendationCollection.createIndex({ 
      userId: 1, 
      'colorPalette.seasonalType': 1, 
      userRating: -1 
    }, { background: true });
    
    await colorRecommendationCollection.createIndex({ 
      aiService: 1, 
      userRating: -1, 
      createdAt: -1 
    }, { background: true });
    
    console.log('✅ Color Recommendation indexes created');

    // ==================== TEXT SEARCH INDEXES ====================
    console.log('📊 Creating Text Search Indexes...');
    
    // Text search for face analysis
    await faceAnalysisCollection.createIndex({
      originalFileName: 'text',
      'colors.hairColor.primary': 'text',
      'colors.skinTone.primary': 'text',
      'facialFeatures.faceShape': 'text'
    }, { 
      background: true,
      name: 'face_analysis_text_search'
    });
    
    // Text search for color recommendations
    await colorRecommendationCollection.createIndex({
      generalAdvice: 'text',
      'colorPalette.seasonalType': 'text',
      userFeedback: 'text'
    }, { 
      background: true,
      name: 'color_recommendation_text_search'
    });
    
    console.log('✅ Text search indexes created');

    // ==================== TTL INDEXES FOR CLEANUP ====================
    console.log('📊 Creating TTL Indexes for Auto-cleanup...');
    
    // Auto-delete old face analyses after 90 days (optional)
    await faceAnalysisCollection.createIndex(
      { createdAt: 1 }, 
      { 
        expireAfterSeconds: 90 * 24 * 60 * 60, // 90 days
        background: true,
        name: 'face_analysis_ttl'
      }
    );
    
    // Auto-delete old recommendations after 180 days (optional)
    await colorRecommendationCollection.createIndex(
      { createdAt: 1 }, 
      { 
        expireAfterSeconds: 180 * 24 * 60 * 60, // 180 days
        background: true,
        name: 'color_recommendation_ttl'
      }
    );
    
    console.log('✅ TTL indexes created');

    // ==================== PERFORMANCE STATISTICS ====================
    console.log('\n📈 Index Creation Summary:');
    
    const userIndexes = await userCollection.listIndexes().toArray();
    const faceAnalysisIndexes = await faceAnalysisCollection.listIndexes().toArray();
    const colorRecommendationIndexes = await colorRecommendationCollection.listIndexes().toArray();
    
    console.log(`   Users Collection: ${userIndexes.length} indexes`);
    console.log(`   Face Analysis Collection: ${faceAnalysisIndexes.length} indexes`);
    console.log(`   Color Recommendations Collection: ${colorRecommendationIndexes.length} indexes`);
    console.log(`   Total Indexes: ${userIndexes.length + faceAnalysisIndexes.length + colorRecommendationIndexes.length}`);

    console.log('\n🎯 Performance Optimizations Applied:');
    console.log('   ✅ User authentication queries optimized');
    console.log('   ✅ Face analysis lookups optimized');
    console.log('   ✅ Color-based searches optimized');
    console.log('   ✅ Facial feature queries optimized');
    console.log('   ✅ User history queries optimized');
    console.log('   ✅ Analytics queries optimized');
    console.log('   ✅ Text search enabled');
    console.log('   ✅ Auto-cleanup configured');

    console.log('\n🚀 MongoDB Performance Optimization Complete!');
    
  } catch (error) {
    console.error('❌ Error creating indexes:', error);
    throw error;
  } finally {
    await mongoose.disconnect();
    console.log('✅ Disconnected from MongoDB');
  }
}

// Run the indexing script
if (require.main === module) {
  createOptimizedIndexes()
    .then(() => {
      console.log('\n🎉 All indexes created successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n💥 Index creation failed:', error);
      process.exit(1);
    });
}

module.exports = createOptimizedIndexes;
