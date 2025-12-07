#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🚀 Setting up Acadmix Backend for Development...\n');

// Create .env file if it doesn't exist
const envPath = path.join(__dirname, '.env');
const envExample = `# Backend Environment Configuration

# Server Configuration
NODE_ENV=development
PORT=5000

# MongoDB Configuration
MONGODB_URI=mongodb://localhost:27017/acadmix
# For production, use your actual MongoDB connection string
# MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/acadmix

# JWT Configuration
JWT_SECRET=dev-jwt-secret-key-change-in-production
JWT_EXPIRES_IN=7d

# Google OAuth Configuration
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_CALLBACK_URL=http://localhost:5000/api/auth/google/callback

# Session Configuration
SESSION_SECRET=dev-session-secret-change-in-production

# CORS Configuration
ALLOWED_ORIGINS=https://acadmix.shop,https://www.acadmix.shop,http://localhost:3000,http://localhost:5173

# Payment Configuration (if using any payment gateway)
PAYMENT_SECRET_KEY=your-payment-secret-key

# File Upload Configuration (if using cloud storage)
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret

# Backblaze B2 Configuration (if using B2 storage)
B2_APPLICATION_KEY_ID=your-b2-key-id
B2_APPLICATION_KEY=your-b2-application-key
B2_BUCKET_NAME=your-bucket-name
B2_BUCKET_ID=your-bucket-id
`;

if (!fs.existsSync(envPath)) {
  fs.writeFileSync(envPath, envExample);
  console.log('✅ Created .env file with development configuration');
} else {
  console.log('ℹ️  .env file already exists');
}

console.log('\n📋 Next steps:');
console.log('1. Install dependencies: npm install');
console.log('2. Set up MongoDB locally or update MONGODB_URI in .env');
console.log('3. Update Google OAuth credentials in .env (if using OAuth)');
console.log('4. Start the development server: npm run dev');
console.log('\n🔗 The server will be available at: http://localhost:5000');
console.log('📡 API endpoints will be available at: http://localhost:5000/api');
