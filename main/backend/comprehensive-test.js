const axios = require('axios');

const BASE_URL = 'http://localhost:5000/api';

// Test all API endpoints systematically
async function testAllAPIs() {
  console.log('🧪 Comprehensive API Testing...\n');
  
  const tests = [
    // Public endpoints
    { name: 'Health Check', path: '/health', method: 'GET' },
    { name: 'Ping', path: '/ping', method: 'GET' },
    { name: 'Database Test', path: '/test', method: 'GET' },
    { name: 'Books (Public)', path: '/books', method: 'GET' },
    { name: 'Books by Section', path: '/books?section=class11', method: 'GET' },
    { name: 'CORS Test', path: '/test', method: 'GET' },
    
    // Auth endpoints (expected to fail without proper data)
    { name: 'User Registration (Invalid)', path: '/auth/register', method: 'POST', data: { name: 'Test' }, expectedStatus: 400 },
    { name: 'User Login (Invalid)', path: '/auth/login', method: 'POST', data: { email: 'test@test.com' }, expectedStatus: 401 },
    { name: 'Admin Login (Invalid)', path: '/admin/login', method: 'POST', data: { username: 'wrong', password: 'wrong' }, expectedStatus: 401 },
    
    // Protected endpoints (expected to fail without auth)
    { name: 'User Profile (Unauthorized)', path: '/auth/me', method: 'GET', expectedStatus: 401 },
    { name: 'Admin Dashboard (Unauthorized)', path: '/admin/dashboard', method: 'GET', expectedStatus: 401 },
    { name: 'Admin Config (Unauthorized)', path: '/admin/config', method: 'GET', expectedStatus: 401 },
    { name: 'Payment Data (Unauthorized)', path: '/payment/507f1f77bcf86cd799439011', method: 'GET', expectedStatus: 401 },
  ];

  let passed = 0;
  let failed = 0;

  for (const test of tests) {
    try {
      const config = {
        method: test.method,
        url: `${BASE_URL}${test.path}`,
        timeout: 5000,
        ...(test.data && { data: test.data })
      };
      
      const response = await axios(config);
      
      if (test.expectedStatus && response.status === test.expectedStatus) {
        console.log(`✅ ${test.name}: Expected ${test.expectedStatus}, got ${response.status}`);
        passed++;
      } else if (!test.expectedStatus && response.status < 400) {
        console.log(`✅ ${test.name}: ${response.status}`);
        passed++;
      } else {
        console.log(`❌ ${test.name}: Unexpected status ${response.status}`);
        failed++;
      }
    } catch (error) {
      const status = error.response?.status || 'NO_RESPONSE';
      
      if (test.expectedStatus && status === test.expectedStatus) {
        console.log(`✅ ${test.name}: Expected ${test.expectedStatus}, got ${status}`);
        passed++;
      } else if (!test.expectedStatus) {
        console.log(`❌ ${test.name}: ${status} - ${error.response?.data?.error || error.message}`);
        failed++;
      } else {
        console.log(`❌ ${test.name}: Expected ${test.expectedStatus}, got ${status}`);
        failed++;
      }
    }
  }
  
  console.log(`\n📊 Results: ${passed} passed, ${failed} failed`);
  console.log(`📈 Success Rate: ${((passed / (passed + failed)) * 100).toFixed(2)}%`);
}

testAllAPIs().catch(console.error);

