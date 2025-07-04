const NodeCache = require('node-cache');
const Redis = require('ioredis');

class CacheService {
  constructor() {
    // In-memory cache for fast access
    this.memoryCache = new NodeCache({
      stdTTL: 300, // 5 minutes default TTL
      checkperiod: 60, // Check for expired keys every 60 seconds
      useClones: false // Better performance
    });

    // Redis cache for distributed caching (optional)
    this.redisCache = null;
    this.isRedisConnected = false;

    // Initialize Redis if available
    this.initRedis();

    // Cache statistics
    this.stats = {
      hits: 0,
      misses: 0,
      sets: 0,
      deletes: 0
    };
  }

  async initRedis() {
    // Skip Redis initialization if not enabled
    if (process.env.ENABLE_REDIS !== 'true') {
      console.log('ℹ️  Redis disabled, using memory cache only');
      this.redisCache = null;
      this.isRedisConnected = false;
      return;
    }

    try {
      // Try to connect to Redis (optional)
      this.redisCache = new Redis({
        host: process.env.REDIS_HOST || 'localhost',
        port: process.env.REDIS_PORT || 6379,
        password: process.env.REDIS_PASSWORD || undefined,
        retryDelayOnFailover: 100,
        maxRetriesPerRequest: 3,
        lazyConnect: true
      });

      await this.redisCache.ping();
      this.isRedisConnected = true;
      console.log('✅ Redis cache connected');
    } catch (error) {
      console.log('⚠️  Redis not available, using memory cache only');
      this.redisCache = null;
      this.isRedisConnected = false;
    }
  }

  // Generate cache key
  generateKey(prefix, identifier) {
    return `${prefix}:${identifier}`;
  }

  // Get from cache
  async get(key) {
    try {
      // Try memory cache first (fastest)
      let value = this.memoryCache.get(key);
      if (value !== undefined) {
        this.stats.hits++;
        return value;
      }

      // Try Redis cache if available
      if (this.isRedisConnected && this.redisCache) {
        const redisValue = await this.redisCache.get(key);
        if (redisValue) {
          // Parse JSON if it's an object
          try {
            value = JSON.parse(redisValue);
          } catch {
            value = redisValue;
          }
          
          // Store in memory cache for faster access
          this.memoryCache.set(key, value, 300);
          this.stats.hits++;
          return value;
        }
      }

      this.stats.misses++;
      return null;
    } catch (error) {
      console.error('Cache get error:', error);
      this.stats.misses++;
      return null;
    }
  }

  // Set cache value
  async set(key, value, ttl = 300) {
    try {
      // Set in memory cache
      this.memoryCache.set(key, value, ttl);

      // Set in Redis cache if available
      if (this.isRedisConnected && this.redisCache) {
        const stringValue = typeof value === 'object' ? JSON.stringify(value) : value;
        await this.redisCache.setex(key, ttl, stringValue);
      }

      this.stats.sets++;
      return true;
    } catch (error) {
      console.error('Cache set error:', error);
      return false;
    }
  }

  // Delete from cache
  async del(key) {
    try {
      // Delete from memory cache
      this.memoryCache.del(key);

      // Delete from Redis cache if available
      if (this.isRedisConnected && this.redisCache) {
        await this.redisCache.del(key);
      }

      this.stats.deletes++;
      return true;
    } catch (error) {
      console.error('Cache delete error:', error);
      return false;
    }
  }

  // Clear all cache
  async clear() {
    try {
      this.memoryCache.flushAll();
      
      if (this.isRedisConnected && this.redisCache) {
        await this.redisCache.flushall();
      }

      return true;
    } catch (error) {
      console.error('Cache clear error:', error);
      return false;
    }
  }

  // Get cache statistics
  getStats() {
    const memoryStats = this.memoryCache.getStats();
    return {
      ...this.stats,
      memoryKeys: memoryStats.keys,
      memoryHits: memoryStats.hits,
      memoryMisses: memoryStats.misses,
      redisConnected: this.isRedisConnected,
      hitRate: this.stats.hits / (this.stats.hits + this.stats.misses) || 0
    };
  }

  // User-specific cache methods
  async getUserCache(userId) {
    const key = this.generateKey('user', userId);
    return await this.get(key);
  }

  async setUserCache(userId, userData, ttl = 600) {
    const key = this.generateKey('user', userId);
    return await this.set(key, userData, ttl);
  }

  async deleteUserCache(userId) {
    const key = this.generateKey('user', userId);
    return await this.del(key);
  }

  // Session cache methods
  async getSessionCache(sessionId) {
    const key = this.generateKey('session', sessionId);
    return await this.get(key);
  }

  async setSessionCache(sessionId, sessionData, ttl = 3600) {
    const key = this.generateKey('session', sessionId);
    return await this.set(key, sessionData, ttl);
  }

  // Rate limiting cache
  async getRateLimitCache(identifier) {
    const key = this.generateKey('ratelimit', identifier);
    return await this.get(key);
  }

  async setRateLimitCache(identifier, count, ttl = 900) {
    const key = this.generateKey('ratelimit', identifier);
    return await this.set(key, count, ttl);
  }

  async incrementRateLimit(identifier, ttl = 900) {
    const key = this.generateKey('ratelimit', identifier);
    try {
      if (this.isRedisConnected && this.redisCache) {
        const result = await this.redisCache.multi()
          .incr(key)
          .expire(key, ttl)
          .exec();
        return result[0][1]; // Return the incremented value
      } else {
        const current = this.memoryCache.get(key) || 0;
        const newValue = current + 1;
        this.memoryCache.set(key, newValue, ttl);
        return newValue;
      }
    } catch (error) {
      console.error('Rate limit increment error:', error);
      return 1;
    }
  }

  // Face analysis cache methods
  async getFaceAnalysisCache(imageHash) {
    const key = this.generateKey('face_analysis', imageHash);
    return await this.get(key);
  }

  async setFaceAnalysisCache(imageHash, analysisData, ttl = 86400) {
    const key = this.generateKey('face_analysis', imageHash);
    return await this.set(key, analysisData, ttl);
  }

  // Health check
  async healthCheck() {
    try {
      const testKey = 'health_check';
      const testValue = Date.now();
      
      await this.set(testKey, testValue, 10);
      const retrieved = await this.get(testKey);
      await this.del(testKey);
      
      return {
        status: 'healthy',
        memoryCache: retrieved === testValue,
        redisCache: this.isRedisConnected,
        stats: this.getStats()
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        error: error.message,
        stats: this.getStats()
      };
    }
  }
}

// Create singleton instance
const cacheService = new CacheService();

module.exports = cacheService;
