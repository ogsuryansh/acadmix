const jwt = require('jsonwebtoken');

// Test JWT token generation and verification
const testJWT = () => {
  const secret = process.env.JWT_SECRET || "fallback-jwt-secret";
  
  // Test user data
  const userData = {
    id: "test-user-id",
    email: "test@example.com",
    name: "Test User",
    role: "user"
  };
  
  // Generate token
  const token = jwt.sign(userData, secret, { expiresIn: "7d" });
  console.log('✅ Generated JWT token:', token.substring(0, 50) + '...');
  
  // Verify token
  try {
    const decoded = jwt.verify(token, secret);
    console.log('✅ Token verified successfully:', decoded);
    return true;
  } catch (error) {
    console.error('❌ Token verification failed:', error);
    return false;
  }
};

// Test middleware function
const testMiddleware = () => {
  const authenticateToken = require('./middleware/authenticateToken');
  
  // Mock request object
  const mockReq = {
    headers: {
      authorization: 'Bearer ' + jwt.sign({ id: 'test', role: 'user' }, process.env.JWT_SECRET || "fallback-jwt-secret")
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
    console.log('✅ Middleware passed to next()');
  };
  
  authenticateToken(mockReq, mockRes, mockNext);
  
  return nextCalled;
};

console.log('🧪 Testing JWT authentication...');
testJWT();
console.log('\n🧪 Testing middleware...');
testMiddleware();
