const cloudinary = require('cloudinary').v2;
const { Readable } = require('stream');

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Test Cloudinary connection
cloudinary.api.ping()
  .then(result => console.log("✅ Cloudinary connection successful:", result))
  .catch(error => console.error("❌ Cloudinary connection failed:", error));

// Upload image to Cloudinary
const uploadImage = async (file) => {
  try {
    console.log("🔄 Starting image upload...");
    if (!file) {
      console.log("❌ No file provided for image upload");
      return null;
    }

    // Check if Cloudinary is configured
    if (!process.env.CLOUDINARY_CLOUD_NAME || 
        process.env.CLOUDINARY_CLOUD_NAME === 'your-cloud-name') {
      console.warn('⚠️ Cloudinary not configured, returning placeholder URL');
      return 'https://via.placeholder.com/400x300/3B82F6/FFFFFF?text=Book+Cover';
    }

    console.log("☁️ Cloudinary config:", {
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY ? '***' : 'missing',
      api_secret: process.env.CLOUDINARY_API_SECRET ? '***' : 'missing'
    });

    // Convert buffer to stream
    const stream = Readable.from(file.buffer);
    
    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: 'acadmix/images',
          resource_type: 'image',
          transformation: [
            { width: 800, height: 600, crop: 'limit' },
            { quality: 'auto' }
          ]
        },
        (error, result) => {
          if (error) {
            console.error('❌ Cloudinary upload error:', error);
            reject(error);
          } else {
            console.log("✅ Image uploaded successfully:", result.secure_url);
            resolve(result.secure_url);
          }
        }
      );

      stream.pipe(uploadStream);
    });
  } catch (error) {
    console.error('❌ Image upload error:', error);
    // Return placeholder on error
    return 'https://via.placeholder.com/400x300/3B82F6/FFFFFF?text=Book+Cover';
  }
};

// Upload PDF to Cloudinary
const uploadPdf = async (file) => {
  try {
    console.log("📄 Starting PDF upload to Cloudinary...");
    console.log("📄 File details:", {
      originalname: file.originalname,
      mimetype: file.mimetype,
      size: file.size
    });

    if (!file) {
      console.log("❌ No file provided for PDF upload");
      return null;
    }

    // Check if Cloudinary is configured
    if (!process.env.CLOUDINARY_CLOUD_NAME || 
        !process.env.CLOUDINARY_API_KEY || 
        !process.env.CLOUDINARY_API_SECRET) {
      console.warn('⚠️ Cloudinary not configured, returning placeholder URL');
      return 'https://via.placeholder.com/400x600/EF4444/FFFFFF?text=PDF+Document';
    }

    console.log("☁️ Cloudinary config for PDF:", {
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY ? '***' : 'missing',
      api_secret: process.env.CLOUDINARY_API_SECRET ? '***' : 'missing'
    });

    // Convert buffer to stream
    const stream = Readable.from(file.buffer);
    
    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: 'acadmix/pdfs',
          resource_type: 'raw',
          format: 'pdf',
          access_mode: 'public',
          type: 'upload',
          invalidate: true,
          overwrite: true,
          use_filename: false,
          unique_filename: true,
          public_id: `${Date.now()}_${file.originalname.replace(/\.[^/.]+$/, "")}`,
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
        },
        async (error, result) => {
          if (error) {
            console.error('❌ Cloudinary PDF upload error:', error);
            reject(error);
          } else {
            console.log("✅ PDF uploaded successfully:", result.secure_url);
            
            // Remove any query parameters that might cause issues
            const cleanUrl = result.secure_url.split('?')[0];
            
            // Test if the URL is publicly accessible
            try {
              const testResponse = await fetch(cleanUrl, { method: 'HEAD' });
              console.log("🔍 PDF URL accessibility test:", {
                status: testResponse.status,
                accessible: testResponse.ok,
                url: cleanUrl
              });
              
              if (!testResponse.ok) {
                console.log("⚠️ PDF URL not publicly accessible, trying to make it public...");
                // Try to make the resource public explicitly
                await new Promise((resolveUpdate, rejectUpdate) => {
                  cloudinary.api.update(result.public_id, { 
                    resource_type: 'raw',
                    access_mode: 'public',
                    invalidate: true
                  }, (updateError, updateResult) => {
                    if (updateError) {
                      console.error("❌ Failed to make PDF public:", updateError);
                      rejectUpdate(updateError);
                    } else {
                      console.log("✅ PDF made public:", updateResult);
                      resolveUpdate(updateResult);
                    }
                  });
                });
              }
            } catch (testError) {
              console.log("⚠️ Could not test PDF URL accessibility:", testError.message);
            }
            
            resolve(cleanUrl);
          }
        }
      );

      stream.pipe(uploadStream);
    });
  } catch (error) {
    console.error('❌ PDF upload error:', error);
    // Return placeholder on error
    return 'https://via.placeholder.com/400x600/EF4444/FFFFFF?text=PDF+Document';
  }
};

// Delete file from Cloudinary
const deleteFile = async (publicId) => {
  try {
    if (!publicId) return;
    
    const result = await cloudinary.uploader.destroy(publicId);
    console.log('File deleted from Cloudinary:', result);
    return result;
  } catch (error) {
    console.error('Delete file error:', error);
    throw error;
  }
};

// Extract public ID from Cloudinary URL
const getPublicIdFromUrl = (url) => {
  if (!url) return null;
  
  try {
    const urlParts = url.split('/');
    const filename = urlParts[urlParts.length - 1];
    const publicId = filename.split('.')[0];
    return `acadmix/images/${publicId}`;
  } catch (error) {
    console.error('Error extracting public ID:', error);
    return null;
  }
};

module.exports = {
  uploadImage,
  uploadPdf,
  deleteFile,
  getPublicIdFromUrl
}; 