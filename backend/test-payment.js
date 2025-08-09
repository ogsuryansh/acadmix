const jwt = require('jsonwebtoken');
const authenticateToken = require('./middleware/authenticateToken');

// Test payment authentication
const testPaymentAuth = () => {
  const secret = process.env.JWT_SECRET || "fallback-jwt-secret";
  
  // Create a test user token
  const testUser = {
    id: "test-user-id",
    email: "test@example.com",
    name: "Test User",
    role: "user"
  };
  
  const token = jwt.sign(testUser, secret, { expiresIn: "7d" });
  console.log('✅ Generated test token:', token.substring(0, 50) + '...');
  
  // Mock request for payment submission
  const mockReq = {
    headers: {
      authorization: `Bearer ${token}`
    },
    path: '/payment/submit',
    method: 'POST',
    body: {
      utr: 'TEST123456',
      bookId: 'test-book-id',
      amount: 100
    }
  };
  
  const mockRes = {
    status: (code) => ({
      json: (data) => {
        console.log(`Response ${code}:`, data);
        return mockRes;
      }
    })
  };
  
  let nextCalled = false;
  const mockNext = () => {
    nextCalled = true;
    console.log('✅ Payment auth middleware passed to next()');
    console.log('🔍 Request user object:', mockReq.user);
  };
  
  authenticateToken(mockReq, mockRes, mockNext);
  
  return nextCalled;
};

console.log('🧪 Testing payment authentication...');
testPaymentAuth();
