#!/usr/bin/env node

// Complete Testing Runner - Runs all tests in sequence
const { exec } = require('child_process');
const axios = require('axios');
const fs = require('fs');

const BASE_URL = 'http://localhost:3001/api';

class TestRunner {
  constructor() {
    this.results = {
      enhancedSystemTest: null,
      loadTest: null,
      performanceMetrics: null,
      startTime: Date.now(),
      endTime: null
    };
  }

  // Check if server is running
  async checkServer() {
    try {
      console.log('🔍 Checking if server is running...');
      const response = await axios.get(`${BASE_URL}/health`, { timeout: 5000 });
      console.log('✅ Server is running and healthy');
      return true;
    } catch (error) {
      console.log('❌ Server is not running or not responding');
      console.log('💡 Please start the server with: npm start');
      return false;
    }
  }

  // Run command and capture output
  runCommand(command, description) {
    return new Promise((resolve, reject) => {
      console.log(`\n🚀 ${description}...`);
      console.log(`📝 Command: ${command}`);
      console.log('=' .repeat(60));

      const startTime = Date.now();
      const process = exec(command, { maxBuffer: 1024 * 1024 * 10 }); // 10MB buffer

      let stdout = '';
      let stderr = '';

      process.stdout.on('data', (data) => {
        stdout += data;
        process.stdout.write(data); // Show output in real-time
      });

      process.stderr.on('data', (data) => {
        stderr += data;
        process.stderr.write(data);
      });

      process.on('close', (code) => {
        const duration = Date.now() - startTime;
        console.log('=' .repeat(60));
        console.log(`⏱️  Duration: ${duration}ms`);
        console.log(`🔢 Exit Code: ${code}`);
        
        if (code === 0) {
          console.log('✅ Test completed successfully');
          resolve({ success: true, stdout, stderr, duration, code });
        } else {
          console.log('❌ Test failed');
          resolve({ success: false, stdout, stderr, duration, code });
        }
      });

      process.on('error', (error) => {
        console.log('❌ Process error:', error.message);
        reject(error);
      });
    });
  }

  // Get performance metrics
  async getPerformanceMetrics() {
    try {
      console.log('\n📊 Getting Performance Metrics...');
      const response = await axios.get(`${BASE_URL}/metrics`);
      const metrics = response.data.data;
      
      console.log('✅ Performance Metrics Retrieved:');
      console.log(`   - Total Requests: ${metrics.detailed.requests.total}`);
      console.log(`   - Success Rate: ${metrics.detailed.requests.successRate}%`);
      console.log(`   - Average Response Time: ${metrics.detailed.requests.averageResponseTime.toFixed(2)}ms`);
      console.log(`   - Requests/Second: ${metrics.detailed.requests.requestsPerSecond.toFixed(2)}`);
      console.log(`   - CPU Usage: ${metrics.detailed.system.cpuUsage.toFixed(2)}%`);
      console.log(`   - Memory Usage: ${metrics.detailed.system.memoryUsage.toFixed(2)}%`);
      
      return { success: true, data: metrics };
    } catch (error) {
      console.log('❌ Failed to get performance metrics:', error.message);
      return { success: false, error: error.message };
    }
  }

  // Get cache status
  async getCacheStatus() {
    try {
      console.log('\n💾 Getting Cache Status...');
      const response = await axios.get(`${BASE_URL}/cache/status`);
      const cache = response.data.data;
      
      console.log('✅ Cache Status Retrieved:');
      console.log(`   - Status: ${cache.status}`);
      console.log(`   - Memory Cache: ${cache.memoryCache ? 'Working' : 'Not Working'}`);
      console.log(`   - Redis Connected: ${cache.redisConnected ? 'Yes' : 'No'}`);
      console.log(`   - Cache Hits: ${cache.stats.hits}`);
      console.log(`   - Cache Misses: ${cache.stats.misses}`);
      console.log(`   - Hit Rate: ${(cache.stats.hitRate * 100).toFixed(2)}%`);
      
      return { success: true, data: cache };
    } catch (error) {
      console.log('❌ Failed to get cache status:', error.message);
      return { success: false, error: error.message };
    }
  }

  // Save results to file
  saveResults() {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `test-results-${timestamp}.json`;
    
    this.results.endTime = Date.now();
    this.results.totalDuration = this.results.endTime - this.results.startTime;
    
    try {
      fs.writeFileSync(filename, JSON.stringify(this.results, null, 2));
      console.log(`\n💾 Test results saved to: ${filename}`);
    } catch (error) {
      console.log('❌ Failed to save results:', error.message);
    }
  }

  // Generate summary report
  generateSummary() {
    console.log('\n' + '='.repeat(80));
    console.log('📋 TEST SUMMARY REPORT');
    console.log('='.repeat(80));
    
    const totalDuration = (this.results.endTime - this.results.startTime) / 1000;
    console.log(`⏱️  Total Test Duration: ${totalDuration.toFixed(2)} seconds`);
    
    // Enhanced System Test Summary
    if (this.results.enhancedSystemTest) {
      console.log('\n1️⃣ Enhanced System Test:');
      console.log(`   Status: ${this.results.enhancedSystemTest.success ? '✅ PASSED' : '❌ FAILED'}`);
      console.log(`   Duration: ${(this.results.enhancedSystemTest.duration / 1000).toFixed(2)}s`);
    }
    
    // Load Test Summary
    if (this.results.loadTest) {
      console.log('\n2️⃣ Load Test:');
      console.log(`   Status: ${this.results.loadTest.success ? '✅ PASSED' : '❌ FAILED'}`);
      console.log(`   Duration: ${(this.results.loadTest.duration / 1000).toFixed(2)}s`);
    }
    
    // Performance Metrics Summary
    if (this.results.performanceMetrics && this.results.performanceMetrics.success) {
      const metrics = this.results.performanceMetrics.data;
      console.log('\n3️⃣ Performance Metrics:');
      console.log(`   Status: ✅ RETRIEVED`);
      console.log(`   Total Requests: ${metrics.detailed.requests.total}`);
      console.log(`   Success Rate: ${metrics.detailed.requests.successRate}%`);
      console.log(`   Avg Response Time: ${metrics.detailed.requests.averageResponseTime.toFixed(2)}ms`);
      console.log(`   CPU Usage: ${metrics.detailed.system.cpuUsage.toFixed(2)}%`);
      console.log(`   Memory Usage: ${metrics.detailed.system.memoryUsage.toFixed(2)}%`);
    }
    
    // Overall Status
    const allPassed = this.results.enhancedSystemTest?.success && 
                     this.results.loadTest?.success && 
                     this.results.performanceMetrics?.success;
    
    console.log('\n🎯 OVERALL STATUS:');
    if (allPassed) {
      console.log('🎉 ALL TESTS PASSED - API IS READY FOR PRODUCTION!');
    } else {
      console.log('⚠️  SOME TESTS FAILED - REVIEW RESULTS ABOVE');
    }
    
    console.log('='.repeat(80));
  }

  // Main test runner
  async runAllTests() {
    console.log('🧪 COMPLETE API TESTING SUITE');
    console.log('🚀 Testing Enhanced Scalable Authentication System');
    console.log('=' .repeat(80));
    
    // Step 1: Check server
    const serverRunning = await this.checkServer();
    if (!serverRunning) {
      console.log('\n❌ Cannot proceed without server running');
      process.exit(1);
    }
    
    // Step 2: Get baseline performance
    console.log('\n📊 Getting Baseline Performance...');
    const baselineMetrics = await this.getPerformanceMetrics();
    const baselineCache = await this.getCacheStatus();
    
    // Step 3: Run Enhanced System Test
    try {
      this.results.enhancedSystemTest = await this.runCommand(
        'node test-enhanced-system.js',
        'Running Enhanced System Test'
      );
    } catch (error) {
      console.log('❌ Enhanced System Test failed to run:', error.message);
      this.results.enhancedSystemTest = { success: false, error: error.message };
    }
    
    // Step 4: Run Load Test
    try {
      this.results.loadTest = await this.runCommand(
        'node tests/loadTest.js',
        'Running Load Test'
      );
    } catch (error) {
      console.log('❌ Load Test failed to run:', error.message);
      this.results.loadTest = { success: false, error: error.message };
    }
    
    // Step 5: Get final performance metrics
    console.log('\n📊 Getting Final Performance Metrics...');
    this.results.performanceMetrics = await this.getPerformanceMetrics();
    this.results.cacheStatus = await this.getCacheStatus();
    
    // Step 6: Generate summary
    this.generateSummary();
    
    // Step 7: Save results
    this.saveResults();
    
    console.log('\n✅ Complete testing suite finished!');
    console.log('📖 For detailed documentation, see: COMPLETE_TESTING_GUIDE.md');
  }
}

// Run tests if this file is executed directly
if (require.main === module) {
  const runner = new TestRunner();
  runner.runAllTests().catch(error => {
    console.error('❌ Test runner failed:', error);
    process.exit(1);
  });
}

module.exports = TestRunner;
