const express = require('express');
const Book = require('../models/Book');
const Payment = require('../models/Payment');
const logger = require('../utils/logger');
const { validate, schemas } = require('../middleware/validation');
const { asyncHandler } = require('../middleware/errorHandler');

const router = express.Router();

// Middleware to ensure DB connection
let connectToDB;
const setDBConnection = (dbConnector) => {
    connectToDB = dbConnector;
};

// Helper function to get current user
const getCurrentUser = (req) => {
    return req.isAuthenticated() ? req.user : null;
};

// Get all books with access control
router.get('/', validate(schemas.section, 'query'), asyncHandler(async (req, res) => {
    logger.debug('Fetching books', { section: req.query.section || 'all' });

    await connectToDB();
    const { section, category } = req.query;
    let query = {};

    if (section && section !== "home") {
        query.section = section;
    }

    if (category) {
        query.category = category;
    }

    const books = await Book.find(query).sort({ createdAt: -1 });
    logger.debug('Books found', { count: books.length });

    const user = getCurrentUser(req);
    let userId = null;
    let isAdmin = false;
    let payments = [];

    if (user) {
        userId = user._id;
        isAdmin = user.role === "admin";
        logger.debug('User authenticated', { userId, isAdmin });

        if (userId && !isAdmin) {
            try {
                payments = await Payment.find({ user: userId }).lean();
                logger.debug('User payments found', { count: payments.length });
            } catch (paymentError) {
                logger.error('Payment lookup failed', { error: paymentError.message });
                payments = [];
            }
        }
    }

    const booksWithAccess = books.map((book) => {
        try {
            const userPayments = payments
                .filter((p) => p.book && p.book.toString() === book._id.toString())
                .sort((a, b) => new Date(b.submittedAt || 0) - new Date(a.submittedAt || 0));

            const userPayment = userPayments[0];
            const isFreeBook = book.isFree === true;

            const bookObject = book.toObject ? book.toObject() : book;

            return {
                ...bookObject,
                canRead: isAdmin || userPayment?.status === "approved" || isFreeBook,
                paymentStatus: isAdmin ? "admin_access" : isFreeBook ? "free" : userPayment?.status || null,
                pdfUrl: book.pdfUrl || null,
            };
        } catch (bookError) {
            logger.error('Error processing book', { bookId: book._id, error: bookError.message });
            return {
                _id: book._id,
                title: book.title || 'Unknown Book',
                description: book.description || '',
                category: book.category || '',
                section: book.section || '',
                price: book.price || 0,
                priceDiscounted: book.priceDiscounted || 0,
                pages: book.pages || 0,
                image: book.image || '',
                isFree: book.isFree || false,
                shareCount: book.shareCount || 0,
                canRead: isAdmin,
                paymentStatus: isAdmin ? "admin_access" : "unknown",
                pdfUrl: book.pdfUrl || null,
            };
        }
    });

    logger.info('Books processed successfully', { count: booksWithAccess.length });
    res.json({ success: true, books: booksWithAccess });
}));

// Get single book
router.get('/:id', validate(schemas.bookId, 'params'), asyncHandler(async (req, res) => {
    await connectToDB();
    const { id } = req.params;

    const book = await Book.findById(id);

    if (!book) {
        logger.warn('Book not found', { bookId: id });
        return res.status(404).json({ success: false, error: "Book not found" });
    }

    const bookData = {
        _id: book._id,
        title: book.title,
        description: book.description,
        category: book.category,
        section: book.section,
        price: book.price,
        priceDiscounted: book.priceDiscounted,
        pages: book.pages,
        image: book.image,
        isFree: book.isFree,
        shareCount: book.shareCount,
        createdAt: book.createdAt,
        updatedAt: book.updatedAt
    };

    res.json({ success: true, book: bookData });
}));

// Share a book (increment share count)
router.post('/:id/share', validate(schemas.bookId, 'params'), asyncHandler(async (req, res) => {
    await connectToDB();
    const { id } = req.params;

    const book = await Book.findByIdAndUpdate(
        id,
        { $inc: { shareCount: 1 } },
        { new: true }
    );

    if (!book) {
        logger.warn('Book not found for share', { bookId: id });
        return res.status(404).json({ success: false, error: "Book not found" });
    }

    logger.info('Book shared', { bookId: id, shareCount: book.shareCount });
    res.json({ success: true, shareCount: book.shareCount });
}));

module.exports = { router, setDBConnection };
