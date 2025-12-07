# Acadmix API Troubleshooting Guide

## Common Issues and Solutions

### 1. Admin Authentication Failing (403 Forbidden)
**Problem**: Admin login returns 401/403 errors
**Solution**: 
- Check that ADMIN_USER and ADMIN_PASS are set in .env file
- Default values: ADMIN_USER=admin, ADMIN_PASS=admin123
- Restart the server after changing environment variables

### 2. MongoDB Connection Issues
**Problem**: Database tests failing
**Solution**:
- Ensure MongoDB is running on localhost:27017
- Check MONGO_URI in .env file
- For production, use MongoDB Atlas or similar cloud service

### 3. CORS Errors
**Problem**: Frontend requests blocked
**Solution**:
- Check FRONTEND_ORIGIN in .env file
- Ensure CORS headers are properly set
- Add your frontend URL to allowedOrigins in server.js

### 4. JWT Token Issues
**Problem**: Authentication tokens not working
**Solution**:
- Check JWT_SECRET in .env file
- Ensure tokens are being sent in Authorization header
- Format: Authorization: Bearer <token>

### 5. Payment API Issues
**Problem**: Payment endpoints returning errors
**Solution**:
- Check UPI_ID, PAYEE_NAME, BANK_NAME in .env file
- Ensure QR code generation dependencies are installed
- Test with valid payment data

## Quick Fix Commands

```bash
# 1. Stop the server
Ctrl+C

# 2. Check environment variables
cat .env

# 3. Restart the server
npm run dev

# 4. Test the APIs
node test-apis.js

# 5. Check MongoDB
mongosh mongodb://localhost:27017/acadmix
```

## API Endpoint Reference

### Public Endpoints
- GET /api/health - Health check
- GET /api/ping - Simple ping
- GET /api/test - Database test
- GET /api/books - Get all books
- GET /api/books?section=class11 - Get books by section

### Authentication Endpoints
- POST /api/auth/register - User registration
- POST /api/auth/login - User login
- GET /api/auth/me - Get user profile (protected)
- POST /api/admin/login - Admin login

### Admin Endpoints (Protected)
- GET /api/admin/dashboard - Admin dashboard
- GET /api/admin/config - Admin configuration
- GET /api/admin/books - Manage books
- GET /api/admin/users - Manage users

### Payment Endpoints (Protected)
- GET /api/payment/:bookId - Get payment data
- POST /api/payment/submit - Submit payment
- GET /api/payments/history - Payment history

## Environment Variables Reference

| Variable | Description | Default |
|----------|-------------|---------|
| MONGO_URI | MongoDB connection string | mongodb://localhost:27017/acadmix |
| JWT_SECRET | JWT signing secret | your-super-secret-jwt-key |
| ADMIN_USER | Admin username | admin |
| ADMIN_PASS | Admin password | admin123 |
| PORT | Server port | 5000 |
| NODE_ENV | Environment | development |
| FRONTEND_ORIGIN | Frontend URL | http://localhost:5173 |

## Testing Checklist

- [ ] Server starts without errors
- [ ] Health check endpoint responds
- [ ] Database connection works
- [ ] Books API returns data
- [ ] Admin login works
- [ ] User registration works
- [ ] Protected endpoints require authentication
- [ ] CORS headers are set correctly
- [ ] Payment endpoints are accessible
- [ ] Error handling works properly

