const mongoose = require('mongoose');
const cloudinary = require('cloudinary').v2;
require('dotenv').config();

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('✅ Connected to MongoDB'))
  .catch(err => console.error('❌ MongoDB connection error:', err));

// Book Schema
const bookSchema = new mongoose.Schema({
  title: String,
  author: String,
  description: String,
  price: Number,
  image: String,
  pdfUrl: String,
  category: String,
  canRead: Boolean,
  paymentStatus: String,
  createdAt: { type: Date, default: Date.now }
});

const Book = mongoose.model('Book', bookSchema);

async function testAndFixPDFs() {
  try {
    console.log('🔍 Testing and fixing PDFs...');
    
    // Get all books with PDFs
    const books = await Book.find({ pdfUrl: { $exists: true, $ne: null } });
    console.log(`📚 Found ${books.length} books with PDFs`);
    
    for (const book of books) {
      console.log(`\n📖 Testing book: ${book.title}`);
      console.log(`🔗 PDF URL: ${book.pdfUrl}`);
      
      if (!book.pdfUrl || book.pdfUrl.includes('placeholder')) {
        console.log('⚠️ Skipping placeholder URL');
        continue;
      }
      
      try {
        // Test if PDF is accessible
        const response = await fetch(book.pdfUrl, { method: 'HEAD' });
        console.log(`🔍 Status: ${response.status} - ${response.statusText}`);
        
        if (response.ok) {
          console.log('✅ PDF is publicly accessible');
        } else {
          console.log('❌ PDF is not publicly accessible, attempting to fix...');
          
          // Extract public ID from Cloudinary URL
          // URL format: https://res.cloudinary.com/dlk7oahyd/raw/upload/v1754325228/acadmix/pdfs/i71biqtwpypskkqucioz.pdf
          const urlParts = book.pdfUrl.split('/');
          const uploadIndex = urlParts.findIndex(part => part === 'upload');
          if (uploadIndex !== -1 && uploadIndex + 3 < urlParts.length) {
            const version = urlParts[uploadIndex + 1]; // v1754325228
            const folder = urlParts[uploadIndex + 2]; // acadmix
            const subfolder = urlParts[uploadIndex + 3]; // pdfs
            const filename = urlParts[uploadIndex + 4]; // i71biqtwpypskkqucioz.pdf
            const fullPublicId = `${folder}/${subfolder}/${filename}`;
            console.log(`🔧 Extracted public ID: ${fullPublicId}`);
            console.log(`🔧 Full URL parts:`, urlParts);
            console.log(`🔧 Upload index: ${uploadIndex}, folder: ${folder}, subfolder: ${subfolder}, filename: ${filename}`);
            
            // Make the resource public
            const result = await new Promise((resolve, reject) => {
              cloudinary.api.update(fullPublicId, { 
                resource_type: 'raw',
                access_mode: 'public',
                invalidate: true
              }, (error, result) => {
                if (error) {
                  console.error("❌ Failed to make PDF public:", error);
                  reject(error);
                } else {
                  console.log("✅ PDF made public:", result);
                  resolve(result);
                }
              });
            });
          } else {
            console.log('❌ Could not extract public ID from URL');
            continue;
          }
          
          // Test again after making public
          const testResponse = await fetch(book.pdfUrl, { method: 'HEAD' });
          console.log(`🔍 After fix - Status: ${testResponse.status} - ${testResponse.statusText}`);
          
          if (testResponse.ok) {
            console.log('✅ PDF is now publicly accessible');
          } else {
            console.log('❌ PDF still not accessible after fix attempt');
          }
        }
      } catch (error) {
        console.error(`❌ Error testing PDF for ${book.title}:`, error.message);
      }
    }
    
    console.log('\n✅ PDF testing and fixing completed');
  } catch (error) {
    console.error('❌ Error in testAndFixPDFs:', error);
  } finally {
    mongoose.connection.close();
  }
}

// Run the script
testAndFixPDFs(); 