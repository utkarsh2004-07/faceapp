const cacheService = require('../services/cacheService');

class AdvancedRateLimit {
  constructor() {
    this.limits = {
      // Global limits
      global: {
        windowMs: 15 * 60 * 1000, // 15 minutes
        max: 1000, // requests per window
        message: 'Too many requests from this IP'
      },
      
      // Authentication endpoints
      auth: {
        windowMs: 15 * 60 * 1000, // 15 minutes
        max: 50, // requests per window
        message: 'Too many authentication attempts'
      },
      
      // Login specific (stricter)
      login: {
        windowMs: 15 * 60 * 1000, // 15 minutes
        max: 10, // requests per window
        message: 'Too many login attempts'
      },
      
      // Registration
      register: {
        // windowMs: 60 * 60 * 1000, // 1 hour
        windowMs: 60 * 1000,
        max: 5, // requests per window
        message: 'Too many registration attempts'
      },
      
      // Face analysis (resource intensive)
      faceAnalysis: {
        windowMs: 60 * 60 * 1000, // 1 hour
        max: 20, // requests per window
        message: 'Too many face analysis requests'
      },
      
      // File upload
      upload: {
        windowMs: 60 * 60 * 1000, // 1 hour
        max: 50, // requests per window
        message: 'Too many file upload requests'
      },

      // Color recommendations (AI-powered, resource intensive)
      colorRecommendations: {
        windowMs: 60 * 60 * 1000, // 1 hour
        max: 30, // requests per window
        message: 'Too many color recommendation requests'
      },

      // Recommendation regeneration (more restrictive)
      recommendationRegeneration: {
        windowMs: 60 * 60 * 1000, // 1 hour
        max: 10, // requests per window
        message: 'Too many recommendation regeneration requests'
      }
    };
  }

  // Create rate limiter middleware
  createLimiter(type = 'global') {
    const config = this.limits[type] || this.limits.global;
    
    return async (req, res, next) => {
      try {
        const identifier = this.getIdentifier(req, type);
        const key = `${type}_${identifier}`;
        
        // Get current count
        const current = await cacheService.incrementRateLimit(
          key, 
          Math.ceil(config.windowMs / 1000)
        );
        
        // Set headers
        res.set({
          'X-RateLimit-Limit': config.max,
          'X-RateLimit-Remaining': Math.max(0, config.max - current),
          'X-RateLimit-Reset': new Date(Date.now() + config.windowMs).toISOString()
        });
        
        // Check if limit exceeded
        if (current > config.max) {
          return res.status(429).json({
            success: false,
            message: config.message,
            retryAfter: Math.ceil(config.windowMs / 1000),
            limit: config.max,
            current: current
          });
        }
        
        next();
      } catch (error) {
        console.error('Rate limit error:', error);
        // Fail open - allow request if rate limiting fails
        next();
      }
    };
  }

  // Get identifier for rate limiting
  getIdentifier(req, type) {
    // For authenticated requests, use user ID
    if (req.user && req.user.id) {
      return `user_${req.user.id}`;
    }
    
    // For login attempts, use email if available
    if (type === 'login' && req.body && req.body.email) {
      return `email_${req.body.email}`;
    }
    
    // Default to IP address
    return this.getClientIP(req);
  }

  // Get client IP address
  getClientIP(req) {
    return req.ip || 
           req.connection.remoteAddress || 
           req.socket.remoteAddress ||
           (req.connection.socket ? req.connection.socket.remoteAddress : null) ||
           '0.0.0.0';
  }

  // Sliding window rate limiter
  createSlidingWindowLimiter(type = 'global') {
    const config = this.limits[type] || this.limits.global;
    
    return async (req, res, next) => {
      try {
        const identifier = this.getIdentifier(req, type);
        const now = Date.now();
        const windowStart = now - config.windowMs;
        
        // Use Redis for sliding window if available
        if (cacheService.isRedisConnected && cacheService.redisCache) {
          const key = `sliding_${type}_${identifier}`;
          
          // Remove old entries and add current request
          const pipeline = cacheService.redisCache.pipeline();
          pipeline.zremrangebyscore(key, 0, windowStart);
          pipeline.zadd(key, now, `${now}_${Math.random()}`);
          pipeline.zcard(key);
          pipeline.expire(key, Math.ceil(config.windowMs / 1000));
          
          const results = await pipeline.exec();
          const count = results[2][1];
          
          res.set({
            'X-RateLimit-Limit': config.max,
            'X-RateLimit-Remaining': Math.max(0, config.max - count),
            'X-RateLimit-Reset': new Date(now + config.windowMs).toISOString()
          });
          
          if (count > config.max) {
            return res.status(429).json({
              success: false,
              message: config.message,
              retryAfter: Math.ceil(config.windowMs / 1000)
            });
          }
        } else {
          // Fallback to simple rate limiting
          return this.createLimiter(type)(req, res, next);
        }
        
        next();
      } catch (error) {
        console.error('Sliding window rate limit error:', error);
        next();
      }
    };
  }

  // Adaptive rate limiting based on server load
  createAdaptiveLimiter(type = 'global') {
    return async (req, res, next) => {
      try {
        const config = { ...this.limits[type] || this.limits.global };
        
        // Adjust limits based on server metrics
        const serverLoad = await this.getServerLoad();
        
        if (serverLoad > 0.8) {
          // High load - reduce limits by 50%
          config.max = Math.floor(config.max * 0.5);
        } else if (serverLoad > 0.6) {
          // Medium load - reduce limits by 25%
          config.max = Math.floor(config.max * 0.75);
        }
        
        // Apply rate limiting with adjusted config
        const identifier = this.getIdentifier(req, type);
        const key = `adaptive_${type}_${identifier}`;
        
        const current = await cacheService.incrementRateLimit(
          key, 
          Math.ceil(config.windowMs / 1000)
        );
        
        res.set({
          'X-RateLimit-Limit': config.max,
          'X-RateLimit-Remaining': Math.max(0, config.max - current),
          'X-RateLimit-Reset': new Date(Date.now() + config.windowMs).toISOString(),
          'X-Server-Load': serverLoad.toFixed(2)
        });
        
        if (current > config.max) {
          return res.status(429).json({
            success: false,
            message: `${config.message} (server load: ${(serverLoad * 100).toFixed(1)}%)`,
            retryAfter: Math.ceil(config.windowMs / 1000),
            serverLoad: serverLoad
          });
        }
        
        next();
      } catch (error) {
        console.error('Adaptive rate limit error:', error);
        next();
      }
    };
  }

  // Get server load metrics
  async getServerLoad() {
    try {
      const os = require('os');
      const loadAvg = os.loadavg()[0]; // 1-minute load average
      const cpuCount = os.cpus().length;
      
      // Normalize load average by CPU count
      return Math.min(loadAvg / cpuCount, 1.0);
    } catch (error) {
      return 0.5; // Default moderate load
    }
  }

  // Whitelist certain IPs or users
  createWhitelistLimiter(type = 'global', whitelist = []) {
    const baseLimiter = this.createLimiter(type);
    
    return (req, res, next) => {
      const ip = this.getClientIP(req);
      const userId = req.user?.id;
      
      // Check if IP or user is whitelisted
      if (whitelist.includes(ip) || whitelist.includes(userId)) {
        return next();
      }
      
      return baseLimiter(req, res, next);
    };
  }

  // Get rate limit status
  async getRateLimitStatus(identifier, type = 'global') {
    try {
      const config = this.limits[type] || this.limits.global;
      const key = `${type}_${identifier}`;
      
      const current = await cacheService.getRateLimitCache(key) || 0;
      
      return {
        limit: config.max,
        current: current,
        remaining: Math.max(0, config.max - current),
        resetTime: Date.now() + config.windowMs,
        blocked: current >= config.max
      };
    } catch (error) {
      return {
        limit: 0,
        current: 0,
        remaining: 0,
        resetTime: Date.now(),
        blocked: false,
        error: error.message
      };
    }
  }

  // Clear rate limit for identifier
  async clearRateLimit(identifier, type = 'global') {
    try {
      const key = `${type}_${identifier}`;
      await cacheService.del(key);
      return true;
    } catch (error) {
      console.error('Clear rate limit error:', error);
      return false;
    }
  }
}

// Create singleton instance
const advancedRateLimit = new AdvancedRateLimit();

module.exports = advancedRateLimit;
