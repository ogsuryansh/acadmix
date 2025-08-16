const cloudinary = require('cloudinary').v2;
const { Readable } = require('stream');
const { smartCompressPdf, needsCompression, getCompressionRecommendations } = require('./pdfCompressor');

// Configure Cloudinary only if environment variables are available
const configureCloudinary = () => {
  if (process.env.CLOUDINARY_CLOUD_NAME && 
      process.env.CLOUDINARY_API_KEY && 
      process.env.CLOUDINARY_API_SECRET) {
    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
    });
    return true;
  }
  return false;
};

// Test Cloudinary connection only if configured
const testCloudinaryConnection = async () => {
  if (configureCloudinary()) {
    try {
      await cloudinary.api.ping();
      console.log("✅ Cloudinary connection successful");
    } catch (error) {
      console.error("❌ Cloudinary connection failed:", error);
    }
  } else {
    console.warn("⚠️ Cloudinary not configured, skipping connection test");
  }
};

// Don't test connection on module load - make it lazy
// testCloudinaryConnection();

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

// Upload PDF with hybrid storage (Cloudinary + Backblaze B2)
const uploadPdf = async (file) => {
  try {
    console.log("📄 Starting PDF upload...");
    console.log("📄 File details:", {
      originalname: file.originalname,
      mimetype: file.mimetype,
      size: file.size
    });

    if (!file) {
      console.log("❌ No file provided for PDF upload");
      return null;
    }

    // Check file size - Cloudinary free plan has 10MB limit
    const maxFileSize = 10 * 1024 * 1024; // 10MB
    
    // If file is too large for Cloudinary, try Backblaze B2 first
    if (file.size > maxFileSize) {
      console.log("🔄 File too large for Cloudinary, trying Backblaze B2...");
      
      try {
        const { uploadToB2 } = require('./backblazeStorage');
        const b2Result = await uploadToB2(file, 'pdfs');
        console.log("✅ B2 upload successful");
        return b2Result;
      } catch (b2Error) {
        console.error("❌ B2 upload failed:", b2Error.message);
        console.log("🔄 Falling back to Cloudinary with compression...");
      }
    }
    
    // Check if compression is needed for Cloudinary
    if (needsCompression(file.buffer, maxFileSize)) {
      console.log("🔄 PDF needs compression, analyzing...");
      
      const recommendations = getCompressionRecommendations(file.buffer, maxFileSize);
      console.log("📊 Compression recommendations:", recommendations);
      
      try {
        console.log("🧠 Starting automatic PDF compression...");
        const compressedBuffer = await smartCompressPdf(file.buffer, maxFileSize);
        
        // Update file buffer with compressed version
        file.buffer = compressedBuffer;
        file.size = compressedBuffer.length;
        
        console.log("✅ PDF compressed successfully");
        console.log("📊 New size:", file.size, "bytes");
        
        // Check if compression was successful
        if (file.size > maxFileSize) {
          console.warn("⚠️ PDF still too large after compression");
          
          // Check if we should allow larger files (for development/testing)
          const allowLargeFiles = process.env.ALLOW_LARGE_FILES === 'true';
          
          if (allowLargeFiles) {
            console.log("🔄 Large files allowed, proceeding with compressed file");
          } else {
            const error = new Error(`PDF is still too large after compression. Size: ${(file.size / (1024 * 1024)).toFixed(1)}MB. Maximum: ${(maxFileSize / (1024 * 1024)).toFixed(1)}MB. Please try a smaller PDF or upgrade your Cloudinary plan.`);
            error.http_code = 400;
            throw error;
          }
        }
        
      } catch (compressionError) {
        console.error("❌ PDF compression failed:", compressionError);
        
        // If compression failed but file is still within limits, continue with original
        if (file.size <= maxFileSize) {
          console.log("⚠️ Compression failed, but file is within size limits. Continuing with original file.");
        } else {
          const error = new Error(`PDF compression failed: ${compressionError.message}. Please try uploading a smaller PDF or upgrade your Cloudinary plan.`);
          error.http_code = 400;
          throw error;
        }
      }
    } else {
      console.log("✅ PDF size is within limits, no compression needed");
    }

    // Check if Cloudinary is configured
    if (!configureCloudinary()) {
      console.warn('⚠️ Cloudinary not configured, returning placeholder URL');
      console.warn('📝 Please set up CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET in your .env file');
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

// Delete file from appropriate storage
const deleteFile = async (fileUrl) => {
  try {
    if (!fileUrl) return;
    
    // Handle B2 files
    if (fileUrl.includes('backblazeb2.com')) {
      try {
        const { deleteFromB2 } = require('./backblazeStorage');
        await deleteFromB2(fileUrl);
        console.log('✅ File deleted from B2');
        return { result: 'ok' };
      } catch (b2Error) {
        console.error('❌ B2 delete error:', b2Error);
        return { result: 'ok' }; // Don't throw error
      }
    }
    
    // Handle Cloudinary files
    if (fileUrl.includes('cloudinary.com')) {
      // Check if Cloudinary is configured
      if (!configureCloudinary()) {
        console.warn('⚠️ Cloudinary not configured, skipping file deletion');
        return { result: 'ok' }; // Return success to avoid errors
      }
      
      const publicId = getPublicIdFromUrl(fileUrl);
      if (publicId) {
        const result = await cloudinary.uploader.destroy(publicId);
        console.log('✅ File deleted from Cloudinary:', result);
        return result;
      }
    }
    
    console.log('⚠️ Unknown storage provider, skipping deletion');
    return { result: 'ok' };
  } catch (error) {
    console.error('Delete file error:', error);
    // Don't throw error, just log it to avoid breaking the update process
    return { result: 'ok' };
  }
};

// Extract public ID from Cloudinary URL
const getPublicIdFromUrl = (url) => {
  if (!url) return null;
  
  // Skip placeholder URLs
  if (url.includes('via.placeholder.com') || url.includes('placeholder')) {
    console.log('⚠️ Skipping placeholder URL for deletion:', url);
    return null;
  }
  
  try {
    // Check if it's a Cloudinary URL
    if (!url.includes('res.cloudinary.com')) {
      console.log('⚠️ Not a Cloudinary URL, skipping deletion:', url);
      return null;
    }
    
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