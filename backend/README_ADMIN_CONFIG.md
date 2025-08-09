# Admin Panel Dynamic Configuration

This document describes the dynamic configuration system for the Acadmix admin panel.

## Overview

The admin panel now uses a centralized configuration system that makes all hardcoded numbers dynamic and configurable through environment variables.

## Configuration File

The main configuration file is located at `main/backend/config/admin.js` and contains the following settings:

### Dashboard Settings

```javascript
dashboard: {
  paymentsLimit: process.env.ADMIN_PAYMENTS_LIMIT || 50,        // Number of payments to show in dashboard
  growthPeriod: process.env.ADMIN_GROWTH_PERIOD || 'month',    // Growth calculation period
}
```

### File Upload Settings

```javascript
upload: {
  maxImageSize: process.env.MAX_IMAGE_SIZE || 5 * 1024 * 1024,     // 5MB default
  maxPdfSize: process.env.MAX_PDF_SIZE || 50 * 1024 * 1024,        // 50MB default
  allowedImageTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'],
  allowedPdfTypes: ['application/pdf'],
}
```

### Payment Settings

```javascript
payment: {
  testAmount: process.env.TEST_PAYMENT_AMOUNT || 100,    // Test payment amount
  currency: process.env.PAYMENT_CURRENCY || 'INR',       // Payment currency
}
```

### UI Settings

```javascript
ui: {
  paginationLimit: process.env.ADMIN_PAGINATION_LIMIT || 20,      // Items per page
  refreshInterval: process.env.ADMIN_REFRESH_INTERVAL || 30000,   // 30 seconds
}
```

## Environment Variables

Add these variables to your `.env` file to customize the admin panel:

```env
# Dashboard Configuration
ADMIN_PAYMENTS_LIMIT=50
ADMIN_GROWTH_PERIOD=month

# File Upload Limits
MAX_IMAGE_SIZE=5242880
MAX_PDF_SIZE=52428800

# Payment Configuration
TEST_PAYMENT_AMOUNT=100
PAYMENT_CURRENCY=INR

# UI Configuration
ADMIN_PAGINATION_LIMIT=20
ADMIN_REFRESH_INTERVAL=30000
```

## API Endpoints

### Get Admin Configuration

```
GET /api/admin/config
```

Returns the current admin configuration for the frontend to use.

**Response:**
```json
{
  "upload": {
    "maxImageSize": 5242880,
    "maxPdfSize": 52428800,
    "allowedImageTypes": ["image/jpeg", "image/png", "image/webp", "image/jpg"],
    "allowedPdfTypes": ["application/pdf"]
  },
  "payment": {
    "testAmount": 100,
    "currency": "INR"
  },
  "ui": {
    "paginationLimit": 20,
    "refreshInterval": 30000
  },
  "dashboard": {
    "paymentsLimit": 50,
    "growthPeriod": "month"
  }
}
```

## Frontend Integration

The frontend components now fetch and use this configuration:

### BookManagement Component

- Uses `adminConfig.upload.maxImageSize` for image upload limits
- Uses `adminConfig.upload.maxPdfSize` for PDF upload limits

### Admin Component

- Uses `adminConfig.payment.testAmount` for test payment amounts
- Uses `adminConfig.dashboard.paymentsLimit` for dashboard limits

## Benefits

1. **Dynamic Configuration**: All hardcoded numbers are now configurable
2. **Environment-Specific**: Different settings for development, staging, and production
3. **Centralized Management**: All admin settings in one place
4. **Easy Updates**: Change values without code modifications
5. **Scalable**: Easy to add new configuration options

## Migration Notes

- All hardcoded numbers have been replaced with dynamic values
- Default values are provided for backward compatibility
- Environment variables are optional and have sensible defaults
- Frontend components gracefully handle missing configuration

## Future Enhancements

- Add configuration validation
- Add configuration UI in admin panel
- Add configuration versioning
- Add configuration import/export functionality
