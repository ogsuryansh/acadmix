const express = require('express');
const Book = require('../models/Book');
const Payment = require('../models/Payment');
const logger = require('../utils/logger');
const { asyncHandler } = require('../middleware/errorHandler');

const router = express.Router();

// Middleware to ensure DB connection
let connectToDB;
const setDBConnection = (dbConnector) => {
    connectToDB = dbConnector;
};

// Require authentication middleware
const requireAuth = (req, res, next) => {
    if (req.isAuthenticated()) {
        return next();
    }
    res.status(401).json({ success: false, error: "Authentication required" });
};

// Get user's purchased books
router.get('/purchased-books', requireAuth, asyncHandler(async (req, res) => {
    await connectToDB();

    logger.debug('Fetching purchased books', {
        userId: req.user._id,
        userRole: req.user.role
    });

    const userId = req.user._id;
    const isAdmin = req.user.role === "admin";

    if (isAdmin) {
        logger.debug('Admin access - returning all books');
        const allBooks = await Book.find({}).sort({ createdAt: -1 });
        const booksWithAccess = allBooks.map(book => {
            try {
                return {
                    ...book.toObject(),
                    paymentStatus: "admin_access",
                    canRead: true
                };
            } catch (bookError) {
                logger.error('Error processing book for admin', { bookId: book._id, error: bookError.message });
                return {
                    _id: book._id,
                    title: book.title || 'Unknown Book',
                    paymentStatus: "admin_access",
                    canRead: true
                };
            }
        });
        return res.json({ success: true, books: booksWithAccess });
    }

    logger.debug('Fetching approved payments for user');
    const approvedPayments = await Payment.find({
        user: userId,
        status: "approved"
    }).populate('book');

    const purchasedBooks = approvedPayments
        .filter(payment => payment.book)
        .map(payment => {
            try {
                return {
                    ...payment.book.toObject(),
                    paymentStatus: "approved",
                    canRead: true,
                    paymentId: payment._id,
                    purchasedAt: payment.approvedAt || payment.submittedAt
                };
            } catch (bookError) {
                logger.error('Error processing purchased book', { paymentId: payment._id, error: bookError.message });
                return {
                    _id: payment.book._id,
                    title: payment.book.title || 'Unknown Book',
                    paymentStatus: "approved",
                    canRead: true,
                    paymentId: payment._id,
                    purchasedAt: payment.approvedAt || payment.submittedAt
                };
            }
        });

    logger.debug('Fetching free books');
    const freeBooks = await Book.find({ isFree: true }).sort({ createdAt: -1 });
    const freeBooksWithAccess = freeBooks.map(book => {
        try {
            return {
                ...book.toObject(),
                paymentStatus: "free",
                canRead: true,
                isFree: true
            };
        } catch (bookError) {
            logger.error('Error processing free book', { bookId: book._id, error: bookError.message });
            return {
                _id: book._id,
                title: book.title || 'Unknown Book',
                paymentStatus: "free",
                canRead: true,
                isFree: true
            };
        }
    });

    const allUserBooks = [...purchasedBooks, ...freeBooksWithAccess];
    const uniqueBooks = allUserBooks.filter((book, index, self) =>
        index === self.findIndex(b => b._id.toString() === book._id.toString())
    );

    logger.info('Purchased books retrieved', {
        userId,
        totalBooks: uniqueBooks.length,
        purchased: purchasedBooks.length,
        free: freeBooksWithAccess.length
    });

    res.json({ success: true, books: uniqueBooks });
}));

module.exports = { router, setDBConnection };
