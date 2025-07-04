const axios = require('axios');
const cluster = require('cluster');
const os = require('os');

class LoadTester {
  constructor(baseURL = 'http://localhost:3001/api') {
    this.baseURL = baseURL;
    this.results = {
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      averageResponseTime: 0,
      minResponseTime: Infinity,
      maxResponseTime: 0,
      requestsPerSecond: 0,
      errors: {},
      statusCodes: {},
      startTime: null,
      endTime: null
    };
  }

  // Generate random user data
  generateUserData(index) {
    const genders = ['male', 'female', 'other', 'prefer_not_to_say'];
    return {
      name: `TestUser${index}`,
      email: `testuser${index}@example.com`,
      password: 'TestPassword123',
      gender: genders[Math.floor(Math.random() * genders.length)]
    };
  }

  // Make HTTP request with timing
  async makeRequest(method, endpoint, data = null, headers = {}) {
    const startTime = Date.now();
    try {
      const config = {
        method,
        url: `${this.baseURL}${endpoint}`,
        headers: {
          'Content-Type': 'application/json',
          ...headers
        },
        timeout: 30000 // 30 second timeout
      };

      if (data) {
        config.data = data;
      }

      const response = await axios(config);
      const responseTime = Date.now() - startTime;

      return {
        success: true,
        status: response.status,
        responseTime,
        data: response.data
      };
    } catch (error) {
      const responseTime = Date.now() - startTime;
      return {
        success: false,
        status: error.response?.status || 0,
        responseTime,
        error: error.message
      };
    }
  }

  // Update results
  updateResults(result) {
    this.results.totalRequests++;
    
    if (result.success) {
      this.results.successfulRequests++;
    } else {
      this.results.failedRequests++;
      this.results.errors[result.error] = (this.results.errors[result.error] || 0) + 1;
    }

    this.results.statusCodes[result.status] = (this.results.statusCodes[result.status] || 0) + 1;
    
    this.results.minResponseTime = Math.min(this.results.minResponseTime, result.responseTime);
    this.results.maxResponseTime = Math.max(this.results.maxResponseTime, result.responseTime);
    
    // Update average response time
    const totalTime = (this.results.averageResponseTime * (this.results.totalRequests - 1)) + result.responseTime;
    this.results.averageResponseTime = totalTime / this.results.totalRequests;
  }

  // Test user registration
  async testRegistration(concurrentUsers = 10, requestsPerUser = 5) {
    console.log(`🧪 Testing Registration: ${concurrentUsers} concurrent users, ${requestsPerUser} requests each`);
    
    this.results.startTime = Date.now();
    const promises = [];

    for (let i = 0; i < concurrentUsers; i++) {
      const userPromise = this.runUserRegistrationTest(i, requestsPerUser);
      promises.push(userPromise);
    }

    await Promise.all(promises);
    this.results.endTime = Date.now();
    
    const duration = (this.results.endTime - this.results.startTime) / 1000;
    this.results.requestsPerSecond = this.results.totalRequests / duration;

    return this.results;
  }

  // Run registration test for single user
  async runUserRegistrationTest(userIndex, requestCount) {
    for (let i = 0; i < requestCount; i++) {
      const userData = this.generateUserData(userIndex * 1000 + i);
      const result = await this.makeRequest('POST', '/auth/register', userData);
      this.updateResults(result);
    }
  }

  // Test user login
  async testLogin(concurrentUsers = 10, requestsPerUser = 5) {
    console.log(`🧪 Testing Login: ${concurrentUsers} concurrent users, ${requestsPerUser} requests each`);
    
    // First, create test users
    console.log('Creating test users...');
    const testUsers = [];
    for (let i = 0; i < concurrentUsers; i++) {
      const userData = this.generateUserData(i + 10000);
      const result = await this.makeRequest('POST', '/auth/register', userData);
      if (result.success) {
        testUsers.push(userData);
      }
    }

    console.log(`Created ${testUsers.length} test users`);

    // Reset results for login test
    this.resetResults();
    this.results.startTime = Date.now();

    const promises = [];
    for (let i = 0; i < testUsers.length; i++) {
      const userPromise = this.runUserLoginTest(testUsers[i], requestsPerUser);
      promises.push(userPromise);
    }

    await Promise.all(promises);
    this.results.endTime = Date.now();
    
    const duration = (this.results.endTime - this.results.startTime) / 1000;
    this.results.requestsPerSecond = this.results.totalRequests / duration;

    return this.results;
  }

  // Run login test for single user
  async runUserLoginTest(userData, requestCount) {
    for (let i = 0; i < requestCount; i++) {
      const loginData = {
        email: userData.email,
        password: userData.password
      };
      const result = await this.makeRequest('POST', '/auth/login', loginData);
      this.updateResults(result);
    }
  }

  // Test authenticated endpoints
  async testAuthenticatedEndpoints(concurrentUsers = 5, requestsPerUser = 10) {
    console.log(`🧪 Testing Authenticated Endpoints: ${concurrentUsers} concurrent users, ${requestsPerUser} requests each`);
    
    // Create and login test users to get tokens
    const tokens = [];
    for (let i = 0; i < concurrentUsers; i++) {
      const userData = this.generateUserData(i + 20000);
      
      // Register user
      await this.makeRequest('POST', '/auth/register', userData);
      
      // Login to get token
      const loginResult = await this.makeRequest('POST', '/auth/login', {
        email: userData.email,
        password: userData.password
      });
      
      if (loginResult.success && loginResult.data.token) {
        tokens.push(loginResult.data.token);
      }
    }

    console.log(`Got ${tokens.length} authentication tokens`);

    // Reset results for authenticated test
    this.resetResults();
    this.results.startTime = Date.now();

    const promises = [];
    for (let i = 0; i < tokens.length; i++) {
      const userPromise = this.runAuthenticatedTest(tokens[i], requestsPerUser);
      promises.push(userPromise);
    }

    await Promise.all(promises);
    this.results.endTime = Date.now();
    
    const duration = (this.results.endTime - this.results.startTime) / 1000;
    this.results.requestsPerSecond = this.results.totalRequests / duration;

    return this.results;
  }

  // Run authenticated endpoint test
  async runAuthenticatedTest(token, requestCount) {
    const headers = { Authorization: `Bearer ${token}` };
    
    for (let i = 0; i < requestCount; i++) {
      // Test different endpoints
      const endpoints = ['/auth/me', '/face/test'];
      const endpoint = endpoints[i % endpoints.length];
      
      const result = await this.makeRequest('GET', endpoint, null, headers);
      this.updateResults(result);
    }
  }

  // Test server under extreme load
  async testExtremeLoad(concurrentUsers = 50, requestsPerUser = 20) {
    console.log(`🔥 Extreme Load Test: ${concurrentUsers} concurrent users, ${requestsPerUser} requests each`);
    console.log(`Total requests: ${concurrentUsers * requestsPerUser}`);
    
    this.resetResults();
    this.results.startTime = Date.now();

    const promises = [];
    for (let i = 0; i < concurrentUsers; i++) {
      const userPromise = this.runMixedLoadTest(i, requestsPerUser);
      promises.push(userPromise);
    }

    await Promise.all(promises);
    this.results.endTime = Date.now();
    
    const duration = (this.results.endTime - this.results.startTime) / 1000;
    this.results.requestsPerSecond = this.results.totalRequests / duration;

    return this.results;
  }

  // Run mixed load test (registration, login, authenticated requests)
  async runMixedLoadTest(userIndex, requestCount) {
    const userData = this.generateUserData(userIndex + 30000);
    
    // Register
    let result = await this.makeRequest('POST', '/auth/register', userData);
    this.updateResults(result);
    
    if (!result.success) return;

    // Login
    result = await this.makeRequest('POST', '/auth/login', {
      email: userData.email,
      password: userData.password
    });
    this.updateResults(result);
    
    if (!result.success || !result.data.token) return;

    const token = result.data.token;
    const headers = { Authorization: `Bearer ${token}` };

    // Make authenticated requests
    for (let i = 0; i < requestCount - 2; i++) {
      result = await this.makeRequest('GET', '/auth/me', null, headers);
      this.updateResults(result);
    }
  }

  // Reset results
  resetResults() {
    this.results = {
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      averageResponseTime: 0,
      minResponseTime: Infinity,
      maxResponseTime: 0,
      requestsPerSecond: 0,
      errors: {},
      statusCodes: {},
      startTime: null,
      endTime: null
    };
  }

  // Print results
  printResults(testName) {
    console.log(`\n📊 ${testName} Results:`);
    console.log('='.repeat(50));
    console.log(`Total Requests: ${this.results.totalRequests}`);
    console.log(`Successful: ${this.results.successfulRequests} (${((this.results.successfulRequests / this.results.totalRequests) * 100).toFixed(2)}%)`);
    console.log(`Failed: ${this.results.failedRequests} (${((this.results.failedRequests / this.results.totalRequests) * 100).toFixed(2)}%)`);
    console.log(`Requests/Second: ${this.results.requestsPerSecond.toFixed(2)}`);
    console.log(`Average Response Time: ${this.results.averageResponseTime.toFixed(2)}ms`);
    console.log(`Min Response Time: ${this.results.minResponseTime}ms`);
    console.log(`Max Response Time: ${this.results.maxResponseTime}ms`);
    
    if (this.results.endTime && this.results.startTime) {
      const duration = (this.results.endTime - this.results.startTime) / 1000;
      console.log(`Total Duration: ${duration.toFixed(2)}s`);
    }

    console.log('\nStatus Codes:');
    Object.entries(this.results.statusCodes).forEach(([code, count]) => {
      console.log(`  ${code}: ${count}`);
    });

    if (Object.keys(this.results.errors).length > 0) {
      console.log('\nErrors:');
      Object.entries(this.results.errors).forEach(([error, count]) => {
        console.log(`  ${error}: ${count}`);
      });
    }
    console.log('='.repeat(50));
  }
}

// Main test runner
async function runLoadTests() {
  const tester = new LoadTester();
  
  console.log('🚀 Starting Load Tests...\n');
  
  try {
    // Test 1: Registration Load
    await tester.testRegistration(10, 5);
    tester.printResults('Registration Load Test');
    
    // Wait between tests
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Test 2: Login Load
    await tester.testLogin(10, 5);
    tester.printResults('Login Load Test');
    
    // Wait between tests
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Test 3: Authenticated Endpoints
    await tester.testAuthenticatedEndpoints(5, 10);
    tester.printResults('Authenticated Endpoints Test');
    
    // Wait between tests
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Test 4: Extreme Load
    await tester.testExtremeLoad(20, 10);
    tester.printResults('Extreme Load Test');
    
  } catch (error) {
    console.error('❌ Load test failed:', error);
  }
}

// Export for use as module
module.exports = { LoadTester, runLoadTests };

// Run tests if this file is executed directly
if (require.main === module) {
  runLoadTests();
}
