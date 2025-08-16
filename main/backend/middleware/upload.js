const multer = require('multer');
const path = require('path');

// Set storage engine for local development
const storage = multer.memoryStorage(); // Use memory storage for cloud uploads

// File filter for images and PDFs
const fileFilter = (req, file, cb) => {
  const allowedImageTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];
  const allowedPdfTypes = ['application/pdf'];
  
  if (allowedImageTypes.includes(file.mimetype) || allowedPdfTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Only images (jpeg, png, webp) and PDFs are allowed!'), false);
  }
};

const upload = multer({ 
  storage, 
  fileFilter,
  limits: {
    fileSize: 100 * 1024 * 1024, // 100MB limit to allow large PDFs for compression
  }
});

module.exports = upload;
