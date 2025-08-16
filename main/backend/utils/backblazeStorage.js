const axios = require('axios');
const FormData = require('form-data');

// Backblaze B2 configuration
const B2_CONFIG = {
  accountId: process.env.B2_ACCOUNT_ID,
  applicationKey: process.env.B2_APPLICATION_KEY,
  bucketId: process.env.B2_BUCKET_ID,
  bucketName: process.env.B2_BUCKET_NAME || 'acadmix-storage'
};

// Get B2 authorization token
const getAuthToken = async () => {
  try {
    const response = await axios.get('https://api.backblazeb2.com/b2api/v2/b2_authorize_account', {
      auth: {
        username: B2_CONFIG.accountId,
        password: B2_CONFIG.applicationKey
      }
    });
    
    return response.data;
  } catch (error) {
    console.error('❌ B2 auth error:', error.message);
    throw new Error('B2 authentication failed');
  }
};

// Upload file to B2
const uploadToB2 = async (file, folder = 'pdfs') => {
  try {
    console.log('📦 Starting B2 upload...');
    console.log('📊 File size:', (file.size / (1024 * 1024)).toFixed(1), 'MB');

    // Get auth token
    const auth = await getAuthToken();
    
    // Get upload URL
    const uploadUrlResponse = await axios.post(`${auth.apiUrl}/b2api/v2/b2_get_upload_url`, {
      bucketId: B2_CONFIG.bucketId
    }, {
      headers: {
        'Authorization': auth.authorizationToken
      }
    });

    const uploadUrl = uploadUrlResponse.data.uploadUrl;
    const authToken = uploadUrlResponse.data.authorizationToken;

    // Prepare file data
    const fileName = `${folder}/${Date.now()}_${file.originalname}`;
    const fileBuffer = file.buffer;
    const sha1 = require('crypto').createHash('sha1').update(fileBuffer).digest('hex');

    // Upload file
    const formData = new FormData();
    formData.append('file', fileBuffer, {
      filename: fileName,
      contentType: file.mimetype
    });

    const uploadResponse = await axios.post(uploadUrl, formData, {
      headers: {
        ...formData.getHeaders(),
        'Authorization': authToken,
        'X-Bz-File-Name': fileName,
        'Content-Type': file.mimetype,
        'Content-Length': fileBuffer.length,
        'X-Bz-Content-Sha1': sha1
      }
    });

    // For private bucket, we need to create a signed URL
    const fileId = uploadResponse.data.fileId;
    const signedUrl = await createSignedUrl(fileName, fileId, auth);
    
    console.log('✅ B2 upload successful:', signedUrl);
    return signedUrl;

  } catch (error) {
    console.error('❌ B2 upload error:', error.message);
    
    if (!B2_CONFIG.accountId || !B2_CONFIG.applicationKey) {
      console.warn('⚠️ B2 not configured, returning placeholder URL');
      return 'https://via.placeholder.com/400x600/EF4444/FFFFFF?text=B2+Not+Configured';
    }
    
    throw new Error(`B2 upload failed: ${error.message}`);
  }
};

// Create signed URL for private bucket access
const createSignedUrl = async (fileName, fileId, auth) => {
  try {
    // Create a signed URL that expires in 1 year (maximum allowed)
    const expirationTime = Math.floor(Date.now() / 1000) + (365 * 24 * 60 * 60); // 1 year
    
    const response = await axios.post(`${auth.apiUrl}/b2api/v2/b2_get_download_authorization`, {
      bucketId: B2_CONFIG.bucketId,
      fileNamePrefix: fileName,
      validDurationInSeconds: 365 * 24 * 60 * 60 // 1 year
    }, {
      headers: {
        'Authorization': auth.authorizationToken
      }
    });

    const downloadAuthToken = response.data.authorizationToken;
    const signedUrl = `${auth.downloadUrl}/file/${B2_CONFIG.bucketName}/${fileName}?Authorization=${downloadAuthToken}`;
    
    return signedUrl;
  } catch (error) {
    console.error('❌ Error creating signed URL:', error.message);
    // Fallback to regular URL (might not work for private bucket)
    return `${auth.downloadUrl}/file/${B2_CONFIG.bucketName}/${fileName}`;
  }
};

// Delete file from B2
const deleteFromB2 = async (fileUrl) => {
  try {
    if (!fileUrl || !fileUrl.includes('backblazeb2.com')) return;

    const auth = await getAuthToken();
    
    // Extract file name from URL
    const fileName = fileUrl.split('/file/')[1].split('/').slice(1).join('/');
    
    console.log('🗑️ Deleting from B2:', fileName);

    await axios.post(`${auth.apiUrl}/b2api/v2/b2_delete_file_version`, {
      fileName: fileName,
      fileId: fileName // B2 uses fileName as fileId for simplicity
    }, {
      headers: {
        'Authorization': auth.authorizationToken
      }
    });

    console.log('✅ B2 delete successful');

  } catch (error) {
    console.error('❌ B2 delete error:', error.message);
  }
};

// Test B2 connection
const testB2Connection = async () => {
  try {
    if (!B2_CONFIG.accountId || !B2_CONFIG.applicationKey) {
      console.warn('⚠️ B2 not configured');
      return false;
    }

    await getAuthToken();
    console.log('✅ B2 connection successful');
    return true;

  } catch (error) {
    console.error('❌ B2 connection failed:', error.message);
    return false;
  }
};

module.exports = {
  uploadToB2,
  deleteFromB2,
  testB2Connection
};
