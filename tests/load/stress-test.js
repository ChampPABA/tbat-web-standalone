import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate } from 'k6/metrics';

// Custom metrics
export const errorRate = new Rate('errors');

// Stress test configuration - 300+ concurrent users
export const options = {
  stages: [
    { duration: '2m', target: 50 },   // Ramp up to 50 users
    { duration: '2m', target: 100 },  // Ramp up to 100 users
    { duration: '2m', target: 200 },  // Ramp up to 200 users
    { duration: '2m', target: 300 },  // Ramp up to 300 users (target)
    { duration: '5m', target: 300 },  // Stay at 300 users for 5 minutes
    { duration: '2m', target: 400 },  // Push to 400 users (stress test)
    { duration: '3m', target: 400 },  // Maintain stress level
    { duration: '2m', target: 300 },  // Scale back to target
    { duration: '2m', target: 200 },  // Ramp down
    { duration: '2m', target: 100 },  // Continue ramp down
    { duration: '2m', target: 0 },    // Complete ramp down
  ],
  thresholds: {
    http_req_duration: ['p(95)<5000'], // 95% of requests under 5s (more lenient for stress test)
    http_req_failed: ['rate<0.10'],    // Error rate under 10% for stress test
    errors: ['rate<0.10'],             // Custom error rate under 10%
  },
};

// Test data
const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000';

export function setup() {
  console.log('Starting stress test - 300+ concurrent users');
  console.log(`Base URL: ${BASE_URL}`);
  return { baseUrl: BASE_URL };
}

export default function(data) {
  const baseUrl = data.baseUrl;
  
  // Simulate different user behaviors during stress test
  const behavior = __VU % 5;
  
  switch (behavior) {
    case 0:
      // Heavy registration load
      registrationBurst(baseUrl);
      break;
    case 1:
      // Continuous page browsing
      browsingSessions(baseUrl);
      break;
    case 2:
      // API stress testing
      apiStressTest(baseUrl);
      break;
    case 3:
      // Mixed user activities
      mixedActivities(baseUrl);
      break;
    case 4:
      // Health check flooding
      healthCheckFlood(baseUrl);
      break;
  }
  
  sleep(Math.random() * 3); // Random sleep between 0-3 seconds
}

function registrationBurst(baseUrl) {
  // Simulate burst registration scenario
  const uniqueEmail = `stress-${__VU}-${__ITER}-${Date.now()}@example.com`;
  
  const registrationData = {
    email: uniqueEmail,
    password: 'StressTest123!',
    thaiName: `ทดสอบ ความเครียด ${__VU}`,
    phone: `08${Math.floor(Math.random() * 100000000).toString().padStart(8, '0')}`,
    school: 'โรงเรียนทดสอบความเครียด',
  };

  const response = http.post(`${baseUrl}/api/auth/register`, JSON.stringify(registrationData), {
    headers: {
      'Content-Type': 'application/json',
    },
  });

  const success = check(response, {
    'stress registration status acceptable': (r) => r.status < 500,
    'stress registration completes in <10s': (r) => r.timings.duration < 10000,
  });
  
  errorRate.add(success ? 0 : 1);
}

function browsingSessions(baseUrl) {
  // Simulate continuous browsing
  const pages = ['/', '/about', '/pricing', '/contact'];
  
  for (const page of pages) {
    const response = http.get(`${baseUrl}${page}`);
    
    const success = check(response, {
      [`stress ${page} loads`]: (r) => r.status < 500,
      [`stress ${page} responds in time`]: (r) => r.timings.duration < 8000,
    });
    
    errorRate.add(success ? 0 : 1);
    sleep(0.5);
  }
}

function apiStressTest(baseUrl) {
  // Rapid API calls to test backend under stress
  const apiEndpoints = [
    '/api/health',
    '/api/health/detailed',
  ];
  
  for (let i = 0; i < 5; i++) {
    const endpoint = apiEndpoints[i % apiEndpoints.length];
    const response = http.get(`${baseUrl}${endpoint}`);
    
    const success = check(response, {
      [`stress API ${endpoint} responds`]: (r) => r.status < 500,
      [`stress API ${endpoint} fast`]: (r) => r.timings.duration < 3000,
    });
    
    errorRate.add(success ? 0 : 1);
    sleep(0.2);
  }
}

function mixedActivities(baseUrl) {
  // Mixed user activities
  
  // Landing page
  let response = http.get(`${baseUrl}/`);
  let success = check(response, {
    'stress mixed: landing page loads': (r) => r.status < 500,
  });
  errorRate.add(success ? 0 : 1);
  
  sleep(1);
  
  // Health check
  response = http.get(`${baseUrl}/api/health`);
  success = check(response, {
    'stress mixed: health check works': (r) => r.status < 500,
  });
  errorRate.add(success ? 0 : 1);
  
  sleep(1);
  
  // Try login with test credentials
  response = http.post(`${baseUrl}/api/auth/signin`, JSON.stringify({
    email: 'stress-test@example.com',
    password: 'StressTest123!',
  }), {
    headers: {
      'Content-Type': 'application/json',
    },
  });
  
  success = check(response, {
    'stress mixed: login attempt': (r) => r.status < 500,
  });
  errorRate.add(success ? 0 : 1);
}

function healthCheckFlood(baseUrl) {
  // Flood health check endpoints
  for (let i = 0; i < 10; i++) {
    const response = http.get(`${baseUrl}/api/health`);
    
    const success = check(response, {
      'stress health flood: responds': (r) => r.status < 500,
      'stress health flood: fast': (r) => r.timings.duration < 1000,
    });
    
    errorRate.add(success ? 0 : 1);
    sleep(0.1);
  }
}

export function teardown(data) {
  console.log('Stress test completed');
  console.log('Check metrics for system behavior under 300+ concurrent users');
}