# Environment Setup Guide

## Required Environment Variables

Create a `.env` file in the `main/backend/` directory with the following variables:

```env
# Cloudinary Configuration (REQUIRED for file uploads)
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# MongoDB Configuration
MONGODB_URI=your_mongodb_connection_string

# JWT Secret
JWT_SECRET=your_jwt_secret_key

# Server Configuration
PORT=5000
NODE_ENV=development

# Admin Configuration
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=admin_password

# File Upload Limits
MAX_IMAGE_SIZE=5242880
MAX_PDF_SIZE=10485760

# Payment Configuration
PAYMENT_CURRENCY=INR
TEST_PAYMENT_AMOUNT=100
```

## Getting Cloudinary Credentials

1. Go to [Cloudinary Console](https://cloudinary.com/console)
2. Sign up or log in to your account
3. Go to Dashboard
4. Copy your:
   - Cloud Name
   - API Key
   - API Secret

## Quick Setup for Testing

If you want to test without Cloudinary, the system will use placeholder URLs, but you won't be able to upload real files.

## Testing the Setup

After creating your `.env` file, run:

```bash
node check-cloudinary.js
```

This will verify your Cloudinary configuration is working correctly.
