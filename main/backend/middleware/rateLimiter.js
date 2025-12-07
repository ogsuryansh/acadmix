const rateLimit = require('express-rate-limit');

// Stricter rate limiting for authentication endpoints
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // Limit each IP to 5 requests per windowMs
    message: {
        success: false,
        error: "Too many authentication attempts from this IP, please try again after 15 minutes"
    },
    standardHeaders: true,
    legacyHeaders: false,
});

// Rate limiter for registration
const registerLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 3, // Limit each IP to 3 registrations per hour
    message: {
        success: false,
        error: "Too many registration attempts from this IP, please try again after 1 hour"
    },
    standardHeaders: true,
    legacyHeaders: false,
});

// Rate limiter for password reset (if implemented)
const passwordResetLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 3, // Limit each IP to 3 password resets per hour
    message: {
        success: false,
        error: "Too many password reset attempts from this IP, please try again after 1 hour"
    },
    standardHeaders: true,
    legacyHeaders: false,
});

module.exports = {
    authLimiter,
    registerLimiter,
    passwordResetLimiter
};
