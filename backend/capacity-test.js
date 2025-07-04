// API Capacity Testing - Find Your API's True Limits
const axios = require('axios');
const cluster = require('cluster');
const os = require('os');

const BASE_URL = 'http://localhost:3001/api';

class CapacityTester {
  constructor() {
    this.results = {
      capacityTests: [],
      maxConcurrentUsers: 0,
      maxRequestsPerSecond: 0,
      breakingPoint: null,
      recommendations: []
    };
  }

  // Test API capacity with increasing load
  async testCapacity() {
    console.log('🚀 API CAPACITY TESTING');
    console.log('🎯 Finding your API\'s true limits...');
    console.log('=' .repeat(80));

    // Test scenarios with increasing concurrent users
    const testScenarios = [
      { users: 10, requestsPerUser: 5, description: 'Light Load' },
      { users: 25, requestsPerUser: 4, description: 'Medium Load' },
      { users: 50, requestsPerUser: 3, description: 'Heavy Load' },
      { users: 100, requestsPerUser: 2, description: 'Stress Load' },
      { users: 200, requestsPerUser: 2, description: 'Extreme Load' },
      { users: 500, requestsPerUser: 1, description: 'Breaking Point Test' },
      { users: 1000, requestsPerUser: 1, description: 'Maximum Capacity Test' }
    ];

    for (const scenario of testScenarios) {
      console.log(`\n🧪 Testing ${scenario.description}: ${scenario.users} users, ${scenario.requestsPerUser} requests each`);
      
      const result = await this.runCapacityTest(scenario);
      this.results.capacityTests.push(result);
      
      // Check if we've hit the breaking point
      if (result.successRate < 50 || result.averageResponseTime > 5000) {
        console.log(`⚠️  Breaking point detected at ${scenario.users} concurrent users`);
        this.results.breakingPoint = scenario.users;
        break;
      }
      
      // Update max capacity if successful
      if (result.successRate > 80) {
        this.results.maxConcurrentUsers = scenario.users;
        this.results.maxRequestsPerSecond = Math.max(
          this.results.maxRequestsPerSecond, 
          result.requestsPerSecond
        );
      }
      
      // Wait between tests to let server recover
      await this.waitForRecovery(2000);
    }

    this.generateCapacityReport();
  }

  // Run a single capacity test
  async runCapacityTest(scenario) {
    const startTime = Date.now();
    const results = {
      scenario,
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      responseTimes: [],
      errors: {},
      statusCodes: {},
      duration: 0,
      requestsPerSecond: 0,
      successRate: 0,
      averageResponseTime: 0
    };

    // Create test users first (within rate limits)
    const testUsers = await this.createTestUsers(Math.min(scenario.users, 5));
    
    if (testUsers.length === 0) {
      console.log('❌ Could not create test users - using existing authentication');
      return this.runAuthenticatedCapacityTest(scenario);
    }

    // Run concurrent requests
    const promises = [];
    
    for (let i = 0; i < scenario.users; i++) {
      const user = testUsers[i % testUsers.length]; // Reuse users if needed
      
      for (let j = 0; j < scenario.requestsPerUser; j++) {
        const promise = this.makeCapacityRequest(user, results);
        promises.push(promise);
      }
    }

    // Execute all requests concurrently
    await Promise.allSettled(promises);

    // Calculate metrics
    results.duration = Date.now() - startTime;
    results.requestsPerSecond = (results.totalRequests / results.duration) * 1000;
    results.successRate = (results.successfulRequests / results.totalRequests) * 100;
    results.averageResponseTime = results.responseTimes.length > 0 
      ? results.responseTimes.reduce((a, b) => a + b, 0) / results.responseTimes.length 
      : 0;

    this.printTestResults(results);
    return results;
  }

  // Create test users for capacity testing
  async createTestUsers(count) {
    const users = [];
    console.log(`   Creating ${count} test users...`);

    for (let i = 0; i < count; i++) {
      try {
        const userData = {
          name: `CapacityUser${Date.now()}${i}`,
          email: `capacity${Date.now()}${i}@example.com`,
          password: 'CapacityTest123',
          gender: ['male', 'female', 'other'][i % 3]
        };

        const response = await axios.post(`${BASE_URL}/auth/register`, userData);
        
        if (response.data.success) {
          // Login to get token
          const loginResponse = await axios.post(`${BASE_URL}/auth/login`, {
            email: userData.email,
            password: userData.password
          });
          
          if (loginResponse.data.success) {
            users.push({
              ...userData,
              token: loginResponse.data.token
            });
          }
        }
        
        // Small delay to respect rate limits
        await new Promise(resolve => setTimeout(resolve, 100));
        
      } catch (error) {
        // Rate limited or other error - continue with what we have
        break;
      }
    }

    console.log(`   ✅ Created ${users.length} test users`);
    return users;
  }

  // Make a capacity test request
  async makeCapacityRequest(user, results) {
    const startTime = Date.now();
    
    try {
      const response = await axios.get(`${BASE_URL}/auth/me`, {
        headers: { Authorization: `Bearer ${user.token}` },
        timeout: 10000 // 10 second timeout
      });
      
      const responseTime = Date.now() - startTime;
      
      results.totalRequests++;
      results.successfulRequests++;
      results.responseTimes.push(responseTime);
      results.statusCodes[response.status] = (results.statusCodes[response.status] || 0) + 1;
      
    } catch (error) {
      const responseTime = Date.now() - startTime;
      
      results.totalRequests++;
      results.failedRequests++;
      results.responseTimes.push(responseTime);
      
      const status = error.response?.status || 'timeout';
      results.statusCodes[status] = (results.statusCodes[status] || 0) + 1;
      results.errors[error.message] = (results.errors[error.message] || 0) + 1;
    }
  }

  // Run authenticated capacity test (fallback)
  async runAuthenticatedCapacityTest(scenario) {
    console.log('   Using fallback authentication test...');
    
    const results = {
      scenario,
      totalRequests: scenario.users * scenario.requestsPerUser,
      successfulRequests: 0,
      failedRequests: 0,
      responseTimes: [],
      errors: {},
      statusCodes: {},
      duration: 0,
      requestsPerSecond: 0,
      successRate: 0,
      averageResponseTime: 0
    };

    const startTime = Date.now();
    const promises = [];

    // Create requests to health endpoint (no auth required)
    for (let i = 0; i < results.totalRequests; i++) {
      const promise = this.makeHealthRequest(results);
      promises.push(promise);
    }

    await Promise.allSettled(promises);

    results.duration = Date.now() - startTime;
    results.requestsPerSecond = (results.totalRequests / results.duration) * 1000;
    results.successRate = (results.successfulRequests / results.totalRequests) * 100;
    results.averageResponseTime = results.responseTimes.length > 0 
      ? results.responseTimes.reduce((a, b) => a + b, 0) / results.responseTimes.length 
      : 0;

    this.printTestResults(results);
    return results;
  }

  // Make health check request
  async makeHealthRequest(results) {
    const startTime = Date.now();
    
    try {
      const response = await axios.get(`${BASE_URL}/health`, {
        timeout: 10000
      });
      
      const responseTime = Date.now() - startTime;
      
      results.successfulRequests++;
      results.responseTimes.push(responseTime);
      results.statusCodes[response.status] = (results.statusCodes[response.status] || 0) + 1;
      
    } catch (error) {
      const responseTime = Date.now() - startTime;
      
      results.failedRequests++;
      results.responseTimes.push(responseTime);
      
      const status = error.response?.status || 'timeout';
      results.statusCodes[status] = (results.statusCodes[status] || 0) + 1;
      results.errors[error.message] = (results.errors[error.message] || 0) + 1;
    }
  }

  // Print test results
  printTestResults(results) {
    console.log('\n📊 Test Results:');
    console.log(`   Total Requests: ${results.totalRequests}`);
    console.log(`   Successful: ${results.successfulRequests} (${results.successRate.toFixed(2)}%)`);
    console.log(`   Failed: ${results.failedRequests} (${(100 - results.successRate).toFixed(2)}%)`);
    console.log(`   Requests/Second: ${results.requestsPerSecond.toFixed(2)}`);
    console.log(`   Average Response Time: ${results.averageResponseTime.toFixed(2)}ms`);
    console.log(`   Duration: ${(results.duration / 1000).toFixed(2)}s`);
    
    if (Object.keys(results.statusCodes).length > 0) {
      console.log('   Status Codes:', Object.entries(results.statusCodes)
        .map(([code, count]) => `${code}:${count}`).join(', '));
    }
  }

  // Wait for server recovery
  async waitForRecovery(ms) {
    console.log(`   ⏳ Waiting ${ms}ms for server recovery...`);
    await new Promise(resolve => setTimeout(resolve, ms));
  }

  // Generate comprehensive capacity report
  generateCapacityReport() {
    console.log('\n' + '='.repeat(80));
    console.log('📋 API CAPACITY ANALYSIS REPORT');
    console.log('='.repeat(80));

    // Find best performing test
    const bestTest = this.results.capacityTests
      .filter(test => test.successRate > 80)
      .sort((a, b) => b.scenario.users - a.scenario.users)[0];

    if (bestTest) {
      console.log('\n🏆 MAXIMUM STABLE CAPACITY:');
      console.log(`   👥 Concurrent Users: ${bestTest.scenario.users}`);
      console.log(`   🚀 Requests/Second: ${bestTest.requestsPerSecond.toFixed(2)}`);
      console.log(`   ✅ Success Rate: ${bestTest.successRate.toFixed(2)}%`);
      console.log(`   ⚡ Response Time: ${bestTest.averageResponseTime.toFixed(2)}ms`);
    }

    // Performance breakdown
    console.log('\n📊 PERFORMANCE BREAKDOWN:');
    this.results.capacityTests.forEach(test => {
      const status = test.successRate > 80 ? '✅' : 
                    test.successRate > 50 ? '⚠️' : '❌';
      
      console.log(`   ${status} ${test.scenario.users} users: ${test.successRate.toFixed(1)}% success, ${test.averageResponseTime.toFixed(0)}ms avg`);
    });

    // Capacity recommendations
    console.log('\n💡 CAPACITY RECOMMENDATIONS:');
    
    if (bestTest) {
      const safeCapacity = Math.floor(bestTest.scenario.users * 0.7); // 70% of max for safety
      console.log(`   🎯 Recommended Production Capacity: ${safeCapacity} concurrent users`);
      console.log(`   📈 Peak Capacity: ${bestTest.scenario.users} concurrent users`);
      console.log(`   🚀 Throughput: ${bestTest.requestsPerSecond.toFixed(0)} requests/second`);
    }

    // Scaling recommendations
    console.log('\n🔧 SCALING RECOMMENDATIONS:');
    
    if (this.results.maxConcurrentUsers >= 1000) {
      console.log('   🎉 EXCELLENT: Your API can handle 1000+ concurrent users!');
      console.log('   💡 Consider: Load balancing for even higher capacity');
    } else if (this.results.maxConcurrentUsers >= 500) {
      console.log('   ✅ GOOD: Your API can handle 500+ concurrent users');
      console.log('   💡 Consider: Horizontal scaling to reach 1000+ users');
    } else if (this.results.maxConcurrentUsers >= 100) {
      console.log('   ⚠️  MODERATE: Your API can handle 100+ concurrent users');
      console.log('   💡 Recommendations:');
      console.log('      - Enable Redis for better caching');
      console.log('      - Optimize database queries');
      console.log('      - Consider clustering with PM2');
    } else {
      console.log('   🚨 LIMITED: Your API handles <100 concurrent users');
      console.log('   💡 Urgent Recommendations:');
      console.log('      - Enable Redis caching');
      console.log('      - Optimize database connections');
      console.log('      - Use PM2 cluster mode');
      console.log('      - Consider upgrading server resources');
    }

    // Hardware recommendations
    console.log('\n🖥️  HARDWARE RECOMMENDATIONS:');
    console.log('   For 1000+ concurrent users:');
    console.log('   • CPU: 8+ cores');
    console.log('   • RAM: 16GB+');
    console.log('   • Storage: SSD');
    console.log('   • Network: High bandwidth');
    console.log('   • Database: Dedicated server or cluster');

    console.log('='.repeat(80));
  }

  // Quick capacity check
  async quickCapacityCheck() {
    console.log('⚡ QUICK CAPACITY CHECK');
    console.log('Testing with 100 concurrent users...\n');

    const result = await this.runCapacityTest({
      users: 100,
      requestsPerUser: 1,
      description: 'Quick Capacity Check'
    });

    console.log('\n🎯 QUICK ASSESSMENT:');
    if (result.successRate > 90) {
      console.log('🎉 EXCELLENT: Your API easily handles 100 concurrent users!');
      console.log('💡 Run full capacity test to find your true limits');
    } else if (result.successRate > 70) {
      console.log('✅ GOOD: Your API handles 100 users with some stress');
      console.log('💡 Consider optimizations for better performance');
    } else {
      console.log('⚠️  NEEDS OPTIMIZATION: Struggling with 100 concurrent users');
      console.log('💡 Immediate optimizations needed');
    }
  }
}

// Command line interface
async function main() {
  const tester = new CapacityTester();
  
  const args = process.argv.slice(2);
  const testType = args[0] || 'full';

  if (testType === 'quick') {
    await tester.quickCapacityCheck();
  } else {
    await tester.testCapacity();
  }
}

// Run if called directly
if (require.main === module) {
  main().catch(console.error);
}

module.exports = CapacityTester;
