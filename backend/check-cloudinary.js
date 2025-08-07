const cloudinary = require('cloudinary').v2;
require('dotenv').config();

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

async function checkCloudinaryResources() {
  try {
    console.log('🔍 Checking Cloudinary resources...');
    
    // List all resources
    const result = await new Promise((resolve, reject) => {
      cloudinary.api.resources({
        type: 'upload',
        resource_type: 'raw',
        max_results: 100
      }, (error, result) => {
        if (error) {
          console.error('❌ Error listing resources:', error);
          reject(error);
        } else {
          resolve(result);
        }
      });
    });
    
    console.log(`📚 Found ${result.resources.length} resources:`);
    
    result.resources.forEach((resource, index) => {
      console.log(`${index + 1}. ${resource.public_id} (${resource.resource_type})`);
      console.log(`   URL: ${resource.secure_url}`);
      console.log(`   Format: ${resource.format}`);
      console.log(`   Size: ${resource.bytes} bytes`);
      console.log(`   Created: ${resource.created_at}`);
      console.log('');
    });
    
    // Also check for any resources in the acadmix folder
    console.log('🔍 Checking acadmix folder specifically...');
    const acadmixResult = await new Promise((resolve, reject) => {
      cloudinary.api.resources({
        type: 'upload',
        resource_type: 'raw',
        prefix: 'acadmix/',
        max_results: 100
      }, (error, result) => {
        if (error) {
          console.error('❌ Error listing acadmix resources:', error);
          reject(error);
        } else {
          resolve(result);
        }
      });
    });
    
    console.log(`📚 Found ${acadmixResult.resources.length} resources in acadmix folder:`);
    
    acadmixResult.resources.forEach((resource, index) => {
      console.log(`${index + 1}. ${resource.public_id} (${resource.resource_type})`);
      console.log(`   URL: ${resource.secure_url}`);
      console.log(`   Format: ${resource.format}`);
      console.log(`   Size: ${resource.bytes} bytes`);
      console.log(`   Created: ${resource.created_at}`);
      console.log('');
    });
    
  } catch (error) {
    console.error('❌ Error in checkCloudinaryResources:', error);
  }
}

// Run the script
checkCloudinaryResources(); 