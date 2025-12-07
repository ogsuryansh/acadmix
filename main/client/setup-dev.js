#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🚀 Setting up Acadmix Frontend for Development...\n');

// Create .env file if it doesn't exist
const envPath = path.join(__dirname, '.env');
const envExample = `# Frontend Environment Configuration

# API Configuration
VITE_API_BASE_URL=http://localhost:5000/api

# For production, uncomment and set to your production API URL
# VITE_API_BASE_URL=https://api.acadmix.shop/api

# Google OAuth Configuration
VITE_GOOGLE_CLIENT_ID=your-google-client-id

# App Configuration
VITE_APP_NAME=Acadmix
VITE_APP_VERSION=1.0.0

# Feature Flags
VITE_ENABLE_DEBUG=true
VITE_ENABLE_ANALYTICS=false
`;

if (!fs.existsSync(envPath)) {
  fs.writeFileSync(envPath, envExample);
  console.log('✅ Created .env file with development configuration');
} else {
  console.log('ℹ️  .env file already exists');
}

console.log('\n📋 Next steps:');
console.log('1. Install dependencies: npm install');
console.log('2. Update VITE_GOOGLE_CLIENT_ID in .env (if using OAuth)');
console.log('3. Start the development server: npm run dev');
console.log('\n🔗 The frontend will be available at: http://localhost:5173');
console.log('📡 API will connect to: http://localhost:5000/api');
