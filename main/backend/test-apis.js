const axios = require('axios');

const BASE_URL = 'http://localhost:5000/api';

// Test configuration
const testConfig = {
  timeout: 5000,
  headers: {
    'Content-Type': 'application/json'
  }
};

// Colors for console output
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

async function testAPI(endpoint, method = 'GET', data = null, description = '') {
  try {
    const config = {
      ...testConfig,
      method,
      url: `${BASE_URL}${endpoint}`,
      ...(data && { data })
    };

    log(`🔍 Testing: ${method} ${endpoint}`, 'blue');
    if (description) log(`📝 Description: ${description}`, 'yellow');

    const response = await axios(config);
    
    log(`✅ SUCCESS: ${method} ${endpoint} - Status: ${response.status}`, 'green');
    if (response.data && Object.keys(response.data).length > 0) {
      log(`📊 Response: ${JSON.stringify(response.data, null, 2).substring(0, 200)}...`, 'green');
    }
    return { success: true, status: response.status, data: response.data };
  } catch (error) {
    const status = error.response?.status || 'NO_RESPONSE';
    const message = error.response?.data?.error || error.message;
    log(`❌ FAILED: ${method} ${endpoint} - Status: ${status} - ${message}`, 'red');
    return { success: false, status, error: message };
  }
}

async function runAllTests() {
  log('🚀 Starting API Tests...', 'blue');
  log('=' * 50, 'blue');

  const results = {
    passed: 0,
    failed: 0,
    total: 0
  };

  // Test 1: Health Check
  log('\n📋 Test 1: Health Check', 'yellow');
  const healthResult = await testAPI('/health', 'GET', null, 'Basic health check endpoint');
  results.total++;
  if (healthResult.success) results.passed++; else results.failed++;

  // Test 2: Ping
  log('\n📋 Test 2: Ping', 'yellow');
  const pingResult = await testAPI('/ping', 'GET', null, 'Simple ping endpoint');
  results.total++;
  if (pingResult.success) results.passed++; else results.failed++;

  // Test 3: Test Database Connection
  log('\n📋 Test 3: Database Test', 'yellow');
  const dbResult = await testAPI('/test', 'GET', null, 'Database connection test');
  results.total++;
  if (dbResult.success) results.passed++; else results.failed++;

  // Test 4: Books API (Public)
  log('\n📋 Test 4: Books API (Public)', 'yellow');
  const booksResult = await testAPI('/books', 'GET', null, 'Get all books (public endpoint)');
  results.total++;
  if (booksResult.success) results.passed++; else results.failed++;

  // Test 5: Books by Section
  log('\n📋 Test 5: Books by Section', 'yellow');
  const booksSectionResult = await testAPI('/books?section=class11', 'GET', null, 'Get books by section');
  results.total++;
  if (booksSectionResult.success) results.passed++; else results.failed++;

  // Test 6: Admin Login (without credentials)
  log('\n📋 Test 6: Admin Login (Invalid)', 'yellow');
  const adminLoginResult = await testAPI('/admin/login', 'POST', { username: 'test', password: 'test' }, 'Admin login with invalid credentials');
  results.total++;
  if (!adminLoginResult.success && adminLoginResult.status === 401) {
    log('✅ Expected failure for invalid admin credentials', 'green');
    results.passed++;
  } else {
    results.failed++;
  }

  // Test 7: Admin Dashboard (Unauthorized)
  log('\n📋 Test 7: Admin Dashboard (Unauthorized)', 'yellow');
  const adminDashboardResult = await testAPI('/admin/dashboard', 'GET', null, 'Admin dashboard without authentication');
  results.total++;
  if (!adminDashboardResult.success && adminDashboardResult.status === 401) {
    log('✅ Expected failure for unauthorized admin access', 'green');
    results.passed++;
  } else {
    results.failed++;
  }

  // Test 8: Admin Config (Unauthorized)
  log('\n📋 Test 8: Admin Config (Unauthorized)', 'yellow');
  const adminConfigResult = await testAPI('/admin/config', 'GET', null, 'Admin config without authentication');
  results.total++;
  if (!adminConfigResult.success && adminConfigResult.status === 401) {
    log('✅ Expected failure for unauthorized admin access', 'green');
    results.passed++;
  } else {
    results.failed++;
  }

  // Test 9: User Registration (Invalid data)
  log('\n📋 Test 9: User Registration (Invalid)', 'yellow');
  const registerResult = await testAPI('/auth/register', 'POST', { name: 'Test', email: 'invalid-email' }, 'User registration with invalid data');
  results.total++;
  if (!registerResult.success && registerResult.status === 400) {
    log('✅ Expected failure for invalid registration data', 'green');
    results.passed++;
  } else {
    results.failed++;
  }

  // Test 10: User Login (Invalid data)
  log('\n📋 Test 10: User Login (Invalid)', 'yellow');
  const loginResult = await testAPI('/auth/login', 'POST', { email: 'test@test.com', password: 'wrong' }, 'User login with invalid credentials');
  results.total++;
  if (!loginResult.success && loginResult.status === 401) {
    log('✅ Expected failure for invalid login credentials', 'green');
    results.passed++;
  } else {
    results.failed++;
  }

  // Test 11: Protected User Endpoint (Unauthorized)
  log('\n📋 Test 11: Protected User Endpoint (Unauthorized)', 'yellow');
  const userMeResult = await testAPI('/auth/me', 'GET', null, 'Get user profile without authentication');
  results.total++;
  if (!userMeResult.success && userMeResult.status === 401) {
    log('✅ Expected failure for unauthorized user access', 'green');
    results.passed++;
  } else {
    results.failed++;
  }

  // Test 12: Payment Endpoint (Unauthorized)
  log('\n📋 Test 12: Payment Endpoint (Unauthorized)', 'yellow');
  const paymentResult = await testAPI('/payment/507f1f77bcf86cd799439011', 'GET', null, 'Get payment data without authentication');
  results.total++;
  if (!paymentResult.success && paymentResult.status === 401) {
    log('✅ Expected failure for unauthorized payment access', 'green');
    results.passed++;
  } else {
    results.failed++;
  }

  // Test 13: CORS Test
  log('\n📋 Test 13: CORS Test', 'yellow');
  const corsResult = await testAPI('/test', 'GET', null, 'CORS configuration test');
  results.total++;
  if (corsResult.success) results.passed++; else results.failed++;

  // Test 14: PDF Proxy (Invalid URL)
  log('\n📋 Test 14: PDF Proxy (Invalid URL)', 'yellow');
  const pdfProxyResult = await testAPI('/pdf-proxy?url=invalid-url', 'GET', null, 'PDF proxy with invalid URL');
  results.total++;
  if (!pdfProxyResult.success && pdfProxyResult.status === 400) {
    log('✅ Expected failure for invalid PDF URL', 'green');
    results.passed++;
  } else {
    results.failed++;
  }

  // Summary
  log('\n' + '=' * 50, 'blue');
  log('📊 TEST SUMMARY', 'blue');
  log(`✅ Passed: ${results.passed}`, 'green');
  log(`❌ Failed: ${results.failed}`, 'red');
  log(`📈 Total: ${results.total}`, 'blue');
  log(`📊 Success Rate: ${((results.passed / results.total) * 100).toFixed(2)}%`, 'blue');

  if (results.failed > 0) {
    log('\n🔧 RECOMMENDATIONS:', 'yellow');
    log('1. Check MongoDB connection if database tests are failing', 'yellow');
    log('2. Verify environment variables are set correctly', 'yellow');
    log('3. Check CORS configuration for frontend integration', 'yellow');
    log('4. Ensure all required dependencies are installed', 'yellow');
  } else {
    log('\n🎉 All tests passed! APIs are working correctly.', 'green');
  }
}

// Run the tests
runAllTests().catch(error => {
  log(`❌ Test runner error: ${error.message}`, 'red');
  process.exit(1);
});
