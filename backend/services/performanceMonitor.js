const os = require('os');
const process = require('process');
const cacheService = require('./cacheService');

class PerformanceMonitor {
  constructor() {
    this.metrics = {
      requests: {
        total: 0,
        successful: 0,
        failed: 0,
        averageResponseTime: 0,
        responseTimes: []
      },
      system: {
        cpuUsage: 0,
        memoryUsage: 0,
        loadAverage: 0,
        uptime: 0
      },
      database: {
        connections: 0,
        queries: 0,
        averageQueryTime: 0
      },
      cache: {
        hits: 0,
        misses: 0,
        hitRate: 0
      }
    };

    this.startTime = Date.now();
    this.requestTimes = [];
    this.maxRequestTimes = 1000; // Keep last 1000 request times

    // Start monitoring
    this.startMonitoring();
  }

  // Start performance monitoring
  startMonitoring() {
    // Update system metrics every 30 seconds
    setInterval(() => {
      this.updateSystemMetrics();
    }, 30000);

    // Update cache metrics every 60 seconds
    setInterval(() => {
      this.updateCacheMetrics();
    }, 60000);
  }

  // Middleware to track request performance
  trackRequest() {
    return (req, res, next) => {
      const startTime = Date.now();
      
      // Track request start
      this.metrics.requests.total++;

      // Override res.end to capture response time
      const originalEnd = res.end;
      res.end = (...args) => {
        const responseTime = Date.now() - startTime;
        
        // Track response time
        this.addResponseTime(responseTime);
        
        // Track success/failure
        if (res.statusCode >= 200 && res.statusCode < 400) {
          this.metrics.requests.successful++;
        } else {
          this.metrics.requests.failed++;
        }

        // Call original end
        originalEnd.apply(res, args);
      };

      next();
    };
  }

  // Add response time to metrics
  addResponseTime(responseTime) {
    this.requestTimes.push(responseTime);
    
    // Keep only last N request times
    if (this.requestTimes.length > this.maxRequestTimes) {
      this.requestTimes.shift();
    }

    // Update average response time
    const total = this.requestTimes.reduce((sum, time) => sum + time, 0);
    this.metrics.requests.averageResponseTime = total / this.requestTimes.length;
    this.metrics.requests.responseTimes = [...this.requestTimes];
  }

  // Update system metrics
  updateSystemMetrics() {
    try {
      // CPU usage
      const cpus = os.cpus();
      let totalIdle = 0;
      let totalTick = 0;

      cpus.forEach(cpu => {
        for (let type in cpu.times) {
          totalTick += cpu.times[type];
        }
        totalIdle += cpu.times.idle;
      });

      this.metrics.system.cpuUsage = ((totalTick - totalIdle) / totalTick) * 100;

      // Memory usage
      const totalMemory = os.totalmem();
      const freeMemory = os.freemem();
      this.metrics.system.memoryUsage = ((totalMemory - freeMemory) / totalMemory) * 100;

      // Load average
      this.metrics.system.loadAverage = os.loadavg()[0];

      // Uptime
      this.metrics.system.uptime = process.uptime();

    } catch (error) {
      console.error('Error updating system metrics:', error);
    }
  }

  // Update cache metrics
  async updateCacheMetrics() {
    try {
      const cacheStats = cacheService.getStats();
      this.metrics.cache = {
        hits: cacheStats.hits || 0,
        misses: cacheStats.misses || 0,
        hitRate: cacheStats.hitRate || 0
      };
    } catch (error) {
      console.error('Error updating cache metrics:', error);
    }
  }

  // Get current metrics
  getMetrics() {
    return {
      ...this.metrics,
      timestamp: Date.now(),
      uptime: Date.now() - this.startTime
    };
  }

  // Get performance summary
  getPerformanceSummary() {
    const metrics = this.getMetrics();
    
    return {
      status: this.getHealthStatus(metrics),
      summary: {
        totalRequests: metrics.requests.total,
        successRate: metrics.requests.total > 0 
          ? (metrics.requests.successful / metrics.requests.total * 100).toFixed(2) + '%'
          : '0%',
        averageResponseTime: metrics.requests.averageResponseTime.toFixed(2) + 'ms',
        requestsPerSecond: this.getRequestsPerSecond().toFixed(2),
        cpuUsage: metrics.system.cpuUsage.toFixed(2) + '%',
        memoryUsage: metrics.system.memoryUsage.toFixed(2) + '%',
        cacheHitRate: (metrics.cache.hitRate * 100).toFixed(2) + '%'
      },
      alerts: this.getAlerts(metrics)
    };
  }

  // Calculate requests per second
  getRequestsPerSecond() {
    const uptimeSeconds = (Date.now() - this.startTime) / 1000;
    return uptimeSeconds > 0 ? this.metrics.requests.total / uptimeSeconds : 0;
  }

  // Get health status
  getHealthStatus(metrics) {
    const alerts = this.getAlerts(metrics);
    
    if (alerts.critical.length > 0) return 'critical';
    if (alerts.warning.length > 0) return 'warning';
    return 'healthy';
  }

  // Get performance alerts
  getAlerts(metrics) {
    const alerts = {
      critical: [],
      warning: [],
      info: []
    };

    // CPU usage alerts
    if (metrics.system.cpuUsage > 90) {
      alerts.critical.push('CPU usage is critically high (>90%)');
    } else if (metrics.system.cpuUsage > 70) {
      alerts.warning.push('CPU usage is high (>70%)');
    }

    // Memory usage alerts
    if (metrics.system.memoryUsage > 90) {
      alerts.critical.push('Memory usage is critically high (>90%)');
    } else if (metrics.system.memoryUsage > 80) {
      alerts.warning.push('Memory usage is high (>80%)');
    }

    // Response time alerts
    if (metrics.requests.averageResponseTime > 5000) {
      alerts.critical.push('Average response time is critically high (>5s)');
    } else if (metrics.requests.averageResponseTime > 2000) {
      alerts.warning.push('Average response time is high (>2s)');
    }

    // Error rate alerts
    const errorRate = metrics.requests.total > 0 
      ? (metrics.requests.failed / metrics.requests.total) * 100 
      : 0;
    
    if (errorRate > 10) {
      alerts.critical.push(`Error rate is critically high (${errorRate.toFixed(2)}%)`);
    } else if (errorRate > 5) {
      alerts.warning.push(`Error rate is high (${errorRate.toFixed(2)}%)`);
    }

    // Cache hit rate alerts
    if (metrics.cache.hitRate < 0.5 && metrics.requests.total > 100) {
      alerts.warning.push(`Cache hit rate is low (${(metrics.cache.hitRate * 100).toFixed(2)}%)`);
    }

    return alerts;
  }

  // Get detailed performance report
  getDetailedReport() {
    const metrics = this.getMetrics();
    const summary = this.getPerformanceSummary();
    
    return {
      timestamp: new Date().toISOString(),
      status: summary.status,
      summary: summary.summary,
      alerts: summary.alerts,
      detailed: {
        requests: {
          total: metrics.requests.total,
          successful: metrics.requests.successful,
          failed: metrics.requests.failed,
          successRate: metrics.requests.total > 0 
            ? (metrics.requests.successful / metrics.requests.total * 100).toFixed(2)
            : 0,
          averageResponseTime: metrics.requests.averageResponseTime,
          requestsPerSecond: this.getRequestsPerSecond(),
          responseTimePercentiles: this.getResponseTimePercentiles()
        },
        system: {
          cpuUsage: metrics.system.cpuUsage,
          memoryUsage: metrics.system.memoryUsage,
          loadAverage: metrics.system.loadAverage,
          uptime: metrics.system.uptime,
          totalMemory: (os.totalmem() / 1024 / 1024 / 1024).toFixed(2) + ' GB',
          freeMemory: (os.freemem() / 1024 / 1024 / 1024).toFixed(2) + ' GB',
          cpuCount: os.cpus().length,
          platform: os.platform(),
          nodeVersion: process.version
        },
        cache: metrics.cache
      }
    };
  }

  // Calculate response time percentiles
  getResponseTimePercentiles() {
    if (this.requestTimes.length === 0) {
      return { p50: 0, p90: 0, p95: 0, p99: 0 };
    }

    const sorted = [...this.requestTimes].sort((a, b) => a - b);
    const len = sorted.length;

    return {
      p50: sorted[Math.floor(len * 0.5)],
      p90: sorted[Math.floor(len * 0.9)],
      p95: sorted[Math.floor(len * 0.95)],
      p99: sorted[Math.floor(len * 0.99)]
    };
  }

  // Reset metrics
  reset() {
    this.metrics = {
      requests: {
        total: 0,
        successful: 0,
        failed: 0,
        averageResponseTime: 0,
        responseTimes: []
      },
      system: {
        cpuUsage: 0,
        memoryUsage: 0,
        loadAverage: 0,
        uptime: 0
      },
      database: {
        connections: 0,
        queries: 0,
        averageQueryTime: 0
      },
      cache: {
        hits: 0,
        misses: 0,
        hitRate: 0
      }
    };
    
    this.requestTimes = [];
    this.startTime = Date.now();
  }
}

// Create singleton instance
const performanceMonitor = new PerformanceMonitor();

module.exports = performanceMonitor;
