const express = require('express');
const bcrypt = require('bcryptjs');
const Book = require('../models/Book');
const Payment = require('../models/Payment');
const User = require('../models/User');
const logger = require('../utils/logger');
const { validate, schemas } = require('../middleware/validation');
const { asyncHandler } = require('../middleware/errorHandler');
const { authLimiter } = require('../middleware/rateLimiter');

const router = express.Router();

// Middleware to ensure DB connection
let connectToDB;
const setDBConnection = (dbConnector) => {
    connectToDB = dbConnector;
};

// Admin authentication middleware
const requireAdmin = (req, res, next) => {
    if (req.isAuthenticated() && req.user.role === 'admin') {
        return next();
    }
    logger.warn('Unauthorized admin access attempt', {
        userId: req.user?._id,
        url: req.originalUrl
    });
    res.status(403).json({ success: false, error: "Admin access required" });
};

// Admin login
router.post('/login', authLimiter, validate(schemas.adminLogin), asyncHandler(async (req, res) => {
    await connectToDB();
    const { username, password } = req.body;

    let adminUser = null;
    let useEnvAuth = false;

    try {
        adminUser = await User.findOne({ role: "admin", email: username });
    } catch (dbErr) {
        logger.error('Database error during admin lookup', { error: dbErr.message });
        useEnvAuth = true;
    }

    let isValidAdmin = false;

    if (adminUser && adminUser.password) {
        try {
            isValidAdmin = await bcrypt.compare(password, adminUser.password);
        } catch (bcryptErr) {
            logger.error('Password comparison error', { error: bcryptErr.message });
            isValidAdmin = false;
        }
    } else if (useEnvAuth || !adminUser) {
        const envUsername = process.env.ADMIN_USER;
        const envPassword = process.env.ADMIN_PASS;

        if (envUsername && envPassword) {
            isValidAdmin = username === envUsername && password === envPassword;
            if (isValidAdmin && !adminUser) {
                // Create admin user if using env auth
                adminUser = await User.create({
                    name: 'Admin',
                    email: username,
                    password: await bcrypt.hash(password, 12),
                    role: 'admin'
                });
                logger.info('Admin user created from environment credentials');
            }
        } else {
            logger.error('Admin authentication not configured');
            return res.status(500).json({ success: false, error: "Admin authentication not configured" });
        }
    }

    if (isValidAdmin && adminUser) {
        // Update last login
        adminUser.lastLogin = new Date();
        await adminUser.save();

        // Log admin in with passport
        req.login(adminUser, (err) => {
            if (err) {
                logger.error('Admin login session creation failed', { error: err.message });
                return res.status(500).json({ success: false, error: "Admin login failed" });
            }

            logger.info('Admin logged in successfully', { adminId: adminUser._id, email: adminUser.email });

            res.json({
                success: true,
                message: "Admin login successful",
                user: {
                    id: adminUser._id,
                    name: adminUser.name,
                    email: adminUser.email,
                    role: adminUser.role
                }
            });
        });
    } else {
        logger.warn('Failed admin login attempt', { username });
        res.status(401).json({ success: false, error: "Admin authentication failed" });
    }
}));

// Get admin dashboard data with pagination
router.get('/dashboard', requireAdmin, validate(schemas.pagination, 'query'), asyncHandler(async (req, res) => {
    await connectToDB();

    const { page = 1, limit = 20 } = req.query;
    const skip = (page - 1) * limit;

    logger.debug('Admin dashboard request', {
        adminId: req.user._id,
        page,
        limit
    });

    // Get counts
    const totalUsers = await User.countDocuments();
    const totalBooks = await Book.countDocuments();
    const totalPayments = await Payment.countDocuments();

    // Get revenue
    const approvedPayments = await Payment.find({ status: "approved" }).lean();
    const totalRevenue = approvedPayments.reduce((sum, payment) => {
        return sum + (payment.amount || 0);
    }, 0);

    // Get paginated users
    const users = await User.find()
        .select("-password")
        .skip(skip)
        .limit(limit)
        .sort({ createdAt: -1 })
        .lean();

    // Get recent payments (limit 50)
    const payments = await Payment.find()
        .sort({ submittedAt: -1 })
        .limit(50)
        .populate("user", "name email")
        .populate("book", "title")
        .lean();

    logger.info('Admin dashboard data retrieved', {
        totalUsers,
        usersFetched: users.length,
        totalPayments,
        page
    });

    res.json({
        success: true,
        users,
        totalUsers,
        totalBooks,
        totalPayments,
        totalRevenue,
        payments,
        pagination: {
            page,
            limit,
            totalPages: Math.ceil(totalUsers / limit),
            hasMore: skip + users.length < totalUsers
        }
    });
}));

// Create book
router.post('/books', requireAdmin, validate(schemas.createBook), asyncHandler(async (req, res) => {
    await connectToDB();

    const book = await Book.create(req.body);
    logger.info('Book created', { bookId: book._id, title: book.title, createdBy: req.user._id });

    res.status(201).json({ success: true, book });
}));

// Update book
router.put('/books/:id', requireAdmin, validate(schemas.bookId, 'params'), validate(schemas.updateBook), asyncHandler(async (req, res) => {
    await connectToDB();

    const book = await Book.findByIdAndUpdate(
        req.params.id,
        req.body,
        { new: true, runValidators: true }
    );

    if (!book) {
        return res.status(404).json({ success: false, error: "Book not found" });
    }

    logger.info('Book updated', { bookId: book._id, title: book.title, updatedBy: req.user._id });
    res.json({ success: true, book });
}));

// Get all books for admin (no section filter)
router.get('/books', requireAdmin, asyncHandler(async (req, res) => {
    await connectToDB();

    const books = await Book.find()
        .sort({ createdAt: -1 })
        .lean();

    logger.debug('Admin books list retrieved', {
        adminId: req.user._id,
        totalBooks: books.length
    });

    res.json(books);
}));

// Delete book
router.delete('/books/:id', requireAdmin, validate(schemas.bookId, 'params'), asyncHandler(async (req, res) => {
    await connectToDB();

    const book = await Book.findByIdAndDelete(req.params.id);

    if (!book) {
        return res.status(404).json({ success: false, error: "Book not found" });
    }

    logger.info('Book deleted', { bookId: req.params.id, title: book.title, deletedBy: req.user._id });
    res.json({ success: true, message: "Book deleted successfully" });
}));

// Get book details (for debugging)
router.get('/books/:id/details', requireAdmin, validate(schemas.bookId, 'params'), asyncHandler(async (req, res) => {
    await connectToDB();

    const book = await Book.findById(req.params.id);
    if (!book) {
        return res.status(404).json({ success: false, error: "Book not found" });
    }

    logger.debug('Admin book details request', {
        bookId: book._id,
        title: book.title,
        price: book.price,
        priceDiscounted: book.priceDiscounted
    });

    res.json({
        success: true,
        book: book.toObject(),
        meta: {
            priceType: typeof book.price,
            discountedType: typeof book.priceDiscounted,
            allFields: Object.keys(book.toObject())
        }
    });
}));

// Update user role
router.put('/users/:userId/role', requireAdmin, validate(schemas.updateUserRole), asyncHandler(async (req, res) => {
    await connectToDB();

    const { userId, role } = req.body;

    const user = await User.findByIdAndUpdate(
        userId,
        { role },
        { new: true }
    ).select('-password');

    if (!user) {
        return res.status(404).json({ success: false, error: "User not found" });
    }

    logger.info('User role updated', { userId, newRole: role, updatedBy: req.user._id });
    res.json({ success: true, user });
}));

// Update user status
router.put('/users/:userId/status', requireAdmin, validate(schemas.updateUserStatus), asyncHandler(async (req, res) => {
    await connectToDB();

    const { userId, isActive } = req.body;

    const user = await User.findByIdAndUpdate(
        userId,
        { isActive },
        { new: true }
    ).select('-password');

    if (!user) {
        return res.status(404).json({ success: false, error: "User not found" });
    }

    logger.info('User status updated', { userId, newStatus: isActive, updatedBy: req.user._id });
    res.json({ success: true, user });
}));

module.exports = { router, setDBConnection };
