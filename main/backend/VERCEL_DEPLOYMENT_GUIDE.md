# Vercel Deployment Guide for Acadmix Backend

## Prerequisites

1. **Node.js Version**: Ensure Vercel is using Node.js 18+ (specified in package.json)
2. **Environment Variables**: Set all required environment variables in Vercel dashboard

## Required Environment Variables

Make sure these environment variables are set in your Vercel project settings:

### Database
- `MONGO_URI` - Your MongoDB connection string

### Authentication
- `JWT_SECRET` - Secret key for JWT tokens
- `SESSION_SECRET` - Secret for session management
- `GOOGLE_CLIENT_ID` - Google OAuth client ID
- `GOOGLE_CLIENT_SECRET` - Google OAuth client secret

### Admin Access
- `ADMIN_USER` - Admin username
- `ADMIN_PASS` - Admin password

### Cloud Storage (Optional)
- `CLOUDINARY_CLOUD_NAME`
- `CLOUDINARY_API_KEY`
- `CLOUDINARY_API_SECRET`

### Frontend URLs
- `FRONTEND_ORIGIN` - Your frontend URL (e.g., https://acadmix.shop)

## Deployment Steps

1. **Connect Repository**: Link your GitHub repository to Vercel
2. **Set Root Directory**: Set the root directory to `backend/`
3. **Set Build Command**: Leave empty (no build step required)
4. **Set Output Directory**: Leave empty
5. **Set Install Command**: `npm install`
6. **Set Environment Variables**: Add all required variables listed above

## File Structure

Ensure your backend directory contains:
```
backend/
├── server.js (main entry point)
├── package.json
├── vercel.json
├── .vercelignore
├── config/
├── models/
├── routes/
├── middleware/
└── utils/
```

## Troubleshooting

### Common Issues

1. **Build Failures**:
   - Check if all dependencies are in package.json
   - Ensure Node.js version is compatible
   - Check for syntax errors in server.js

2. **Runtime Errors**:
   - Verify all environment variables are set
   - Check MongoDB connection string
   - Ensure all required files exist

3. **CORS Issues**:
   - Verify FRONTEND_ORIGIN is set correctly
   - Check CORS configuration in server.js

### Debugging

1. Check Vercel function logs in the dashboard
2. Use `console.log` statements in server.js for debugging
3. Test endpoints using Vercel's function testing feature

## Health Check

After deployment, test these endpoints:
- `GET /api/health` - Should return server status
- `GET /api/admin/login` - Should return admin login page

## Notes

- The server uses serverless-http for Vercel compatibility
- MongoDB connection is handled with retry logic
- CORS is configured for production domains
- Rate limiting is enabled for API endpoints
- Session store gracefully falls back to memory store if MongoDB is unavailable
- Static file serving is conditionally enabled based on directory existence
- Serverless function is always exported for Vercel compatibility

## Recent Fixes

1. **Serverless Export**: Fixed to always export serverless function regardless of environment
2. **Session Store**: Added graceful fallback for MongoDB session store
3. **Static Files**: Added conditional static file serving
4. **Error Handling**: Enhanced error handling for serverless deployment
5. **Database Connection**: Added timeout and lazy loading for MongoDB connection
6. **Request Logging**: Added request logging for debugging
7. **CORS**: Simplified CORS configuration for better compatibility
8. **Lazy Loading**: Implemented lazy loading of modules to prevent timeout during startup
9. **Timeout Configuration**: Increased function timeout to 60 seconds
10. **Lightweight Endpoints**: Added endpoints that don't require database connection
