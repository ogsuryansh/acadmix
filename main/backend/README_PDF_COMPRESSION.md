# PDF Compression Feature

## Overview
The Acadmix platform now includes automatic PDF compression to handle large files that exceed Cloudinary's 10MB free plan limit.

## How It Works

### Automatic Compression
- When a PDF larger than 10MB is uploaded, the system automatically compresses it
- Compression uses multiple strategies to reduce file size while maintaining quality
- Users are informed about the compression process via toast notifications

### Compression Strategies
1. **Image Compression**: Resizes and compresses images within the PDF
2. **Metadata Removal**: Strips unnecessary metadata to reduce size
3. **Object Optimization**: Removes unused objects and optimizes PDF structure
4. **Quality Adjustment**: Uses different quality levels based on file size

### Quality Levels
- **High**: 80% image quality, minimal compression
- **Medium**: 60% image quality, balanced compression
- **Low**: 30% image quality, maximum compression

## Installation

1. Install the required dependency:
```bash
npm install pdf-lib
```

2. The compression utility is automatically imported in `cloudStorage.js`

## Usage

### Backend (Automatic)
PDF compression happens automatically during upload in the `uploadPdf` function:

```javascript
// In utils/cloudStorage.js
const uploadPdf = async (file) => {
  // Automatic compression if file > 10MB
  if (needsCompression(file.buffer, maxFileSize)) {
    const compressedBuffer = await smartCompressPdf(file.buffer, maxFileSize);
    file.buffer = compressedBuffer;
    file.size = compressedBuffer.length;
  }
  // Continue with upload...
};
```

### Manual Compression
You can also compress PDFs manually:

```javascript
const { smartCompressPdf } = require('./utils/pdfCompressor');

const compressedBuffer = await smartCompressPdf(originalBuffer, 10 * 1024 * 1024);
```

## Configuration

### File Size Limits
- **Maximum PDF Size**: 10MB (Cloudinary free plan limit)
- **Target Compression**: Automatically targets 10MB or smaller
- **Fallback**: Returns error if compression cannot achieve target size

### Environment Variables
```env
MAX_PDF_SIZE=10485760  # 10MB in bytes
```

## Error Handling

### Compression Failures
- If compression fails, the system returns a detailed error message
- Users are advised to try smaller PDFs or upgrade their Cloudinary plan

### Size Limits
- If a PDF cannot be compressed below 10MB, upload is rejected
- Clear error messages guide users on next steps

## Testing

Run the compression test:
```bash
node test-compression.js
```

## Benefits

1. **Automatic**: No user intervention required
2. **Smart**: Uses multiple compression strategies
3. **Informative**: Users know when compression is happening
4. **Reliable**: Handles edge cases and provides clear error messages
5. **Configurable**: Easy to adjust compression settings

## Troubleshooting

### Common Issues

1. **Compression Not Working**
   - Check if `pdf-lib` is installed
   - Verify file is a valid PDF
   - Check server logs for compression errors

2. **Still Too Large After Compression**
   - PDF may contain high-resolution images that can't be compressed further
   - Consider manual compression or file splitting
   - Upgrade Cloudinary plan for larger files

3. **Performance Issues**
   - Large PDFs may take time to compress
   - Consider implementing progress indicators for very large files

## Future Enhancements

- Progress indicators for compression
- Multiple compression quality options for users
- Batch compression for multiple files
- Compression statistics and analytics
