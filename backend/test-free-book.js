const mongoose = require('mongoose');
const Book = require('./models/Book');

// Test script to mark a book as free
const testFreeBook = async () => {
  try {
    // Connect to database
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/acadmix');
    console.log('✅ Connected to database');

    // Find the book with the specific PDF URL
    const pdfUrl = 'https://res.cloudinary.com/dlk7oahyd/raw/upload/v1754721382/acadmix/pdfs/1754721383150_sample.pdf';
    const book = await Book.findOne({ pdfUrl: pdfUrl });
    
    if (!book) {
      console.log('❌ Book not found for PDF URL:', pdfUrl);
      return;
    }

    console.log('🔍 Found book:', {
      id: book._id,
      title: book.title,
      isFree: book.isFree,
      pdfUrl: book.pdfUrl
    });

    // Mark the book as free
    book.isFree = true;
    await book.save();

    console.log('✅ Book marked as free successfully:', {
      id: book._id,
      title: book.title,
      isFree: book.isFree
    });

    // Verify the change
    const updatedBook = await Book.findById(book._id);
    console.log('🔍 Verification - Book after update:', {
      id: updatedBook._id,
      title: updatedBook.title,
      isFree: updatedBook.isFree
    });

  } catch (err) {
    console.error('❌ Error:', err);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from database');
  }
};

// Run the test
testFreeBook();
