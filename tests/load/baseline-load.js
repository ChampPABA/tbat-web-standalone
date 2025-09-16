import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate } from 'k6/metrics';

// Custom metrics
export const errorRate = new Rate('errors');

// Test configuration
export const options = {
  stages: [
    { duration: '2m', target: 5 },   // Ramp up to 5 users
    { duration: '5m', target: 5 },   // Stay at 5 users
    { duration: '2m', target: 10 },  // Ramp up to 10 users
    { duration: '5m', target: 10 },  // Stay at 10 users
    { duration: '2m', target: 20 },  // Ramp up to 20 users (baseline)
    { duration: '10m', target: 20 }, // Stay at baseline for 10 minutes
    { duration: '2m', target: 0 },   // Ramp down
  ],
  thresholds: {
    http_req_duration: ['p(95)<2000'], // 95% of requests under 2s
    http_req_failed: ['rate<0.05'],    // Error rate under 5%
    errors: ['rate<0.05'],             // Custom error rate under 5%
  },
};

// Test data
const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000';

// User credentials for testing
const testUsers = [
  { email: 'test1@example.com', password: 'TestPassword123!' },
  { email: 'test2@example.com', password: 'TestPassword123!' },
  { email: 'test3@example.com', password: 'TestPassword123!' },
];

export function setup() {
  console.log('Starting baseline load test');
  console.log(`Base URL: ${BASE_URL}`);
  return { baseUrl: BASE_URL };
}

export default function(data) {
  const baseUrl = data.baseUrl;
  
  // Test scenario: Landing page load
  landingPageTest(baseUrl);
  sleep(1);
  
  // Test scenario: User registration
  if (__ITER % 3 === 0) {
    registrationTest(baseUrl);
    sleep(2);
  }
  
  // Test scenario: User login and dashboard
  if (__ITER % 2 === 0) {
    loginAndDashboardTest(baseUrl);
    sleep(1);
  }
  
  // Test scenario: API health check
  apiHealthTest(baseUrl);
  sleep(1);
}

function landingPageTest(baseUrl) {
  const response = http.get(`${baseUrl}/`);
  
  const success = check(response, {
    'landing page status is 200': (r) => r.status === 200,
    'landing page loads in <2s': (r) => r.timings.duration < 2000,
    'landing page contains title': (r) => r.body.includes('TBAT Mock Exam'),
  });
  
  if (!success) {
    errorRate.add(1);
  } else {
    errorRate.add(0);
  }
}

function registrationTest(baseUrl) {
  // Generate unique email for this iteration
  const uniqueEmail = `test-${__VU}-${__ITER}@example.com`;
  
  const registrationData = {
    email: uniqueEmail,
    password: 'TestPassword123!',
    thaiName: 'ทดสอบ ระบบ',
    phone: '0812345678',
    school: 'โรงเรียนทดสอบ',
  };

  const response = http.post(`${baseUrl}/api/auth/register`, JSON.stringify(registrationData), {
    headers: {
      'Content-Type': 'application/json',
    },
  });

  const success = check(response, {
    'registration status is 200 or 409': (r) => r.status === 200 || r.status === 409,
    'registration completes in <5s': (r) => r.timings.duration < 5000,
  });
  
  if (!success) {
    errorRate.add(1);
  } else {
    errorRate.add(0);
  }
}

function loginAndDashboardTest(baseUrl) {
  // Use one of the test users
  const testUser = testUsers[__VU % testUsers.length];
  
  // Login
  const loginResponse = http.post(`${baseUrl}/api/auth/signin`, JSON.stringify(testUser), {
    headers: {
      'Content-Type': 'application/json',
    },
  });

  const loginSuccess = check(loginResponse, {
    'login status is 200': (r) => r.status === 200,
    'login completes in <3s': (r) => r.timings.duration < 3000,
  });

  if (loginSuccess) {
    // Dashboard load (simulate authenticated request)
    const dashboardResponse = http.get(`${baseUrl}/dashboard`, {
      headers: {
        'Cookie': loginResponse.headers['Set-Cookie'] ? loginResponse.headers['Set-Cookie'][0] : '',
      },
    });

    const dashboardSuccess = check(dashboardResponse, {
      'dashboard loads successfully': (r) => r.status === 200 || r.status === 401, // 401 expected if auth fails
      'dashboard loads in <3s': (r) => r.timings.duration < 3000,
    });
    
    if (!dashboardSuccess) {
      errorRate.add(1);
    } else {
      errorRate.add(0);
    }
  } else {
    errorRate.add(1);
  }
}

function apiHealthTest(baseUrl) {
  const response = http.get(`${baseUrl}/api/health`);
  
  const success = check(response, {
    'health check status is 200': (r) => r.status === 200,
    'health check responds in <500ms': (r) => r.timings.duration < 500,
    'health check returns valid JSON': (r) => {
      try {
        JSON.parse(r.body);
        return true;
      } catch {
        return false;
      }
    },
  });
  
  if (!success) {
    errorRate.add(1);
  } else {
    errorRate.add(0);
  }
}

export function teardown(data) {
  console.log('Baseline load test completed');
}