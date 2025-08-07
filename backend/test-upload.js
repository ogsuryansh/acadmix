const cloudinary = require('cloudinary').v2;
const fs = require('fs');
require('dotenv').config();

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

async function testUpload() {
  try {
    console.log('🧪 Testing PDF upload with different settings...');
    
    // Create a simple test PDF content (this is just a test)
    const testContent = '%PDF-1.4\n1 0 obj\n<<\n/Type /Catalog\n/Pages 2 0 R\n>>\nendobj\n2 0 obj\n<<\n/Type /Pages\n/Kids [3 0 R]\n/Count 1\n>>\nendobj\n3 0 obj\n<<\n/Type /Page\n/Parent 2 0 R\n/MediaBox [0 0 612 792]\n/Contents 4 0 R\n>>\nendobj\n4 0 obj\n<<\n/Length 44\n>>\nstream\nBT\n/F1 12 Tf\n72 720 Td\n(Test PDF) Tj\nET\nendstream\nendobj\nxref\n0 5\n0000000000 65535 f \n0000000009 00000 n \n0000000058 00000 n \n0000000115 00000 n \n0000000204 00000 n \ntrailer\n<<\n/Size 5\n/Root 1 0 R\n>>\nstartxref\n297\n%%EOF';
    
    // Write to a temporary file
    fs.writeFileSync('test.pdf', testContent);
    
    console.log('📄 Created test PDF file');
    
    // Test upload with different settings
    const uploadResult = await new Promise((resolve, reject) => {
      cloudinary.uploader.upload('test.pdf', {
        resource_type: 'raw',
        folder: 'acadmix/test',
        public_id: `test-${Date.now()}`,
        access_mode: 'public',
        type: 'upload',
        invalidate: true,
        overwrite: true,
        use_filename: false,
        unique_filename: true,
        allowed_formats: ['pdf'],
        eager: [],
        eager_async: false,
        eager_notification_url: null,
        eager_transformation: null,
        categorization: null,
        auto_tagging: null,
        background_removal: null,
        detection: null,
        similarity_search: null,
        ocr: null,
        raw_convert: null,
        disallowed_formats: null,
        moderation: null,
        notification_url: null,
        colors: null,
        faces: null,
        quality_analysis: null,
        cinemagraph_analysis: null,
        accessibility_analysis: null,
        backup: null,
        callback: null,
        eval: null,
        headers: null,
        height: null,
        html: null,
        http_headers: null,
        phash: null,
        proxy: null,
        quality: null,
        responsive_breakpoints: null,
        tags: null,
        transformation: null,
        upload_preset: null,
        width: null
      }, (error, result) => {
        if (error) {
          console.error('❌ Upload error:', error);
          reject(error);
        } else {
          console.log('✅ Upload result:', result);
          resolve(result);
        }
      });
    });
    
    console.log('\n🔗 Test PDF URL:', uploadResult.secure_url);
    
    // Test if the uploaded PDF is accessible
    console.log('\n🔍 Testing accessibility...');
    const response = await fetch(uploadResult.secure_url, { method: 'HEAD' });
    console.log(`Status: ${response.status} - ${response.statusText}`);
    
    if (response.ok) {
      console.log('✅ Test PDF is publicly accessible!');
    } else {
      console.log('❌ Test PDF is not publicly accessible');
      console.log('Headers:', Object.fromEntries(response.headers.entries()));
    }
    
    // Clean up
    fs.unlinkSync('test.pdf');
    console.log('\n🧹 Cleaned up test file');
    
  } catch (error) {
    console.error('❌ Error in test upload:', error);
  }
}

testUpload(); 