// Admin Panel Configuration
const adminConfig = {
  // Dashboard settings
  dashboard: {
    paymentsLimit: process.env.ADMIN_PAYMENTS_LIMIT || 50,
    growthPeriod: process.env.ADMIN_GROWTH_PERIOD || 'month', // 'week', 'month', 'quarter'
  },
  
  // File upload limits
  upload: {
    maxImageSize: process.env.MAX_IMAGE_SIZE || 5 * 1024 * 1024, // 5MB
    maxPdfSize: process.env.MAX_PDF_SIZE || 100 * 1024 * 1024, // 100MB (will be compressed to 10MB)
    allowedImageTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'],
    allowedPdfTypes: ['application/pdf'],
  },
  
  // Payment settings
  payment: {
    testAmount: process.env.TEST_PAYMENT_AMOUNT || 100,
    currency: process.env.PAYMENT_CURRENCY || 'INR',
  },
  
  // UI settings
  ui: {
    paginationLimit: process.env.ADMIN_PAGINATION_LIMIT || 20,
    refreshInterval: process.env.ADMIN_REFRESH_INTERVAL || 30000, // 30 seconds
  }
};

module.exports = adminConfig;
