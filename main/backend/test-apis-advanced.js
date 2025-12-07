const axios = require('axios');

const BASE_URL = 'http://localhost:5000/api';

// Test configuration
const testConfig = {
  timeout: 10000,
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

async function testAPI(endpoint, method = 'GET', data = null, headers = {}, description = '') {
  try {
    const config = {
      ...testConfig,
      method,
      url: `${BASE_URL}${endpoint}`,
      headers: { ...testConfig.headers, ...headers },
      ...(data && { data })
    };

    log(`🔍 Testing: ${method} ${endpoint}`, 'blue');
    if (description) log(`📝 Description: ${description}`, 'yellow');

    const response = await axios(config);
    
    log(`✅ SUCCESS: ${method} ${endpoint} - Status: ${response.status}`, 'green');
    if (response.data && Object.keys(response.data).length > 0) {
      const responseStr = JSON.stringify(response.data, null, 2);
      log(`📊 Response: ${responseStr.substring(0, 300)}${responseStr.length > 300 ? '...' : ''}`, 'green');
    }
    return { success: true, status: response.status, data: response.data };
  } catch (error) {
    const status = error.response?.status || 'NO_RESPONSE';
    const message = error.response?.data?.error || error.message;
    log(`❌ FAILED: ${method} ${endpoint} - Status: ${status} - ${message}`, 'red');
    return { success: false, status, error: message };
  }
}

async function runAdvancedTests() {
  log('🚀 Starting Advanced API Tests...', 'blue');
  log('=' * 60, 'blue');

  const results = {
    passed: 0,
    failed: 0,
    total: 0
  };

  let adminToken = null;
  let userToken = null;

  // Test 1: Admin Login with Environment Variables
  log('\n📋 Test 1: Admin Login', 'yellow');
  const adminLoginResult = await testAPI('/admin/login', 'POST', 
    { username: 'admin', password: 'admin123' }, 
    {}, 
    'Admin login with environment credentials'
  );
  results.total++;
  if (adminLoginResult.success) {
    adminToken = adminLoginResult.data.token;
    log('✅ Admin token obtained successfully', 'green');
    results.passed++;
  } else {
    log('⚠️ Admin login failed - check environment variables', 'yellow');
    results.failed++;
  }

  // Test 2: Admin Dashboard with Token
  log('\n📋 Test 2: Admin Dashboard (Authenticated)', 'yellow');
  if (adminToken) {
    const adminDashboardResult = await testAPI('/admin/dashboard', 'GET', 
      null, 
      { 'Authorization': `Bearer ${adminToken}` }, 
      'Admin dashboard with authentication'
    );
    results.total++;
    if (adminDashboardResult.success) {
      log('✅ Admin dashboard accessible', 'green');
      results.passed++;
    } else {
      results.failed++;
    }
  } else {
    log('⚠️ Skipping admin dashboard test - no admin token', 'yellow');
    results.total++;
    results.failed++;
  }

  // Test 3: Admin Config with Token
  log('\n📋 Test 3: Admin Config (Authenticated)', 'yellow');
  if (adminToken) {
    const adminConfigResult = await testAPI('/admin/config', 'GET', 
      null, 
      { 'Authorization': `Bearer ${adminToken}` }, 
      'Admin config with authentication'
    );
    results.total++;
    if (adminConfigResult.success) {
      log('✅ Admin config accessible', 'green');
      results.passed++;
    } else {
      results.failed++;
    }
  } else {
    log('⚠️ Skipping admin config test - no admin token', 'yellow');
    results.total++;
    results.failed++;
  }

  // Test 4: Admin Books with Token
  log('\n📋 Test 4: Admin Books (Authenticated)', 'yellow');
  if (adminToken) {
    const adminBooksResult = await testAPI('/admin/books', 'GET', 
      null, 
      { 'Authorization': `Bearer ${adminToken}` }, 
      'Admin books management with authentication'
    );
    results.total++;
    if (adminBooksResult.success) {
      log('✅ Admin books accessible', 'green');
      results.passed++;
    } else {
      results.failed++;
    }
  } else {
    log('⚠️ Skipping admin books test - no admin token', 'yellow');
    results.total++;
    results.failed++;
  }

  // Test 5: User Registration
  log('\n📋 Test 5: User Registration', 'yellow');
  const testEmail = `test${Date.now()}@example.com`;
  const registerResult = await testAPI('/auth/register', 'POST', 
    { 
      name: 'Test User', 
      email: testEmail, 
      password: 'testpassword123' 
    }, 
    {}, 
    'User registration with valid data'
  );
  results.total++;
  if (registerResult.success) {
    userToken = registerResult.data.token;
    log('✅ User registration successful', 'green');
    results.passed++;
  } else {
    log('⚠️ User registration failed - might be duplicate email', 'yellow');
    results.failed++;
  }

  // Test 6: User Login
  log('\n📋 Test 6: User Login', 'yellow');
  const loginResult = await testAPI('/auth/login', 'POST', 
    { 
      email: testEmail, 
      password: 'testpassword123' 
    }, 
    {}, 
    'User login with valid credentials'
  );
  results.total++;
  if (loginResult.success) {
    userToken = loginResult.data.token;
    log('✅ User login successful', 'green');
    results.passed++;
  } else {
    results.failed++;
  }

  // Test 7: User Profile with Token
  log('\n📋 Test 7: User Profile (Authenticated)', 'yellow');
  if (userToken) {
    const userProfileResult = await testAPI('/auth/me', 'GET', 
      null, 
      { 'Authorization': `Bearer ${userToken}` }, 
      'User profile with authentication'
    );
    results.total++;
    if (userProfileResult.success) {
      log('✅ User profile accessible', 'green');
      results.passed++;
    } else {
      results.failed++;
    }
  } else {
    log('⚠️ Skipping user profile test - no user token', 'yellow');
    results.total++;
    results.failed++;
  }

  // Test 8: User Purchased Books
  log('\n📋 Test 8: User Purchased Books (Authenticated)', 'yellow');
  if (userToken) {
    const purchasedBooksResult = await testAPI('/user/purchased-books', 'GET', 
      null, 
      { 'Authorization': `Bearer ${userToken}` }, 
      'User purchased books with authentication'
    );
    results.total++;
    if (purchasedBooksResult.success) {
      log('✅ User purchased books accessible', 'green');
      results.passed++;
    } else {
      results.failed++;
    }
  } else {
    log('⚠️ Skipping purchased books test - no user token', 'yellow');
    results.total++;
    results.failed++;
  }

  // Test 9: Books with Authentication Context
  log('\n📋 Test 9: Books with Auth Context', 'yellow');
  if (userToken) {
    const booksWithAuthResult = await testAPI('/books', 'GET', 
      null, 
      { 'Authorization': `Bearer ${userToken}` }, 
      'Books with user authentication context'
    );
    results.total++;
    if (booksWithAuthResult.success) {
      log('✅ Books with auth context accessible', 'green');
      results.passed++;
    } else {
      results.failed++;
    }
  } else {
    log('⚠️ Skipping books with auth test - no user token', 'yellow');
    results.total++;
    results.failed++;
  }

  // Test 10: Payment Configuration (Admin)
  log('\n📋 Test 10: Payment Configuration (Admin)', 'yellow');
  if (adminToken) {
    const paymentConfigResult = await testAPI('/admin/payment-config', 'GET', 
      null, 
      { 'Authorization': `Bearer ${adminToken}` }, 
      'Payment configuration with admin authentication'
    );
    results.total++;
    if (paymentConfigResult.success) {
      log('✅ Payment configuration accessible', 'green');
      results.passed++;
    } else {
      results.failed++;
    }
  } else {
    log('⚠️ Skipping payment config test - no admin token', 'yellow');
    results.total++;
    results.failed++;
  }

  // Test 11: Pending Payments (Admin)
  log('\n📋 Test 11: Pending Payments (Admin)', 'yellow');
  if (adminToken) {
    const pendingPaymentsResult = await testAPI('/admin/payments/pending', 'GET', 
      null, 
      { 'Authorization': `Bearer ${adminToken}` }, 
      'Pending payments with admin authentication'
    );
    results.total++;
    if (pendingPaymentsResult.success) {
      log('✅ Pending payments accessible', 'green');
      results.passed++;
    } else {
      results.failed++;
    }
  } else {
    log('⚠️ Skipping pending payments test - no admin token', 'yellow');
    results.total++;
    results.failed++;
  }

  // Test 12: Payment History (User)
  log('\n📋 Test 12: Payment History (User)', 'yellow');
  if (userToken) {
    const paymentHistoryResult = await testAPI('/payments/history', 'GET', 
      null, 
      { 'Authorization': `Bearer ${userToken}` }, 
      'Payment history with user authentication'
    );
    results.total++;
    if (paymentHistoryResult.success) {
      log('✅ Payment history accessible', 'green');
      results.passed++;
    } else {
      results.failed++;
    }
  } else {
    log('⚠️ Skipping payment history test - no user token', 'yellow');
    results.total++;
    results.failed++;
  }

  // Test 13: Book Share Count
  log('\n📋 Test 13: Book Share Count', 'yellow');
  const booksResult = await testAPI('/books', 'GET', null, {}, 'Get books for share test');
  if (booksResult.success && booksResult.data.length > 0) {
    const firstBookId = booksResult.data[0]._id;
    const shareResult = await testAPI(`/books/${firstBookId}/share`, 'POST', 
      null, 
      {}, 
      'Increment book share count'
    );
    results.total++;
    if (shareResult.success) {
      log('✅ Book share count updated', 'green');
      results.passed++;
    } else {
      results.failed++;
    }
  } else {
    log('⚠️ Skipping share test - no books available', 'yellow');
    results.total++;
    results.failed++;
  }

  // Test 14: Specific Book Details
  log('\n📋 Test 14: Specific Book Details', 'yellow');
  const booksForDetailsResult = await testAPI('/books', 'GET', null, {}, 'Get books for details test');
  if (booksForDetailsResult.success && booksForDetailsResult.data.length > 0) {
    const firstBookId = booksForDetailsResult.data[0]._id;
    const bookDetailsResult = await testAPI(`/books/${firstBookId}`, 'GET', 
      null, 
      {}, 
      'Get specific book details'
    );
    results.total++;
    if (bookDetailsResult.success) {
      log('✅ Book details accessible', 'green');
      results.passed++;
    } else {
      results.failed++;
    }
  } else {
    log('⚠️ Skipping book details test - no books available', 'yellow');
    results.total++;
    results.failed++;
  }

  // Summary
  log('\n' + '=' * 60, 'blue');
  log('📊 ADVANCED TEST SUMMARY', 'blue');
  log(`✅ Passed: ${results.passed}`, 'green');
  log(`❌ Failed: ${results.failed}`, 'red');
  log(`📈 Total: ${results.total}`, 'blue');
  log(`📊 Success Rate: ${((results.passed / results.total) * 100).toFixed(2)}%`, 'blue');

  if (results.failed > 0) {
    log('\n🔧 ISSUES FOUND:', 'yellow');
    if (!adminToken) {
      log('• Admin authentication failed - check ADMIN_USER and ADMIN_PASS environment variables', 'red');
    }
    if (!userToken) {
      log('• User authentication failed - check user registration/login flow', 'red');
    }
    log('\n🔧 RECOMMENDATIONS:', 'yellow');
    log('1. Set up proper environment variables for admin authentication', 'yellow');
    log('2. Check MongoDB connection and user data', 'yellow');
    log('3. Verify JWT secret configuration', 'yellow');
    log('4. Test payment flow with real data', 'yellow');
  } else {
    log('\n🎉 All advanced tests passed! APIs are working correctly.', 'green');
  }

  // Return tokens for further testing if needed
  return { adminToken, userToken, results };
}

// Run the advanced tests
runAdvancedTests().catch(error => {
  log(`❌ Advanced test runner error: ${error.message}`, 'red');
  process.exit(1);
});
