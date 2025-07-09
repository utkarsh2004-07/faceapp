const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const compression = require('compression');
require('dotenv').config();

// Import database connection
const connectDB = require('./config/database');

// Import services
const performanceMonitor = require('./services/performanceMonitor');
const cacheService = require('./services/cacheService');
const advancedRateLimit = require('./middleware/advancedRateLimit');

// Import routes
const authRoutes = require('./routes/auth');
const faceAnalysisRoutes = require('./routes/faceAnalysis');

// Initialize Express app
const app = express();

// Connect to MongoDB
connectDB();

// Performance monitoring middleware
app.use(performanceMonitor.trackRequest());

// Compression middleware
app.use(compression({
  filter: (req, res) => {
    if (req.headers['x-no-compression']) {
      return false;
    }
    return compression.filter(req, res);
  },
  level: 6,
  threshold: 1024
}));

// Security middleware
app.use(helmet());

// Global rate limiting
app.use(advancedRateLimit.createAdaptiveLimiter('global'));

// CORS configuration for mobile app
const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (mobile apps, Postman, etc.)
    if (!origin) return callback(null, true);

    // Check if it's a mobile app configuration
    const isMobileApp = !process.env.FRONTEND_URL || process.env.FRONTEND_URL.startsWith('augumentapp://');

    if (isMobileApp) {
      // For mobile apps, allow all origins
      return callback(null, true);
    } else {
      // For web apps, check against FRONTEND_URL
      const allowedOrigins = [process.env.FRONTEND_URL, 'http://localhost:3000', 'http://localhost:3001'];
      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      } else {
        return callback(new Error('Not allowed by CORS'));
      }
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  optionsSuccessStatus: 200 // For legacy browser support
};

app.use(cors(corsOptions));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Note: Static file serving removed - images now served from Cloudinary

// Routes
const uploadRoutes = require('./routes/upload');
app.use('/api/auth', authRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/face', faceAnalysisRoutes);

// Health check endpoint
app.get('/api/health', async (req, res) => {
  const cacheHealth = await cacheService.healthCheck();
  const performanceData = performanceMonitor.getPerformanceSummary();

  res.status(200).json({
    success: true,
    message: 'Server is running successfully',
    timestamp: new Date().toISOString(),
    performance: performanceData,
    cache: cacheHealth,
    uptime: process.uptime(),
    memory: {
      used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024) + ' MB',
      total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024) + ' MB'
    }
  });
});

// Performance metrics endpoint
app.get('/api/metrics', (req, res) => {
  const detailedReport = performanceMonitor.getDetailedReport();
  res.status(200).json({
    success: true,
    data: detailedReport
  });
});

// Cache status endpoint
app.get('/api/cache/status', async (req, res) => {
  const cacheHealth = await cacheService.healthCheck();
  res.status(200).json({
    success: true,
    data: cacheHealth
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found'
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal Server Error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📊 Environment: ${process.env.NODE_ENV}`);
  console.log(`🔗 Health check: http://localhost:${PORT}/api/health`);
});

module.exports = app;
