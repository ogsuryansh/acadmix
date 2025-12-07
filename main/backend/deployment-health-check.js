const axios = require('axios');

// Configuration
const API_BASE_URL = process.env.API_BASE_URL || 'https://api.acadmix.shop/api';
const FRONTEND_URL = process.env.FRONTEND_URL || 'https://acadmix.shop';

console.log('🏥 Starting Deployment Health Check...\n');
console.log(`🔗 API Base URL: ${API_BASE_URL}`);
console.log(`🌐 Frontend URL: ${FRONTEND_URL}\n`);

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

async function testEndpoint(path, method = 'GET', data = null, description = '') {
  try {
    console.log(`🔍 Testing: ${method} ${path} - ${description}`);
    
    const response = await api.request({
      method,
      url: path,
      data,
    });
    
    console.log(`✅ Success: ${response.status} ${response.statusText}`);
    if (response.data) {
      console.log(`📄 Response:`, JSON.stringify(response.data, null, 2));
    }
    return { success: true, status: response.status, data: response.data };
  } catch (error) {
    console.log(`❌ Failed: ${error.response?.status || 'Network Error'} ${error.response?.statusText || error.message}`);
    if (error.response?.data) {
      console.log(`📄 Error Response:`, JSON.stringify(error.response.data, null, 2));
    }
    return { success: false, error: error.message, status: error.response?.status };
  }
}

async function runHealthCheck() {
  const results = {
    passed: 0,
    failed: 0,
    tests: []
  };

  // Test 1: Basic Health Check
  console.log('\n📋 Test 1: Basic Health Check');
  const healthResult = await testEndpoint('/health', 'GET', null, 'Basic health check endpoint');
  results.tests.push({ name: 'Health Check', ...healthResult });
  if (healthResult.success) results.passed++; else results.failed++;

  // Test 2: Ping Endpoint
  console.log('\n📋 Test 2: Ping Endpoint');
  const pingResult = await testEndpoint('/ping', 'GET', null, 'Ping endpoint');
  results.tests.push({ name: 'Ping', ...pingResult });
  if (pingResult.success) results.passed++; else results.failed++;

  // Test 3: Database Connection
  console.log('\n📋 Test 3: Database Connection');
  const dbResult = await testEndpoint('/test', 'GET', null, 'Database connection test');
  results.tests.push({ name: 'Database', ...dbResult });
  if (dbResult.success) results.passed++; else results.failed++;

  // Test 4: CORS Test
  console.log('\n📋 Test 4: CORS Test');
  const corsResult = await testEndpoint('/test', 'GET', null, 'CORS configuration test');
  results.tests.push({ name: 'CORS', ...corsResult });
  if (corsResult.success) results.passed++; else results.failed++;

  // Test 5: Books API
  console.log('\n📋 Test 5: Books API');
  const booksResult = await testEndpoint('/books', 'GET', null, 'Books API endpoint');
  results.tests.push({ name: 'Books API', ...booksResult });
  if (booksResult.success) results.passed++; else results.failed++;

  // Test 6: Admin Login Page
  console.log('\n📋 Test 6: Admin Login Page');
  const adminResult = await testEndpoint('/admin/login', 'GET', null, 'Admin login page');
  results.tests.push({ name: 'Admin Login', ...adminResult });
  if (adminResult.success) results.passed++; else results.failed++;

  // Test 7: Authentication Endpoint (should fail without token)
  console.log('\n📋 Test 7: Authentication Endpoint');
  const authResult = await testEndpoint('/auth/me', 'GET', null, 'Authentication endpoint (should fail without token)');
  results.tests.push({ name: 'Auth Endpoint', ...authResult });
  // This should fail with 401, which is expected
  if (authResult.status === 401) {
    results.passed++;
    console.log('✅ Expected 401 response for unauthenticated request');
  } else {
    results.failed++;
  }

  // Summary
  console.log('\n' + '='.repeat(50));
  console.log('📊 HEALTH CHECK SUMMARY');
  console.log('='.repeat(50));
  console.log(`✅ Passed: ${results.passed}`);
  console.log(`❌ Failed: ${results.failed}`);
  console.log(`📈 Success Rate: ${((results.passed / (results.passed + results.failed)) * 100).toFixed(1)}%`);
  
  console.log('\n📋 Detailed Results:');
  results.tests.forEach((test, index) => {
    const status = test.success ? '✅' : '❌';
    console.log(`${index + 1}. ${status} ${test.name}: ${test.success ? 'PASSED' : 'FAILED'} (${test.status || 'N/A'})`);
  });

  if (results.failed === 0) {
    console.log('\n🎉 All tests passed! Your deployment is healthy.');
  } else {
    console.log('\n⚠️  Some tests failed. Please check the issues above.');
  }

  return results;
}

// Run the health check
runHealthCheck().catch(console.error);


