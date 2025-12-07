const logger = require('../utils/logger');

// Custom error class
class AppError extends Error {
    constructor(message, statusCode, isOperational = true) {
        super(message);
        this.statusCode = statusCode;
        this.isOperational = isOperational;
        this.timestamp = new Date().toISOString();
        Error.captureStackTrace(this, this.constructor);
    }
}

// Error handler middleware
const errorHandler = (err, req, res, next) => {
    let error = { ...err };
    error.message = err.message;

    // Log error
    if (process.env.NODE_ENV !== 'production') {
        logger.error('Error occurred', {
            message: err.message,
            stack: err.stack,
            url: req.originalUrl,
            method: req.method
        });
    } else {
        logger.error('Error occurred', {
            message: err.message,
            url: req.originalUrl,
            method: req.method
        });
    }

    // Mongoose bad ObjectId
    if (err.name === 'CastError') {
        error.message = 'Resource not found';
        error.statusCode = 404;
    }

    // Mongoose duplicate key error
    if (err.code === 11000) {
        const field = Object.keys(err.keyValue)[0];
        error.message = `${field} already exists`;
        error.statusCode = 400;
    }

    // Mongoose validation error
    if (err.name === 'ValidationError') {
        const errors = Object.values(err.errors).map(e => e.message);
        error.message = errors.join(', ');
        error.statusCode = 400;
    }

    // JWT errors
    if (err.name === 'JsonWebTokenError') {
        error.message = 'Invalid token';
        error.statusCode = 401;
    }

    if (err.name === 'TokenExpiredError') {
        error.message = 'Token expired';
        error.statusCode = 401;
    }

    const statusCode = error.statusCode || err.statusCode || 500;
    const message = error.message || 'Internal Server Error';

    res.status(statusCode).json({
        success: false,
        error: message,
        ...(process.env.NODE_ENV !== 'production' && { stack: err.stack }),
        timestamp: new Date().toISOString()
    });
};

// 404 handler
const notFound = (req, res, next) => {
    const error = new AppError(`Route not found - ${req.originalUrl}`, 404);
    next(error);
};

// Async handler wrapper to catch errors in async route handlers
const asyncHandler = (fn) => (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
};

module.exports = {
    AppError,
    errorHandler,
    notFound,
    asyncHandler
};
