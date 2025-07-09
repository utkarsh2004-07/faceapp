// Performance Monitoring Script for PM2 and MongoDB
require('dotenv').config();
const mongoose = require('mongoose');
const { exec } = require('child_process');
const util = require('util');
const execAsync = util.promisify(exec);

class PerformanceMonitor {
  constructor() {
    this.isMonitoring = false;
    this.monitoringInterval = null;
  }

  // Check if PM2 is running and get process information
  async checkPM2Status() {
    try {
      const { stdout } = await execAsync('pm2 jlist');
      const processes = JSON.parse(stdout);
      
      const faceappProcess = processes.find(p => p.name === 'faceapp-backend');
      
      if (!faceappProcess) {
        return {
          isRunning: false,
          message: 'PM2 process not found'
        };
      }

      return {
        isRunning: true,
        processInfo: {
          name: faceappProcess.name,
          pid: faceappProcess.pid,
          status: faceappProcess.pm2_env.status,
          instances: faceappProcess.pm2_env.instances || 1,
          uptime: faceappProcess.pm2_env.pm_uptime,
          restarts: faceappProcess.pm2_env.restart_time,
          memory: faceappProcess.monit.memory,
          cpu: faceappProcess.monit.cpu,
          version: faceappProcess.pm2_env.version
        }
      };
    } catch (error) {
      return {
        isRunning: false,
        error: error.message
      };
    }
  }

  // Get detailed PM2 monitoring information
  async getPM2Metrics() {
    try {
      const { stdout } = await execAsync('pm2 show faceapp-backend');
      const monitoringData = stdout;
      
      // Parse key metrics from PM2 output
      const metrics = {
        timestamp: new Date().toISOString(),
        uptime: this.extractMetric(monitoringData, 'uptime'),
        restarts: this.extractMetric(monitoringData, 'restarts'),
        memory: this.extractMetric(monitoringData, 'memory'),
        cpu: this.extractMetric(monitoringData, 'cpu'),
        pid: this.extractMetric(monitoringData, 'pid'),
        status: this.extractMetric(monitoringData, 'status')
      };

      return metrics;
    } catch (error) {
      console.error('Error getting PM2 metrics:', error.message);
      return null;
    }
  }

  // Extract specific metrics from PM2 output
  extractMetric(output, metric) {
    const lines = output.split('\n');
    const metricLine = lines.find(line => line.toLowerCase().includes(metric.toLowerCase()));
    if (metricLine) {
      return metricLine.split(':')[1]?.trim() || 'N/A';
    }
    return 'N/A';
  }

  // Check MongoDB performance and connection status
  async checkMongoDBPerformance() {
    try {
      if (mongoose.connection.readyState !== 1) {
        await mongoose.connect(process.env.MONGODB_URI);
      }

      const db = mongoose.connection.db;
      const admin = db.admin();

      // Get server status
      const serverStatus = await admin.serverStatus();
      
      // Get database stats
      const dbStats = await db.stats();
      
      // Get collection stats
      const collections = ['users', 'faceanalyses', 'colorrecommendations'];
      const collectionStats = {};
      
      for (const collectionName of collections) {
        try {
          const stats = await db.collection(collectionName).stats();
          collectionStats[collectionName] = {
            count: stats.count,
            size: stats.size,
            avgObjSize: stats.avgObjSize,
            indexSizes: stats.indexSizes,
            totalIndexSize: stats.totalIndexSize
          };
        } catch (error) {
          collectionStats[collectionName] = { error: error.message };
        }
      }

      // Check slow operations
      const currentOp = await admin.currentOp();
      const slowOps = currentOp.inprog.filter(op => op.secs_running > 1);

      return {
        isConnected: true,
        serverInfo: {
          version: serverStatus.version,
          uptime: serverStatus.uptime,
          connections: serverStatus.connections,
          network: serverStatus.network,
          opcounters: serverStatus.opcounters,
          mem: serverStatus.mem,
          globalLock: serverStatus.globalLock
        },
        databaseStats: {
          collections: dbStats.collections,
          dataSize: dbStats.dataSize,
          indexSize: dbStats.indexSize,
          storageSize: dbStats.storageSize
        },
        collectionStats,
        slowOperations: slowOps.length,
        performance: {
          avgInsertTime: this.calculateAvgOpTime(serverStatus.opcounters, 'insert'),
          avgQueryTime: this.calculateAvgOpTime(serverStatus.opcounters, 'query'),
          avgUpdateTime: this.calculateAvgOpTime(serverStatus.opcounters, 'update')
        }
      };
    } catch (error) {
      return {
        isConnected: false,
        error: error.message
      };
    }
  }

  calculateAvgOpTime(opcounters, operation) {
    // This is a simplified calculation - in production you'd want more sophisticated metrics
    return opcounters[operation] ? `${opcounters[operation]} ops` : 'N/A';
  }

  // Get system resource usage
  async getSystemMetrics() {
    try {
      const { stdout: memInfo } = await execAsync('node -e "console.log(JSON.stringify(process.memoryUsage()))"');
      const { stdout: cpuInfo } = await execAsync('node -e "console.log(JSON.stringify(process.cpuUsage()))"');
      
      const memory = JSON.parse(memInfo);
      const cpu = JSON.parse(cpuInfo);

      return {
        memory: {
          rss: `${Math.round(memory.rss / 1024 / 1024)} MB`,
          heapTotal: `${Math.round(memory.heapTotal / 1024 / 1024)} MB`,
          heapUsed: `${Math.round(memory.heapUsed / 1024 / 1024)} MB`,
          external: `${Math.round(memory.external / 1024 / 1024)} MB`
        },
        cpu: {
          user: cpu.user,
          system: cpu.system
        },
        uptime: `${Math.round(process.uptime())} seconds`,
        nodeVersion: process.version,
        platform: process.platform,
        arch: process.arch
      };
    } catch (error) {
      return {
        error: error.message
      };
    }
  }

  // Generate comprehensive performance report
  async generatePerformanceReport() {
    console.log('🔍 Generating Performance Report...\n');

    const pm2Status = await this.checkPM2Status();
    const pm2Metrics = await this.getPM2Metrics();
    const mongoPerformance = await this.checkMongoDBPerformance();
    const systemMetrics = await this.getSystemMetrics();

    const report = {
      timestamp: new Date().toISOString(),
      pm2: pm2Status,
      pm2Metrics,
      mongodb: mongoPerformance,
      system: systemMetrics
    };

    // Display formatted report
    this.displayReport(report);

    return report;
  }

  // Display formatted performance report
  displayReport(report) {
    console.log('📊 PERFORMANCE REPORT');
    console.log('='.repeat(50));
    console.log(`Generated: ${report.timestamp}\n`);

    // PM2 Status
    console.log('🚀 PM2 STATUS:');
    if (report.pm2.isRunning) {
      const info = report.pm2.processInfo;
      console.log(`   Status: ✅ Running (PID: ${info.pid})`);
      console.log(`   Instances: ${info.instances}`);
      console.log(`   Restarts: ${info.restarts}`);
      console.log(`   Memory: ${Math.round(info.memory / 1024 / 1024)} MB`);
      console.log(`   CPU: ${info.cpu}%`);
    } else {
      console.log(`   Status: ❌ Not Running`);
      console.log(`   Error: ${report.pm2.error || report.pm2.message}`);
    }

    // MongoDB Status
    console.log('\n🗄️  MONGODB STATUS:');
    if (report.mongodb.isConnected) {
      const db = report.mongodb;
      console.log(`   Status: ✅ Connected`);
      console.log(`   Version: ${db.serverInfo.version}`);
      console.log(`   Uptime: ${Math.round(db.serverInfo.uptime / 3600)} hours`);
      console.log(`   Connections: ${db.serverInfo.connections.current}/${db.serverInfo.connections.available}`);
      console.log(`   Data Size: ${Math.round(db.databaseStats.dataSize / 1024 / 1024)} MB`);
      console.log(`   Index Size: ${Math.round(db.databaseStats.indexSize / 1024 / 1024)} MB`);
      console.log(`   Collections: ${db.databaseStats.collections}`);
      
      if (db.slowOperations > 0) {
        console.log(`   ⚠️  Slow Operations: ${db.slowOperations}`);
      }
    } else {
      console.log(`   Status: ❌ Disconnected`);
      console.log(`   Error: ${report.mongodb.error}`);
    }

    // System Metrics
    console.log('\n💻 SYSTEM METRICS:');
    if (report.system.memory) {
      console.log(`   Memory Usage: ${report.system.memory.heapUsed}/${report.system.memory.heapTotal}`);
      console.log(`   RSS: ${report.system.memory.rss}`);
      console.log(`   Uptime: ${report.system.uptime}`);
      console.log(`   Node Version: ${report.system.nodeVersion}`);
      console.log(`   Platform: ${report.system.platform} (${report.system.arch})`);
    }

    console.log('\n' + '='.repeat(50));
  }

  // Start continuous monitoring
  startMonitoring(intervalMinutes = 5) {
    if (this.isMonitoring) {
      console.log('⚠️  Monitoring is already running');
      return;
    }

    console.log(`🔄 Starting continuous monitoring (every ${intervalMinutes} minutes)...`);
    this.isMonitoring = true;

    this.monitoringInterval = setInterval(async () => {
      console.log('\n' + '='.repeat(20) + ' MONITORING CHECK ' + '='.repeat(20));
      await this.generatePerformanceReport();
    }, intervalMinutes * 60 * 1000);

    // Initial report
    this.generatePerformanceReport();
  }

  // Stop continuous monitoring
  stopMonitoring() {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
      this.isMonitoring = false;
      console.log('⏹️  Monitoring stopped');
    }
  }
}

// CLI interface
async function main() {
  const monitor = new PerformanceMonitor();
  const command = process.argv[2];

  switch (command) {
    case 'report':
      await monitor.generatePerformanceReport();
      process.exit(0);
      break;
    
    case 'pm2':
      const pm2Status = await monitor.checkPM2Status();
      console.log('PM2 Status:', pm2Status);
      process.exit(0);
      break;
    
    case 'mongodb':
      const mongoStatus = await monitor.checkMongoDBPerformance();
      console.log('MongoDB Status:', mongoStatus);
      await mongoose.disconnect();
      process.exit(0);
      break;
    
    case 'monitor':
      const interval = parseInt(process.argv[3]) || 5;
      monitor.startMonitoring(interval);
      
      // Handle graceful shutdown
      process.on('SIGINT', () => {
        console.log('\n🛑 Shutting down monitoring...');
        monitor.stopMonitoring();
        mongoose.disconnect();
        process.exit(0);
      });
      break;
    
    default:
      console.log('📊 Performance Monitor Usage:');
      console.log('  node scripts/monitor.js report     - Generate one-time report');
      console.log('  node scripts/monitor.js pm2        - Check PM2 status only');
      console.log('  node scripts/monitor.js mongodb    - Check MongoDB status only');
      console.log('  node scripts/monitor.js monitor [interval] - Start continuous monitoring');
      console.log('');
      console.log('Examples:');
      console.log('  node scripts/monitor.js report');
      console.log('  node scripts/monitor.js monitor 10  # Monitor every 10 minutes');
      process.exit(1);
  }
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = PerformanceMonitor;
