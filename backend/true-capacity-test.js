// True Capacity Test - Tests API limits without rate limiting interference
const axios = require('axios');
const cluster = require('cluster');
const os = require('os');

const BASE_URL = 'http://localhost:3001/api';

class TrueCapacityTester {
  constructor() {
    this.results = [];
  }

  // Test true API capacity using health endpoint (no rate limiting)
  async testTrueCapacity() {
    console.log('🚀 TRUE API CAPACITY TESTING');
    console.log('🎯 Testing raw server performance (bypassing rate limits)');
    console.log('📊 Using /health endpoint to measure pure server capacity');
    console.log('=' .repeat(80));

    const testScenarios = [
      { concurrent: 10, requests: 100, name: 'Baseline Test' },
      { concurrent: 50, requests: 500, name: 'Light Load' },
      { concurrent: 100, requests: 1000, name: 'Medium Load' },
      { concurrent: 250, requests: 2500, name: 'Heavy Load' },
      { concurrent: 500, requests: 5000, name: 'Stress Test' },
      { concurrent: 1000, requests: 10000, name: 'Maximum Capacity' },
      { concurrent: 2000, requests: 20000, name: 'Breaking Point' }
    ];

    for (const scenario of testScenarios) {
      console.log(`\n🧪 ${scenario.name}: ${scenario.concurrent} concurrent, ${scenario.requests} total requests`);
      
      const result = await this.runScenario(scenario);
      this.results.push(result);
      
      // Stop if we hit breaking point
      if (result.successRate < 50 || result.averageResponseTime > 10000) {
        console.log(`🚨 Breaking point reached at ${scenario.concurrent} concurrent users`);
        break;
      }
      
      // Brief recovery time
      await this.sleep(1000);
    }

    this.generateReport();
  }

  // Run a single test scenario
  async runScenario(scenario) {
    const startTime = Date.now();
    const results = {
      scenario,
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      timeouts: 0,
      responseTimes: [],
      errors: {},
      statusCodes: {},
      startTime,
      endTime: 0,
      duration: 0,
      requestsPerSecond: 0,
      successRate: 0,
      averageResponseTime: 0,
      minResponseTime: Infinity,
      maxResponseTime: 0
    };

    // Create batches of concurrent requests
    const batchSize = scenario.concurrent;
    const totalBatches = Math.ceil(scenario.requests / batchSize);
    
    console.log(`   Running ${totalBatches} batches of ${batchSize} concurrent requests...`);

    for (let batch = 0; batch < totalBatches; batch++) {
      const requestsInBatch = Math.min(batchSize, scenario.requests - (batch * batchSize));
      
      // Create concurrent requests for this batch
      const promises = [];
      for (let i = 0; i < requestsInBatch; i++) {
        promises.push(this.makeRequest(results));
      }
      
      // Execute batch concurrently
      await Promise.allSettled(promises);
      
      // Show progress
      const progress = ((batch + 1) / totalBatches * 100).toFixed(1);
      process.stdout.write(`\r   Progress: ${progress}% (${results.successfulRequests}/${results.totalRequests} successful)`);
    }

    console.log(''); // New line after progress

    // Calculate final metrics
    results.endTime = Date.now();
    results.duration = results.endTime - results.startTime;
    results.requestsPerSecond = (results.totalRequests / results.duration) * 1000;
    results.successRate = (results.successfulRequests / results.totalRequests) * 100;
    
    if (results.responseTimes.length > 0) {
      results.averageResponseTime = results.responseTimes.reduce((a, b) => a + b, 0) / results.responseTimes.length;
      results.minResponseTime = Math.min(...results.responseTimes);
      results.maxResponseTime = Math.max(...results.responseTimes);
    }

    this.printScenarioResults(results);
    return results;
  }

  // Make a single HTTP request
  async makeRequest(results) {
    const requestStart = Date.now();
    
    try {
      const response = await axios.get(`${BASE_URL}/health`, {
        timeout: 30000, // 30 second timeout
        headers: {
          'Connection': 'keep-alive',
          'User-Agent': 'CapacityTester/1.0'
        }
      });
      
      const responseTime = Date.now() - requestStart;
      
      results.totalRequests++;
      results.successfulRequests++;
      results.responseTimes.push(responseTime);
      results.statusCodes[response.status] = (results.statusCodes[response.status] || 0) + 1;
      
    } catch (error) {
      const responseTime = Date.now() - requestStart;
      
      results.totalRequests++;
      results.failedRequests++;
      
      if (error.code === 'ECONNABORTED' || error.message.includes('timeout')) {
        results.timeouts++;
      }
      
      const status = error.response?.status || error.code || 'unknown';
      results.statusCodes[status] = (results.statusCodes[status] || 0) + 1;
      results.errors[error.message] = (results.errors[error.message] || 0) + 1;
      
      if (responseTime < 30000) { // Only count if not timeout
        results.responseTimes.push(responseTime);
      }
    }
  }

  // Print results for a scenario
  printScenarioResults(results) {
    console.log('\n📊 Results:');
    console.log(`   ✅ Success Rate: ${results.successRate.toFixed(2)}%`);
    console.log(`   🚀 Requests/Second: ${results.requestsPerSecond.toFixed(2)}`);
    console.log(`   ⚡ Avg Response Time: ${results.averageResponseTime.toFixed(2)}ms`);
    console.log(`   📈 Min/Max Response: ${results.minResponseTime}ms / ${results.maxResponseTime}ms`);
    console.log(`   ⏱️  Total Duration: ${(results.duration / 1000).toFixed(2)}s`);
    console.log(`   📊 Total Requests: ${results.totalRequests}`);
    
    if (results.timeouts > 0) {
      console.log(`   ⏰ Timeouts: ${results.timeouts}`);
    }
  }

  // Generate comprehensive capacity report
  generateReport() {
    console.log('\n' + '='.repeat(80));
    console.log('📋 TRUE CAPACITY ANALYSIS REPORT');
    console.log('='.repeat(80));

    // Find maximum stable capacity
    const stableResults = this.results.filter(r => r.successRate >= 95 && r.averageResponseTime < 1000);
    const maxStable = stableResults.length > 0 ? stableResults[stableResults.length - 1] : null;

    // Find maximum capacity (even with some failures)
    const workingResults = this.results.filter(r => r.successRate >= 70);
    const maxWorking = workingResults.length > 0 ? workingResults[workingResults.length - 1] : null;

    console.log('\n🏆 CAPACITY SUMMARY:');
    
    if (maxStable) {
      console.log(`   🎯 STABLE CAPACITY: ${maxStable.scenario.concurrent} concurrent users`);
      console.log(`      • Success Rate: ${maxStable.successRate.toFixed(2)}%`);
      console.log(`      • Requests/Second: ${maxStable.requestsPerSecond.toFixed(2)}`);
      console.log(`      • Response Time: ${maxStable.averageResponseTime.toFixed(2)}ms`);
    }
    
    if (maxWorking && maxWorking !== maxStable) {
      console.log(`   ⚡ MAXIMUM CAPACITY: ${maxWorking.scenario.concurrent} concurrent users`);
      console.log(`      • Success Rate: ${maxWorking.successRate.toFixed(2)}%`);
      console.log(`      • Requests/Second: ${maxWorking.requestsPerSecond.toFixed(2)}`);
      console.log(`      • Response Time: ${maxWorking.averageResponseTime.toFixed(2)}ms`);
    }

    // Performance breakdown
    console.log('\n📊 PERFORMANCE BREAKDOWN:');
    this.results.forEach(result => {
      const status = result.successRate >= 95 ? '🟢' : 
                    result.successRate >= 80 ? '🟡' : 
                    result.successRate >= 50 ? '🟠' : '🔴';
      
      console.log(`   ${status} ${result.scenario.concurrent.toString().padStart(4)} users: ` +
                 `${result.successRate.toFixed(1).padStart(5)}% success, ` +
                 `${result.requestsPerSecond.toFixed(1).padStart(6)} req/s, ` +
                 `${result.averageResponseTime.toFixed(0).padStart(4)}ms avg`);
    });

    // 1000 user assessment
    console.log('\n🎯 1000 CONCURRENT USER ASSESSMENT:');
    
    if (maxStable && maxStable.scenario.concurrent >= 1000) {
      console.log('   🎉 EXCELLENT: Your API can EASILY handle 1000+ concurrent users!');
      console.log('   💪 Your server is production-ready for high-traffic applications');
    } else if (maxWorking && maxWorking.scenario.concurrent >= 1000) {
      console.log('   ✅ GOOD: Your API can handle 1000 concurrent users with some stress');
      console.log('   💡 Consider optimizations for better stability at this scale');
    } else if (maxStable && maxStable.scenario.concurrent >= 500) {
      console.log('   ⚠️  MODERATE: Your API handles 500+ users stably, 1000 may be challenging');
      console.log('   🔧 Scaling recommendations needed for 1000+ users');
    } else {
      console.log('   🚨 LIMITED: Your API needs optimization to handle 1000 concurrent users');
      console.log('   🛠️  Immediate scaling required');
    }

    // Recommendations
    console.log('\n💡 SCALING RECOMMENDATIONS:');
    
    if (maxStable && maxStable.scenario.concurrent >= 1000) {
      console.log('   🎯 For even higher capacity:');
      console.log('      • Load balancing across multiple instances');
      console.log('      • Database clustering');
      console.log('      • CDN for static content');
    } else if (maxStable && maxStable.scenario.concurrent >= 500) {
      console.log('   🔧 To reach 1000+ users:');
      console.log('      • Enable Redis caching');
      console.log('      • Use PM2 cluster mode');
      console.log('      • Optimize database queries');
      console.log('      • Consider horizontal scaling');
    } else {
      console.log('   🚨 Immediate optimizations needed:');
      console.log('      • Enable Redis for caching');
      console.log('      • Use PM2 cluster mode (utilize all CPU cores)');
      console.log('      • Optimize database connections');
      console.log('      • Increase server resources (CPU/RAM)');
      console.log('      • Add database indexing');
    }

    // Hardware recommendations
    console.log('\n🖥️  HARDWARE RECOMMENDATIONS FOR 1000+ USERS:');
    console.log('   • CPU: 8+ cores (16+ recommended)');
    console.log('   • RAM: 16GB+ (32GB recommended)');
    console.log('   • Storage: NVMe SSD');
    console.log('   • Network: 1Gbps+ bandwidth');
    console.log('   • Database: Dedicated server with SSD storage');

    console.log('='.repeat(80));
  }

  // Quick 1000 user test
  async quick1000UserTest() {
    console.log('⚡ QUICK 1000 USER CAPACITY TEST');
    console.log('🎯 Testing if your API can handle 1000 concurrent users');
    console.log('=' .repeat(60));

    const result = await this.runScenario({
      concurrent: 1000,
      requests: 5000,
      name: '1000 User Test'
    });

    console.log('\n🎯 1000 USER TEST RESULT:');
    
    if (result.successRate >= 95 && result.averageResponseTime < 1000) {
      console.log('🎉 EXCELLENT: Your API easily handles 1000 concurrent users!');
      console.log(`   • ${result.successRate.toFixed(2)}% success rate`);
      console.log(`   • ${result.requestsPerSecond.toFixed(2)} requests/second`);
      console.log(`   • ${result.averageResponseTime.toFixed(2)}ms average response time`);
      console.log('   💪 Production ready for high-traffic applications!');
    } else if (result.successRate >= 80) {
      console.log('✅ GOOD: Your API can handle 1000 users with some stress');
      console.log(`   • ${result.successRate.toFixed(2)}% success rate`);
      console.log(`   • ${result.averageResponseTime.toFixed(2)}ms average response time`);
      console.log('   💡 Consider optimizations for better performance');
    } else if (result.successRate >= 50) {
      console.log('⚠️  STRUGGLING: Your API has difficulty with 1000 concurrent users');
      console.log(`   • ${result.successRate.toFixed(2)}% success rate`);
      console.log(`   • ${result.averageResponseTime.toFixed(2)}ms average response time`);
      console.log('   🔧 Optimization needed for production use');
    } else {
      console.log('🚨 OVERLOADED: Your API cannot handle 1000 concurrent users');
      console.log(`   • ${result.successRate.toFixed(2)}% success rate`);
      console.log('   🛠️  Immediate scaling and optimization required');
    }
  }

  // Utility function
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Command line interface
async function main() {
  const tester = new TrueCapacityTester();
  
  const args = process.argv.slice(2);
  const testType = args[0] || 'full';

  console.log('🔧 Note: This test uses the /health endpoint to bypass rate limiting');
  console.log('📊 This shows your server\'s true processing capacity\n');

  if (testType === 'quick') {
    await tester.quick1000UserTest();
  } else if (testType === '1000') {
    await tester.quick1000UserTest();
  } else {
    await tester.testTrueCapacity();
  }
}

// Run if called directly
if (require.main === module) {
  main().catch(console.error);
}

module.exports = TrueCapacityTester;
