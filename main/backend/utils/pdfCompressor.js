const { PDFDocument } = require('pdf-lib');

/**
 * Compress PDF file to reduce size
 * @param {Buffer} pdfBuffer - Original PDF buffer
 * @param {Object} options - Compression options
 * @returns {Promise<Buffer>} - Compressed PDF buffer
 */
const compressPdf = async (pdfBuffer, options = {}) => {
  try {
    console.log('📄 Starting PDF compression...');
    console.log('📊 Original size:', pdfBuffer.length, 'bytes');

    const {
      quality = 'medium', // 'low', 'medium', 'high'
      maxSize = 10 * 1024 * 1024, // 10MB target
      removeMetadata = true,
      compressImages = false // Disabled for now due to pdf-lib limitations
    } = options;

    // Validate PDF header
    const pdfHeader = pdfBuffer.toString('ascii', 0, 5);
    if (pdfHeader !== '%PDF-') {
      throw new Error('Invalid PDF file: Missing PDF header');
    }

    // Load the PDF document
    const pdfDoc = await PDFDocument.load(pdfBuffer, {
      ignoreEncryption: true,
      updateMetadata: false
    });

    console.log('📚 PDF loaded, pages:', pdfDoc.getPageCount());

    // Quality settings based on compression level
    const qualitySettings = {
      low: {
        removeUnusedObjects: true,
        aggressiveCompression: true
      },
      medium: {
        removeUnusedObjects: true,
        aggressiveCompression: false
      },
      high: {
        removeUnusedObjects: false,
        aggressiveCompression: false
      }
    };

    const settings = qualitySettings[quality];

    // Remove metadata if requested
    if (removeMetadata) {
      console.log('🗑️ Removing metadata...');
      pdfDoc.setTitle('');
      pdfDoc.setAuthor('');
      pdfDoc.setSubject('');
      pdfDoc.setKeywords([]);
      pdfDoc.setProducer('');
      pdfDoc.setCreator('');
      pdfDoc.setCreationDate(new Date());
      pdfDoc.setModificationDate(new Date());
    }

    // Save with compression
    console.log('💾 Saving compressed PDF...');
    const saveOptions = {
      useObjectStreams: true,
      addDefaultPage: false,
      objectsPerTick: 50,
      updateFieldAppearances: false,
      throwOnInvalidObject: false,
      compress: true
    };

    // Add aggressive compression for low quality
    if (settings.aggressiveCompression) {
      saveOptions.removeUnusedObjects = true;
      saveOptions.objectsPerTick = 100;
      // Try to reduce quality further
      saveOptions.compress = true;
      saveOptions.useObjectStreams = true;
    }

    // For very large files, try even more aggressive settings
    if (pdfBuffer.length > 40 * 1024 * 1024) { // If file > 40MB
      console.log('🔥 Applying ultra-aggressive compression for large file...');
      saveOptions.removeUnusedObjects = true;
      saveOptions.objectsPerTick = 200;
      saveOptions.compress = true;
      saveOptions.useObjectStreams = true;
      // Try to optimize further
      saveOptions.updateFieldAppearances = false;
      saveOptions.throwOnInvalidObject = false;
    }

    const compressedBuffer = await pdfDoc.save(saveOptions);

    console.log('📊 Compressed size:', compressedBuffer.length, 'bytes');
    console.log('📈 Compression ratio:', ((1 - compressedBuffer.length / pdfBuffer.length) * 100).toFixed(1) + '%');

    // If still too large, try more aggressive compression
    if (compressedBuffer.length > maxSize && quality !== 'low') {
      console.log('⚠️ File still too large, trying more aggressive compression...');
      return await compressPdf(compressedBuffer, { ...options, quality: 'low' });
    }

    return compressedBuffer;

  } catch (error) {
    console.error('❌ PDF compression error:', error);
    
    // If it's a PDF parsing error, return original buffer
    if (error.message.includes('Failed to parse PDF') || error.message.includes('Invalid PDF')) {
      console.warn('⚠️ PDF parsing failed, returning original file');
      return pdfBuffer;
    }
    
    throw new Error(`PDF compression failed: ${error.message}`);
  }
};

/**
 * Smart PDF compression that tries different strategies
 * @param {Buffer} pdfBuffer - Original PDF buffer
 * @param {number} targetSize - Target size in bytes
 * @returns {Promise<Buffer>} - Compressed PDF buffer
 */
const smartCompressPdf = async (pdfBuffer, targetSize = 10 * 1024 * 1024) => {
  try {
    console.log('🧠 Starting smart PDF compression...');
    console.log('🎯 Target size:', targetSize / (1024 * 1024), 'MB');

    let compressedBuffer = pdfBuffer;
    let attempts = 0;
    const maxAttempts = 3;

    while (compressedBuffer.length > targetSize && attempts < maxAttempts) {
      attempts++;
      console.log(`🔄 Compression attempt ${attempts}/${maxAttempts}`);

      const quality = attempts === 1 ? 'medium' : attempts === 2 ? 'low' : 'low';
      
      compressedBuffer = await compressPdf(compressedBuffer, {
        quality,
        maxSize: targetSize,
        removeMetadata: true,
        compressImages: false // Disabled due to pdf-lib limitations
      });

      // If we can't compress further, break
      if (compressedBuffer.length >= pdfBuffer.length) {
        console.log('⚠️ Cannot compress further, returning best result');
        break;
      }
    }

    const finalSize = compressedBuffer.length;
    const originalSize = pdfBuffer.length;
    const compressionRatio = ((1 - finalSize / originalSize) * 100).toFixed(1);

    console.log('✅ Smart compression completed:');
    console.log(`   Original: ${(originalSize / (1024 * 1024)).toFixed(1)} MB`);
    console.log(`   Final: ${(finalSize / (1024 * 1024)).toFixed(1)} MB`);
    console.log(`   Compression: ${compressionRatio}%`);
    console.log(`   Target met: ${finalSize <= targetSize ? '✅' : '❌'}`);

    return compressedBuffer;

  } catch (error) {
    console.error('❌ Smart compression error:', error);
    throw error;
  }
};

/**
 * Check if PDF needs compression
 * @param {Buffer} pdfBuffer - PDF buffer
 * @param {number} maxSize - Maximum allowed size
 * @returns {boolean} - Whether compression is needed
 */
const needsCompression = (pdfBuffer, maxSize = 10 * 1024 * 1024) => {
  return pdfBuffer.length > maxSize;
};

/**
 * Get compression recommendations
 * @param {Buffer} pdfBuffer - PDF buffer
 * @param {number} maxSize - Maximum allowed size
 * @returns {Object} - Compression recommendations
 */
const getCompressionRecommendations = (pdfBuffer, maxSize = 10 * 1024 * 1024) => {
  const currentSize = pdfBuffer.length;
  const sizeMB = (currentSize / (1024 * 1024)).toFixed(1);
  const maxSizeMB = (maxSize / (1024 * 1024)).toFixed(1);
  
  const recommendations = {
    needsCompression: currentSize > maxSize,
    currentSize: currentSize,
    currentSizeMB: sizeMB,
    maxSizeMB: maxSizeMB,
    excessSize: currentSize - maxSize,
    excessSizeMB: ((currentSize - maxSize) / (1024 * 1024)).toFixed(1),
    suggestedQuality: 'medium'
  };

  if (currentSize > maxSize * 2) {
    recommendations.suggestedQuality = 'low';
  } else if (currentSize > maxSize * 1.5) {
    recommendations.suggestedQuality = 'medium';
  } else {
    recommendations.suggestedQuality = 'high';
  }

  return recommendations;
};

module.exports = {
  compressPdf,
  smartCompressPdf,
  needsCompression,
  getCompressionRecommendations
};
