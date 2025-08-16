# Backblaze B2 Setup Guide (Simple & Free!)

## 🚀 Why Backblaze B2?

- **Free tier**: 10GB storage FOREVER
- **File size limit**: 5TB per file
- **Cost after free tier**: $0.005/GB/month (super cheap!)
- **Setup time**: 10 minutes
- **No credit card required**

## 📋 Quick Setup (5 Steps)

### 1. Create Backblaze Account
1. Go to [Backblaze B2](https://www.backblaze.com/b2/cloud-storage.html)
2. Click "Sign Up" (top right)
3. Enter email and password
4. **No credit card required!**

### 2. Create Bucket
1. Login to [B2 Console](https://secure.backblaze.com/b2/)
2. Click "Create Bucket"
3. Name: `acadmix-storage`
4. **Important**: Select "Private" (to avoid payment requirement)
5. Click "Create Bucket"

### 3. Get Account Info
1. Go to "Account" → "App Keys"
2. Click "Add a New Application Key"
3. Name: `acadmix-app`
4. **Important**: Check "Allow access to all buckets"
5. Click "Create New Key"
6. **Save**: Account ID, Application Key, and Bucket ID

### 4. Add Environment Variables
Add to your `.env` file:

```env
# Backblaze B2 Configuration
B2_ACCOUNT_ID=your_account_id_here
B2_APPLICATION_KEY=your_application_key_here
B2_BUCKET_ID=your_bucket_id_here
B2_BUCKET_NAME=acadmix-storage
```

### 5. Install Dependencies
```bash
npm install axios form-data
```

## 🧪 Test the Setup

```bash
node -e "
const { testB2Connection } = require('./utils/backblazeStorage');
testB2Connection().then(result => {
  console.log('B2 Test Result:', result);
  process.exit(result ? 0 : 1);
});
"
```

## 💰 Cost Breakdown

### Free Tier (Forever!)
- **Storage**: 10GB free
- **Requests**: Unlimited
- **Cost**: $0

### After Free Tier
- **Storage**: $0.005/GB/month
- **Requests**: Free
- **Example**: 100GB = $0.50/month (vs $2.30 on AWS!)

## 🔄 How It Works

The system will:
1. Try Cloudinary first (for files < 10MB)
2. Use B2 for large files (> 10MB) with signed URLs
3. Automatic fallback if Cloudinary fails
4. Signed URLs expire after 1 year (automatically renewed)

## 🛡️ Security

- **API keys are secure**
- **Files are encrypted**
- **Private bucket** - files are not publicly accessible
- **Signed URLs** - temporary access with expiration
- **Maximum security** - no unauthorized access

## 🚨 Important Notes

- **10GB free forever** (no expiration!)
- **No credit card required**
- **Private bucket** - completely free
- **Signed URLs** - secure access to files
- **Very reliable service**

## 📞 Support

- **Backblaze Support**: Available in console
- **Documentation**: https://www.backblaze.com/b2/docs/
- **Community**: Reddit, Stack Overflow

## 🎯 That's It!

Backblaze B2 is the simplest solution for large PDF storage. No complex AWS setup, no credit card required, and 10GB free forever! 🚀
