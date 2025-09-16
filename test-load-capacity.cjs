#!/usr/bin/env node

/**
 * TBAT Mock Exam Platform - Database Load Testing
 * Tests 20 concurrent users with real database integration
 */

const http = require('http');
const { performance } = require('perf_hooks');

const CONCURRENT_USERS = 20;
const API_ENDPOINT = 'http://localhost:3000/api/capacity?format=detailed';
const TEST_DURATION_MS = 30000; // 30 seconds

class LoadTester {
  constructor() {
    this.results = [];
    this.errors = [];
    this.startTime = null;
    this.totalRequests = 0;
    this.completedRequests = 0;
  }

  async makeRequest(userId) {
    return new Promise((resolve) => {
      const start = performance.now();
      
      const req = http.get(API_ENDPOINT, (res) => {
        let data = '';
        
        res.on('data', (chunk) => {
          data += chunk;
        });
        
        res.on('end', () => {
          const end = performance.now();
          const responseTime = end - start;
          
          this.completedRequests++;
          
          try {
            const parsedData = JSON.parse(data);
            this.results.push({
              userId,
              responseTime,
              statusCode: res.statusCode,
              success: res.statusCode === 200 && parsedData.success,
              dataSize: data.length,
              timestamp: new Date().toISOString()
            });
          } catch (error) {
            this.errors.push({
              userId,
              error: 'JSON Parse Error',
              responseTime,
              statusCode: res.statusCode,
              timestamp: new Date().toISOString()
            });
          }
          
          resolve();
        });
      });
      
      req.on('error', (error) => {
        const end = performance.now();
        const responseTime = end - start;
        
        this.completedRequests++;
        this.errors.push({
          userId,
          error: error.message,
          responseTime,
          timestamp: new Date().toISOString()
        });
        
        resolve();
      });
      
      req.setTimeout(5000, () => {
        req.destroy();
        const end = performance.now();
        const responseTime = end - start;
        
        this.completedRequests++;
        this.errors.push({
          userId,
          error: 'Timeout',
          responseTime,
          timestamp: new Date().toISOString()
        });
        
        resolve();
      });
    });
  }

  async runConcurrentUser(userId) {
    console.log(`🚀 Starting User ${userId}`);
    
    while (performance.now() - this.startTime < TEST_DURATION_MS) {
      await this.makeRequest(userId);
      this.totalRequests++;
      
      // Brief pause between requests (realistic user behavior)
      await new Promise(resolve => setTimeout(resolve, Math.random() * 1000 + 500));
    }
    
    console.log(`✅ User ${userId} completed`);
  }

  generateReport() {
    const successfulRequests = this.results.filter(r => r.success);
    const totalRequests = this.results.length + this.errors.length;
    
    const responseTimes = this.results.map(r => r.responseTime);
    const avgResponseTime = responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length || 0;
    const minResponseTime = Math.min(...responseTimes) || 0;
    const maxResponseTime = Math.max(...responseTimes) || 0;
    
    // Calculate percentiles
    const sortedTimes = responseTimes.sort((a, b) => a - b);
    const p50 = sortedTimes[Math.floor(sortedTimes.length * 0.5)] || 0;
    const p95 = sortedTimes[Math.floor(sortedTimes.length * 0.95)] || 0;
    const p99 = sortedTimes[Math.floor(sortedTimes.length * 0.99)] || 0;

    console.log('\n' + '='.repeat(60));
    console.log('📊 TBAT DATABASE LOAD TEST RESULTS');
    console.log('='.repeat(60));
    console.log(`⏱️  Test Duration: ${TEST_DURATION_MS / 1000}s`);
    console.log(`👥 Concurrent Users: ${CONCURRENT_USERS}`);
    console.log(`📈 Total Requests: ${totalRequests}`);
    console.log(`✅ Successful Requests: ${successfulRequests.length} (${((successfulRequests.length/totalRequests)*100).toFixed(2)}%)`);
    console.log(`❌ Failed Requests: ${this.errors.length} (${((this.errors.length/totalRequests)*100).toFixed(2)}%)`);
    console.log(`🔄 Requests/second: ${(totalRequests / (TEST_DURATION_MS/1000)).toFixed(2)}`);
    
    console.log('\n📈 RESPONSE TIME ANALYSIS:');
    console.log(`   Average: ${avgResponseTime.toFixed(2)}ms`);
    console.log(`   Minimum: ${minResponseTime.toFixed(2)}ms`);
    console.log(`   Maximum: ${maxResponseTime.toFixed(2)}ms`);
    console.log(`   50th percentile: ${p50.toFixed(2)}ms`);
    console.log(`   95th percentile: ${p95.toFixed(2)}ms`);
    console.log(`   99th percentile: ${p99.toFixed(2)}ms`);
    
    // Performance Assessment
    console.log('\n🎯 PERFORMANCE ASSESSMENT:');
    const under200ms = responseTimes.filter(t => t < 200).length;
    const under500ms = responseTimes.filter(t => t < 500).length;
    
    console.log(`   Under 200ms (Target): ${under200ms}/${responseTimes.length} (${((under200ms/responseTimes.length)*100).toFixed(1)}%)`);
    console.log(`   Under 500ms (Acceptable): ${under500ms}/${responseTimes.length} (${((under500ms/responseTimes.length)*100).toFixed(1)}%)`);
    
    if (p95 <= 200) {
      console.log('   ✅ EXCELLENT: 95% of requests under 200ms (Production Ready)');
    } else if (p95 <= 500) {
      console.log('   ⚠️  ACCEPTABLE: 95% of requests under 500ms');
    } else {
      console.log('   ❌ NEEDS OPTIMIZATION: 95% of requests over 500ms');
    }
    
    // Error Analysis
    if (this.errors.length > 0) {
      console.log('\n🚨 ERROR ANALYSIS:');
      const errorTypes = {};
      this.errors.forEach(error => {
        errorTypes[error.error] = (errorTypes[error.error] || 0) + 1;
      });
      
      Object.entries(errorTypes).forEach(([errorType, count]) => {
        console.log(`   ${errorType}: ${count} occurrences`);
      });
    }
    
    // Database Performance Validation
    console.log('\n🗄️  DATABASE PERFORMANCE VALIDATION:');
    const databaseRequests = successfulRequests.length;
    const requestRate = databaseRequests / (TEST_DURATION_MS / 1000);
    
    console.log(`   Database Requests: ${databaseRequests}`);
    console.log(`   Database Req/sec: ${requestRate.toFixed(2)}`);
    
    if (requestRate > 10) {
      console.log('   ✅ Database throughput excellent for 20 concurrent users');
    } else if (requestRate > 5) {
      console.log('   ⚠️  Database throughput acceptable');
    } else {
      console.log('   ❌ Database throughput needs optimization');
    }
    
    console.log('\n' + '='.repeat(60));
    
    return {
      totalRequests,
      successfulRequests: successfulRequests.length,
      errorRate: (this.errors.length / totalRequests) * 100,
      averageResponseTime: avgResponseTime,
      p95ResponseTime: p95,
      requestsPerSecond: totalRequests / (TEST_DURATION_MS / 1000),
      productionReady: p95 <= 200 && (this.errors.length / totalRequests) < 0.05
    };
  }

  async run() {
    console.log('🧪 TBAT Mock Exam Platform - Database Load Test');
    console.log(`📊 Testing ${CONCURRENT_USERS} concurrent users for ${TEST_DURATION_MS/1000}s`);
    console.log(`🎯 Target: <200ms response time, <5% error rate\n`);
    
    this.startTime = performance.now();
    
    // Create concurrent user promises
    const userPromises = [];
    for (let i = 1; i <= CONCURRENT_USERS; i++) {
      userPromises.push(this.runConcurrentUser(i));
    }
    
    // Wait for all users to complete
    await Promise.all(userPromises);
    
    // Generate and return report
    return this.generateReport();
  }
}

// Run the load test
async function main() {
  const tester = new LoadTester();
  
  try {
    const results = await tester.run();
    
    if (results.productionReady) {
      console.log('🎉 PRODUCTION READY: Database performance meets requirements!');
      process.exit(0);
    } else {
      console.log('⚠️  OPTIMIZATION NEEDED: Review database performance');
      process.exit(1);
    }
    
  } catch (error) {
    console.error('❌ Load test failed:', error);
    process.exit(1);
  }
}

// Execute if called directly
if (require.main === module) {
  main();
}

module.exports = LoadTester;